/**
 * CONTRACTS.md C3, on Supabase Auth (ADR-014). Every function here
 * normalizes Supabase's own auth errors into the fixed AuthError.code set;
 * S2 maps each code to an i18n.ts key, and this file never produces
 * user-facing text. See .claude/docs/specs/auth.md for the full flow.
 */
import { isAuthApiError, isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { BackendError, callRpc, supabase } from './supabase';
import type { Membership } from '../types/category';

export type AuthErrorCode =
  | 'invalid-phone'
  | 'invalid-code'
  | 'code-expired'
  | 'too-many-requests'
  | 'staff-account'
  | 'not-staff'
  | 'network'
  | 'unknown';

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, cause?: unknown) {
    super(`AuthError: ${code}`);
    this.name = 'AuthError';
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

/** Exported for unit testing only; not part of CONTRACTS C3. */
export function mapSupabaseAuthError(err: unknown, fallback: AuthErrorCode = 'unknown'): AuthError {
  // The screen shows a friendly message; keep the real reason findable in the console.
  console.error('[auth] sign-in error:', (err as { code?: string })?.code ?? '', err);
  if (isAuthRetryableFetchError(err)) {
    return new AuthError('network', err);
  }
  if (isAuthApiError(err) || isAuthError(err)) {
    if (err.status === 429) {
      return new AuthError('too-many-requests', err);
    }
    switch (err.code) {
      case 'over_sms_send_rate_limit':
      case 'over_request_rate_limit':
        return new AuthError('too-many-requests', err);
      // Supabase uses one code for a wrong code and an expired one; a typo is
      // far more likely, so that is what the person is told.
      case 'otp_expired':
        return new AuthError('invalid-code', err);
      case 'validation_failed':
        // A malformed phone number when sending; a malformed email on the staff form.
        return new AuthError(fallback === 'not-staff' ? 'not-staff' : 'invalid-phone', err);
      case 'invalid_credentials':
      case 'user_not_found':
      case 'email_not_confirmed':
        return new AuthError(fallback === 'not-staff' ? 'not-staff' : 'unknown', err);
      default:
        return new AuthError(fallback, err);
    }
  }
  return new AuthError(fallback, err);
}

async function readOwnProfile(uid: string): Promise<{ is_admin: boolean; memberships: Membership[] } | null> {
  const { data } = await supabase.from('users').select('is_admin, memberships').eq('id', uid).maybeSingle();
  return data as { is_admin: boolean; memberships: Membership[] } | null;
}

// Held between sendOtp and confirmOtp, matching the CONTRACTS C3 signature
// (confirmOtp takes only the code). Kept after a wrong code so the person can
// retry without a new SMS; cleared once they are in.
let pendingPhone: string | null = null;

/**
 * `recaptchaContainerId` is kept for the C3 signature but unused: Supabase
 * needs no reCAPTCHA widget. (Bot protection, if wanted, is the project's
 * hCaptcha/Turnstile setting plus a captchaToken option here.)
 */
export async function sendOtp(phone: string, _recaptchaContainerId?: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { channel: 'sms', shouldCreateUser: true } });
  if (error) {
    // Only a genuinely bad number maps to 'invalid-phone' (above); anything else is not the person's fault
    throw mapSupabaseAuthError(error, 'unknown');
  }
  pendingPhone = phone;
}

export async function confirmOtp(code: string): Promise<{ uid: string; isNewUser: boolean }> {
  if (!pendingPhone) {
    throw new AuthError('unknown');
  }

  const { data, error } = await supabase.auth.verifyOtp({ phone: pendingPhone, token: code, type: 'sms' });
  if (error || !data.user) {
    throw mapSupabaseAuthError(error, 'invalid-code');
  }
  pendingPhone = null;

  const profile = await readOwnProfile(data.user.id);
  if (profile?.is_admin) {
    // The public OTP flow must never open a staff account (KNOWN_ISSUES #17),
    // decided by the server-side is_admin flag, not a client phone denylist.
    await supabase.auth.signOut();
    throw new AuthError('staff-account');
  }

  return {
    uid: data.user.id,
    // Supabase does not report "first sign-in"; no category membership yet is what onboarding cares about.
    isNewUser: (profile?.memberships ?? []).length === 0,
  };
}

/** Calls add_membership() (never writes roles directly). RLS reads the table, so there is no token to refresh afterwards. */
export async function addMembership(m: Membership): Promise<void> {
  try {
    await callRpc('add_membership', { p_category: m.category, p_role: m.role });
  } catch (err) {
    throw err instanceof BackendError ? new AuthError('unknown', err) : mapSupabaseAuthError(err);
  }
}

export async function signInStaff(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw mapSupabaseAuthError(error, 'not-staff');
  }

  const profile = await readOwnProfile(data.user.id);
  if (!profile?.is_admin) {
    await supabase.auth.signOut();
    throw new AuthError('not-staff');
  }
}

export async function signOut(): Promise<void> {
  pendingPhone = null;
  await supabase.auth.signOut();
}
