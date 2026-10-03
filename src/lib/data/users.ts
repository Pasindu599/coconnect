import type { User } from '../../types';
import { patchDoc, subscribeToDocument } from './firestoreSync';

const COLLECTION = 'users';

/**
 * Read-only sync for now. Real user docs are created by the `onUserCreate`
 * Function (S1-05) and updated by `addMembership`/admin review — never by
 * this repository. The one client-writable field is `active_category`,
 * a UI preference (see firestore.rules); store.ts's still-mock
 * requestOtp/verifyOtp/adminLogin keep mutating local state directly until
 * Session 2 switches the login UI to src/lib/auth.ts (CONTRACTS SP2).
 */
export function updateOwnProfile(uid: string, patch: Pick<Partial<User>, 'active_category'>): Promise<void> {
  return patchDoc(COLLECTION, uid, patch);
}

/**
 * Only `users/{uid}` for the signed-in uid — firestore.rules scopes reads to
 * self+admin, so a bare collection listener would be denied outright for
 * every non-admin caller the moment any other user's doc exists (ADR-009).
 * An admin console that needs to browse all users is a separate, deliberate
 * admin-only query, not something store.startSync() does implicitly.
 */
export function subscribeToOwnUser(
  uid: string,
  onChange: (user: User | null) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToDocument<User>(COLLECTION, uid, onChange, onError);
}
