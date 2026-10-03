import type { AttendanceDay, AttendanceEntry } from '../../types';
import { patchDoc, putDoc, subscribeToOwnedCollection, type RemoteChanges } from './firestoreSync';

const DAYS_COLLECTION = 'attendance_days';
const ENTRIES_COLLECTION = 'attendance_entries';
const OWNED_FIELDS = { ownerField: 'owner_id', supervisorField: 'supervisor_id' };

export function createAttendanceDay(day: AttendanceDay): Promise<void> {
  return putDoc(DAYS_COLLECTION, day.id, day);
}

export function updateAttendanceDay(id: string, patch: Partial<AttendanceDay>): Promise<void> {
  return patchDoc(DAYS_COLLECTION, id, patch);
}

/** Owner-or-supervisor scoped, not a bare collection listener — see ADR-009. */
export function subscribeToAttendanceDays(
  uid: string,
  onChange: (changes: RemoteChanges<AttendanceDay>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToOwnedCollection<AttendanceDay>(DAYS_COLLECTION, uid, OWNED_FIELDS, onChange, onError);
}

export function createAttendanceEntry(entry: AttendanceEntry): Promise<void> {
  return putDoc(ENTRIES_COLLECTION, entry.id, entry);
}

export function subscribeToAttendanceEntries(
  uid: string,
  onChange: (changes: RemoteChanges<AttendanceEntry>) => void,
  onError: (err: unknown) => void
): () => void {
  return subscribeToOwnedCollection<AttendanceEntry>(ENTRIES_COLLECTION, uid, OWNED_FIELDS, onChange, onError);
}
