import '../../auth/__tests__/setup';
process.env.PAYHERE_MERCHANT_SECRET ??= 'test-secret';
process.env.PAYHERE_MERCHANT_ID ??= 'test-merchant';

import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { resolveDispute, type ResolveDisputeInput } from '../resolveDispute.js';
import { DATABASE_ID } from '../../db.js';

let app: App;

beforeAll(() => {
  app = getApps().length ? getApps()[0]! : initializeApp({ projectId: process.env.GCLOUD_PROJECT });
});

afterAll(() => deleteApp(app));

function call(data: ResolveDisputeInput, uid: string, isAdmin: boolean) {
  const request = {
    data,
    auth: { uid, token: { uid, admin: isAdmin || undefined } as never, rawToken: 'test' },
  } as unknown as CallableRequest<ResolveDisputeInput>;
  return resolveDispute.run(request);
}

async function seedDispute(withPaidPayment: boolean) {
  const db = getFirestore(app, DATABASE_ID);
  const ownerId = `owner-${randomUUID()}`;
  const supervisorId = `sup-${randomUUID()}`;
  const jobId = `job-${randomUUID()}`;
  const awardId = `award-${randomUUID()}`;
  const disputeId = `disp-${randomUUID()}`;

  await db.collection('jobs').doc(jobId).set({ owner_id: ownerId, status: 'ACTIVE', category: 'coconut' });
  await db.collection('awards').doc(awardId).set({ job_id: jobId, owner_id: ownerId, supervisor_id: supervisorId, escrow_status: 'disputed', escrow_amount: 10000, category: 'coconut' });
  await db.collection('disputes').doc(disputeId).set({
    job_id: jobId, award_id: awardId, owner_id: ownerId, supervisor_id: supervisorId,
    opened_by: ownerId, reason: 'test', opened_at: new Date().toISOString(), status: 'open',
  });

  if (withPaidPayment) {
    await db.collection('payments').doc(`payment-${randomUUID()}`).set({
      award_id: awardId, owner_id: ownerId, supervisor_id: supervisorId,
      amount: 10000, status: 'paid', provider_ref: 'PH-REF-1', currency: 'LKR',
    });
  }

  return { ownerId, supervisorId, jobId, awardId, disputeId };
}

describe('resolveDispute', () => {
  it('rejects a non-admin caller', async () => {
    const { disputeId } = await seedDispute(true);
    await expect(call({ disputeId, resolution: 'released' }, 'someone', false)).rejects.toThrow();
  });

  it('released: moves escrow to released, writes a ledger release entry, resolves the dispute', async () => {
    const { disputeId, awardId } = await seedDispute(true);
    await call({ disputeId, resolution: 'released' }, 'admin-1', true);

    const db = getFirestore(app, DATABASE_ID);
    const [dispute, award, ledger] = await Promise.all([
      db.collection('disputes').doc(disputeId).get(),
      db.collection('awards').doc(awardId).get(),
      db.collection('ledger').where('award_id', '==', awardId).where('type', '==', 'release').get(),
    ]);
    expect(dispute.data()).toMatchObject({ status: 'resolved', resolution: 'released' });
    expect(award.data()?.escrow_status).toBe('released');
    expect(ledger.size).toBe(1);
  });

  it('refunded: fails because the real PayHere refund API isn\'t available yet, and leaves the dispute open', async () => {
    const { disputeId, awardId } = await seedDispute(true);
    await expect(call({ disputeId, resolution: 'refunded' }, 'admin-1', true)).rejects.toThrow();

    const db = getFirestore(app, DATABASE_ID);
    const [dispute, award] = await Promise.all([
      db.collection('disputes').doc(disputeId).get(),
      db.collection('awards').doc(awardId).get(),
    ]);
    expect(dispute.data()?.status).toBe('open');
    expect(award.data()?.escrow_status).toBe('disputed');
  });

  it('rejects resolving an already-resolved dispute', async () => {
    const { disputeId } = await seedDispute(true);
    await call({ disputeId, resolution: 'released' }, 'admin-1', true);
    await expect(call({ disputeId, resolution: 'released' }, 'admin-1', true)).rejects.toThrow();
  });
});
