/**
 * Shared machinery behind src/lib/data/{users,estates,jobs,bids}.ts.
 *
 * Not exported from the package's public surface — each collection module
 * wraps these generically-typed helpers with its own domain type, so a
 * caller never has to pass a collection name by hand.
 */
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface RemoteChanges<T> {
  added: T[];
  modified: T[];
  removed: string[];
}

/**
 * Upserts added/modified items by id and drops removed ones, preserving the
 * position of items that weren't touched. Pure and framework-free on
 * purpose — this is the exact piece of logic KNOWN_ISSUES #10 flagged as
 * missing (the old sync only ever merged in adds), so it's worth testing in
 * isolation from both Firestore and store.ts's class state.
 */
export function reconcile<T extends { id: string }>(current: T[], changes: RemoteChanges<T>): T[] {
  const byId = new Map(current.map((item) => [item.id, item]));
  for (const item of [...changes.added, ...changes.modified]) {
    byId.set(item.id, item);
  }
  for (const id of changes.removed) {
    byId.delete(id);
  }
  return Array.from(byId.values());
}

/**
 * Writes a document with a caller-chosen ID (matching this codebase's
 * `est-${Date.now()}` / `job-${Date.now()}` / `bid-${Date.now()}` id scheme),
 * so a write this client just made and the snapshot it reads back for that
 * same write reconcile as one upsert, not a duplicate.
 */
export async function putDoc(collectionName: string, id: string, data: DocumentData): Promise<void> {
  await setDoc(doc(db, collectionName, id), data);
}

export async function patchDoc(collectionName: string, id: string, patch: DocumentData): Promise<void> {
  await setDoc(doc(db, collectionName, id), patch, { merge: true });
}

export async function removeDoc(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

/**
 * Subscribes to every add/modify/remove in a collection, not just adds
 * (closes KNOWN_ISSUES #10's "sync only adds missing IDs" gap).
 */
export function subscribeToCollection<T>(
  collectionName: string,
  onChange: (changes: RemoteChanges<T>) => void,
  onError: (err: unknown) => void
): () => void {
  return onSnapshot(
    collection(db, collectionName),
    (snapshot: QuerySnapshot) => {
      const added: T[] = [];
      const modified: T[] = [];
      const removed: string[] = [];

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          removed.push(change.doc.id);
          return;
        }
        const record = { id: change.doc.id, ...change.doc.data() } as T;
        (change.type === 'added' ? added : modified).push(record);
      });

      if (added.length || modified.length || removed.length) {
        onChange({ added, modified, removed });
      }
    },
    onError
  );
}
