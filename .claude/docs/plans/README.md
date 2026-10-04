# Parallel sessions: how the two plans fit together

The remaining roadmap is split across **two Claude Code sessions that run at the same time**:

| Session | Plan | Scope |
|---|---|---|
| **S1: Backend & Platform** | [SESSION_1_BACKEND.md](SESSION_1_BACKEND.md) | Supabase (schema, RLS, SQL/Edge Functions), auth, data layer, payments/escrow, CI, db tests, deploy |
| **S2: Frontend & Categories** | [SESSION_2_FRONTEND.md](SESSION_2_FRONTEND.md) | Router, category registry, home picker, construction UI, dashboards, i18n, UI tests, e2e |

Already done: 1C-1, 1C-2, 1C-3. **1C-4** (PayHere sandbox + escrow question) is being handled by a person, outside both sessions.

Each session updates the **Status** column in its own plan file only. `ROADMAP.md` stays as the overview.

---

## 1. Use separate working copies (required)

Two sessions in the same folder will switch branches and overwrite each other's files. Give each session its own git worktree:

```bash
# from the main checkout (this folder) — Session 1 works here
cd "/mnt/data/parttime - B/Mine/coconnect"

# create a second working copy for Session 2, next to this one
git worktree add "../coconnect-s2" main
cd "../coconnect-s2" && npm ci      # each worktree needs its own node_modules
```

Start Session 2's Claude Code inside `../coconnect-s2`. Both copies share the same git history, so branches and commits are visible to both.

Both need **Node 22** (Vite 8 doesn't run on Node 18).

## 2. File ownership

A session only edits files it owns. If it needs a change in the other session's file, it adds a request to [CONTRACTS.md](CONTRACTS.md#change-requests) instead.

| Owner | Files |
|---|---|
| **S1** | `supabase/**` (config, migrations, Edge Functions), `vercel.json`, `src/lib/supabase.ts`, `src/lib/googleDrive.ts`, `src/lib/auth.ts`, `src/lib/escrow.ts`, `src/lib/payments.ts`, `src/lib/data/**`, `src/lib/store.ts`, `src/types/index.ts`, `tests/db/**`, `scripts/**`, `.github/workflows/**`, `vitest.config.ts`, `.nvmrc` |
| **S2** | `src/App.tsx`, `src/main.tsx`, `src/config/**`, `src/components/**`, `src/lib/i18n.ts`, `src/lib/router.ts`, `src/lib/nicValidator.ts`, `e2e/**`, `playwright.config.ts`, `index.html` |
| **Shared, with care** | `package.json` + lockfile (see below), `src/types/category.ts` (frozen contract), `.claude/docs/KNOWN_ISSUES.md` (append rows only), `CLAUDE.md` (lasting conventions only) |

**`package.json` and lockfile.** S1 lands the test/CI setup first (task S1-01). After that, either session may add dependencies, in a PR of its own. On a lockfile conflict, never merge it by hand. Take `main`'s lockfile and re-run `npm install <your packages>`.

## 3. Sync points

These are the only moments one session waits on the other. Everything else runs independently.

| # | When | What must be merged | Who waits |
|---|---|---|---|
| SP1 | Day 1, first | S1-01: Vitest, CI, `.nvmrc`, `engines` | S2 rebases before adding test deps |
| SP2 | End of day 3 | S1-05: `src/lib/auth.ts` (phone OTP) | S2-07 switches login from the mock to real auth |
| SP3 | Day 4 | S1-07: `store.startSync()` | S2-08 replaces the old sync block in `App.tsx` |
| SP4 | End of day 5 | Both sessions' week-1 work | Humans: week-1 demo, `/code-review`, `/security-review` |
| SP5 | Day 6 | S1-09: `src/lib/payments.ts` + `createPayment` (done; Supabase since ADR-014) | S2-11 swaps its mock for the real call |
| SP6 | Day 8 | S1-10: `payhereNotify` webhook | S2-13 e2e happy path can run end to end |
| SP7 | Day 9 | S1-13: staging deploy | Both: bug fixing on staging (day 10) |

Before an SP is reached, the waiting session builds against the mock described in [CONTRACTS.md](CONTRACTS.md). It doesn't sit idle.

## 4. Working rules for both sessions

- Branch names: `s1/<task-id>-<short-name>` or `s2/<task-id>-<short-name>`, branched from the latest `main`.
- One task per PR. Rebase on `main` before opening it. CI must be green.
- Run `/code-review` on your branch before asking for human review. Run `/security-review` on anything touching auth, RLS policies, SQL/Edge Functions or payments.
- When a task is done: set its status in **your** plan file, and add or close rows in `KNOWN_ISSUES.md`.
- If you change something in [CONTRACTS.md](CONTRACTS.md), say so in the PR title (`[contract]`), so the other session notices.
