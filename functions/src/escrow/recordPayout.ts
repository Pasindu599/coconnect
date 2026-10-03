import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDb } from '../db.js';

export interface RecordPayoutInput {
  awardId: string;
  bankTransferRef: string;
}

/**
 * Admin-claim only. The MVP payout is a manual bank transfer the admin
 * makes outside the app; this just records that it happened. The ledger
 * `release` entry uses the award's full `escrow_amount` (bid price +
 * platform fee), matching the `hold` entry payhereNotify wrote — the
 * platform fee was never a separate pot of money to "release" out of
 * escrow, it's accounted for by `payout_amount` below being smaller than
 * `escrow_amount`, not by a smaller ledger entry. See
 * .claude/docs/specs/payments.md's "Admin payouts" section for why this
 * was an open question.
 */
export const recordPayout = onCall<RecordPayoutInput>(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Only an admin can record a payout.');
  }

  const { awardId, bankTransferRef } = request.data ?? ({} as RecordPayoutInput);
  if (!awardId || !bankTransferRef) {
    throw new HttpsError('invalid-argument', 'awardId and bankTransferRef are required.');
  }

  const db = getDb();
  const awardRef = db.collection('awards').doc(awardId);
  const awardSnap = await awardRef.get();
  if (!awardSnap.exists) {
    throw new HttpsError('not-found', 'Award not found.');
  }
  const award = awardSnap.data()!;

  if (award.escrow_status !== 'release_requested') {
    throw new HttpsError('failed-precondition', `Escrow is "${award.escrow_status}", not release_requested.`);
  }

  const paymentSnap = await db.collection('payments').where('award_id', '==', awardId).where('status', '==', 'paid').limit(1).get();
  const platformFee: number = paymentSnap.docs[0]?.data()?.platform_fee ?? 0;
  const payoutAmount = award.escrow_amount - platformFee;

  const now = new Date().toISOString();

  await db.runTransaction(async (tx) => {
    tx.update(awardRef, {
      escrow_status: 'released',
      fee_payment_ref: bankTransferRef,
      payout_amount: payoutAmount,
      // payout_ref/payout_at are Session 2's existing field names (their
      // admin PayoutsTab UI filters/sorts on these) — set alongside the
      // names above so the UI needs no further change once it calls this
      // Function instead of the mock. See CONTRACTS.md C7.
      payout_ref: bankTransferRef,
      payout_at: now,
    });
    tx.set(db.collection('ledger').doc(), {
      category: award.category ?? 'coconut',
      award_id: awardId,
      payment_id: paymentSnap.docs[0]?.id ?? null,
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
      action: 'payout.recorded',
      subject_type: 'award',
      subject_id: awardId,
      details: `Payout of LKR ${payoutAmount} recorded via bank transfer ${bankTransferRef}`,
      at: now,
    });
  });

  return { ok: true, payoutAmount };
});
