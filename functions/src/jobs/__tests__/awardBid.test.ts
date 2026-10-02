import '../../auth/__tests__/setup';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { awardBid, type AwardBidInput } from '../awardBid.js';
import { DATABASE_ID } from '../../db.js';

let app: App;

beforeAll(() => {
  app = getApps().length ? getApps()[0]! : initializeApp({ projectId: process.env.GCLOUD_PROJECT });
});

afterAll(() => deleteApp(app));

function call(data: AwardBidInput, uid: string) {
  const request = {
    data,
    auth: { uid, token: { uid } as never, rawToken: 'test' },
  } as unknown as CallableRequest<AwardBidInput>;
  return awardBid.run(request);
}

async function seedJobAndBids(ownerId: string) {
  const db = getFirestore(app, DATABASE_ID);
  const jobId = `job-${randomUUID()}`;
  const winningBidId = `bid-${randomUUID()}`;
  const otherBidId = `bid-${randomUUID()}`;

  await db.collection('jobs').doc(jobId).set({ owner_id: ownerId, owner_name: 'Owner', status: 'OPEN', category: 'coconut' });
  await db.collection('users').doc(ownerId).set({ name: 'Owner', phone: '+94770000001', memberships: [] });
  await db.collection('bids').doc(winningBidId).set({ job_id: jobId, supervisor_id: 'sup-1', supervisor_name: 'Sup One', price: 1000, status: 'pending' });
  await db.collection('bids').doc(otherBidId).set({ job_id: jobId, supervisor_id: 'sup-2', supervisor_name: 'Sup Two', price: 1200, status: 'pending' });

  return { jobId, winningBidId, otherBidId };
}

describe('awardBid', () => {
  it('rejects an unauthenticated call', async () => {
    const request = { data: { bidId: 'x', awardId: 'y' } } as unknown as CallableRequest<AwardBidInput>;
    await expect(awardBid.run(request)).rejects.toThrow();
  });

  it('rejects a caller who is not the job owner', async () => {
    const { winningBidId } = await seedJobAndBids('owner-1');
    await expect(call({ bidId: winningBidId, awardId: `award-${randomUUID()}` }, 'stranger')).rejects.toThrow();
  });

  it('accepts the winning bid, rejects the others, moves the job, and creates the award', async () => {
    const ownerId = `owner-${randomUUID()}`;
    const { jobId, winningBidId, otherBidId } = await seedJobAndBids(ownerId);
    const awardId = `award-${randomUUID()}`;

    await call({ bidId: winningBidId, awardId }, ownerId);

    const db = getFirestore(app, DATABASE_ID);
    const [winningBid, otherBid, job, award] = await Promise.all([
      db.collection('bids').doc(winningBidId).get(),
      db.collection('bids').doc(otherBidId).get(),
      db.collection('jobs').doc(jobId).get(),
      db.collection('awards').doc(awardId).get(),
    ]);

    expect(winningBid.data()?.status).toBe('accepted');
    expect(otherBid.data()?.status).toBe('rejected');
    expect(job.data()?.status).toBe('AWARDED_PENDING_FEE');
    expect(award.exists).toBe(true);
    expect(award.data()).toMatchObject({
      job_id: jobId,
      owner_name: 'Owner',
      owner_phone: '+94770000001',
      bid_id: winningBidId,
      supervisor_id: 'sup-1',
      escrow_status: 'pending',
      escrow_amount: 1000,
    });
  });

  it('rejects awarding a bid that is no longer pending', async () => {
    const ownerId = `owner-${randomUUID()}`;
    const { winningBidId } = await seedJobAndBids(ownerId);
    await call({ bidId: winningBidId, awardId: `award-${randomUUID()}` }, ownerId);
    await expect(call({ bidId: winningBidId, awardId: `award-${randomUUID()}` }, ownerId)).rejects.toThrow();
  });

  it('rejects reusing an award id', async () => {
    const ownerId = `owner-${randomUUID()}`;
    const { winningBidId } = await seedJobAndBids(ownerId);
    const awardId = `award-${randomUUID()}`;
    await call({ bidId: winningBidId, awardId }, ownerId);

    const { winningBidId: secondBidId } = await seedJobAndBids(ownerId);
    await expect(call({ bidId: secondBidId, awardId }, ownerId)).rejects.toThrow();
  });
});
