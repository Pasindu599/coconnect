/**
 * Shared machinery behind src/lib/data/{users,estates,jobs,bids,...}.ts.
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
  query,
  where,
  or,
  type DocumentData,
  type Query,
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

function emitChanges<T>(snapshot: QuerySnapshot, onChange: (changes: RemoteChanges<T>) => void) {
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
}

/**
 * Subscribes to every add/modify/remove in a whole collection, not just
 * adds (closes KNOWN_ISSUES #10's "sync only adds missing IDs" gap).
 *
 * Only safe for collections whose read rule doesn't vary per document (e.g.
 * "any signed-in user" — estates, jobs, workers, ratings). For anything
 * scoped to a specific owner/supervisor, use `subscribeToOwnedCollection`
 * instead — see ADR-008/009: Firestore denies an entire unfiltered `list`
 * outright when it can't prove the rule holds for every possible document,
 * it does not quietly filter the result down to what the caller may see.
 */
export function subscribeToCollection<T>(
  collectionName: string,
  onChange: (changes: RemoteChanges<T>) => void,
  onError: (err: unknown) => void
): () => void {
  return onSnapshot(collection(db, collectionName), (snapshot: QuerySnapshot) => emitChanges(snapshot, onChange), onError);
}

/**
 * Subscribes to the documents in `collectionName` where `ownerField` or
 * `supervisorField` equals `uid` — the query itself must be at least as
 * restrictive as the security rule for Firestore to allow a `list` at all
 * (ADR-008/009), so this mirrors the `fieldIs(...,'owner_id',...) ||
 * fieldIs(...,'supervisor_id',...)` shape every such rule in
 * firestore.rules uses.
 */
export function subscribeToOwnedCollection<T>(
  collectionName: string,
  uid: string,
  fields: { ownerField: string; supervisorField: string },
  onChange: (changes: RemoteChanges<T>) => void,
  onError: (err: unknown) => void
): () => void {
  const scoped: Query = query(
    collection(db, collectionName),
    or(where(fields.ownerField, '==', uid), where(fields.supervisorField, '==', uid))
  );
  return onSnapshot(scoped, (snapshot: QuerySnapshot) => emitChanges(snapshot, onChange), onError);
}

/**
 * Subscribes to a single document (e.g. users/{uid}) rather than a
 * collection — the natural way to sync something whose read rule is
 * "only this exact uid", since a single-document get/listen is evaluated
 * against real data, not the same list-wide static check a bare collection
 * listener would need (ADR-008/009).
 */
export function subscribeToDocument<T extends { id: string }>(
  collectionName: string,
  id: string,
  onChange: (item: T | null) => void,
  onError: (err: unknown) => void
): () => void {
  return onSnapshot(
    doc(db, collectionName, id),
    (snapshot) => {
      onChange(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null);
    },
    onError
  );
}
