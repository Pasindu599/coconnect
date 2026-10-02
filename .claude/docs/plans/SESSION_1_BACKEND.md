# Session 1: Backend & Platform

**You are Session 1.** You own Firebase, security rules, auth, the data layer, payments/escrow, CI and backend tests. Session 2 is building the frontend in parallel, in a separate worktree.

Before starting, read [README.md](README.md) (file ownership, sync points, rules) and [CONTRACTS.md](CONTRACTS.md) (the interfaces Session 2 is building against). Don't edit Session 2's files; add a change request instead.

**Start prompt:**
> You are Session 1. Read `.claude/docs/plans/SESSION_1_BACKEND.md`, `README.md` and `CONTRACTS.md` in that folder. Work on the next task whose status is `todo` and whose dependencies are `done`. Use plan mode first.

## Task list

Status: `todo` · `doing` · `done` · `blocked`. Update this table when you start or finish a task.

| ID | Roadmap | Day | Task | Depends on | Unblocks S2 | Status |
|---|---|---|---|---|---|---|
| S1-01 | 2C-1 (pulled forward) | 1 | Vitest + CI + Node 22 pin. **Merge first.** | — | SP1 | done |
| S1-02 | 1A-1 | 1 | Specs: data model, auth, payments | — | | doing (drafted, pending human review) |
| S1-03 | 1A-2 | 1 | Firebase project + Emulator Suite | S1-01 | | done |
| S1-04 | 2A-1, 2C-3, 3C-1 | 2–3 | Firestore + Storage rules, with rules tests | S1-02, S1-03 | | done |
| S1-05 | 3A-1 | 3 | Phone OTP auth, `auth.ts`, custom-claims Functions | S1-04 | SP2 | done — **SP2 delivered** |
| S1-06 | 3C-2 | 3 | Emulator seed script | S1-03 | | done |
| S1-07 | 4A-1 | 4 | Repositories: users, sites, jobs, bids + `store.startSync()` | S1-04, S1-06 | SP3 | todo |
| S1-08 | 5A-1 | 5 | Repositories: workers, awards, attendance, completions; NIC images → Storage | S1-07 | | todo |
| — | 5C-1 | 5 | **SP4: week-1 demo + reviews (humans, both sessions)** | | | todo |
| S1-09 | 6A, 6C | 6 | `createPayment` Function + `payments.ts` + fee calc, with tests | S1-08, 1C-4 | SP5 | todo |
| S1-10 | 7A | 7 | `payhereNotify` webhook, with tests | S1-09 | SP6 | todo |
| S1-11 | 8A, 8C (rules) | 8 | Completion, dispute, refund Functions; payments/ledger rules tests | S1-10 | | todo |
| S1-12 | 9A | 9 | Admin payout recording + ledger reconciliation | S1-11 | | todo |
| S1-13 | 9C | 9 | Staging deploy (Hosting + Functions) via CI; error monitoring | S1-01, S1-10 | SP7 | todo |
| S1-14 | 10A | 10 | Bug fixes from staging | S1-13 | | todo |
| — | 10C | 10 | **Final `/code-review` + `/security-review`, docs, retro (humans, both sessions)** | | | todo |

---

## Task details

### S1-01: Vitest + CI + Node 22 pin — done
- **Files:** `package.json` (scripts `test`, `engines: { node: ">=22.12" }`), `.nvmrc` (`22`), `vitest.config.ts`, `.github/workflows/ci.yml`, one sample test.
- **Done when:** `npm test` runs. CI on every PR runs `npm ci`, `npm run lint`, `npm test`, `npm run build` on Node 22.
- **Note:** merge this before anything else. Session 2 rebases on it before adding its own test dependencies.
- **Local env note:** this machine's global Node is still 20.19 (no nvm/volta/fnm installed to switch via `.nvmrc`). `npm test`/`build`/`lint` all run fine on 20 in practice, so this wasn't a blocker, but someone should `nvm install` (or equivalent) to match `.nvmrc` for local dev. CI pins Node 22 via `actions/setup-node` regardless.

