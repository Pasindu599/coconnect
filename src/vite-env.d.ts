/// <reference types="vite/client" />

/**
 * Opts into Vite's strict `import.meta.env` typing. Without this, Vite declares
 * `ImportMetaEnv extends Record<string, any>`, so any name at all type-checks
 * and a misspelled variable silently reads as `undefined`. Declaring
 * `strictImportMetaEnv` drops that index signature, leaving only the variables
 * listed below.
 */
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

/**
 * Build-time environment variables.
 *
 * Everything here is inlined into the client bundle by Vite and is therefore
 * PUBLIC. Never add a value that must stay secret (see ADR-005); server-side
 * secrets belong in Cloud Functions config.
 */
interface ImportMetaEnv {
  /**
   * Google Maps Platform browser key, restricted by HTTP referrer in Google
   * Cloud Console. Optional on purpose: it is unset in CI and in any checkout
   * without a local `.env.local`, and `EstateMapView` renders a "map
   * unavailable" panel in that case rather than falling back to a shared key.
   */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;

  /**
   * The Supabase project's API URL (https://<ref>.supabase.co). Public (ADR-005):
   * RLS protects the data, not this value. Optional so demo mode, CI and e2e
   * run without a project; see src/lib/supabase.ts.
   */
  readonly VITE_SUPABASE_URL?: string;

  /**
   * The project's anon (publishable) key. Public by design, same as the URL.
   * Never put the service_role key here: it bypasses RLS.
   */
  readonly VITE_SUPABASE_ANON_KEY?: string;

  /**
   * "supabase" signs people in with real Supabase phone / staff auth
   * (src/lib/auth.ts) and turns on live data sync. Anything else uses the
   * in-browser demo sign-in (code 123456) and keeps all data local.
   */
  readonly VITE_AUTH_MODE?: string;
}
