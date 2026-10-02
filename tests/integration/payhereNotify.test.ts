/**
 * payhereNotify over a real HTTP POST through the Functions emulator (not
 * a direct call with a hand-built req/res) — confirms Cloud Functions'
 * body-parsing actually gives req.body the shape payhereNotify.ts assumes
 * for a form-encoded POST, which is how PayHere actually sends it.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { DATABASE_ID } from '../../functions/src/db';
import { computeNotifySig, formatAmount } from '../../functions/src/payments/payhere';

const PROJECT_ID = 'gen-lang-client-0417035030';
const FUNCTIONS_HOST = process.env.FUNCTIONS_EMULATOR_HOST ?? '127.0.0.1:5001';
const NOTIFY_URL = `http://${FUNCTIONS_HOST}/${PROJECT_ID}/us-central1/payhereNotify`;

// Must match functions/.env.local (PAYHERE_MERCHANT_ID) and
// functions/.secret.local (PAYHERE_MERCHANT_SECRET) — whatever the running
// Functions emulator actually resolves, not an independently-chosen value.
const MERCHANT_ID = 'SANDBOX_MERCHANT_ID_PLACEHOLDER';
const SECRET = 'local-dev-placeholder-secret';

let app: App;

beforeAll(() => {
  app = getApps().length ? getApps()[0]! : initializeApp({ projectId: PROJECT_ID });
});

afterAll(() => deleteApp(app));

describe('payhereNotify (real HTTP POST, form-encoded)', () => {
  it('holds escrow for a valid form-encoded notify', async () => {
    const db = getFirestore(app, DATABASE_ID);
    const awardId = `award-${randomUUID()}`;
    const jobId = `job-${randomUUID()}`;
    const paymentId = `payment-${randomUUID()}`;
    const amount = 10000;

    await db.collection('jobs').doc(jobId).set({ owner_id: 'owner-1', status: 'AWARDED_PENDING_FEE', category: 'coconut' });
    await db.collection('awards').doc(awardId).set({ job_id: jobId, owner_id: 'owner-1', supervisor_id: 'sup-1', escrow_status: 'pending', escrow_amount: amount, category: 'coconut' });
    await db.collection('payments').doc(paymentId).set({
      award_id: awardId, job_id: jobId, owner_id: 'owner-1', supervisor_id: 'sup-1',
      amount, platform_fee: 0, currency: 'LKR', provider: 'payhere', status: 'pending', created_at: new Date().toISOString(),
    });

    const amountStr = formatAmount(amount);
    const sig = computeNotifySig(MERCHANT_ID, paymentId, amountStr, 'LKR', '2', SECRET);
    const form = new URLSearchParams({
      merchant_id: MERCHANT_ID,
      order_id: paymentId,
      payhere_amount: amountStr,
      payhere_currency: 'LKR',
      status_code: '2',
      md5sig: sig,
    });

    const res = await fetch(NOTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    expect(res.status).toBe(200);

    const award = await db.collection('awards').doc(awardId).get();
    expect(award.data()?.escrow_status).toBe('held');
  });
});