### S1-02: Specs
- **Files:** `.claude/docs/specs/data-model.md`, `auth.md`, `payments.md`.
- **Content:** start from `ARCHITECTURE.md` and `CONTRACTS.md`. Collections and fields, which role may read/write each, escrow state transitions, the PayHere flow, and failure cases (duplicate webhook, amount mismatch, refund after release).
- **Done when:** a teammate has reviewed them.

### S1-03: Firebase + emulators — done
- **Files:** `firebase.json`, `.firebaserc`, `firestore.indexes.json`, `src/lib/firebase.ts`, `src/vite-env.d.ts`, `package.json` (`firebase-tools` dev dep, `emulators` script), `.env.example`, plus a minimal `functions/` scaffold (package.json, tsconfig, `src/index.ts`) so the Functions emulator has something to load — real Functions land task by task from S1-05 on.
- `src/lib/firebase.ts` connects Auth/Firestore/Storage/Functions clients to the emulators when `VITE_USE_EMULATORS=true` (now the default in `.env.example`).
- Used the existing AI-Studio-provisioned Firebase project (`gen-lang-client-0417035030`, from `firebase-applet-config.json`) as `.firebaserc`'s default rather than creating a new one — a new project needs `firebase projects:create`, which needs `firebase login` (interactive browser OAuth), which isn't possible from this non-interactive session. **Nobody has run `firebase login` on this machine or in CI yet** — fine for emulator-only local dev (verified: `firebase emulators:exec --project demo-coconnect` starts auth+firestore+storage+functions+hosting cleanly with a fake "demo-" project id, no login needed), but it blocks any real `firebase deploy` (rules, functions, hosting) until a human runs it. That's the real blocker for S1-13 (staging deploy), not anything code-shaped.
- **Done when:** `npm run emulators` starts all four. ✅ verified via `firebase emulators:exec` (demo project, no login). The actual `npm run emulators` (without `--project demo-...`) will try to use `gen-lang-client-0417035030` and may prompt for login on first real (non-`exec`) run depending on firebase-tools version — a human on this machine should run it once interactively to confirm, or always pass `--project demo-coconnect` for pure local dev.
- **Local env notes (this machine):** (1) needs a JDK ≥21 for the Firestore/Storage emulators; only `openjdk@17` was on `PATH`, had to point `JAVA_HOME`/`PATH` at the already-installed-but-unlinked `openjdk@21` Homebrew keg. (2) macOS's AirPlay Receiver squats on port 5000, which is firebase-tools' default Hosting emulator port — moved it to 5050 in `firebase.json`. Neither affects CI (Linux runners, no AirPlay, and Java is provisioned separately if/when functions tests run in CI).

### S1-04: Security rules + rules tests — done
- **Files:** `firestore.rules`, `storage.rules`, `tests/rules/{setup,firestore,storage}.test.ts`, `vitest.rules.config.ts`, `src/types/index.ts` (added `memberships: Membership[]` and `active_category` to `User`, and widened `EscrowStatus` to the full state machine), `package.json` (`test:rules` script, `@firebase/rules-unit-testing` dev dep), CI `rules` job (Java 21 + `npm run test:rules`).
- **Rules implemented:** users (self+admin read/write, `memberships`/`nic_status`/`trust_score` client-immutable), sites, jobs (owner-only, status locked down to DRAFT/OPEN/CANCELLED client-side), bids (sealed — only the bidder and job owner can read), workers (manager-only, `rating`/`jobs_completed` immutable), `awards`/`payments`/`ledger`/`audit_logs` (Functions-only; `audit_logs` has no client read at all), attendance/completions/disputes (both parties, via denormalized `owner_id`/`bidder_id` — see ADR-006), `nic_submissions` (owner + admin), `ratings` (self-attested, best-effort uniqueness per the documented gap in `payments.md`). Deny-by-default catch-all at the end.
- **Done when:** rules tests cover allow **and** deny for every collection, and pass in CI. ✅ 54/54 passing locally via `npm run test:rules` (`firebase emulators:exec --only firestore,storage`); CI job added (untested in actual CI since nothing has been pushed through GitHub Actions yet — flag if the Java setup step needs tweaking). Closes KNOWN_ISSUES #1.
- Deviated from the data-model spec draft in one place: `users` reads are self+admin only, not "any authenticated user" — see ADR-006 for why, and `data-model.md` is updated to match.
- **Local env note:** the Firestore/Storage emulators need a JDK ≥21; see the S1-03 note above for the `JAVA_HOME` workaround on this machine. CI installs Java via `actions/setup-java`.

