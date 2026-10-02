/**
 * End-to-end check of S1-07's "done when": a write from one client reaches
 * another through Firestore, and add/modify/remove all sync — not just
 * adds (KNOWN_ISSUES #10). Runs against the real Auth + Firestore
 * emulators (see package.json's "test:integration"), unlike tests/rules/
 * which uses the rules-unit-testing harness.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getApps, initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import type { Estate } from '../../src/types';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';

const PROJECT_ID = 'gen-lang-client-0417035030'; // must match firebase-applet-config.json (see firebase.json's singleProjectMode)

let adminApp: App;

beforeAll(async () => {
  adminApp = getApps().length ? getApps()[0]! : initializeApp({ projectId: PROJECT_ID });
});

afterAll(() => deleteApp(adminApp));

describe('estate sync (add/modify/remove)', () => {
  it('a write from this process is visible to a listener, and edits/deletes propagate too', async () => {
    // Importing these only now, after VITE_USE_EMULATORS is set by
    // vitest.integration.config.ts, so src/lib/firebase.ts connects to the
    // emulator when its module scope first runs.
    const { auth, db } = await import('../../src/lib/firebase');
    const { createEstate, deleteEstate, subscribeToEstates } = await import('../../src/lib/data/estates');
    const { doc, setDoc } = await import('firebase/firestore');

    const uid = `owner-${randomUUID()}`;
    await getAdminAuth(adminApp).createUser({ uid });
    const customToken = await getAdminAuth(adminApp).createCustomToken(uid, {
      memberships: [{ category: 'coconut', role: 'owner' }],
    });
    await signInWithCustomToken(auth, customToken);

    const events: Array<{ type: 'added' | 'modified' | 'removed'; id: string; name?: string }> = [];
    const unsubscribe = subscribeToEstates(
      (changes) => {
        changes.added.forEach((e) => events.push({ type: 'added', id: e.id, name: e.name }));
        changes.modified.forEach((e) => events.push({ type: 'modified', id: e.id, name: e.name }));
        changes.removed.forEach((id) => events.push({ type: 'removed', id }));
      },
      (err) => {
        throw err;
      }
    );

    try {
      const estateId = `est-integration-${randomUUID()}`;
      const estate: Estate = {
        id: estateId,
        category: 'coconut',
        owner_id: uid,
        name: 'Integration Test Estate',
        area_acres: 1,
        location: 'Test',
        tree_count: 10,
        created_at: new Date().toISOString(),
      };

      // 1. create -> listener sees 'added'
      await createEstate(estate);
      await waitFor(() => events.some((e) => e.type === 'added' && e.id === estateId));

      // 2. modify (direct Firestore write, as a second "browser" would) -> listener sees 'modified'
      await setDoc(doc(db, 'estates', estateId), { name: 'Renamed Estate' }, { merge: true });
      await waitFor(() => events.some((e) => e.type === 'modified' && e.id === estateId && e.name === 'Renamed Estate'));

      // 3. delete -> listener sees 'removed', proving this isn't an add-only sync (closes KNOWN_ISSUES #10)
      await deleteEstate(estateId);
      await waitFor(() => events.some((e) => e.type === 'removed' && e.id === estateId));

      const docAfterDelete = await getAdminFirestore(adminApp).collection('estates').doc(estateId).get();
      expect(docAfterDelete.exists).toBe(false);
    } finally {
      unsubscribe();
    }
  });
});

async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timed out waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
