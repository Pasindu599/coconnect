import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDb } from '../db.js';

export interface OpenDisputeInput {
  awardId: string;
  reason: string;
}

const DISPUTABLE_STATUSES = ['held', 'release_requested'];

/**
 * Either party to the award. Freezes the escrow in `disputed` — a dead-end
 * state except via resolveDispute (payments.md). Could be a plain client
 * write (disputes/{id}.create is allowed by firestore.rules), but the
 * escrow_status flip on the award is Functions-only, so this does both in
 * one transaction rather than relying on two separate client writes to
 * stay in sync.
 */
export const openDispute = onCall<OpenDisputeInput>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const { awardId, reason } = request.data ?? ({} as OpenDisputeInput);
  if (!awardId || !reason) {
    throw new HttpsError('invalid-argument', 'awardId and reason are required.');
  }

  const db = getDb();
  const awardRef = db.collection('awards').doc(awardId);
  const awardSnap = await awardRef.get();
  if (!awardSnap.exists) {
    throw new HttpsError('not-found', 'Award not found.');
  }
  const award = awardSnap.data()!;

  const uid = request.auth.uid;
  if (award.owner_id !== uid && award.supervisor_id !== uid) {
    throw new HttpsError('permission-denied', 'Only a party to this award can open a dispute.');
  }
  if (!DISPUTABLE_STATUSES.includes(award.escrow_status)) {
    throw new HttpsError('failed-precondition', `Cannot dispute escrow in status "${award.escrow_status}".`);
  }

  const disputeRef = db.collection('disputes').doc();
  const now = new Date().toISOString();

  await db.runTransaction(async (tx) => {
    tx.set(disputeRef, {
      category: award.category ?? 'coconut',
      job_id: award.job_id,
      award_id: awardId,
      owner_id: award.owner_id,
      supervisor_id: award.supervisor_id,
      opened_by: uid,
      reason,
      opened_at: now,
      status: 'open',
    });
    tx.update(awardRef, { escrow_status: 'disputed' });
    tx.set(db.collection('audit_logs').doc(), {
      actor_id: uid,
      actor_name: uid === award.owner_id ? 'owner' : 'supervisor',
      action: 'dispute.opened',
      subject_type: 'award',
      subject_id: awardId,
      details: `Dispute opened: ${reason}`,
      at: now,
    });
  });

  return { disputeId: disputeRef.id };
});
