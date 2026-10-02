import type { Worker } from '../../types';
import { patchDoc, putDoc, subscribeToCollection, type RemoteChanges } from './firestoreSync';

const COLLECTION = 'workers';

export function createWorker(worker: Worker): Promise<void> {
  return putDoc(COLLECTION, worker.id, worker);
}

/** Profile fields only — rating/jobs_completed are rejected by firestore.rules for client writes. */
export function updateWorker(id: string, patch: Partial<Worker>): Promise<void> {
  return patchDoc(COLLECTION, id, patch);
}

export function subscribeToWorkers(
  onChange: (changes: RemoteChanges<Worker>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToCollection<Worker>(COLLECTION, onChange, onError);
}
