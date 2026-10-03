# Runbook: staging deploy

Owner: whoever has Google Cloud Console / Firebase Console access for this
project · Roadmap task **S1-13** · Workflow: `.github/workflows/deploy-staging.yml`

## Why this exists

`deploy-staging.yml` deploys Hosting, Cloud Functions, Firestore rules and
Storage rules on every push to `main`. It's written and correct, but it
**cannot run successfully yet** — it needs one-time setup that only a human
with Google Cloud/Firebase console access and GitHub repo-admin access can
do. This was written from a non-interactive session with neither: no browser
for `firebase login`, no repo-admin UI for adding secrets. Everything below
is what's left.

## What's already true

- **Staging == the existing project.** There's no separate staging Firebase
  project — `.firebaserc`'s `default` (`gen-lang-client-0417035030`) is the
  AI-Studio-provisioned project this app has used since before S1 started
  (see S1-03's notes). Reusing it as "staging" is a pragmatic MVP call, not
  an oversight; if the team wants a genuinely separate staging project
  (recommended before anything touches real money), create one and update
  `.firebaserc`'s `default` (or add a `staging` alias and change the
  workflow's `--project` flag) — that's also a console action a human needs
  to do, `firebase projects:create` requires `firebase login`.
- Every Cloud Function, `firestore.rules` and `storage.rules` already exist
  and are tested against the emulator (S1-04 through S1-12). The workflow
  deploys exactly what's in `main` — nothing is deploy-specific or
  staging-only in the code.

## One-time setup (do this before the workflow can succeed)

1. **Create a deploy service account** (Google Cloud Console → IAM & Admin →
   Service Accounts, on the project above):
   - Name it something obvious, e.g. `github-actions-deploy`.
   - Grant roles: **Firebase Hosting Admin**, **Cloud Functions Admin**,
     **Firebase Rules Admin**, **Service Account User**, **Cloud Datastore
     Index Admin** (for `firestore.indexes.json`), and **Secret Manager
     Secret Accessor** (functions using `defineSecret` need to read the
     secret at deploy time, not just at runtime).
   - Create a JSON key for it.
2. **Add it as a GitHub secret**: repo Settings → Secrets and variables →
   Actions → New repository secret → name it `FIREBASE_STAGING_SERVICE_ACCOUNT`,
   paste the full JSON key content.
3. **Create the PayHere merchant secret in Secret Manager** — this is the
   actual blocker, not just a formality: `firebase deploy` **fails outright**
   if a deployed function references a `defineSecret()` that doesn't exist
   in Secret Manager yet, regardless of whether the function is ever called.
   Needs 1C-4 (real PayHere sandbox credentials) first, then:
   ```
   firebase functions:secrets:set PAYHERE_MERCHANT_SECRET --project gen-lang-client-0417035030
   ```
   (interactive prompt for the value; needs `firebase login` first).

   **Until 1C-4 lands**, this workflow will fail at the `firebase deploy`
   step specifically because this secret doesn't exist — not a bug in the
   workflow, a real external dependency. A stopgap if staging needs to be
   reachable sooner: set it to any placeholder string so the deploy
   succeeds, with payments simply not working for real until the secret is
   replaced with the genuine value.
4. **(Optional, non-secret) set the real merchant ID** as a GitHub Actions
   **variable** (not secret — it's not sensitive) named `PAYHERE_MERCHANT_ID`,
   repo Settings → Secrets and variables → Actions → Variables tab. Without
   it, Functions use the `SANDBOX_MERCHANT_ID_PLACEHOLDER` default.
5. **First deploy**: once 1–3 are done, merging anything to `main` triggers
   the workflow. Watch the Actions tab; the first run also creates the
   Hosting site and Functions if they don't exist yet.

## Error monitoring

Cloud Functions (2nd gen) send errors to **Google Cloud's Error Reporting**
and structured logs to **Cloud Logging** automatically — no extra setup
needed for the backend; every `console.error()` already called in this
codebase's Functions (`payhereNotify`'s rejection logging, etc.) shows up
there once deployed. Check it at Cloud Console → Error Reporting, scoped to
this project.

Frontend error monitoring (e.g. Sentry) is **not set up** — it would mean
adding a dependency and wiring it into `src/App.tsx` / a new error boundary
component, both of which are `src/components/**`/`App.tsx`, Session 2's
files, not something this session edits. Flagging as a Session 2 /
follow-up task rather than guessing at ownership.

## Verifying it worked

Once deployed, walk the Definition of Done in `ROADMAP.md` against the
staging Hosting URL (Firebase Console → Hosting shows it) for both
categories.
