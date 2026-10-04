# Runbook: staging deploy

Owner: whoever has Supabase dashboard, Vercel and GitHub repo-admin access ·
Roadmap task **S1-13** · Workflow: `.github/workflows/deploy-staging.yml`

## What it does

On every push to `main` (main only moves through merged, CI-green PRs):

1. `supabase db push` applies new `supabase/migrations/*` to the staging project.
2. `supabase functions deploy` deploys `create-payment` and `payhere-notify`.
3. `vercel build` + `vercel deploy --prebuilt --prod` publishes the static site.

Nothing in the code is staging-specific; the workflow deploys what is in `main`.

## One-time setup

1. **Staging Supabase project:** set it up with
   [supabase-setup.md](supabase-setup.md) (auth providers, Edge Function
   secrets, first admin). Use a project separate from production before
   anything touches real money.
2. **Vercel project:** import the repo in Vercel (framework: Vite; `vercel.json`
   already sets the build). In the Vercel project's environment variables set
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_AUTH_MODE=supabase` and
   a staging `VITE_GOOGLE_MAPS_API_KEY` (referrer-restricted to the Vercel
   domain). Add the Vercel URL to Supabase's Auth redirect URLs.
3. **GitHub repo settings > Secrets and variables > Actions:**

   | Kind | Name | Value |
   |---|---|---|
   | secret | `SUPABASE_ACCESS_TOKEN` | Supabase account > Access Tokens |
   | secret | `SUPABASE_STAGING_DB_URL` | staging Session pooler URI with password |
   | secret | `VERCEL_TOKEN` | Vercel account > Tokens |
   | variable | `SUPABASE_PROJECT_REF` | staging project ref |
   | variable | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | from `.vercel/project.json` after `npx vercel link` |

   Optional, for CI's `db` job (RLS/function tests against a **dev** project,
   never staging or production): variable `SUPABASE_DB_TESTS=true`, secrets
   `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`, `SUPABASE_TEST_SERVICE_ROLE_KEY`.
4. **PayHere:** until 1C-4 delivers sandbox credentials, set placeholder
   `PAYHERE_MERCHANT_ID` / `PAYHERE_MERCHANT_SECRET` Edge Function secrets:
   the functions deploy fine, and checkout simply won't work until the real
   values are set. Then register the notify URL
   `https://<ref>.supabase.co/functions/v1/payhere-notify` with PayHere.

## Error monitoring

Edge Function logs and errors: Supabase dashboard > Edge Functions > (function) >
Logs. Every `console.error` in `payhere-notify` (bad signature, amount
mismatch, unknown order) shows there. Postgres logs: dashboard > Logs.
Frontend error monitoring (e.g. Sentry) is not set up yet.

## Verifying it worked

Walk the Definition of Done in `ROADMAP.md` against the Vercel URL for both
categories, with `VITE_AUTH_MODE=supabase`.
