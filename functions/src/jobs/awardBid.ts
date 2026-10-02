import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { type Transaction, type DocumentReference, type DocumentData } from 'firebase-admin/firestore';
import { getDb } from '../db.js';

export interface AwardBidInput {
  bidId: string;
  /**
   * Client-chosen, matching this codebase's `award-${Date.now()}` id scheme
   * (the same reason createEstate/createJob/createBid take a pre-made id —
   * see src/lib/data/firestoreSync.ts) so the optimistic local Award and the
   * one this Function creates reconcile as one upsert, not a duplicate, once
   * store.startSync()'s listener picks it up.
   */
  awardId: string;
}

/**
 * The one way a bid ever becomes an award. Not a plain client write because
 * firestore.rules only lets a job's owner move `status` within
 * {DRAFT, OPEN, CANCELLED} — AWARDED_PENDING_FEE onward is Functions-only —
 * and `awards` has no client write rule at all. In one transaction: accept
 * the winning bid, reject every other pending bid on the job, move the job
 * to AWARDED_PENDING_FEE, and create the award (escrow_status: 'pending' —
 * no money has moved yet; that starts at S1-09's createPayment).
 *
 * See .claude/docs/plans/SESSION_1_BACKEND.md's S1-08 note for why this
 * exists (found as a gap while building S1-07's repositories).
 */
export const awardBid = onCall<AwardBidInput>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const { bidId, awardId } = request.data ?? ({} as AwardBidInput);
  if (!bidId || !awardId) {
    throw new HttpsError('invalid-argument', 'bidId and awardId are required.');
  }

  const db = getDb();
  const bidRef = db.collection('bids').doc(bidId);
  const awardRef = db.collection('awards').doc(awardId);

  await db.runTransaction(async (tx: Transaction) => {
    const [bidSnap, awardSnap] = await Promise.all([tx.get(bidRef), tx.get(awardRef)]);
    if (!bidSnap.exists) {
      throw new HttpsError('not-found', 'Bid not found.');
    }
    if (awardSnap.exists) {
      throw new HttpsError('already-exists', 'An award with this id already exists.');
    }
    const bid = bidSnap.data()!;

    const jobRef = db.collection('jobs').doc(bid.job_id);
    const jobSnap = await tx.get(jobRef);
    if (!jobSnap.exists) {
      throw new HttpsError('not-found', 'Job not found.');
    }
    const job = jobSnap.data()!;

    if (job.owner_id !== request.auth!.uid) {
      throw new HttpsError('permission-denied', 'Only the job owner can award a bid.');
    }
    if (bid.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'This bid is no longer pending.');
    }
    if (job.status !== 'OPEN') {
      throw new HttpsError('failed-precondition', 'This job is not open for awarding.');
    }

    const otherBidsSnap = await tx.get(db.collection('bids').where('job_id', '==', bid.job_id));
    const ownerSnap = await tx.get(db.collection('users').doc(job.owner_id));
    const owner = ownerSnap.data();

    tx.update(bidRef, { status: 'accepted' });
    otherBidsSnap.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot<DocumentData>) => {
      if (doc.id !== bidId && doc.data().status === 'pending') {
        tx.update(doc.ref as DocumentReference, { status: 'rejected' });
      }
    });

    tx.update(jobRef, { status: 'AWARDED_PENDING_FEE' });

    tx.set(awardRef, {
      category: job.category ?? 'coconut',
      job_id: bid.job_id,
      owner_id: job.owner_id,
      owner_name: job.owner_name ?? owner?.name ?? null,
      owner_phone: owner?.phone ?? null,
      bid_id: bidId,
      supervisor_id: bid.supervisor_id,
      supervisor_name: bid.supervisor_name,
      awarded_at: new Date().toISOString(),
      escrow_status: 'pending',
      escrow_amount: bid.price,
    });

    const auditRef = db.collection('audit_logs').doc();
    tx.set(auditRef, {
      actor_id: request.auth!.uid,
      actor_name: job.owner_name ?? request.auth!.uid,
      action: 'award.created',
      subject_type: 'award',
      subject_id: awardRef.id,
      details: `Owner accepted bid ${bidId} for job ${bid.job_id}`,
      at: new Date().toISOString(),
    });

    return awardRef.id;
  });

  return { awardId };
});
