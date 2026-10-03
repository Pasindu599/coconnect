import '../../auth/__tests__/setup';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { openDispute, type OpenDisputeInput } from '../openDispute.js';
import { DATABASE_ID } from '../../db.js';

let app: App;

beforeAll(() => {
  app = getApps().length ? getApps()[0]! : initializeApp({ projectId: process.env.GCLOUD_PROJECT });
});

afterAll(() => deleteApp(app));

function call(data: OpenDisputeInput, uid: string) {
  const request = {
    data,
    auth: { uid, token: { uid } as never, rawToken: 'test' },
  } as unknown as CallableRequest<OpenDisputeInput>;
  return openDispute.run(request);
}

async function seedAward(escrowStatus: string, ownerId = `owner-${randomUUID()}`, supervisorId = `sup-${randomUUID()}`) {
  const db = getFirestore(app, DATABASE_ID);
  const jobId = `job-${randomUUID()}`;
  const awardId = `award-${randomUUID()}`;
  await db.collection('jobs').doc(jobId).set({ owner_id: ownerId, status: 'ACTIVE', category: 'coconut' });
  await db.collection('awards').doc(awardId).set({ job_id: jobId, owner_id: ownerId, supervisor_id: supervisorId, escrow_status: escrowStatus, escrow_amount: 10000, category: 'coconut' });
  return { jobId, awardId, ownerId, supervisorId };
}

describe('openDispute', () => {
  it('rejects a stranger to the award', async () => {
    const { awardId } = await seedAward('held');
    await expect(call({ awardId, reason: 'no show' }, 'stranger')).rejects.toThrow();
  });

  it('the owner can open a dispute while held', async () => {
    const { awardId, ownerId } = await seedAward('held');
    const result = await call({ awardId, reason: 'worker never showed up' }, ownerId);

    const db = getFirestore(app, DATABASE_ID);
    const [dispute, award] = await Promise.all([
      db.collection('disputes').doc(result.disputeId).get(),
      db.collection('awards').doc(awardId).get(),
    ]);
    expect(dispute.data()).toMatchObject({ status: 'open', opened_by: ownerId });
    expect(award.data()?.escrow_status).toBe('disputed');
  });

  it('the supervisor can open a dispute while release_requested', async () => {
    const { awardId, supervisorId } = await seedAward('release_requested');
    await expect(call({ awardId, reason: 'owner refusing to pay' }, supervisorId)).resolves.toMatchObject({});
  });

  it('cannot dispute an award that is still pending (not held yet)', async () => {
    const { awardId, ownerId } = await seedAward('pending');
    await expect(call({ awardId, reason: 'too early' }, ownerId)).rejects.toThrow();
  });

  it('cannot dispute an award that is already released', async () => {
    const { awardId, ownerId } = await seedAward('released');
    await expect(call({ awardId, reason: 'too late' }, ownerId)).rejects.toThrow();
  });
});
