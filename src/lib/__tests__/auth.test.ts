import { describe, expect, it, vi } from 'vitest';
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { AuthError, mapSupabaseAuthError } from '../auth';

vi.spyOn(console, 'error').mockImplementation(() => {});

function apiError(code: string, status = 400) {
  return new AuthApiError('test error', status, code);
}

describe('mapSupabaseAuthError', () => {
  it('maps known Supabase Auth codes to AuthError codes', () => {
    expect(mapSupabaseAuthError(apiError('validation_failed')).code).toBe('invalid-phone');
    expect(mapSupabaseAuthError(apiError('otp_expired', 403)).code).toBe('invalid-code');
    expect(mapSupabaseAuthError(apiError('over_sms_send_rate_limit')).code).toBe('too-many-requests');
    expect(mapSupabaseAuthError(apiError('anything', 429)).code).toBe('too-many-requests');
    expect(mapSupabaseAuthError(new AuthRetryableFetchError('offline', 0)).code).toBe('network');
  });

  it('maps credential failures to not-staff only when that is the given fallback', () => {
    expect(mapSupabaseAuthError(apiError('invalid_credentials'), 'not-staff').code).toBe('not-staff');
    expect(mapSupabaseAuthError(apiError('validation_failed'), 'not-staff').code).toBe('not-staff');
    expect(mapSupabaseAuthError(apiError('invalid_credentials')).code).toBe('unknown');
  });

  it('falls back to the given default for an unrecognized code', () => {
    expect(mapSupabaseAuthError(apiError('something_new'), 'invalid-code').code).toBe('invalid-code');
  });

  it('falls back to "unknown" for a non-Supabase error with no explicit fallback', () => {
    expect(mapSupabaseAuthError(new Error('boom')).code).toBe('unknown');
  });

  it('keeps the original error as `cause`', () => {
    const original = apiError('otp_expired', 403);
    const mapped = mapSupabaseAuthError(original);
    expect(mapped).toBeInstanceOf(AuthError);
    expect(mapped.cause).toBe(original);
  });
});
