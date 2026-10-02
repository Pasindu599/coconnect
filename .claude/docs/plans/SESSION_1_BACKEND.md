# Session 1: Backend & Platform

**You are Session 1.** You own Firebase, security rules, auth, the data layer, payments/escrow, CI and backend tests. Session 2 is building the frontend in parallel, in a separate worktree.

Before starting, read [README.md](README.md) (file ownership, sync points, rules) and [CONTRACTS.md](CONTRACTS.md) (the interfaces Session 2 is building against). Don't edit Session 2's files; add a change request instead.

**Start prompt:**
> You are Session 1. Read `.claude/docs/plans/SESSION_1_BACKEND.md`, `README.md` and `CONTRACTS.md` in that folder. Work on the next task whose status is `todo` and whose dependencies are `done`. Use plan mode first.

## Task list

Status: `todo` · `doing` · `done` · `blocked`. Update this table when you start or finish a task.

| ID | Roadmap | Day | Task | Depends on | Unblocks S2 | Status |
|---|---|---|---|---|---|---|
| S1-01 | 2C-1 (pulled forward) | 1 | Vitest + CI + Node 22 pin. **Merge first.** | — | SP1 | todo |
| S1-02 | 1A-1 | 1 | Specs: data model, auth, payments | — | | todo |
| S1-03 | 1A-2 | 1 | Firebase project + Emulator Suite | S1-01 | | todo |
| S1-04 | 2A-1, 2C-3, 3C-1 | 2–3 | Firestore + Storage rules, with rules tests | S1-02, S1-03 | | todo |
| S1-05 | 3A-1 | 3 | Phone OTP auth, `auth.ts`, custom-claims Functions | S1-04 | SP2 | todo |
| S1-06 | 3C-2 | 3 | Emulator seed script | S1-03 | | todo |
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

### S1-01: Vitest + CI + Node 22 pin
- **Files:** `package.json` (scripts `test`, `engines: { node: ">=22.12" }`), `.nvmrc` (`22`), `vitest.config.ts`, `.github/workflows/ci.yml`, one sample test.
- **Done when:** `npm test` runs. CI on every PR runs `npm ci`, `npm run lint`, `npm test`, `npm run build` on Node 22.
- **Note:** merge this before anything else. Session 2 rebases on it before adding its own test dependencies.

### S1-02: Specs
- **Files:** `.claude/docs/specs/data-model.md`, `auth.md`, `payments.md`.
- **Content:** start from `ARCHITECTURE.md` and `CONTRACTS.md`. Collections and fields, which role may read/write each, escrow state transitions, the PayHere flow, and failure cases (duplicate webhook, amount mismatch, refund after release).
- **Done when:** a teammate has reviewed them.

### S1-03: Firebase + emulators
- **Files:** `firebase.json`, `.firebaserc`, `src/lib/firebase.ts`, `package.json` (`firebase-tools` dev dep, `emulators` script), `.env.example`.
- `src/lib/firebase.ts` connects to the Auth, Firestore, Storage and Functions emulators when `VITE_USE_EMULATORS=true`.
- **Done when:** `npm run emulators` starts all four, and the app runs against them.

### S1-04: Security rules + rules tests
- **Files:** `firestore.rules`, `storage.rules`, `tests/rules/**`, `src/types/index.ts` (add `memberships: Membership[]` and `active_category` to `User`), CI step to run rules tests on the emulator.
- **Rules:**
  - Users read and write only their own profile, and never their roles or memberships.
  - Posters write their own sites and jobs.
  - Bidders write their own bids and workers.
  - `awards`, `payments`, `ledger`, `audit_logs`: clients can read their own, nobody can write.
  - NIC files: readable by the owner and admins only.
- **Done when:** rules tests cover allow **and** deny for every collection, and pass in CI. Closes KNOWN_ISSUES #1.
- Write the tests first, from the spec, then the rules.

### S1-05: Auth (delivers SP2)
- **Files:** `src/lib/auth.ts` (exactly the API in CONTRACTS C3), `functions/src/auth/*` (`onUserCreate`, `addMembership`, `setAdmin`), `src/lib/firebase.ts`.
- Roles and admin are **custom claims set by Functions only**. `addMembership` rejects `admin`.
- Staff sign in through `signInStaff(email, password)` (Firebase email/password) and must have the `admin` claim.
- Remove the full `drive` scope from Google sign-in (KNOWN_ISSUES #9).
- **Done when:** sign-in works with Firebase test phone numbers on the emulator; Functions have unit tests; the CONTRACTS C3 API matches. This closes #3. #18 is closed once S2-07 switches the admin form to `signInStaff`.
- When merged, tell Session 2 (SP2).

### S1-06: Seed script
- **Files:** `scripts/seed.ts`, `package.json` script `seed`.
- Move the demo data currently hardcoded in `store.ts` (users, estates, jobs, bids, workers, ...) into the seed script, for **both** categories. Use the construction content from `categories.md`.
- **Done when:** `npm run seed` fills an empty emulator with a usable demo for coconut and construction.

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
