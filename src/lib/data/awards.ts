import type { Award } from '../../types';
import { subscribeToTable, type RemoteChanges } from './sync';

const TABLE = 'awards';

/**
 * Read-only: no client write grant on awards. Created by award_bid() and
 * changed only by the payment/escrow SQL functions. RLS returns the awards
 * where `uid` is the owner or the bidder (all of them for an admin).
 */
export function subscribeToAwards(
  _uid: string,
  onChange: (changes: RemoteChanges<Award>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToTable<Award>(TABLE, onChange, onError);
}
