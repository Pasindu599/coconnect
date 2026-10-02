import type { Bid } from '../../types';
import { patchDoc, putDoc, subscribeToCollection, type RemoteChanges } from './firestoreSync';

const COLLECTION = 'bids';

export function createBid(bid: Bid): Promise<void> {
  return putDoc(COLLECTION, bid.id, bid);
}

/** Bidder edits (price/crew) while pending, or the job owner accepting/rejecting — see firestore.rules. */
export function updateBid(id: string, patch: Partial<Bid>): Promise<void> {
  return patchDoc(COLLECTION, id, patch);
}

export function subscribeToBids(
  onChange: (changes: RemoteChanges<Bid>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToCollection<Bid>(COLLECTION, onChange, onError);
}
