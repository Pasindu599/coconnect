/**
 * confirmCompletion and openDispute over real HTTP through the Functions
 * emulator, each followed by a client-side read through the same rules
 * store.startSync() relies on — the pattern that caught ADR-009/010.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { DATABASE_ID } from '../../functions/src/db';
import { hashPin } from '../../functions/src/escrow/pin';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';

const PROJECT_ID = 'gen-lang-client-0417035030';

let adminApp: App;

beforeAll(() => {
  adminApp = getApps().length ? getApps()[0]! : initializeApp({ projectId: PROJECT_ID });
});

afterAll(() => deleteApp(adminApp));

describe('confirmCompletion + openDispute (real HTTP callables)', () => {
  it('confirms completion with the right PIN and the owner sees the award update via a listener', async () => {
    const { auth } = await import('../../src/lib/firebase');
    const { functions } = await import('../../src/lib/firebase');
    const { subscribeToAwards } = await import('../../src/lib/data/awards');

    const ownerUid = `owner-${randomUUID()}`;
    await getAdminAuth(adminApp).createUser({ uid: ownerUid });
    const token = await getAdminAuth(adminApp).createCustomToken(ownerUid);
    await signInWithCustomToken(auth, token);

    const adminDb = getAdminFirestore(adminApp, DATABASE_ID);
    await adminDb.collection('users').doc(ownerUid).set({ name: 'Owner', memberships: [], pin_hash: await hashPin('4321') });

    const jobId = `job-${randomUUID()}`;
    const awardId = `award-${randomUUID()}`;
    const completionId = `comp-${randomUUID()}`;

    await adminDb.collection('jobs').doc(jobId).set({ owner_id: ownerUid, status: 'PENDING_COMPLETION', category: 'coconut' });
    await adminDb.collection('awards').doc(awardId).set({ job_id: jobId, owner_id: ownerUid, supervisor_id: 'sup-1', escrow_status: 'held', escrow_amount: 10000, category: 'coconut' });
    await adminDb.collection('completions').doc(completionId).set({ job_id: jobId, owner_id: ownerUid, submitted_by: 'sup-1', status: 'pending' });

    const seenStatuses: string[] = [];
    const unsubscribe = subscribeToAwards(
      ownerUid,
      (changes) => changes.modified.forEach((a) => seenStatuses.push(a.escrow_status)),
      (err) => {
        throw err;
      }
    );

    try {
      const confirmCompletion = httpsCallable(functions, 'confirmCompletion');
      await confirmCompletion({ completionId, pin: '4321' });
      await waitFor(() => seenStatuses.includes('release_requested'));
    } finally {
      unsubscribe();
    }
  });

  it('opens a dispute and the escrow listener sees it flip to disputed', async () => {
    const { auth, functions } = await import('../../src/lib/firebase');
    const { subscribeToAwards } = await import('../../src/lib/data/awards');

    const ownerUid = `owner-${randomUUID()}`;
    await getAdminAuth(adminApp).createUser({ uid: ownerUid });
    const token = await getAdminAuth(adminApp).createCustomToken(ownerUid);
    await signInWithCustomToken(auth, token);

    const adminDb = getAdminFirestore(adminApp, DATABASE_ID);
    const jobId = `job-${randomUUID()}`;
    const awardId = `award-${randomUUID()}`;
    await adminDb.collection('jobs').doc(jobId).set({ owner_id: ownerUid, status: 'ACTIVE', category: 'coconut' });
    await adminDb.collection('awards').doc(awardId).set({ job_id: jobId, owner_id: ownerUid, supervisor_id: 'sup-1', escrow_status: 'held', escrow_amount: 10000, category: 'coconut' });

    const seenStatuses: string[] = [];
    const unsubscribe = subscribeToAwards(
      ownerUid,
      (changes) => changes.modified.forEach((a) => seenStatuses.push(a.escrow_status)),
      (err) => {
        throw err;
      }
    );

    try {
      const openDispute = httpsCallable(functions, 'openDispute');
      await openDispute({ awardId, reason: 'crew never showed up' });
      await waitFor(() => seenStatuses.includes('disputed'));
    } finally {
      unsubscribe();
    }
  });
});

async function waitFor(predicate: () => boolean, timeoutMs = 8000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timed out waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
