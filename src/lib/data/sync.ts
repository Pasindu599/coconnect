/**
 * Shared machinery behind src/lib/data/{users,estates,jobs,bids,...}.ts, on
 * Supabase (Postgres + Realtime; ADR-014).
 *
 * Not exported from the package's public surface: each table module wraps
 * these generically-typed helpers with its own domain type, so a caller never
 * passes a table name by hand.
 *
 * Reads need no query shaping. RLS returns only the rows the caller may see
 * (a sealed bid, someone else's award, ...) and filters the Realtime feed the
 * same way, so a plain `select *` is both safe and complete. Firestore's
 * "the query must be as narrow as the rule" constraint (ADR-008/009) is gone.
 */
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export interface RemoteChanges<T> {
  added: T[];
  modified: T[];
  removed: string[];
}

/**
 * Upserts added/modified items by id and drops removed ones, preserving the
 * position of items that weren't touched. Pure and framework-free on
 * purpose (KNOWN_ISSUES #10: the original sync only ever merged in adds), so
 * it is tested in isolation from both Supabase and store.ts's class state.
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
 * Postgres returns every column, with `null` for "not set". The domain types
 * (and the UI) treat unset fields as absent (`field?: T`), as the Firestore
 * documents did, so nulls are dropped rather than leaking `null` into
 * `undefined` checks.
 */
export function fromRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== null) out[key] = value;
  }
  return out as T;
}

/** JSON drops `undefined` anyway; stripping it here keeps PostgREST from seeing absent optional fields at all. */
function toRow(data: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

/**
 * Inserts a row with a caller-chosen id (this codebase's `est-${Date.now()}`
 * scheme), so a write this client just made and the Realtime event it gets
 * back for that same row reconcile as one upsert, not a duplicate.
 */
export async function insertRow(table: string, data: { id: string }): Promise<void> {
  const { error } = await supabase.from(table).insert(toRow(data));
  if (error) throw error;
}

export async function updateRow(table: string, id: string, patch: object): Promise<void> {
  const { error } = await supabase.from(table).update(toRow(patch)).eq('id', id);
  if (error) throw error;
}

export async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

let channelSeq = 0;

/**
 * Loads the visible rows of `table`, then follows every insert/update/delete
 * through Realtime. Events that arrive while the first load is in flight are
 * queued and replayed after it, so a slow first load can't overwrite a newer
 * change. Returns an unsubscribe function.
 *
 * `filter` is a Realtime filter such as `id=eq.<uuid>` (one column only;
 * RLS does the access control either way).
 */
export function subscribeToTable<T extends { id: string }>(
  table: string,
  onChange: (changes: RemoteChanges<T>) => void,
  onError: (err: unknown) => void,
  filter?: { column: string; value: string }
): () => void {
  let loaded = false;
  let closed = false;
  const queued: RemoteChanges<T>[] = [];

  const deliver = (changes: RemoteChanges<T>) => {
    if (closed) return;
    if (!loaded) {
      queued.push(changes);
      return;
    }
    onChange(changes);
  };

  const toChanges = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>): RemoteChanges<T> => {
    if (payload.eventType === 'DELETE') {
      return { added: [], modified: [], removed: [String((payload.old as { id?: unknown }).id)] };
    }
    const record = fromRow<T>(payload.new);
    return payload.eventType === 'INSERT'
      ? { added: [record], modified: [], removed: [] }
      : { added: [], modified: [record], removed: [] };
  };

  const loadAll = async () => {
    let query = supabase.from(table).select('*');
    if (filter) query = query.eq(filter.column, filter.value);
    const { data, error } = await query;
    if (closed) return;
    if (error) {
      onError(error);
      return;
    }
    const rows = (data ?? []).map((row) => fromRow<T>(row as Record<string, unknown>));
    loaded = true;
    if (rows.length) onChange({ added: rows, modified: [], removed: [] });
    for (const changes of queued.splice(0)) onChange(changes);
  };

  const channel = supabase
    .channel(`sync:${table}:${++channelSeq}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => deliver(toChanges(payload))
    )
    .subscribe((status, err) => {
      // Also fires after Realtime reconnects: reload then, to pick up changes
      // missed while disconnected (a row deleted meanwhile stays until the next full sync).
      if (status === 'SUBSCRIBED') {
        void loadAll();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError(err ?? new Error(`Realtime ${status} on ${table}`));
      }
    });

  return () => {
    closed = true;
    void supabase.removeChannel(channel);
  };
}

/** One row by id (e.g. the signed-in user's own `users` row), as an item-or-null callback. */
export function subscribeToRow<T extends { id: string }>(
  table: string,
  id: string,
  onChange: (item: T | null) => void,
  onError: (err: unknown) => void
): () => void {
  let current: T | null = null;
  return subscribeToTable<T>(
    table,
    (changes) => {
      current = reconcile(current ? [current] : [], changes).find((item) => item.id === id) ?? null;
      onChange(current);
    },
    onError,
    { column: 'id', value: id }
  );
}
