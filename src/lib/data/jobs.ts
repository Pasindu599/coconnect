import type { LabourJob } from '../../types';
import { deleteRow, insertRow, subscribeToTable, updateRow, type RemoteChanges } from './sync';

const TABLE = 'jobs';

export function createJob(job: LabourJob): Promise<void> {
  return insertRow(TABLE, job);
}

/**
 * Only for the owner-allowed subset of transitions (DRAFT/OPEN/CANCELLED,
 * see the jobs policies in supabase/migrations/*_rls.sql). Anything past
 * OPEN is written by a SQL function, never through this module.
 */
export function updateJob(id: string, patch: Partial<LabourJob>): Promise<void> {
  return updateRow(TABLE, id, patch);
}

/** RLS has no delete policy for jobs, so this is refused for every client today. */
export function deleteJob(id: string): Promise<void> {
  return deleteRow(TABLE, id);
}

export function subscribeToJobs(
  onChange: (changes: RemoteChanges<LabourJob>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToTable<LabourJob>(TABLE, onChange, onError);
}
