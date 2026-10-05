import type { AttendanceDay, AttendanceEntry } from '../../types';
import { insertRow, subscribeToTable, updateRow, type RemoteChanges } from './sync';

const DAYS_TABLE = 'attendance_days';
const ENTRIES_TABLE = 'attendance_entries';

export function createAttendanceDay(day: AttendanceDay): Promise<void> {
  return insertRow(DAYS_TABLE, day);
}

/** Status only (the one column clients may update), and never once reconciled. */
export function updateAttendanceDay(id: string, patch: Pick<Partial<AttendanceDay>, 'status'>): Promise<void> {
  return updateRow(DAYS_TABLE, id, patch);
}

/** RLS returns the days where `uid` is the owner or the supervisor. */
export function subscribeToAttendanceDays(
  _uid: string,
  onChange: (changes: RemoteChanges<AttendanceDay>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToTable<AttendanceDay>(DAYS_TABLE, onChange, onError);
}

export function createAttendanceEntry(entry: AttendanceEntry): Promise<void> {
  return insertRow(ENTRIES_TABLE, entry);
}

export function subscribeToAttendanceEntries(
  _uid: string,
  onChange: (changes: RemoteChanges<AttendanceEntry>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToTable<AttendanceEntry>(ENTRIES_TABLE, onChange, onError);
}
