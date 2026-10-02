import type { User } from '../../types';
import { patchDoc, subscribeToCollection, type RemoteChanges } from './firestoreSync';

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

export function subscribeToUsers(
  onChange: (changes: RemoteChanges<User>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToCollection<User>(COLLECTION, onChange, onError);
}
