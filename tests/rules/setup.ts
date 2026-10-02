import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

const ROOT = resolve(import.meta.dirname, '..', '..');

export function makeFirestoreTestEnv(projectId: string): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(resolve(ROOT, 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
}

export function makeStorageTestEnv(projectId: string): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId,
    storage: {
      rules: readFileSync(resolve(ROOT, 'storage.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  });
}

export const OWNER = { uid: 'owner-1', token: { memberships: [{ category: 'coconut', role: 'owner' }] } };
export const OTHER_OWNER = { uid: 'owner-2', token: { memberships: [{ category: 'coconut', role: 'owner' }] } };
export const BIDDER = { uid: 'bidder-1', token: { memberships: [{ category: 'coconut', role: 'broker' }] } };
export const OTHER_BIDDER = { uid: 'bidder-2', token: { memberships: [{ category: 'coconut', role: 'broker' }] } };
export const WORKER = { uid: 'worker-1', token: { memberships: [{ category: 'coconut', role: 'worker' }] } };
export const ADMIN = { uid: 'admin-1', token: { admin: true, memberships: [] } };
