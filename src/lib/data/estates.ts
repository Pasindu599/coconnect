import type { Estate } from '../../types';
import { putDoc, removeDoc, subscribeToCollection, type RemoteChanges } from './firestoreSync';

const COLLECTION = 'estates';

export function createEstate(estate: Estate): Promise<void> {
  return putDoc(COLLECTION, estate.id, estate);
}

export function deleteEstate(id: string): Promise<void> {
  return removeDoc(COLLECTION, id);
}

export function subscribeToEstates(
  onChange: (changes: RemoteChanges<Estate>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToCollection<Estate>(COLLECTION, onChange, onError);
}
