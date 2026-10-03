import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineString, defineSecret } from 'firebase-functions/params';
import { getDb } from '../db.js';
import { calculateFees } from './feeCalculator.js';
import { PayHereProvider } from './payhere.js';

// All overridable per environment (dev/staging/prod) without a code change.
// PAYHERE_MERCHANT_ID/SECRET are sandbox-only until 1C-4 delivers real
// credentials — see .claude/docs/specs/payments.md's "Open dependency" note.
const APP_BASE_URL = defineString('APP_BASE_URL', { default: 'http://localhost:3000' });
const PAYHERE_MERCHANT_ID = defineString('PAYHERE_MERCHANT_ID', { default: 'SANDBOX_MERCHANT_ID_PLACEHOLDER' });
const PAYHERE_MERCHANT_SECRET = defineSecret('PAYHERE_MERCHANT_SECRET');

const DEFAULT_FEE_PERCENT = 5; // ADR-011, used only if config/platform is missing
const PENDING_PAYMENT_STALE_MS = 30 * 60 * 1000; // payments.md: retry same checkout within 30 min, else start fresh

export interface CreatePaymentInput {
  awardId: string;
}

// CONTRACTS C4. Checks: only the job's poster may pay, never twice for one
// award (a fresh pending payment reuses the same checkout within 30 minutes
// instead of creating a duplicate — payments.md).
export const createPayment = onCall<CreatePaymentInput>({ secrets: [PAYHERE_MERCHANT_SECRET] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const { awardId } = request.data ?? ({} as CreatePaymentInput);
  if (!awardId) {
    throw new HttpsError('invalid-argument', 'awardId is required.');
  }

  const db = getDb();

  const awardSnap = await db.collection('awards').doc(awardId).get();
  if (!awardSnap.exists) {
    throw new HttpsError('not-found', 'Award not found.');
  }
  const award = awardSnap.data()!;

  const jobSnap = await db.collection('jobs').doc(award.job_id).get();
  if (!jobSnap.exists) {
    throw new HttpsError('not-found', 'Job not found.');
  }
  const job = jobSnap.data()!;

  if (job.owner_id !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'Only the job owner can create a payment for this award.');
  }

  const paidSnap = await db.collection('payments').where('award_id', '==', awardId).where('status', '==', 'paid').limit(1).get();
  if (!paidSnap.empty) {
    throw new HttpsError('already-exists', 'This award has already been paid.');
  }

  const feeConfigSnap = await db.collection('config').doc('platform').get();
  const feePercent = (feeConfigSnap.exists && feeConfigSnap.data()?.fee_percent) || DEFAULT_FEE_PERCENT;
  const fees = calculateFees(award.escrow_amount, feePercent);

  const pendingSnap = await db.collection('payments').where('award_id', '==', awardId).where('status', '==', 'pending').limit(1).get();
  const pendingDoc = pendingSnap.docs[0];
  const pendingIsRecent =
    pendingDoc && Date.now() - new Date(pendingDoc.data().created_at).getTime() < PENDING_PAYMENT_STALE_MS;

  let paymentId: string;
  if (pendingDoc && pendingIsRecent) {
    paymentId = pendingDoc.id;
  } else {
    const paymentRef = db.collection('payments').doc();
    paymentId = paymentRef.id;
    await paymentRef.set({
      category: award.category ?? 'coconut',
      award_id: awardId,
      job_id: award.job_id,
      owner_id: job.owner_id,
      supervisor_id: award.supervisor_id,
      amount: fees.total,
      platform_fee: fees.platformFee,
      currency: 'LKR',
      provider: 'payhere',
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  }

  const ownerSnap = await db.collection('users').doc(job.owner_id).get();
  const owner = ownerSnap.data() ?? {};
  const [firstName, ...rest] = String(owner.name ?? 'Coconnect User').split(' ');

  const provider = new PayHereProvider({
    merchantId: PAYHERE_MERCHANT_ID.value(),
    merchantSecret: PAYHERE_MERCHANT_SECRET.value(),
    sandbox: true,
  });

  const checkout = provider.buildCheckout({
    orderId: paymentId,
    amount: fees.total,
    currency: 'LKR',
    items: `Coconnect escrow — job ${award.job_id}`,
    returnUrl: `${APP_BASE_URL.value()}/#/payment/return`,
    cancelUrl: `${APP_BASE_URL.value()}/#/payment/cancel`,
    // Placeholder path until S1-10 deploys the real payhereNotify endpoint.
    notifyUrl: `${APP_BASE_URL.value()}/payhereNotify`,
    customer: {
      firstName: firstName || 'Coconnect',
      lastName: rest.join(' ') || 'User',
      email: owner.email ?? 'no-reply@coconnect.lk',
      phone: owner.phone ?? '',
      address: owner.location ?? '',
      city: owner.location ?? '',
      country: 'Sri Lanka',
    },
  });

  return { checkout, fees };
});
