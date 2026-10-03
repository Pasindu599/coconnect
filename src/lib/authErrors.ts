import type { AuthErrorCode } from './auth';
import type { TranslationDict } from './i18n';

/**
 * Every AuthError.code (CONTRACTS C3) has a translated message. The Record type makes the
 * compiler reject this file if Session 1 adds a code that has no wording here.
 */
const AUTH_ERROR_KEY: Record<AuthErrorCode, keyof TranslationDict> = {
  'invalid-phone': 'auth_err_invalid_phone',
  'invalid-code': 'auth_err_invalid_code',
  'code-expired': 'auth_err_code_expired',
  'too-many-requests': 'auth_err_too_many',
  'staff-account': 'auth_err_staff_account',
  // Reuses the staff sign-in's own wording ("credentials rejected, access is audited")
  'not-staff': 'admin_err_credentials',
  network: 'auth_err_network',
  unknown: 'auth_err_unknown',
};

export const authErrorKey = (code: string): keyof TranslationDict =>
  AUTH_ERROR_KEY[code as AuthErrorCode] ?? 'auth_err_unknown';

/** The message for anything thrown while signing in; anything that is not an AuthError reads as "unknown". */
export const authErrorMessage = (error: unknown, t: TranslationDict): string => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : 'unknown';
  return t[authErrorKey(code)];
};

export const AUTH_ERROR_CODES = Object.keys(AUTH_ERROR_KEY) as AuthErrorCode[];
