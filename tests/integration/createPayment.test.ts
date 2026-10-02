/**
 * createPayment over real HTTP through the Functions emulator — in
 * particular, that `defineSecret('PAYHERE_MERCHANT_SECRET')` actually
 * resolves outside of a direct `.run()` call, which is what
 * functions/src/payments/__tests__/createPayment.test.ts exercises instead.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { DATABASE_ID } from '../../functions/src/db';
import { computeHash } from '../../functions/src/payments/payhere';
import type { PayHereCheckout } from '../../src/lib/payments';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';

const PROJECT_ID = 'gen-lang-client-0417035030';

let adminApp: App;

beforeAll(() => {
  adminApp = getApps().length ? getApps()[0]! : initializeApp({ projectId: PROJECT_ID });
});

afterAll(() => deleteApp(adminApp));

describe('createPayment (real HTTP callable)', () => {
  it('returns a real checkout and fee breakdown for the job owner', async () => {
    const { auth } = await import('../../src/lib/firebase');
    const { createPayment } = await import('../../src/lib/payments');

    const ownerUid = `owner-${randomUUID()}`;
    await getAdminAuth(adminApp).createUser({ uid: ownerUid });
    const token = await getAdminAuth(adminApp).createCustomToken(ownerUid);
    await signInWithCustomToken(auth, token);

    const adminDb = getAdminFirestore(adminApp, DATABASE_ID);
    const jobId = `job-${randomUUID()}`;
    const awardId = `award-${randomUUID()}`;

    await adminDb.collection('jobs').doc(jobId).set({ owner_id: ownerUid, owner_name: 'Owner', status: 'AWARDED_PENDING_FEE', category: 'coconut' });
    await adminDb
      .collection('awards')
      .doc(awardId)
      .set({ job_id: jobId, owner_id: ownerUid, supervisor_id: 'sup-x', supervisor_name: 'Sup X', escrow_status: 'pending', escrow_amount: 10000, category: 'coconut' });

    const { checkout, fees } = await createPayment(awardId);

    expect(fees).toEqual({ bidPrice: 10000, platformFee: 500, total: 10500, currency: 'LKR' });
    expect(checkout.amount).toBe('10500.00');
    expect(checkout.hash).toMatch(/^[0-9A-F]{32}$/);
    // Proves the secret actually resolved (not silently empty) — see
    // functions/.secret.local(.example) and DECISIONS.md if this ever
    // regresses: an empty secret still produces *a* 32-char hex hash, just
    // the wrong one, so the regex check above alone wouldn't catch it.
    expect(checkout.hash).not.toBe(computeHashWithEmptySecret(checkout));

    const paymentDoc = await adminDb.collection('payments').doc(checkout.order_id).get();
    expect(paymentDoc.data()).toMatchObject({ award_id: awardId, status: 'pending', amount: 10500 });
  });
});

function computeHashWithEmptySecret(checkout: PayHereCheckout): string {
  return computeHash(checkout.merchant_id, checkout.order_id, checkout.amount, checkout.currency, '');
}
