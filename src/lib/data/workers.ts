import type { Worker } from '../../types';
import { insertRow, subscribeToTable, updateRow, type RemoteChanges } from './sync';

const TABLE = 'workers';

export function createWorker(worker: Worker): Promise<void> {
  return insertRow(TABLE, worker);
}

/** Profile fields only: rating/jobs_completed/supervisor_id have no client update grant. */
export function updateWorker(id: string, patch: Partial<Worker>): Promise<void> {
  return updateRow(TABLE, id, patch);
}

export function subscribeToWorkers(
  onChange: (changes: RemoteChanges<Worker>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToTable<Worker>(TABLE, onChange, onError);
}
