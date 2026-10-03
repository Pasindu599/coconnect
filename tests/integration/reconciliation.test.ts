/**
 * reconcileAwards() as an admin, over a real client connection — confirms
 * the ADR-009 reasoning that a blanket (unfiltered) list query IS safe for
 * an admin caller specifically, because firestore.rules' isAdmin() branch
 * doesn't depend on the document being read. Not proven anywhere else.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { DATABASE_ID } from '../../functions/src/db';

const PROJECT_ID = 'gen-lang-client-0417035030';

let adminApp: App;

beforeAll(() => {
  adminApp = getApps().length ? getApps()[0]! : initializeApp({ projectId: PROJECT_ID });
});

afterAll(() => deleteApp(adminApp));

describe('reconcileAwards (real admin-authenticated client read)', () => {
  it('reports a balanced award once released, matching sum(hold) == sum(release)', async () => {
    const { auth } = await import('../../src/lib/firebase');
    const { reconcileAwards } = await import('../../src/lib/data/reconciliation');

    const adminUid = `admin-${randomUUID()}`;
    await getAdminAuth(adminApp).createUser({ uid: adminUid });
    const token = await getAdminAuth(adminApp).createCustomToken(adminUid, { admin: true });
    await signInWithCustomToken(auth, token);

    const db = getAdminFirestore(adminApp, DATABASE_ID);
    const awardId = `award-${randomUUID()}`;
    const ownerId = 'owner-x';
    const supervisorId = 'sup-x';

    await db.collection('awards').doc(awardId).set({
      job_id: 'job-x', owner_id: ownerId, supervisor_id: supervisorId,
      escrow_status: 'released', escrow_amount: 10500, category: 'coconut',
    });
    await db.collection('ledger').doc(`ledger-${randomUUID()}`).set({
      award_id: awardId, owner_id: ownerId, supervisor_id: supervisorId, type: 'hold', amount: 10500, currency: 'LKR',
    });
    await db.collection('ledger').doc(`ledger-${randomUUID()}`).set({
      award_id: awardId, owner_id: ownerId, supervisor_id: supervisorId, type: 'release', amount: 10500, currency: 'LKR',
    });

    const rows = await reconcileAwards();
    const row = rows.find((r) => r.awardId === awardId);

    expect(row).toBeDefined();
    expect(row?.balanced).toBe(true);
    expect(row?.held).toBe(10500);
    expect(row?.releasedOrRefunded).toBe(10500);
    expect(row?.stillInEscrow).toBe(0);
  });

  it('flags a mismatch as unbalanced rather than hiding it', async () => {
    const { reconcileAwards } = await import('../../src/lib/data/reconciliation');

    const db = getAdminFirestore(adminApp, DATABASE_ID);
    const awardId = `award-${randomUUID()}`;

    await db.collection('awards').doc(awardId).set({
      job_id: 'job-y', owner_id: 'owner-y', supervisor_id: 'sup-y',
      escrow_status: 'held', escrow_amount: 5000, category: 'coconut',
    });
    // Deliberately wrong: a hold of 5000 but a release already recorded,
    // which should never happen while escrow_status is still 'held'.
    await db.collection('ledger').doc(`ledger-${randomUUID()}`).set({
      award_id: awardId, owner_id: 'owner-y', supervisor_id: 'sup-y', type: 'hold', amount: 5000, currency: 'LKR',
    });
    await db.collection('ledger').doc(`ledger-${randomUUID()}`).set({
      award_id: awardId, owner_id: 'owner-y', supervisor_id: 'sup-y', type: 'release', amount: 5000, currency: 'LKR',
    });

    const rows = await reconcileAwards();
    const row = rows.find((r) => r.awardId === awardId);

    expect(row?.balanced).toBe(false);
  });
});
