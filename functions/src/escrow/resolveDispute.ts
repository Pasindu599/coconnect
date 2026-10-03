import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { getDb } from '../db.js';
import { PayHereProvider } from '../payments/payhere.js';

const PAYHERE_MERCHANT_ID = defineString('PAYHERE_MERCHANT_ID', { default: 'SANDBOX_MERCHANT_ID_PLACEHOLDER' });
const PAYHERE_MERCHANT_SECRET = defineSecret('PAYHERE_MERCHANT_SECRET');

export interface ResolveDisputeInput {
  disputeId: string;
  resolution: 'refunded' | 'released';
}

/**
 * Admin-claim only. See payments.md's "resolveDispute" section for the
 * two branches; `refunded` currently always fails at the provider step
 * (PayHereProvider.refund — no real refund API access yet, 1C-4), which is
 * the documented "needs human eyes" failure path, not a bug.
 */
export const resolveDispute = onCall<ResolveDisputeInput>({ secrets: [PAYHERE_MERCHANT_SECRET] }, async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Only an admin can resolve a dispute.');
  }

  const { disputeId, resolution } = request.data ?? ({} as ResolveDisputeInput);
  if (!disputeId || (resolution !== 'refunded' && resolution !== 'released')) {
    throw new HttpsError('invalid-argument', 'disputeId and a valid resolution are required.');
  }

  const db = getDb();
  const disputeRef = db.collection('disputes').doc(disputeId);
  const disputeSnap = await disputeRef.get();
  if (!disputeSnap.exists) {
    throw new HttpsError('not-found', 'Dispute not found.');
  }
  const dispute = disputeSnap.data()!;
  if (dispute.status !== 'open') {
    throw new HttpsError('failed-precondition', 'This dispute is already resolved.');
  }

  const awardRef = db.collection('awards').doc(dispute.award_id);
  const awardSnap = await awardRef.get();
  if (!awardSnap.exists) {
    throw new HttpsError('not-found', 'Award not found.');
  }
  const award = awardSnap.data()!;

  const paymentSnap = await db.collection('payments').where('award_id', '==', dispute.award_id).where('status', '==', 'paid').limit(1).get();
  const payment = paymentSnap.docs[0];

  const now = new Date().toISOString();

  if (resolution === 'refunded') {
    if (!payment) {
      throw new HttpsError('failed-precondition', 'No paid payment found for this award to refund.');
    }
    const provider = new PayHereProvider({
      merchantId: PAYHERE_MERCHANT_ID.value(),
      merchantSecret: PAYHERE_MERCHANT_SECRET.value(),
      sandbox: true,
    });

    // Intentionally not wrapped in a transaction with the refund call:
    // the refund is an external side effect; if it fails, nothing here
    // should have changed yet, and it hasn't — all Firestore writes below
    // happen only after this resolves.
    try {
      await provider.refund({ providerRef: payment.data().provider_ref ?? payment.id, amount: payment.data().amount, currency: 'LKR' });
    } catch (err) {
      throw new HttpsError('internal', `Refund failed: ${err instanceof Error ? err.message : 'unknown error'}. Dispute remains open.`);
    }

    await db.runTransaction(async (tx) => {
      tx.update(payment.ref, { status: 'refunded' });
      tx.update(awardRef, { escrow_status: 'refunded' });
      tx.update(disputeRef, { status: 'resolved', resolution: 'refunded', resolved_by: request.auth!.uid, resolved_at: now });
      tx.set(db.collection('ledger').doc(), {
        category: award.category ?? 'coconut',
        award_id: dispute.award_id,
        payment_id: payment.id,
        owner_id: award.owner_id,
        supervisor_id: award.supervisor_id,
        type: 'refund',
        amount: payment.data().amount,
        currency: 'LKR',
        created_at: now,
        created_by: request.auth!.uid,
      });
      tx.set(db.collection('audit_logs').doc(), {
        actor_id: request.auth!.uid,
        actor_name: 'admin',
        action: 'dispute.resolved_refunded',
        subject_type: 'award',
        subject_id: dispute.award_id,
        details: `Dispute ${disputeId} resolved: refunded`,
        at: now,
      });
    });
  } else {
    await db.runTransaction(async (tx) => {
      tx.update(awardRef, { escrow_status: 'released' });
      tx.update(disputeRef, { status: 'resolved', resolution: 'released', resolved_by: request.auth!.uid, resolved_at: now });
      tx.set(db.collection('ledger').doc(), {
        category: award.category ?? 'coconut',
        award_id: dispute.award_id,
        payment_id: payment?.id ?? null,
        owner_id: award.owner_id,
        supervisor_id: award.supervisor_id,
        type: 'release',
        amount: award.escrow_amount,
        currency: 'LKR',
        created_at: now,
        created_by: request.auth!.uid,
      });
      tx.set(db.collection('audit_logs').doc(), {
        actor_id: request.auth!.uid,
        actor_name: 'admin',
        action: 'dispute.resolved_released',
        subject_type: 'award',
        subject_id: dispute.award_id,
        details: `Dispute ${disputeId} resolved: released`,
        at: now,
      });
    });
  }

  return { ok: true };
});
