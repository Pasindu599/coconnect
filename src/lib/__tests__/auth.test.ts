import { describe, expect, it } from 'vitest';
import { FirebaseError } from 'firebase/app';
import { AuthError, mapFirebaseAuthError } from '../auth';

function firebaseError(code: string) {
  return new FirebaseError(code, 'test error');
}

describe('mapFirebaseAuthError', () => {
  it('maps known Firebase Auth codes to AuthError codes', () => {
    expect(mapFirebaseAuthError(firebaseError('auth/invalid-phone-number')).code).toBe('invalid-phone');
    expect(mapFirebaseAuthError(firebaseError('auth/invalid-verification-code')).code).toBe('invalid-code');
    expect(mapFirebaseAuthError(firebaseError('auth/code-expired')).code).toBe('code-expired');
    expect(mapFirebaseAuthError(firebaseError('auth/too-many-requests')).code).toBe('too-many-requests');
    expect(mapFirebaseAuthError(firebaseError('auth/network-request-failed')).code).toBe('network');
  });

  it('maps credential failures to not-staff only when that is the given fallback', () => {
    expect(mapFirebaseAuthError(firebaseError('auth/wrong-password'), 'not-staff').code).toBe('not-staff');
    expect(mapFirebaseAuthError(firebaseError('auth/user-not-found'), 'not-staff').code).toBe('not-staff');
    expect(mapFirebaseAuthError(firebaseError('auth/wrong-password')).code).toBe('unknown');
  });

  it('falls back to the given default for an unrecognized code', () => {
    expect(mapFirebaseAuthError(firebaseError('auth/something-new'), 'invalid-phone').code).toBe('invalid-phone');
  });

  it('falls back to "unknown" for a non-Firebase error with no explicit fallback', () => {
    expect(mapFirebaseAuthError(new Error('boom')).code).toBe('unknown');
  });

  it('keeps the original error as `cause`', () => {
    const original = firebaseError('auth/code-expired');
    const mapped = mapFirebaseAuthError(original);
    expect(mapped).toBeInstanceOf(AuthError);
    expect(mapped.cause).toBe(original);
  });
});
