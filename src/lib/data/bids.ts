import type { Bid } from '../../types';
import { insertRow, subscribeToTable, updateRow, type RemoteChanges } from './sync';

const TABLE = 'bids';

export function createBid(bid: Bid): Promise<void> {
  return insertRow(TABLE, bid);
}

/** Bidder edits (price/crew) while pending, or the job owner accepting/rejecting; enforced by the bids_guard_update trigger. */
export function updateBid(id: string, patch: Partial<Bid>): Promise<void> {
  return updateRow(TABLE, id, patch);
}

/** Sealed-bid: RLS returns only `uid`'s own bids (as the bidder) and the bids on jobs `uid` owns. */
export function subscribeToBids(
  _uid: string,
  onChange: (changes: RemoteChanges<Bid>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToTable<Bid>(TABLE, onChange, onError);
}
