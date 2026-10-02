import { onRequest } from 'firebase-functions/v2/https';
import { defineString, defineSecret } from 'firebase-functions/params';
import { getDb } from '../db.js';
import { computeNotifySig, formatAmount } from './payhere.js';

const PAYHERE_MERCHANT_ID = defineString('PAYHERE_MERCHANT_ID', { default: 'SANDBOX_MERCHANT_ID_PLACEHOLDER' });
const PAYHERE_MERCHANT_SECRET = defineSecret('PAYHERE_MERCHANT_SECRET');

// PayHere's convention: 2 = success, 0 = pending, -1 = cancelled,
// -2 = failed, -3 = chargedback. Only 2 moves escrow; the rest just update
// payments.status for visibility.
const NON_SUCCESS_STATUS: Record<string, 'pending' | 'cancelled' | 'failed'> = {
  '0': 'pending',
  '-1': 'cancelled',
  '-2': 'failed',
  '-3': 'failed',
};

interface NotifyBody {
  merchant_id?: string;
  order_id?: string;
  payhere_amount?: string;
  payhere_currency?: string;
  status_code?: string;
  md5sig?: string;
  payment_id?: string;
}

/**
 * PayHere POSTs here directly — unauthenticated except for md5sig. Always
 * acknowledges 200 once the payload is parsed (including every rejection
 * below, after logging) so an invalid/forged request doesn't make PayHere
 * retry-hammer the endpoint — see payments.md's "Response note".
 */
export const payhereNotify = onRequest({ secrets: [PAYHERE_MERCHANT_SECRET] }, async (req, res) => {
  try {
    await handleNotify(req.body as NotifyBody);
  } catch (err) {
    console.error('payhereNotify: unexpected error', err);
  }
  res.status(200).send('OK');
});

async function handleNotify(body: NotifyBody): Promise<void> {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = body;

  if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || !status_code || !md5sig) {
    console.warn('payhereNotify: missing required field(s)', body);
    return;
  }

  if (merchant_id !== PAYHERE_MERCHANT_ID.value()) {
    console.warn('payhereNotify: merchant_id mismatch', { got: merchant_id });
    return;
  }

  const expectedSig = computeNotifySig(merchant_id, order_id, payhere_amount, payhere_currency, status_code, PAYHERE_MERCHANT_SECRET.value());
  if (md5sig.toUpperCase() !== expectedSig) {
    console.warn('payhereNotify: bad signature', { order_id });
    return;
  }

  const db = getDb();
  const paymentRef = db.collection('payments').doc(order_id);
  const paymentSnap = await paymentRef.get();
  if (!paymentSnap.exists) {
    console.warn('payhereNotify: unknown order_id', { order_id });
    return;
  }
  const payment = paymentSnap.data()!;

  if (formatAmount(payment.amount) !== payhere_amount) {
    console.error('payhereNotify: amount mismatch — possible tampering', { order_id, expected: payment.amount, got: payhere_amount });
    await db.collection('audit_logs').add({
      actor_id: 'system',
      actor_name: 'payhereNotify',
      action: 'payment.amount_mismatch',
      subject_type: 'payment',
      subject_id: order_id,
      details: `Expected ${payment.amount}, notify claimed ${payhere_amount}`,
      at: new Date().toISOString(),
    });
    return;
  }

  // Idempotent: a repeated notify for an already-paid order changes nothing.
  if (payment.status === 'paid') {
    return;
  }

  if (status_code === '2') {
    await handleSuccess(db, paymentRef, order_id, payment);
    return;
  }

  const newStatus = NON_SUCCESS_STATUS[status_code];
  if (newStatus && payment.status !== newStatus) {
    await paymentRef.update({ status: newStatus });
  }
}

async function handleSuccess(
  db: FirebaseFirestore.Firestore,
  paymentRef: FirebaseFirestore.DocumentReference,
  orderId: string,
  payment: FirebaseFirestore.DocumentData
): Promise<void> {
  const awardRef = db.collection('awards').doc(payment.award_id);
  const jobRef = db.collection('jobs').doc(payment.job_id);

  await db.runTransaction(async (tx) => {
    const [paymentSnap, awardSnap] = await Promise.all([tx.get(paymentRef), tx.get(awardRef)]);
    if (!paymentSnap.exists || paymentSnap.data()?.status === 'paid') {
      return; // lost the idempotency race to a concurrent notify
    }
    if (!awardSnap.exists) {
      return;
    }

    const now = new Date().toISOString();

    tx.update(paymentRef, { status: 'paid', paid_at: now });
    // escrow_amount is overwritten here to the real, authoritative charged
    // total (bid price + platform fee) — at award time it was only ever a
    // provisional bid-price estimate (no payment existed yet to know the
    // fee from). This is what S1-12's reconciliation balances against, so
    // it must equal exactly what the 'hold' ledger entry below records.
    tx.update(awardRef, { escrow_status: 'held', contacts_released_at: now, escrow_amount: payment.amount });
    tx.update(jobRef, { status: 'ACTIVE' });

    const ledgerRef = db.collection('ledger').doc();
    tx.set(ledgerRef, {
      category: payment.category ?? 'coconut',
      award_id: payment.award_id,
      payment_id: orderId,
      owner_id: payment.owner_id,
      supervisor_id: payment.supervisor_id,
      type: 'hold',
      amount: payment.amount,
      currency: 'LKR',
      created_at: now,
      created_by: 'system',
    });

    const auditRef = db.collection('audit_logs').doc();
    tx.set(auditRef, {
      actor_id: 'system',
      actor_name: 'payhereNotify',
      action: 'payment.held',
      subject_type: 'award',
      subject_id: payment.award_id,
      details: `Payment ${orderId} verified; escrow held for award ${payment.award_id}`,
      at: now,
    });
  });
}
