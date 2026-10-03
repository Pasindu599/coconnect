/**
 * CONTRACTS.md C3. Every function here normalizes Firebase Auth's own error
 * codes into the fixed AuthError.code set — S2 maps each code to an
 * i18n.ts key, this file never produces user-facing text. See
 * .claude/docs/specs/auth.md for the full flow and rationale.
 */
import {
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getIdTokenResult,
  getAdditionalUserInfo,
  RecaptchaVerifier,
  type ConfirmationResult,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';
import { auth, functions } from './firebase';
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
export function mapFirebaseAuthError(err: unknown, fallback: AuthErrorCode = 'unknown'): AuthError {
  // The screen shows a friendly message; keep the real Firebase reason findable in the console.
  console.error('[auth] sign-in error:', (err as { code?: string })?.code ?? '', err);
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-phone-number':
        return new AuthError('invalid-phone', err);
      case 'auth/invalid-verification-code':
        return new AuthError('invalid-code', err);
      case 'auth/code-expired':
        return new AuthError('code-expired', err);
      case 'auth/too-many-requests':
        return new AuthError('too-many-requests', err);
      case 'auth/network-request-failed':
        return new AuthError('network', err);
      case 'auth/wrong-password':
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
        return new AuthError(fallback === 'not-staff' ? 'not-staff' : 'unknown', err);
      default:
        return new AuthError(fallback, err);
    }
  }
  return new AuthError(fallback, err);
}

// Held between sendOtp and confirmOtp, matching the CONTRACTS C3 signature
// (confirmOtp takes only the code, not a handle).
let pendingConfirmation: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export async function sendOtp(phone: string, recaptchaContainerId: string): Promise<void> {
  try {
    // A fresh verifier per send: reusing one across renders/attempts is a
    // common source of "reCAPTCHA has already been rendered" bugs.
    recaptchaVerifier?.clear();
    recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
    pendingConfirmation = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
  } catch (err) {
    // Only a genuinely bad number maps to 'invalid-phone' (above); anything else is not the person's fault
    throw mapFirebaseAuthError(err, 'unknown');
  }
}

export async function confirmOtp(code: string): Promise<{ uid: string; isNewUser: boolean }> {
  if (!pendingConfirmation) {
    throw new AuthError('unknown');
  }

  let credential;
  try {
    credential = await pendingConfirmation.confirm(code);
  } catch (err) {
    throw mapFirebaseAuthError(err, 'invalid-code');
  } finally {
    pendingConfirmation = null;
  }

  const tokenResult = await getIdTokenResult(credential.user);
  if (tokenResult.claims.admin === true) {
    // The public OTP flow must never open a staff account (KNOWN_ISSUES #17's
    // original bug, now enforced server-side by claims rather than a phone
    // number denylist on the client).
    await firebaseSignOut(auth);
    throw new AuthError('staff-account');
  }

  return {
    uid: credential.user.uid,
    isNewUser: getAdditionalUserInfo(credential)?.isNewUser ?? false,
  };
}

const addMembershipCallable = httpsCallable<Membership, { ok: true }>(functions, 'addMembership');

export async function addMembership(m: Membership): Promise<void> {
  try {
    await addMembershipCallable(m);
  } catch (err) {
    throw mapFirebaseAuthError(err);
  }
  // Rules read memberships from the ID token claim (ADR-006); force a
  // refresh so the next rules-gated write/read sees the new membership
  // immediately instead of waiting for the token's natural refresh cycle.
  if (auth.currentUser) {
    await getIdTokenResult(auth.currentUser, true);
  }
}

export async function signInStaff(email: string, password: string): Promise<void> {
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw mapFirebaseAuthError(err, 'not-staff');
  }

  const tokenResult = await getIdTokenResult(credential.user);
  if (tokenResult.claims.admin !== true) {
    await firebaseSignOut(auth);
    throw new AuthError('not-staff');
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
