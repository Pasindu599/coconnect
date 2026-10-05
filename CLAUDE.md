# Coconnect

Labour-hiring marketplace for Sri Lanka. People who need work done (land owners, construction clients) post jobs. Brokers/contractors bid and supply crews of workers they have registered. The owner's payment is **held in escrow until the work is confirmed complete**, then released.

The product is expanding from coconut-only into a **multi-category platform**. The first two categories are **Coconut** and **Construction**. The user picks a category on the home page and continues into that category's flow.

> Status (Oct 2026): the frontend (both categories, payments UI, disputes, payouts, admin) is built and tested against mocks. The backend is **Supabase** (ADR-014: Postgres + RLS, Auth, Storage, Realtime, SQL functions for escrow, Edge Functions for PayHere); the swap points are listed in [.claude/docs/plans/CONTRACTS.md](.claude/docs/plans/CONTRACTS.md). Plan: [.claude/docs/ROADMAP.md](.claude/docs/ROADMAP.md).

## Shared team context — read these first
| File | What's in it |
|---|---|
| [.claude/docs/ROADMAP.md](.claude/docs/ROADMAP.md) | 2-week plan, task owners (A/B/C), status |
| [.claude/docs/ARCHITECTURE.md](.claude/docs/ARCHITECTURE.md) | Current vs target architecture, data model, escrow state machine |
| [.claude/docs/KNOWN_ISSUES.md](.claude/docs/KNOWN_ISSUES.md) | Security and design issues in the current code |
| [.claude/docs/DECISIONS.md](.claude/docs/DECISIONS.md) | Decision log (ADRs) |
| [.claude/docs/categories.md](.claude/docs/categories.md) | Roles, tasks, skills per category |
| [.claude/docs/AI_SDLC.md](.claude/docs/AI_SDLC.md) | How the team uses Claude Code across the SDLC |
| `.claude/docs/specs/` | One spec per feature, written before building it |
| `.claude/docs/runbooks/` | Operational runbooks (key rotation, deploys) |

## Parallel sessions
The remaining roadmap runs as **two Claude Code sessions in parallel**, each in its own git worktree:
- **Session 1, Backend & Platform:** [.claude/docs/plans/SESSION_1_BACKEND.md](.claude/docs/plans/SESSION_1_BACKEND.md)
- **Session 2, Frontend & Categories:** [.claude/docs/plans/SESSION_2_FRONTEND.md](.claude/docs/plans/SESSION_2_FRONTEND.md)

Read [.claude/docs/plans/README.md](.claude/docs/plans/README.md) (file ownership, sync points) and [CONTRACTS.md](.claude/docs/plans/CONTRACTS.md) (shared interfaces) first. Only edit files your session owns; ask the other session through a change request in CONTRACTS.md.

**Keep these up to date.** After you finish a task, update its status in `ROADMAP.md`. When the team decides something, add an entry to `DECISIONS.md`. When you find or fix an issue, update `KNOWN_ISSUES.md`. These files are how every teammate's Claude session shares the same context; personal Claude memory is not shared.

## Stack
- React 19 + TypeScript + Vite + Tailwind v4, `motion`, `lucide-react`
- Supabase (Postgres + Row Level Security, Auth, Storage, Realtime, Edge Functions): everything server-side is in `supabase/` (`migrations/` = schema, RLS, SQL functions; `functions/` = Edge Functions; `config.toml`). No Firebase anywhere.
- Hosting: Vercel (static build; `vercel.json`)
- Google Maps via `@vis.gl/react-google-maps` (`VITE_GOOGLE_MAPS_API_KEY`)
- Payments: PayHere (sandbox first), via the `create-payment` / `payhere-notify` Edge Functions
- i18n: English / Sinhala / Tamil in `src/lib/i18n.ts`

## Commands
```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev      # http://localhost:3000
npm run lint     # tsc --noEmit (type check)
npm run build
```
Also: `npm test` (Vitest), `npm run test:e2e` (Playwright; locally `PW_CHROME_PATH=/usr/bin/google-chrome npm run test:e2e` uses an installed Chrome).
Backend: `npm run db:push` (apply `supabase/migrations` to the project in `SUPABASE_DB_URL`), `npm run test:db` (RLS/function/storage tests against the dev project; creates and deletes throwaway users), `npm run seed -- --yes` (demo data), `npm run functions:deploy`. Never run `test:db` or `seed` against production. `npm test` and `npm run test:e2e` always run the demo, whatever `.env.local` says (pinned in `vitest.config.ts` / `playwright.config.ts`). Setup: [.claude/docs/runbooks/supabase-setup.md](.claude/docs/runbooks/supabase-setup.md).

