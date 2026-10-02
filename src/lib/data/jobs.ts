import type { LabourJob } from '../../types';
import { patchDoc, putDoc, removeDoc, subscribeToCollection, type RemoteChanges } from './firestoreSync';

const COLLECTION = 'jobs';

export function createJob(job: LabourJob): Promise<void> {
  return putDoc(COLLECTION, job.id, job);
}

/**
 * Only for the owner-allowed subset of transitions (DRAFT/OPEN/CANCELLED —
 * see firestore.rules). Anything past OPEN is written by a Function, never
 * through this repository.
 */
export function updateJob(id: string, patch: Partial<LabourJob>): Promise<void> {
  return patchDoc(COLLECTION, id, patch);
}

export function deleteJob(id: string): Promise<void> {
  return removeDoc(COLLECTION, id);
}

export function subscribeToJobs(
  onChange: (changes: RemoteChanges<LabourJob>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToCollection<LabourJob>(COLLECTION, onChange, onError);
}
