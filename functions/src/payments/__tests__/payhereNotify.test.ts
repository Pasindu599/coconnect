import '../../auth/__tests__/setup';
process.env.PAYHERE_MERCHANT_SECRET ??= 'test-secret';
process.env.PAYHERE_MERCHANT_ID ??= 'test-merchant';

import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { payhereNotify } from '../payhereNotify.js';
import { computeNotifySig, formatAmount } from '../payhere.js';
import { DATABASE_ID } from '../../db.js';

const MERCHANT_ID = 'test-merchant';
const SECRET = 'test-secret';

let app: App;

beforeAll(() => {
  app = getApps().length ? getApps()[0]! : initializeApp({ projectId: process.env.GCLOUD_PROJECT });
});

afterAll(() => deleteApp(app));

function fakeRes() {
  const calls: { status?: number; body?: unknown } = {};
  return {
    status(code: number) {
      calls.status = code;
      return this;
    },
    send(body: unknown) {
      calls.body = body;
    },
    calls,
  };
}

function notifyBody(overrides: Partial<Record<string, string>> = {}) {
  const base = {
    merchant_id: MERCHANT_ID,
    order_id: 'order-placeholder',
    payhere_amount: '100.00',
    payhere_currency: 'LKR',
    status_code: '2',
  };
  const merged = { ...base, ...overrides };
  const sig =
    overrides.md5sig ??
    computeNotifySig(merged.merchant_id, merged.order_id, merged.payhere_amount, merged.payhere_currency, merged.status_code, SECRET);
  return { ...merged, md5sig: sig };
}

async function callNotify(body: Record<string, string>) {
  const res = fakeRes();
  await (payhereNotify as unknown as (req: { body: Record<string, string> }, res: ReturnType<typeof fakeRes>) => Promise<void>)(
    { body },
    res
  );
  return res.calls;
}

async function seedPayment(amount = 10000) {
  const db = getFirestore(app, DATABASE_ID);
  const awardId = `award-${randomUUID()}`;
  const jobId = `job-${randomUUID()}`;
  const paymentId = `payment-${randomUUID()}`;

  await db.collection('jobs').doc(jobId).set({ owner_id: 'owner-1', status: 'AWARDED_PENDING_FEE', category: 'coconut' });
  await db.collection('awards').doc(awardId).set({ job_id: jobId, owner_id: 'owner-1', supervisor_id: 'sup-1', escrow_status: 'pending', escrow_amount: amount, category: 'coconut' });
  await db.collection('payments').doc(paymentId).set({
    award_id: awardId, job_id: jobId, owner_id: 'owner-1', supervisor_id: 'sup-1',
    amount, platform_fee: 0, currency: 'LKR', provider: 'payhere', status: 'pending', created_at: new Date().toISOString(),
  });

  return { awardId, jobId, paymentId };
}

describe('payhereNotify', () => {
  it('always responds 200, even for a bad request', async () => {
    const calls = await callNotify({});
    expect(calls.status).toBe(200);
  });

  it('on a valid notify: marks the payment paid, holds escrow, activates the job, writes a ledger entry', async () => {
    const { awardId, jobId, paymentId } = await seedPayment(10000);
    await callNotify(notifyBody({ order_id: paymentId, payhere_amount: formatAmount(10000) }));

    const db = getFirestore(app, DATABASE_ID);
    const [payment, award, job, ledger] = await Promise.all([
      db.collection('payments').doc(paymentId).get(),
      db.collection('awards').doc(awardId).get(),
      db.collection('jobs').doc(jobId).get(),
      db.collection('ledger').where('payment_id', '==', paymentId).get(),
    ]);

    expect(payment.data()?.status).toBe('paid');
    expect(award.data()?.escrow_status).toBe('held');
    expect(job.data()?.status).toBe('ACTIVE');
    expect(ledger.size).toBe(1);
    expect(ledger.docs[0].data()).toMatchObject({ type: 'hold', amount: 10000 });
  });

  it('rejects a bad signature: no state change', async () => {
    const { paymentId } = await seedPayment(10000);
    await callNotify(notifyBody({ order_id: paymentId, payhere_amount: formatAmount(10000), md5sig: 'not-a-real-signature' }));

    const db = getFirestore(app, DATABASE_ID);
    const payment = await db.collection('payments').doc(paymentId).get();
    expect(payment.data()?.status).toBe('pending');
  });

  it('rejects an amount mismatch: no state change, audit log written', async () => {
    const { paymentId } = await seedPayment(10000);
    await callNotify(notifyBody({ order_id: paymentId, payhere_amount: '1.00' }));

    const db = getFirestore(app, DATABASE_ID);
    const payment = await db.collection('payments').doc(paymentId).get();
    expect(payment.data()?.status).toBe('pending');

    const auditLogs = await db.collection('audit_logs').where('subject_id', '==', paymentId).get();
    expect(auditLogs.size).toBeGreaterThan(0);
  });

  it('is idempotent: a duplicate notify for an already-paid order is a no-op (no duplicate ledger entry)', async () => {
    const { paymentId } = await seedPayment(10000);
    const body = notifyBody({ order_id: paymentId, payhere_amount: formatAmount(10000) });

    await callNotify(body);
    await callNotify(body);

    const db = getFirestore(app, DATABASE_ID);
    const ledger = await db.collection('ledger').where('payment_id', '==', paymentId).get();
    expect(ledger.size).toBe(1);
  });

  it('ignores an unknown order_id without throwing', async () => {
    const calls = await callNotify(notifyBody({ order_id: `unknown-${randomUUID()}` }));
    expect(calls.status).toBe(200);
  });

  it('updates payment status for non-success codes without touching escrow', async () => {
    const { paymentId, awardId } = await seedPayment(10000);
    await callNotify(notifyBody({ order_id: paymentId, payhere_amount: formatAmount(10000), status_code: '-1' }));

    const db = getFirestore(app, DATABASE_ID);
    const [payment, award] = await Promise.all([
      db.collection('payments').doc(paymentId).get(),
      db.collection('awards').doc(awardId).get(),
    ]);
    expect(payment.data()?.status).toBe('cancelled');
    expect(award.data()?.escrow_status).toBe('pending');
  });
});
