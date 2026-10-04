import type { Estate } from '../../types';
import { deleteRow, insertRow, subscribeToTable, type RemoteChanges } from './sync';

const TABLE = 'estates';

export function createEstate(estate: Estate): Promise<void> {
  return insertRow(TABLE, estate);
}

export function deleteEstate(id: string): Promise<void> {
  return deleteRow(TABLE, id);
}

export function subscribeToEstates(
  onChange: (changes: RemoteChanges<Estate>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToTable<Estate>(TABLE, onChange, onError);
}
