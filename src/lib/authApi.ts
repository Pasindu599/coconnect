import { AuthError, addMembership, confirmOtp, sendOtp, signInStaff } from './auth';
import { store } from './store';
import type { Membership } from '../types/category';

/**
 * The sign-in page still renders this anchor; Supabase phone auth does not need it (no reCAPTCHA).
 * Kept so a captcha (hCaptcha/Turnstile) can mount here later without a UI change.
 */
export const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';

export interface AuthApi {
  /** True for the in-browser demo sign-in (code 123456); false for real Supabase auth. */
  isMock: boolean;
  /** Sends the code. In demo mode it returns the code so the screen can show it. */
  sendOtp: (phone: string) => Promise<{ demoCode?: string }>;
  /** Checks the code and records the category + role the person chose. */
  confirmOtp: (phone: string, code: string, membership: Membership) => Promise<void>;
  /** Staff sign-in (email + PIN in demo mode, email + password for real). */
  signInStaff: (email: string, secret: string) => Promise<void>;
}

/** The demo sign-in, backed by the local store. Throws the same AuthError codes as the real one. */
export const mockAuthApi: AuthApi = {
  isMock: true,
  async sendOtp(phone) {
    if (phone.replace(/\s+/g, '').length < 9) throw new AuthError('invalid-phone');
    return { demoCode: store.requestOtp(phone).code };
  },
  async confirmOtp(phone, code, membership) {
    const result = store.verifyOtp(phone, code, undefined, membership);
    if (!result.success) {
      throw new AuthError(result.error?.startsWith('Staff accounts') ? 'staff-account' : 'invalid-code');
    }
  },
  async signInStaff(email, pin) {
    if (!store.adminLogin(email, pin).success) throw new AuthError('not-staff');
  },
};

/** Real Supabase auth (src/lib/auth.ts). Roles are added by the `add_membership` SQL function. */
export const supabaseAuthApi: AuthApi = {
  isMock: false,
  async sendOtp(phone) {
    // E.164 without spaces
    await sendOtp(phone.replace(/\s+/g, ''), RECAPTCHA_CONTAINER_ID);
    return {};
  },
  async confirmOtp(_phone, code, membership) {
    await confirmOtp(code);
    await addMembership(membership); // idempotent: a no-op if they already hold this role
  },
  async signInStaff(email, password) {
    await signInStaff(email, password);
  },
};

export const authApi: AuthApi = import.meta.env.VITE_AUTH_MODE === 'supabase' ? supabaseAuthApi : mockAuthApi;

/**
 * Whether the app talks to the Supabase backend. RLS needs a signed-in user, so data sync only
 * runs with real auth; in demo mode everything stays in the browser.
 */
export const usesBackend: boolean = !authApi.isMock;
