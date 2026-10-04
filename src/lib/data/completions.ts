import type { Completion } from '../../types';
import { insertRow, subscribeToTable, type RemoteChanges } from './sync';

const TABLE = 'completions';

/** Create only. Confirming is confirm_completion() (src/lib/escrow.ts), which checks a hashed PIN server-side. */
export function createCompletion(completion: Completion): Promise<void> {
  return insertRow(TABLE, completion);
}

/** RLS returns the completions where `uid` is the owner or the submitter. */
export function subscribeToCompletions(
  _uid: string,
  onChange: (changes: RemoteChanges<Completion>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToTable<Completion>(TABLE, onChange, onError);
}
