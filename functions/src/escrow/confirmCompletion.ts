import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { type Transaction } from 'firebase-admin/firestore';
import { getDb } from '../db.js';
import { verifyPin } from './pin.js';

const MAX_ATTEMPTS_PER_WINDOW = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour — payments.md proposes this as a starting point

export interface ConfirmCompletionInput {
  completionId: string;
  pin: string;
}

/**
 * The only path from `held` to `release_requested`. Checks a HASHED PIN
 * server-side (closes KNOWN_ISSUES #3's completion half) — never a plain
 * client comparison. Rate-limited per completion, same shape as the OTP
 * rate limit pattern payments.md proposes.
 */
export const confirmCompletion = onCall<ConfirmCompletionInput>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const { completionId, pin } = request.data ?? ({} as ConfirmCompletionInput);
  if (!completionId || !pin) {
    throw new HttpsError('invalid-argument', 'completionId and pin are required.');
  }

  const db = getDb();
  const completionRef = db.collection('completions').doc(completionId);

  const completionSnap = await completionRef.get();
  if (!completionSnap.exists) {
    throw new HttpsError('not-found', 'Completion not found.');
  }
  const completion = completionSnap.data()!;

  if (completion.owner_id !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'Only the job owner can confirm this completion.');
  }
  if (completion.status !== 'pending') {
    throw new HttpsError('failed-precondition', 'This completion is not awaiting confirmation.');
  }

  const now = Date.now();
  const windowStart = completion.pin_attempts_window_start ? new Date(completion.pin_attempts_window_start).getTime() : 0;
  const attemptsInWindow = now - windowStart < WINDOW_MS ? completion.pin_attempts ?? 0 : 0;
  if (attemptsInWindow >= MAX_ATTEMPTS_PER_WINDOW) {
    throw new HttpsError('resource-exhausted', 'Too many attempts. Try again later.');
  }

  const ownerSnap = await db.collection('users').doc(completion.owner_id).get();
  const pinHash: string | undefined = ownerSnap.data()?.pin_hash;
  const valid = pinHash ? await verifyPin(pin, pinHash) : false;

  if (!valid) {
    await completionRef.update({
      pin_attempts: attemptsInWindow + 1,
      pin_attempts_window_start: attemptsInWindow === 0 ? new Date(now).toISOString() : completion.pin_attempts_window_start,
    });
    throw new HttpsError('permission-denied', 'Incorrect PIN.');
  }

  const award = await findAwardForJob(db, completion.job_id);
  if (!award) {
    throw new HttpsError('failed-precondition', 'No award found for this job.');
  }
  if (award.data.escrow_status !== 'held') {
    throw new HttpsError('failed-precondition', `Escrow is "${award.data.escrow_status}", not held.`);
  }
  // Defense in depth alongside the firestore.rules create check: refuse to
  // advance escrow for a completion that doesn't match the award's real
  // owner/supervisor, even if a forged doc somehow reached `held`+pending.
  // Security-review fix (completions forgery).
  if (award.data.owner_id !== completion.owner_id) {
    throw new HttpsError('failed-precondition', 'Completion owner does not match this award.');
  }
  if (award.data.supervisor_id !== completion.submitted_by) {
    throw new HttpsError('failed-precondition', 'This completion was not submitted by the awarded supervisor.');
  }

  const now_iso = new Date().toISOString();
  await db.runTransaction(async (tx: Transaction) => {
    tx.update(completionRef, { status: 'confirmed', pin_attempts: 0 });
    tx.update(award.ref, { escrow_status: 'release_requested' });
    tx.update(db.collection('jobs').doc(completion.job_id), { status: 'COMPLETED' });
    tx.set(db.collection('audit_logs').doc(), {
      actor_id: request.auth!.uid,
      actor_name: 'owner',
      action: 'completion.confirmed',
      subject_type: 'award',
      subject_id: award.ref.id,
      details: `Completion ${completionId} confirmed with PIN; escrow release_requested`,
      at: now_iso,
    });
  });

  return { ok: true };
});

async function findAwardForJob(db: FirebaseFirestore.Firestore, jobId: string) {
  const snap = await db.collection('awards').where('job_id', '==', jobId).limit(1).get();
  if (snap.empty) return null;
  return { ref: snap.docs[0].ref, data: snap.docs[0].data() };
}