### S1-05: Auth (delivers SP2) — done
- **Files:** `src/lib/auth.ts` (CONTRACTS C3), `functions/src/auth/{onUserCreate,addMembership,setAdmin,roles}.ts` + `__tests__/*`, `src/lib/firebase.ts` (Drive scope), `functions/package.json` (+`@google-cloud/firestore`, `@google-cloud/storage` as explicit deps — see local-env note), `functions/.npmrc`, `.github/workflows/ci.yml` (functions job now also runs `npm test`, needs Java).
- Roles and admin are **custom claims set by Functions only**, mirrored from `users/{uid}.memberships` (ADR-006). `addMembership` rejects `admin` and validates the role against the category (`functions/src/auth/roles.ts`, hand-kept in sync with CONTRACTS C1 — Functions never import frontend config).
- Staff sign in through `signInStaff(email, password)` (Firebase email/password) and must have the `admin` claim; `setAdmin` is itself admin-gated (no public path to the first admin — see specs/auth.md's bootstrap note, resolved by S1-06's seed script for the emulator).
- Dropped the two redundant Drive scopes (KNOWN_ISSUES #9) — see that row for why the full `drive` scope itself stays, as a product question rather than a quick fix.
- **Done when:** ✅ 13 Functions unit tests pass against the emulator (`npm test` in `functions/`); ✅ manually verified the *full* OTP flow end-to-end against the real HTTP/Auth emulator stack (not just `.run()` calls) — sent a real verification code via the Auth emulator's REST API, signed in, confirmed `onUserCreate` fired and `users/{uid}` rules correctly allow/deny by ID token, then called `addMembership` over real HTTP and confirmed both the Firestore array and the Auth custom claim updated; ✅ `auth.ts` matches CONTRACTS C3 exactly, with its own error-mapping unit tests at the root level. Partially closes #3 (OTP) and #18 (admin) — both fully close once S2 switches its login/admin UI to call this instead of the `store.ts` mocks.
- **Local env note:** `firebase-admin`'s `getFirestore()`/`getStorage()` need `@google-cloud/firestore`/`@google-cloud/storage`, which `firebase-admin` lists as *optional* dependencies — on this machine's Node 20 they silently failed their own engine check and got skipped, breaking the build with a confusing `MODULE_NOT_FOUND`. Added both as explicit direct dependencies instead of chasing the engine mismatch. Separately, installing `vitest` inside `functions/` hit a reproducible `npm` bug (`TypeError: Cannot read properties of null (reading 'edgesOut')` in `@npmcli/arborist`) during dependency resolution — worked around with `legacy-peer-deps=true` in `functions/.npmrc` (the repo root already had this same setting for the same reason).
- Told Session 2: **SP2 is delivered.** S2-07 can switch login from the mock to `sendOtp`/`confirmOtp`/`addMembership`/`signInStaff` in `src/lib/auth.ts`.

### S1-06: Seed script — done
- **Files:** `scripts/seed.ts`, `package.json` script `seed` (+ `firebase-admin`, `@google-cloud/firestore` dev deps at root, needed for the same optional-dependency reason noted under S1-05).
- Moved `store.ts`'s `initialUsers`/`initialEstates`/`initialWorkers`/`initialJobs`/`initialBids`/`initialAwards` into the script, renamed to the new schema (`site_id` not `estate_id`, `bidder_id`/`manager_id` not `supervisor_id`, per the data-model spec), plus a parallel construction set from `categories.md`'s draft content (client/contractor/subcontractor/worker roles, site-cum-renovation sites, foundation/electrical/carpentry jobs). Creates real Firebase Auth users too (phone for regular roles, email+password for the admin), with `memberships`/`admin` custom claims set directly via the Admin SDK — an emulator-only shortcut, documented in the script's header as never a pattern to reuse against a real project (see specs/auth.md's bootstrap note).
- **Done when:** ✅ `npm run seed` (wrapped in `firebase emulators:exec --only auth,firestore --project demo-coconnect "npm run seed"` for a clean one-shot run, or just `npm run seed` against an already-running `npm run emulators`) fills an empty emulator with both categories. Verified: the `jobs` collection has the right shape, and the admin account signs in with the real custom claim set (checked via the Auth/Firestore REST APIs directly, not just script exit code).
- Did **not** seed `attendance_days`/`attendance_entries`/`completions`/`ratings`/`nic_submissions`/`audit_logs` — those are either Functions-written in normal operation or not yet needed for a browsing/bidding demo. Add them here later if a specific demo flow needs pre-seeded state for them.

