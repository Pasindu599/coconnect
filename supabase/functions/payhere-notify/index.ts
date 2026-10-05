/**
 * PayHere's server-to-server notify webhook (was functions/src/payments/payhereNotify.ts).
 *
 * Unauthenticated except for md5sig, so supabase/config.toml turns JWT
 * verification off for this function. Verifies merchant_id and the
 * signature here (the secret never reaches SQL), then hands the state change
 * to payhere_apply_notify(), which is idempotent and runs in one transaction.
 *
 * Always answers 200 once the request is read, rejections included (after
 * logging), so a forged or invalid request does not make PayHere retry
 * forever. See payments.md's "Response note".
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { computeNotifySig } from '../_shared/payhere.ts';

interface NotifyBody {
  merchant_id?: string;
  order_id?: string;
  payhere_amount?: string;
  payhere_currency?: string;
  status_code?: string;
  md5sig?: string;
  payment_id?: string;
}

Deno.serve(async (req) => {
  try {
    await handleNotify(await readBody(req));
  } catch (err) {
    console.error('payhere-notify: unexpected error', err);
  }
  return new Response('OK', { status: 200 });
});

/** PayHere posts application/x-www-form-urlencoded; JSON is accepted too for manual testing. */
async function readBody(req: Request): Promise<NotifyBody> {
  if ((req.headers.get('content-type') ?? '').includes('application/json')) {
    return (await req.json()) as NotifyBody;
  }
  const form = new URLSearchParams(await req.text());
  return Object.fromEntries(form.entries()) as NotifyBody;
}

async function handleNotify(body: NotifyBody): Promise<void> {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = body;

  if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || !status_code || !md5sig) {
    console.warn('payhere-notify: missing required field(s)', { order_id });
    return;
  }

  const merchantId = Deno.env.get('PAYHERE_MERCHANT_ID');
  const merchantSecret = Deno.env.get('PAYHERE_MERCHANT_SECRET');
  if (!merchantId || !merchantSecret) {
    console.error('payhere-notify: PAYHERE_MERCHANT_ID / PAYHERE_MERCHANT_SECRET are not set');
    return;
  }

  if (merchant_id !== merchantId) {
    console.warn('payhere-notify: merchant_id mismatch', { got: merchant_id });
    return;
  }

  const expectedSig = computeNotifySig(merchant_id, order_id, payhere_amount, payhere_currency, status_code, merchantSecret);
  if (md5sig.toUpperCase() !== expectedSig) {
    console.warn('payhere-notify: bad signature', { order_id });
    return;
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: outcome, error } = await admin.rpc('payhere_apply_notify', {
    p_order_id: order_id,
    p_amount: payhere_amount,
    p_status_code: status_code,
    p_provider_ref: payment_id ?? null,
  });
  if (error) {
    console.error('payhere-notify: payhere_apply_notify failed', { order_id, error });
    return;
  }
  if (outcome === 'amount-mismatch' || outcome === 'unknown-order') {
    console.error(`payhere-notify: ${outcome}`, { order_id, payhere_amount });
  }
}
