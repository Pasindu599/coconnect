import { afterAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes } from 'firebase/storage';
import { ADMIN, OTHER_OWNER, OWNER, makeStorageTestEnv } from './setup';

const testEnv: RulesTestEnvironment = await makeStorageTestEnv('rules-test-storage');

afterAll(() => testEnv.cleanup());
beforeEach(() => testEnv.clearStorage());

const SMALL_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]); // minimal valid-enough bytes for a content-type test

function storageFor(user: { uid: string; token?: Record<string, unknown> } | null) {
  const rulesCtx = user ? testEnv.authenticatedContext(user.uid, user.token) : testEnv.unauthenticatedContext();
  return rulesCtx.storage();
}

describe('storage: nic/{uid}/*', () => {
  it('the owner can upload their own NIC image', async () => {
    const storage = storageFor(OWNER);
    await assertSucceeds(
      uploadBytes(ref(storage, `nic/${OWNER.uid}/front.jpg`), SMALL_JPEG, { contentType: 'image/jpeg' })
    );
  });

  it('cannot upload to someone else\'s nic path', async () => {
    const storage = storageFor(OWNER);
    await assertFails(
      uploadBytes(ref(storage, `nic/${OTHER_OWNER.uid}/front.jpg`), SMALL_JPEG, { contentType: 'image/jpeg' })
    );
  });

  it('rejects a non-image content type', async () => {
    const storage = storageFor(OWNER);
    await assertFails(
      uploadBytes(ref(storage, `nic/${OWNER.uid}/front.pdf`), SMALL_JPEG, { contentType: 'application/pdf' })
    );
  });

  it('the owner and admin can read; a stranger cannot', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await uploadBytes(ref(adminCtx.storage(), `nic/${OWNER.uid}/front.jpg`), SMALL_JPEG, {
        contentType: 'image/jpeg',
      });
    });

    await assertSucceeds(getBytes(ref(storageFor(OWNER), `nic/${OWNER.uid}/front.jpg`)));
    await assertSucceeds(getBytes(ref(storageFor(ADMIN), `nic/${OWNER.uid}/front.jpg`)));
    await assertFails(getBytes(ref(storageFor(OTHER_OWNER), `nic/${OWNER.uid}/front.jpg`)));
  });

  it('unauthenticated requests are denied', async () => {
    await assertFails(
      uploadBytes(ref(storageFor(null), `nic/${OWNER.uid}/front.jpg`), SMALL_JPEG, { contentType: 'image/jpeg' })
    );
  });
});
