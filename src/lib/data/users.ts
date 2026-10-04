import type { User } from '../../types';
import { subscribeToRow, updateRow } from './sync';

const TABLE = 'users';

/**
 * Rows are created by the on_auth_user_created trigger and memberships change
 * only through add_membership(). Clients may update a few profile columns of
 * their own row (see the users grants in supabase/migrations/*_rls.sql);
 * `active_category` is the one the app writes today.
 */
export function updateOwnProfile(uid: string, patch: Pick<Partial<User>, 'active_category'>): Promise<void> {
  return updateRow(TABLE, uid, patch);
}

/** Only the signed-in user's own row. An admin console that browses all users is a separate, deliberate query. */
export function subscribeToOwnUser(
  uid: string,
  onChange: (user: User | null) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToRow<User>(TABLE, uid, onChange, onError);
}
