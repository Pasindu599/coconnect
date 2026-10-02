import './setup';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { UserRecord } from 'firebase-admin/auth';
import { onUserCreate } from '../onUserCreate.js';
import { DATABASE_ID } from '../../db.js';

let app: App;

beforeAll(() => {
  app = getApps().length ? getApps()[0]! : initializeApp({ projectId: process.env.GCLOUD_PROJECT });
});

afterAll(() => deleteApp(app));

function fakeUserRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    uid: `user-${randomUUID()}`,
    phoneNumber: '+94770000000',
    email: undefined,
    displayName: undefined,
    ...overrides,
  } as UserRecord;
}

describe('onUserCreate', () => {
  it('creates users/{uid} with empty memberships and unverified NIC status', async () => {
    const user = fakeUserRecord();

    await onUserCreate.run(user, {} as never);

    const snap = await getFirestore(app, DATABASE_ID).collection('users').doc(user.uid).get();
    expect(snap.exists).toBe(true);
    expect(snap.data()).toMatchObject({
      phone: user.phoneNumber,
      memberships: [],
      nic_status: 'unverified',
    });
  });
});
