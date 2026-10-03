import '../../auth/__tests__/setup';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { recordPayout, type RecordPayoutInput } from '../recordPayout.js';
import { DATABASE_ID } from '../../db.js';

let app: App;

beforeAll(() => {
  app = getApps().length ? getApps()[0]! : initializeApp({ projectId: process.env.GCLOUD_PROJECT });
});

afterAll(() => deleteApp(app));

function call(data: RecordPayoutInput, uid: string, isAdmin: boolean) {
  const request = {
    data,
    auth: { uid, token: { uid, admin: isAdmin || undefined } as never, rawToken: 'test' },
  } as unknown as CallableRequest<RecordPayoutInput>;
  return recordPayout.run(request);
}

async function seedReleaseRequested(escrowAmount = 10500, platformFee = 500) {
  const db = getFirestore(app, DATABASE_ID);
  const ownerId = `owner-${randomUUID()}`;
  const supervisorId = `sup-${randomUUID()}`;
  const awardId = `award-${randomUUID()}`;

  await db.collection('awards').doc(awardId).set({
    job_id: `job-${randomUUID()}`, owner_id: ownerId, supervisor_id: supervisorId,
    escrow_status: 'release_requested', escrow_amount: escrowAmount, category: 'coconut',
  });
  await db.collection('payments').doc(`payment-${randomUUID()}`).set({
    award_id: awardId, owner_id: ownerId, supervisor_id: supervisorId,
    amount: escrowAmount, platform_fee: platformFee, status: 'paid', currency: 'LKR',
  });

  return { awardId, ownerId, supervisorId };
}

describe('recordPayout', () => {
  it('rejects a non-admin caller', async () => {
    const { awardId } = await seedReleaseRequested();
    await expect(call({ awardId, bankTransferRef: 'BT-1' }, 'someone', false)).rejects.toThrow();
  });

  it('rejects an award that is not release_requested', async () => {
    const db = getFirestore(app, DATABASE_ID);
    const awardId = `award-${randomUUID()}`;
    await db.collection('awards').doc(awardId).set({ job_id: 'j1', owner_id: 'o1', supervisor_id: 's1', escrow_status: 'held', escrow_amount: 1000, category: 'coconut' });
    await expect(call({ awardId, bankTransferRef: 'BT-1' }, 'admin-1', true)).rejects.toThrow();
  });

  it('releases escrow, records the bank ref, computes the net payout (escrow minus platform fee), writes a ledger release entry', async () => {
    const { awardId } = await seedReleaseRequested(10500, 500);
    const result = await call({ awardId, bankTransferRef: 'BT-9988' }, 'admin-1', true);
    expect(result.payoutAmount).toBe(10000);

    const db = getFirestore(app, DATABASE_ID);
    const [award, ledger] = await Promise.all([
      db.collection('awards').doc(awardId).get(),
      db.collection('ledger').where('award_id', '==', awardId).where('type', '==', 'release').get(),
    ]);

    expect(award.data()).toMatchObject({
      escrow_status: 'released',
      fee_payment_ref: 'BT-9988',
      payout_amount: 10000,
      // Session 2's field names (their admin UI reads these) — see CONTRACTS.md C7.
      payout_ref: 'BT-9988',
    });
    expect(award.data()?.payout_at).toBeTruthy();
    expect(ledger.size).toBe(1);
    // The release ledger entry matches the full held amount (10500), not
    // just the payout (10000) — see recordPayout.ts's reconciliation note.
    expect(ledger.docs[0].data().amount).toBe(10500);
  });
});
