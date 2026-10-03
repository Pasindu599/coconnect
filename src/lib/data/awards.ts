import type { Award } from '../../types';
import { subscribeToOwnedCollection, type RemoteChanges } from './firestoreSync';

const COLLECTION = 'awards';

/**
 * Read-only: awards are Functions-only (firestore.rules denies every client
 * write). Created by the `awardBid` callable (functions/src/jobs/awardBid.ts)
 * and later mutated by the payment/escrow Functions (S1-09 through S1-12).
 * Owner-or-supervisor scoped, not a bare collection listener — see ADR-009.
 */
export function subscribeToAwards(
  uid: string,
  onChange: (changes: RemoteChanges<Award>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToOwnedCollection<Award>(COLLECTION, uid, { ownerField: 'owner_id', supervisorField: 'supervisor_id' }, onChange, onError);
}
