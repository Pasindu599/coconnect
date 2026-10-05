/**
 * Shared response helpers for the Edge Functions.
 *
 * Errors are `{ error: <code> }` using the same code set as the SQL functions
 * (see supabase/migrations/*_functions.sql and CONTRACTS C7), so the client
 * reads one error shape whether it called an RPC or an Edge Function.
 */
export const BACKEND_ERROR_CODES = [
  'unauthenticated',
  'invalid-argument',
  'not-found',
  'already-exists',
  'permission-denied',
  'failed-precondition',
  'resource-exhausted',
  'internal',
] as const;

export type BackendErrorCode = (typeof BACKEND_ERROR_CODES)[number];

const STATUS_BY_CODE: Record<BackendErrorCode, number> = {
  unauthenticated: 401,
  'invalid-argument': 400,
  'not-found': 404,
  'already-exists': 409,
  'permission-denied': 403,
  'failed-precondition': 412,
  'resource-exhausted': 429,
  internal: 500,
};

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** A Postgres error raised as `raise exception '<code>'` carries the code as its message. */
export function toBackendErrorCode(message: string | undefined): BackendErrorCode {
  return (BACKEND_ERROR_CODES as readonly string[]).includes(message ?? '') ? (message as BackendErrorCode) : 'internal';
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(code: BackendErrorCode): Response {
  return jsonResponse({ error: code }, STATUS_BY_CODE[code]);
}
