/**
 * The awardBid Function end-to-end over real HTTP (not .run()): a job
 * owner calls it through the client SDK, and the result is visible to a
 * store-style Firestore listener — proving the whole award creation path
 * S1-08 added (store.ts can't write awards or push jobs past OPEN itself;
 * see functions/src/jobs/awardBid.ts).
 *
 * Also the test that caught ADR-010: every Firestore access here — admin
 * seeding, the Function, and the client listener — must agree on the named
 * database (DATABASE_ID), not the `(default)` one `getFirestore(app)`
 * silently falls back to.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { DATABASE_ID } from '../../functions/src/db';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FUNCTIONS_EMULATOR_HOST ??= '127.0.0.1:5001';

const PROJECT_ID = 'gen-lang-client-0417035030';

let adminApp: App;

beforeAll(() => {
  adminApp = getApps().length ? getApps()[0]! : initializeApp({ projectId: PROJECT_ID });
});

afterAll(() => deleteApp(adminApp));

describe('awardBid (real HTTP callable)', () => {
  it('awards a bid and the result reaches a Firestore listener', async () => {
    const { auth } = await import('../../src/lib/firebase');
    const { awardBid } = await import('../../src/lib/data/jobEngine');
    const { subscribeToAwards } = await import('../../src/lib/data/awards');

    const ownerUid = `owner-${randomUUID()}`;
    await getAdminAuth(adminApp).createUser({ uid: ownerUid });
    const token = await getAdminAuth(adminApp).createCustomToken(ownerUid);
    await signInWithCustomToken(auth, token);

    const adminDb = getAdminFirestore(adminApp, DATABASE_ID);
    const jobId = `job-${randomUUID()}`;
    const bidId = `bid-${randomUUID()}`;
    const awardId = `award-${randomUUID()}`;

    await adminDb.collection('jobs').doc(jobId).set({ owner_id: ownerUid, owner_name: 'Owner', status: 'OPEN', category: 'coconut' });
    await adminDb.collection('bids').doc(bidId).set({ job_id: jobId, supervisor_id: 'sup-x', supervisor_name: 'Sup X', price: 5000, status: 'pending' });

    const seenAwardIds: string[] = [];
    const unsubscribe = subscribeToAwards(
      ownerUid,
      (changes) => changes.added.forEach((a) => seenAwardIds.push(a.id)),
      (err) => {
        throw err;
      }
    );

    try {
      await awardBid(bidId, awardId);
      await waitFor(() => seenAwardIds.includes(awardId));

      const job = await adminDb.collection('jobs').doc(jobId).get();
      expect(job.data()?.status).toBe('AWARDED_PENDING_FEE');
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
