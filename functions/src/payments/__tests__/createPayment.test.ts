import '../../auth/__tests__/setup';
process.env.PAYHERE_MERCHANT_SECRET ??= 'test-secret';
process.env.PAYHERE_MERCHANT_ID ??= 'test-merchant';

import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { createPayment, type CreatePaymentInput } from '../createPayment.js';
import { DATABASE_ID } from '../../db.js';

let app: App;

beforeAll(() => {
  app = getApps().length ? getApps()[0]! : initializeApp({ projectId: process.env.GCLOUD_PROJECT });
});

afterAll(() => deleteApp(app));

// config/platform is a single shared doc across tests in this file — reset
// it before each so "default fee" tests don't see a value another test set.
beforeEach(async () => {
  await getFirestore(app, DATABASE_ID).collection('config').doc('platform').delete();
});

function call(data: CreatePaymentInput, uid: string) {
  const request = {
    data,
    auth: { uid, token: { uid } as never, rawToken: 'test' },
  } as unknown as CallableRequest<CreatePaymentInput>;
  return createPayment.run(request);
}

async function seedAwardAndJob(ownerId: string, bidPrice = 10000) {
  const db = getFirestore(app, DATABASE_ID);
  const jobId = `job-${randomUUID()}`;
  const awardId = `award-${randomUUID()}`;

  await db.collection('jobs').doc(jobId).set({ owner_id: ownerId, owner_name: 'Owner', status: 'AWARDED_PENDING_FEE', category: 'coconut' });
  await db
    .collection('awards')
    .doc(awardId)
    .set({ job_id: jobId, owner_id: ownerId, supervisor_id: 'sup-1', supervisor_name: 'Sup One', escrow_status: 'pending', escrow_amount: bidPrice, category: 'coconut' });

  return { jobId, awardId };
}

describe('createPayment', () => {
  it('rejects an unauthenticated call', async () => {
    const request = { data: { awardId: 'x' } } as unknown as CallableRequest<CreatePaymentInput>;
    await expect(createPayment.run(request)).rejects.toThrow();
  });

  it('rejects a caller who is not the job owner', async () => {
    const ownerId = `owner-${randomUUID()}`;
    const { awardId } = await seedAwardAndJob(ownerId);
    await expect(call({ awardId }, 'stranger')).rejects.toThrow();
  });

  it('rejects an unknown award', async () => {
    const ownerId = `owner-${randomUUID()}`;
    await expect(call({ awardId: `award-${randomUUID()}` }, ownerId)).rejects.toThrow();
  });

  it('returns a checkout and fee breakdown using the default 5% fee', async () => {
    const ownerId = `owner-${randomUUID()}`;
    const { awardId } = await seedAwardAndJob(ownerId, 10000);

    const result = await call({ awardId }, ownerId);

    expect(result.fees).toEqual({ bidPrice: 10000, platformFee: 500, total: 10500, currency: 'LKR' });
    expect(result.checkout).toMatchObject({
      merchant_id: 'test-merchant',
      amount: '10500.00',
      currency: 'LKR',
    });
    expect(result.checkout.hash).toMatch(/^[0-9A-F]{32}$/);
  });

  it('reads the fee percent from config/platform when present', async () => {
    const db = getFirestore(app, DATABASE_ID);
    await db.collection('config').doc('platform').set({ fee_percent: 10 });

    const ownerId = `owner-${randomUUID()}`;
    const { awardId } = await seedAwardAndJob(ownerId, 10000);
    const result = await call({ awardId }, ownerId);

    expect(result.fees).toEqual({ bidPrice: 10000, platformFee: 1000, total: 11000, currency: 'LKR' });
  });

  it('rejects creating a payment twice after one has been paid', async () => {
    const ownerId = `owner-${randomUUID()}`;
    const { awardId } = await seedAwardAndJob(ownerId);
    const first = await call({ awardId }, ownerId);

    const db = getFirestore(app, DATABASE_ID);
    await db.collection('payments').doc(first.checkout.order_id).update({ status: 'paid' });

    await expect(call({ awardId }, ownerId)).rejects.toThrow();
  });

  it('reuses the same pending payment on a quick retry instead of creating a duplicate', async () => {
    const ownerId = `owner-${randomUUID()}`;
    const { awardId } = await seedAwardAndJob(ownerId);

    const first = await call({ awardId }, ownerId);
    const second = await call({ awardId }, ownerId);

    expect(second.checkout.order_id).toBe(first.checkout.order_id);

    const db = getFirestore(app, DATABASE_ID);
    const pending = await db.collection('payments').where('award_id', '==', awardId).get();
    expect(pending.size).toBe(1);
  });
});