### Local environment
`.env.local` is gitignored; `.env.example` holds placeholders only. Ask the team
for a **dev** Google Maps key (referrer-restricted to `http://localhost:3000/*` —
we do not share one key across environments) and put it in
`VITE_GOOGLE_MAPS_API_KEY`. Without it the app runs fine and the map area shows a
"map unavailable" panel; there is deliberately no fallback key in the source.
For the backend, put the dev project's `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env.local` and set
`VITE_AUTH_MODE=supabase`; leave them unset for the in-browser demo. The
`SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_DB_URL` lines are for scripts and tests only
(never `VITE_`-prefixed: the service role bypasses RLS).
Env vars are declared in `src/vite-env.d.ts` — add new `VITE_*` vars there or they
will not type-check. See [.claude/docs/runbooks/google-maps-key.md](.claude/docs/runbooks/google-maps-key.md).

## Code map
- `src/App.tsx`: route-driven shell (hash router) inside `CategoryProvider`; starts `store.startSync()` when real auth is on
- `src/lib/router.ts`: `#/`, `#/:category[/login|dashboard|map|profile|workspace]`, `#/admin`; remembers the last category
- `src/config/categories.ts`: **the category registry** (roles + capabilities, task types, skills, tags, site fields, location presets, map centre) and helpers (`membershipsOf`, `formatSiteSummary`, `buildSitePayload`, ...); `vocab.construction.ts` is the construction wording; `CategoryContext.tsx` gives `useCategory()` / `useT()`; `escrow.ts` is the one rule for what an escrow status means in the UI
- `src/lib/i18n.ts`: en / si / ta dictionaries; `getCategoryT()` applies a category's vocabulary over the base text. `src/lib/money.ts` formats LKR / රු. / ரூ.
- `src/lib/store.ts`: the store: demo data and business logic (mock of the server) plus Supabase Realtime sync (`startSync`); `src/lib/seed/construction.ts` is the construction demo data
- `src/lib/authApi.ts`, `paymentsApi.ts`: the seams the UI calls (demo by default; real Supabase auth / PayHere with `VITE_AUTH_MODE=supabase`). `src/lib/supabase.ts`: the client, `callRpc`, `BackendError`; `src/lib/data/*`: one module per table; `escrow.ts` / `payments.ts`: the SQL / Edge Function calls. `src/lib/bank.ts`: payout bank details
- `src/types/`: domain types; `category.ts` (C1) and `payments.ts` (C4) are shared contracts
- `src/components/<area>/`: `home` (picker + category landing), `auth`, `owner` (poster), `supervisor` (bidder), `worker` (crew), `admin` (tabs), `profile`, `maps`, `common` (timeline, disputes, bank fields)
- `e2e/`: Playwright tests; `src/**/__tests__/`: Vitest unit and component tests

## Conventions (follow these in new code)
- **Category config is the single source of truth.** Task types, skills, roles, rating tags and site fields come from `src/config/categories.ts`. Don't hardcode coconut- or construction-specific values in components; wording that differs per category goes in the category's `vocab`.
- **The job engine is generic.** Check role *capabilities* (`poster`, `bidder`, `crew`), not role names like `'owner'`.
- **Money is only changed server-side.** Escrow status, payments and ledger entries are written by SQL functions (`security definer`) or Edge Functions, never by the client; money tables have no client write grant. New tables need RLS enabled and explicit grants (see `supabase/migrations/*_rls.sql`). The PayHere merchant secret never goes into front-end code.
- **No secrets in git.** Keep `.env.example` placeholder-only.
- Every user-facing string goes through `i18n.ts` with `en`, `si` and `ta` keys.
- Small PRs, one branch per roadmap task (`feat/...`, `fix/...`). Run `/code-review` before asking for human review; run `/security-review` on auth, RLS/migration and payment changes.
