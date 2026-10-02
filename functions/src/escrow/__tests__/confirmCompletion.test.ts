import '../../auth/__tests__/setup';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { confirmCompletion, type ConfirmCompletionInput } from '../confirmCompletion.js';
import { hashPin } from '../pin.js';
import { DATABASE_ID } from '../../db.js';

let app: App;

beforeAll(() => {
  app = getApps().length ? getApps()[0]! : initializeApp({ projectId: process.env.GCLOUD_PROJECT });
});

afterAll(() => deleteApp(app));

function call(data: ConfirmCompletionInput, uid: string) {
  const request = {
    data,
    auth: { uid, token: { uid } as never, rawToken: 'test' },
  } as unknown as CallableRequest<ConfirmCompletionInput>;
  return confirmCompletion.run(request);
}

async function seedScenario(correctPin = '1234') {
  const db = getFirestore(app, DATABASE_ID);
  const ownerId = `owner-${randomUUID()}`;
  const jobId = `job-${randomUUID()}`;
  const awardId = `award-${randomUUID()}`;
  const completionId = `comp-${randomUUID()}`;

  await db.collection('users').doc(ownerId).set({ name: 'Owner', memberships: [], pin_hash: await hashPin(correctPin) });
  await db.collection('jobs').doc(jobId).set({ owner_id: ownerId, status: 'PENDING_COMPLETION', category: 'coconut' });
  await db.collection('awards').doc(awardId).set({ job_id: jobId, owner_id: ownerId, supervisor_id: 'sup-1', escrow_status: 'held', escrow_amount: 10000, category: 'coconut' });
  await db.collection('completions').doc(completionId).set({ job_id: jobId, owner_id: ownerId, submitted_by: 'sup-1', status: 'pending' });

  return { ownerId, jobId, awardId, completionId };
}

describe('confirmCompletion', () => {
  it('rejects a non-owner', async () => {
    const { completionId } = await seedScenario();
    await expect(call({ completionId, pin: '1234' }, 'stranger')).rejects.toThrow();
  });

  it('rejects the wrong PIN without changing state', async () => {
    const { ownerId, completionId, awardId } = await seedScenario('1234');
    await expect(call({ completionId, pin: '0000' }, ownerId)).rejects.toThrow();

    const db = getFirestore(app, DATABASE_ID);
    const [completion, award] = await Promise.all([
      db.collection('completions').doc(completionId).get(),
      db.collection('awards').doc(awardId).get(),
    ]);
    expect(completion.data()?.status).toBe('pending');
    expect(award.data()?.escrow_status).toBe('held');
  });

  it('on the correct PIN: confirms the completion, releases to release_requested, completes the job', async () => {
    const { ownerId, jobId, awardId, completionId } = await seedScenario('1234');
    await call({ completionId, pin: '1234' }, ownerId);

    const db = getFirestore(app, DATABASE_ID);
    const [completion, award, job] = await Promise.all([
      db.collection('completions').doc(completionId).get(),
      db.collection('awards').doc(awardId).get(),
      db.collection('jobs').doc(jobId).get(),
    ]);
    expect(completion.data()?.status).toBe('confirmed');
    expect(award.data()?.escrow_status).toBe('release_requested');
    expect(job.data()?.status).toBe('COMPLETED');
  });

  it('rejects confirming the same completion twice', async () => {
    const { ownerId, completionId } = await seedScenario('1234');
    await call({ completionId, pin: '1234' }, ownerId);
    await expect(call({ completionId, pin: '1234' }, ownerId)).rejects.toThrow();
  });

  it('rate-limits after 5 wrong attempts, even with the right PIN on the 6th try', async () => {
    const { ownerId, completionId } = await seedScenario('1234');
    for (let i = 0; i < 5; i++) {
      await expect(call({ completionId, pin: 'wrong' }, ownerId)).rejects.toThrow();
    }
    await expect(call({ completionId, pin: '1234' }, ownerId)).rejects.toThrow(/Too many attempts/);
  });
});
