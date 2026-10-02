import './setup';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { setAdmin, type SetAdminInput } from '../setAdmin.js';

let app: App;

beforeAll(() => {
  app = getApps().length ? getApps()[0]! : initializeApp({ projectId: process.env.GCLOUD_PROJECT });
});

afterAll(() => deleteApp(app));

function call(data: SetAdminInput, callerUid: string, callerIsAdmin: boolean) {
  const request = {
    data,
    auth: { uid: callerUid, token: { uid: callerUid, admin: callerIsAdmin || undefined } as never, rawToken: 'test' },
  } as unknown as CallableRequest<SetAdminInput>;
  return setAdmin.run(request);
}

async function freshUid() {
  const uid = `user-${randomUUID()}`;
  await getAuth(app).createUser({ uid });
  return uid;
}

describe('setAdmin', () => {
  it('rejects a caller without the admin claim', async () => {
    const caller = await freshUid();
    const target = await freshUid();
    await expect(call({ uid: target }, caller, false)).rejects.toThrow();

    const targetRecord = await getAuth(app).getUser(target);
    expect(targetRecord.customClaims?.admin).toBeUndefined();
  });

  it('an admin caller can grant the admin claim to another uid', async () => {
    const caller = await freshUid();
    await getAuth(app).setCustomUserClaims(caller, { admin: true });
    const target = await freshUid();

    await call({ uid: target }, caller, true);

    const targetRecord = await getAuth(app).getUser(target);
    expect(targetRecord.customClaims?.admin).toBe(true);
  });
});