### S1-07: Repositories, part 1 (delivers SP3)
- **Files:** `src/lib/data/{users,sites,jobs,bids}.ts`, `src/lib/store.ts`.
- The store keeps its public API (CONTRACTS C2). Internally, reads come from Firestore listeners and writes go to Firestore. Add `store.startSync()`.
- Write errors must surface to the caller (no more silent `console.warn`): KNOWN_ISSUES #11.
- **Done when:** jobs posted in one browser appear in another; edits and deletes sync, not only adds. Closes #10 for these collections.

### S1-08: Repositories, part 2
- **Files:** `src/lib/data/{workers,awards,attendance,completions,nic}.ts`, `src/lib/store.ts`.
- Add `uploadNicImage(file: File, side: 'front' | 'back'): Promise<string>` (returns a Storage path). Fill in CONTRACTS C5 with the exact signature in the same PR, so Session 2 can switch the NIC modal to it.
- **Done when:** nothing business-related is read from `localStorage` anymore (only UI preferences such as language). Closes #8 once S2-10 uses the upload.

### S1-09: createPayment (delivers SP5)
- **Needs:** PayHere sandbox merchant ID and secret from 1C-4. Store them as Functions secrets, never in the repo.
- **Files:** `functions/src/payments/{provider.ts,payhere.ts,createPayment.ts}`, `src/lib/payments.ts` (CONTRACTS C4).
- Total = bid price + platform fee. Read the fee percentage from config; record the chosen value in `DECISIONS.md`.
- Hash: `md5(merchant_id + order_id + amount + currency + md5(secret).toUpperCase()).toUpperCase()`. Check it against PayHere's current docs.
- **Tests:** fee calculation, hash, only the job's poster can create a payment, cannot pay twice for one award.

### S1-10: payhereNotify webhook (delivers SP6)
- **Files:** `functions/src/payments/payhereNotify.ts`.
- Verify `md5sig`, merchant ID, amount and currency. Make it idempotent: a repeated notify for the same order changes nothing.
- On success, in one transaction: payment `paid`, escrow `held`, job `ACTIVE`, ledger entry, audit log, contacts released.
- **Tests:** valid notify; bad signature; amount mismatch; duplicate notify; unknown order; failed/cancelled status codes.

### S1-11: Completion, dispute, refund
- **Files:** `functions/src/escrow/{confirmCompletion,openDispute,resolveDispute}.ts`, `tests/rules/**`.
- `confirmCompletion` checks a **hashed** PIN server-side, then sets escrow to `release_requested`.
- A dispute freezes the escrow. `resolveDispute` (admin only) ends in `refunded` (PayHere refund API) or `released`.
- **Tests:** every state transition and every illegal one. Rules tests prove clients can't write `payments` or `ledger`.

### S1-12: Admin payouts
- **Files:** `functions/src/escrow/recordPayout.ts`, reconciliation query helper in `src/lib/data/`.
- Admin records the bank-transfer reference. Escrow moves to `released`, and a ledger entry is written.
- Reconciliation: for each award, money in = held + released + refunded.

### S1-13: Staging deploy
- **Files:** `.github/workflows/deploy-staging.yml`.
- Merge to `main` deploys Hosting, Functions and rules to a staging Firebase project. Add error monitoring.
- **Done when:** staging URL is shared with the team, and the Definition of Done in `ROADMAP.md` can be walked through there.

### S1-14: Bug fixes
- Fix what the team finds on staging. Log anything not fixed in `KNOWN_ISSUES.md`.
