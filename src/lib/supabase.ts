/**
 * The one Supabase client (replaces src/lib/firebase.ts; see ADR-014).
 *
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are public by design (ADR-005):
 * what protects the data is RLS (supabase/migrations/*_rls.sql), not the key.
 * Both are optional so demo mode, CI and e2e run without a project. The
 * client is then built against a placeholder URL and never makes a request,
 * because nothing calls it unless `usesBackend` (src/lib/authApi.ts) is on.
 */
import { createClient, FunctionsHttpError, type SupportedStorage } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/** Real auth and live data (`VITE_AUTH_MODE=supabase`). Off = the in-browser demo. authApi.usesBackend is the same switch. */
export const backendMode = import.meta.env.VITE_AUTH_MODE === 'supabase';

// ---------------------------------------------------------------------------
// Session storage. Supabase keeps the session in localStorage, and after a
// Google sign-in that session includes the Google access token (full Drive
// scope, see WorkspaceHub). That token is kept in memory only: it is taken
// out of the session before the session is written to storage.
// ---------------------------------------------------------------------------
let googleProviderToken: string | null = null;

/** The Google access token from the last Google sign-in in this tab, or null. Never persisted. */
export function getGoogleProviderToken(): string | null {
  return googleProviderToken;
}

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const authStorage: SupportedStorage = {
  getItem: (key) => browserStorage()?.getItem(key) ?? null,
  setItem: (key, value) => {
    let toStore = value;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && 'access_token' in parsed) {
        if (parsed.provider_token) googleProviderToken = parsed.provider_token;
        delete parsed.provider_token;
        delete parsed.provider_refresh_token;
        toStore = JSON.stringify(parsed);
      }
    } catch {
      // not JSON (e.g. the PKCE code verifier): store as-is
    }
    browserStorage()?.setItem(key, toStore);
  },
  removeItem: (key) => browserStorage()?.removeItem(key),
};

// `||`, not `??`: an empty VITE_SUPABASE_URL="" must fall back too, or createClient throws and the page is blank.
export const supabase = createClient(url || 'http://127.0.0.1:54321', anonKey || 'demo-mode-no-backend', {
  auth: {
    // PKCE returns `?code=` instead of tokens in the URL fragment, which the
    // hash router (src/lib/router.ts) owns.
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured,
    storage: authStorage,
  },
});

// ---------------------------------------------------------------------------
// The signed-in auth user, readable synchronously (store.ts gates every
// remote write on it). Updated by Supabase's own auth events.
// ---------------------------------------------------------------------------
let authUserId: string | null = null;

if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange((event, session) => {
    authUserId = session?.user.id ?? null;
    if (event === 'SIGNED_OUT') googleProviderToken = null;
  });
}

/** The Supabase auth uid, or null when nobody is signed in to the backend (always null in demo mode). */
export function getAuthUserId(): string | null {
  return authUserId;
}

// ---------------------------------------------------------------------------
// Errors from the backend (SQL functions and Edge Functions).
// ---------------------------------------------------------------------------

/** The same code set the SQL functions raise (CONTRACTS C7). Wording for each lives in i18n.ts, never here (C6). */
export type BackendErrorCode =
  | 'unauthenticated'
  | 'invalid-argument'
  | 'not-found'
  | 'already-exists'
  | 'permission-denied'
  | 'failed-precondition'
  | 'resource-exhausted'
  | 'internal';

const BACKEND_ERROR_CODES: readonly string[] = [
  'unauthenticated',
  'invalid-argument',
  'not-found',
  'already-exists',
  'permission-denied',
  'failed-precondition',
  'resource-exhausted',
  'internal',
];

export class BackendError extends Error {
  code: BackendErrorCode;

  constructor(code: BackendErrorCode, cause?: unknown) {
    super(`BackendError: ${code}`);
    this.name = 'BackendError';
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

/** Exported for unit testing. A SQL `raise exception '<code>'` arrives with the code as its message. */
export function toBackendErrorCode(value: unknown): BackendErrorCode {
  return typeof value === 'string' && BACKEND_ERROR_CODES.includes(value) ? (value as BackendErrorCode) : 'internal';
}

/**
 * Calls a SQL function and throws BackendError on failure. Also throws when
 * the function *returns* `{ error: <code> }`, which confirm_completion does
 * for a wrong PIN so its attempt counter is not rolled back.
 */
export async function callRpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    throw new BackendError(toBackendErrorCode(error.message), error);
  }
  if (data && typeof data === 'object' && !Array.isArray(data) && 'error' in data) {
    throw new BackendError(toBackendErrorCode((data as { error: unknown }).error));
  }
  return data as T;
}

/** Calls an Edge Function and throws BackendError with the `{ error }` code it answered with. */
export async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let code: BackendErrorCode = 'internal';
    if (error instanceof FunctionsHttpError) {
      try {
        code = toBackendErrorCode((await error.context.json())?.error);
      } catch {
        // body was not JSON
      }
    }
    throw new BackendError(code, error);
  }
  return data as T;
}
