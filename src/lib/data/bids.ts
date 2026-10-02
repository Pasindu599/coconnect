import type { Bid } from '../../types';
import { patchDoc, putDoc, subscribeToOwnedCollection, type RemoteChanges } from './firestoreSync';

const COLLECTION = 'bids';

export function createBid(bid: Bid): Promise<void> {
  return putDoc(COLLECTION, bid.id, bid);
}

/** Bidder edits (price/crew) while pending, or the job owner accepting/rejecting — see firestore.rules. */
export function updateBid(id: string, patch: Partial<Bid>): Promise<void> {
  return patchDoc(COLLECTION, id, patch);
}

/**
 * Sealed-bid, so this can't be a bare collection listener — see ADR-009.
 * `uid`'s own bids (as the bidder) and the bids on jobs `uid` owns.
 */
export function subscribeToBids(
  uid: string,
  onChange: (changes: RemoteChanges<Bid>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToOwnedCollection<Bid>(COLLECTION, uid, { ownerField: 'owner_id', supervisorField: 'supervisor_id' }, onChange, onError);
}
