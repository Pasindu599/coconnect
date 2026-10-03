import './setup';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { addMembership, type AddMembershipInput } from '../addMembership.js';
import { DATABASE_ID } from '../../db.js';

let app: App;

beforeAll(() => {
  app = getApps().length ? getApps()[0]! : initializeApp({ projectId: process.env.GCLOUD_PROJECT });
});

afterAll(() => deleteApp(app));

function call(data: AddMembershipInput, uid: string) {
  const request = {
    data,
    auth: { uid, token: { uid } as never, rawToken: 'test' },
  } as unknown as CallableRequest<AddMembershipInput>;
  return addMembership.run(request);
}

async function freshUid() {
  const uid = `user-${randomUUID()}`;
  await getAuth(app).createUser({ uid });
  return uid;
}

describe('addMembership', () => {
  it('rejects an unauthenticated call', async () => {
    const request = { data: { category: 'coconut', role: 'owner' } } as unknown as CallableRequest<AddMembershipInput>;
    await expect(addMembership.run(request)).rejects.toThrow();
  });

  it('rejects role "admin" outright', async () => {
    const uid = await freshUid();
    await expect(call({ category: 'coconut' as never, role: 'admin' as never }, uid)).rejects.toThrow();
  });

  it('rejects a role that does not belong to the category', async () => {
    const uid = await freshUid();
    await expect(call({ category: 'coconut', role: 'contractor' as never }, uid)).rejects.toThrow();
  });

  it('appends the membership to Firestore and to the custom claim', async () => {
    const uid = await freshUid();
    await call({ category: 'coconut', role: 'broker' }, uid);

    const userDoc = await getFirestore(app, DATABASE_ID).collection('users').doc(uid).get();
    expect(userDoc.data()?.memberships).toEqual([{ category: 'coconut', role: 'broker' }]);

    const userRecord = await getAuth(app).getUser(uid);
    expect(userRecord.customClaims?.memberships).toEqual([{ category: 'coconut', role: 'broker' }]);
  });

  it('is idempotent: calling twice with the same membership does not duplicate it', async () => {
    const uid = await freshUid();
    await call({ category: 'construction', role: 'contractor' }, uid);
    await call({ category: 'construction', role: 'contractor' }, uid);

    const userDoc = await getFirestore(app, DATABASE_ID).collection('users').doc(uid).get();
    expect(userDoc.data()?.memberships).toEqual([{ category: 'construction', role: 'contractor' }]);
  });

  it('a user can hold memberships in more than one category', async () => {
    const uid = await freshUid();
    await call({ category: 'coconut', role: 'owner' }, uid);
    await call({ category: 'construction', role: 'client' }, uid);

    const userDoc = await getFirestore(app, DATABASE_ID).collection('users').doc(uid).get();
    expect(userDoc.data()?.memberships).toEqual([
      { category: 'coconut', role: 'owner' },
      { category: 'construction', role: 'client' },
    ]);
  });
});
