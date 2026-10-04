/**
 * CONTRACTS C4 (was functions/src/payments/createPayment.ts).
 *
 * All the rules (only the job's poster may pay, never twice, reuse a pending
 * payment for 30 minutes, the ADR-011 fee) live in the create_payment_intent()
 * SQL function, which this calls with the caller's own JWT. This function
 * only adds what SQL must not hold: the PayHere merchant secret and the
 * signed checkout hash.
 *
 * Secrets (supabase secrets set ...): PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET,
 * APP_BASE_URL, optionally PAYHERE_SANDBOX ("false" for live) and
 * PAYHERE_NOTIFY_URL (defaults to this project's payhere-notify function).
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { PayHereProvider } from '../_shared/payhere.ts';
import { corsHeaders, errorResponse, jsonResponse, toBackendErrorCode } from '../_shared/http.ts';

interface PaymentIntent {
  paymentId: string;
  jobId: string;
  fees: { bidPrice: number; platformFee: number; total: number; currency: 'LKR' };
  customer: { name: string | null; email: string | null; phone: string | null; location: string | null };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('invalid-argument');
  }

  const authorization = req.headers.get('Authorization');
  if (!authorization) {
    return errorResponse('unauthenticated');
  }

  let awardId: unknown;
  try {
    ({ awardId } = await req.json());
  } catch {
    return errorResponse('invalid-argument');
  }
  if (typeof awardId !== 'string' || !awardId) {
    return errorResponse('invalid-argument');
  }

  const merchantId = Deno.env.get('PAYHERE_MERCHANT_ID');
  const merchantSecret = Deno.env.get('PAYHERE_MERCHANT_SECRET');
  if (!merchantId || !merchantSecret) {
    console.error('create-payment: PAYHERE_MERCHANT_ID / PAYHERE_MERCHANT_SECRET are not set');
    return errorResponse('internal');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc('create_payment_intent', { p_award_id: awardId });
  if (error) {
    const code = toBackendErrorCode(error.message);
    if (code === 'internal') console.error('create-payment: create_payment_intent failed', error);
    return errorResponse(code);
  }
  const intent = data as PaymentIntent;

  const appBaseUrl = Deno.env.get('APP_BASE_URL') ?? 'http://localhost:3000';
  const [firstName, ...rest] = String(intent.customer.name || 'Coconnect User').split(' ');

  const provider = new PayHereProvider({
    merchantId,
    merchantSecret,
    sandbox: Deno.env.get('PAYHERE_SANDBOX') !== 'false',
  });

  const checkout = provider.buildCheckout({
    orderId: intent.paymentId,
    amount: Number(intent.fees.total),
    currency: 'LKR',
    items: `Coconnect escrow — job ${intent.jobId}`,
    returnUrl: `${appBaseUrl}/#/payment/return`,
    cancelUrl: `${appBaseUrl}/#/payment/cancel`,
    notifyUrl: Deno.env.get('PAYHERE_NOTIFY_URL') ?? `${supabaseUrl}/functions/v1/payhere-notify`,
    customer: {
      firstName: firstName || 'Coconnect',
      lastName: rest.join(' ') || 'User',
      email: intent.customer.email ?? 'no-reply@coconnect.lk',
      phone: intent.customer.phone ?? '',
      address: intent.customer.location ?? '',
      city: intent.customer.location ?? '',
      country: 'Sri Lanka',
    },
  });

  return jsonResponse({
    checkout,
    fees: {
      bidPrice: Number(intent.fees.bidPrice),
      platformFee: Number(intent.fees.platformFee),
      total: Number(intent.fees.total),
      currency: 'LKR',
    },
  });
});
