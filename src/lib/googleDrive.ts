/**
 * Google sign-in for the Drive backup page (WorkspaceHub), through Supabase
 * Auth's Google provider. Replaces the Firebase popup sign-in.
 *
 * Supabase's Google sign-in is a full-page redirect, not a popup. It also
 * signs the browser in to Supabase *as that Google account*, replacing any
 * phone-OTP session. This was a deliberate choice (ADR-014); the alternative
 * is Google Identity Services, which would leave app sign-in alone.
 *
 * The Google access token (`provider_token`) is held in memory only; see
 * src/lib/supabase.ts. Supabase does not refresh it, so after a reload or
 * once it expires (about an hour) the person connects Google again.
 */
import { getGoogleProviderToken, isSupabaseConfigured, supabase } from './supabase';

// Scope for the Drive file browser/backup feature: it lists, uploads to and
// deletes arbitrary files anywhere in the user's Drive (src/lib/workspaceApi.ts),
// which genuinely needs the full `drive` scope; `drive.file` only sees files
// this app itself created, which would silently empty the file list.
// KNOWN_ISSUES #9 flagged the full scope as excessive; it is, but narrowing it
// means redesigning the feature (e.g. the Google Picker API), which is a
// product decision, not a scope swap.
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

export interface GoogleAccount {
  displayName?: string;
  email?: string;
}

/** Redirects to Google, then back to the page (hash route included) the person started from. */
export async function googleSignIn(): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Google sign-in needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: DRIVE_SCOPE,
      redirectTo: window.location.href,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
}

export async function googleSignOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Calls back with the connected Google account and its Drive token, or
 * (null, null) when there is no Google session or its token is gone.
 * Returns an unsubscribe function.
 */
export function watchGoogleAccount(onChange: (account: GoogleAccount | null, accessToken: string | null) => void): () => void {
  if (!isSupabaseConfigured) {
    onChange(null, null);
    return () => {};
  }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const token = session?.provider_token ?? getGoogleProviderToken();
    const isGoogle = session?.user.app_metadata?.provider === 'google' || session?.user.identities?.some((i) => i.provider === 'google');
    if (!session || !isGoogle || !token) {
      onChange(null, null);
      return;
    }
    const meta = session.user.user_metadata ?? {};
    onChange({ displayName: meta.full_name ?? meta.name, email: session.user.email }, token);
  });
  return () => data.subscription.unsubscribe();
}
