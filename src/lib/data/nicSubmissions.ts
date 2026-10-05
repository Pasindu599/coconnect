import type { NicSubmission } from '../../types';
import { insertRow, subscribeToTable, updateRow, type RemoteChanges } from './sync';

const TABLE = 'nic_submissions';

/** The submitter's own submission, always created as pending. */
export function createNicSubmission(submission: NicSubmission): Promise<void> {
  return insertRow(TABLE, submission);
}

/** Admin review only (status, reviewed_at, reviewed_by, rejection_reason). */
export function reviewNicSubmission(
  id: string,
  review: Pick<Partial<NicSubmission>, 'status' | 'reviewed_at' | 'reviewed_by' | 'rejection_reason'>
): Promise<void> {
  return updateRow(TABLE, id, review);
}

/** RLS returns the caller's own submissions, or every submission for an admin. */
export function subscribeToNicSubmissions(
  onChange: (changes: RemoteChanges<NicSubmission>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToTable<NicSubmission>(TABLE, onChange, onError);
}
