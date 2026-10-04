import { describe, expect, it } from 'vitest';
import { BackendError, toBackendErrorCode } from '../supabase';
import { fromRow } from '../data/sync';

describe('toBackendErrorCode', () => {
  it('passes through the codes the SQL functions raise', () => {
    for (const code of ['unauthenticated', 'invalid-argument', 'not-found', 'already-exists', 'permission-denied', 'failed-precondition', 'resource-exhausted', 'internal']) {
      expect(toBackendErrorCode(code)).toBe(code);
    }
  });

  it('treats anything else (a raw Postgres or network message) as internal', () => {
    expect(toBackendErrorCode('duplicate key value violates unique constraint')).toBe('internal');
    expect(toBackendErrorCode(undefined)).toBe('internal');
    expect(toBackendErrorCode(42)).toBe('internal');
  });

  it('BackendError carries the code and the cause', () => {
    const cause = new Error('x');
    const err = new BackendError('permission-denied', cause);
    expect(err.code).toBe('permission-denied');
    expect(err.cause).toBe(cause);
  });
});

describe('fromRow', () => {
  it('drops null columns so unset fields read as absent, like the domain types expect', () => {
    expect(fromRow({ id: 'a', payout_ref: null, escrow_amount: 0, active: false, note: '' })).toEqual({
      id: 'a',
      escrow_amount: 0,
      active: false,
      note: '',
    });
  });
});
