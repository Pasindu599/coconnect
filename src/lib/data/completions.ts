import type { Completion } from '../../types';
import { putDoc, subscribeToOwnedCollection, type RemoteChanges } from './firestoreSync';

const COLLECTION = 'completions';

/** Create only — confirming a completion is Functions-only (checks a hashed PIN server-side, see S1-11). */
export function createCompletion(completion: Completion): Promise<void> {
  return putDoc(COLLECTION, completion.id, completion);
}

/** Owner-or-submitter scoped, not a bare collection listener — see ADR-009. */
export function subscribeToCompletions(
  uid: string,
  onChange: (changes: RemoteChanges<Completion>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToOwnedCollection<Completion>(COLLECTION, uid, { ownerField: 'owner_id', supervisorField: 'submitted_by' }, onChange, onError);
}
