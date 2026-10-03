# Contracts between Session 1 and Session 2

These are the interfaces both sessions build against. They let each session work without waiting for the other. **Change them only by agreement**, and mark the PR title `[contract]`.

## C1. Category types (frozen now)

File: `src/types/category.ts` (already in `main`; owned by nobody, changed only by agreement).

```ts
export type CategoryId = 'coconut' | 'construction';
export type Capability = 'poster' | 'bidder' | 'crew';
export type CategoryRoleId = 'owner' | 'broker' | 'client' | 'contractor' | 'subcontractor' | 'worker';
export interface Membership { category: CategoryId; role: CategoryRoleId; }
```

- S2 builds `src/config/categories.ts` on these types.
- S1 uses `Membership` and `CategoryId` in the data model, rules and Functions.
- The legacy `Role` type in `src/types/index.ts` (`owner | supervisor | worker | admin`) stays until S1-07 migrates the data. Coconut `broker` = legacy `supervisor`.

## C2. Store facade (S1 owns the inside, S2 calls the outside)

Components keep using the same API they use today:

```ts
store.getState(): AppState
store.subscribe(listener: () => void): () => void
store.<action>(...)          // awardBid, submitBid, confirmCompletion, ...
```

S1 swaps the internals from `localStorage` to Firestore (S1-07, S1-08) **without changing these signatures**. If a signature has to change, S1 updates every caller in the same PR, with an S2 reviewer.

New for S2 (S1 adds by SP3):

```ts
store.startSync(): () => void   // starts Firestore listeners, returns unsubscribe
```

## C3. Auth API (S1 delivers by SP2)

File: `src/lib/auth.ts`

```ts
export function sendOtp(phone: string, recaptchaContainerId: string): Promise<void>;
export function confirmOtp(code: string): Promise<{ uid: string; isNewUser: boolean }>;
export function addMembership(m: Membership): Promise<void>;  // calls a Function; never writes roles directly
export function signInStaff(email: string, password: string): Promise<void>;  // requires the `admin` custom claim
export function signOut(): Promise<void>;

export class AuthError extends Error {
  code: 'invalid-phone' | 'invalid-code' | 'code-expired' | 'too-many-requests' | 'staff-account' | 'not-staff' | 'network' | 'unknown';
}
```

- Errors are **codes, not text**. S2 maps each code to an `i18n.ts` key.
- **Mock until SP2:** S2 keeps using the existing `store.verifyOtp` (demo OTP `123456`) and `store.adminLogin`.

## C4. Payments API (S1 delivers by SP5)

File: `src/lib/payments.ts`

```ts
export interface PayHereCheckout {
  sandbox: boolean;
  merchant_id: string;
  order_id: string;        // = payments/{id}
  items: string;
  amount: string;          // "35700.00" (bid price + platform fee)
  currency: 'LKR';
  hash: string;            // signed server-side
  return_url: string;
  cancel_url: string;
  notify_url: string;
  first_name: string; last_name: string; email: string; phone: string;
  address: string; city: string; country: string;
}

export interface FeeBreakdown { bidPrice: number; platformFee: number; total: number; currency: 'LKR'; }

export function createPayment(awardId: string): Promise<{ checkout: PayHereCheckout; fees: FeeBreakdown }>;
```

Escrow status shown in the UI comes from `award.escrow_status` in store state. It is set only by Functions: `pending → held → release_requested → released`, side paths `disputed → refunded | released`.

- **Mock until SP5:** S2 uses a local stub in its component tests and UI that returns a fixed `FeeBreakdown` and does not open PayHere.

## C5. NIC upload (S1 delivered in S1-08)

File: `src/lib/data/nic.ts`

```ts
export function uploadNicImage(file: File, side: 'front' | 'back'): Promise<string>;
```

- Uploads to Storage at `nic/{uid}/{side}.{ext}` (`uid` is `auth.currentUser`, not a parameter — throws if nobody's signed in) and **returns that path**, not a download URL. `storage.rules` restricts the path to the owner and admins.
- To actually display the image (e.g. an admin review screen), resolve a download URL from the returned path yourself: `getDownloadURL(ref(storage, path))` (`storage` is exported from `src/lib/firebase.ts`).
- `NicSubmissionModal` can switch to this now — closes KNOWN_ISSUES #8 once it does.

## C6. Error and status strings

S1 never adds user-facing text. Functions and libraries return **codes**; S2 owns all wording in `i18n.ts` (en / si / ta).

## C7. Escrow Functions (S1 delivered in S1-11/S1-12)

File: `src/lib/escrow.ts`

```ts
export function confirmCompletion(completionId: string, pin: string): Promise<void>;
export function openDispute(awardId: string, reason: string): Promise<{ disputeId: string }>;
export function resolveDispute(disputeId: string, resolution: 'refunded' | 'released'): Promise<void>;
export function recordPayout(awardId: string, bankTransferRef: string): Promise<{ payoutAmount: number }>;
```

These were never given a CONTRACTS letter when built (found necessary mid-S1-07/08, not in the original roadmap task list by name) — this section is that backfill, written in response to the mock-shape change requests below.

- **Errors are Firebase's own `FunctionsError`**, not a custom `AuthError`-style class: `err.code` is already a clean string with no `functions/` prefix. Per function:
  - `confirmCompletion`: `unauthenticated`, `invalid-argument` (missing fields), `not-found` (completion), `permission-denied` (not the owner, **or** wrong PIN — both read the same to the caller on purpose), `failed-precondition` (completion not `pending`), `resource-exhausted` (5 wrong attempts in the last hour).
  - `openDispute`: `unauthenticated`, `invalid-argument`, `not-found` (award), `permission-denied` (not a party to the award), `failed-precondition` (escrow not `held`/`release_requested`).
  - `resolveDispute` (admin only): `permission-denied` (not admin), `invalid-argument`, `not-found` (dispute/award), `failed-precondition` (dispute already resolved, or no paid payment to refund), `internal` (the PayHere refund call itself failed — **by design, always today**, see below).
  - `recordPayout` (admin only): `permission-denied` (not admin), `invalid-argument`, `not-found`, `failed-precondition` (escrow not `release_requested`).
- **`resolveDispute`'s `refunded` path always fails right now, on purpose** — there is no real PayHere refund API access yet (1C-4). It throws `internal` immediately; the dispute stays `open`. `released` works fully.
- **Field-name compatibility, so switching the mock → real is a one-line swap, not a UI rewrite:** `recordPayout` writes **both** `Award.fee_payment_ref`/`payout_amount` (S1's original names) **and** `Award.payout_ref`/`payout_at` (the names `PayoutsTab.tsx` already reads, from the interim mock) — same values, both sets. `openDispute`/`resolveDispute` do **not** have an equivalent: they write to a new `disputes/{id}` collection (`Dispute` type, `src/types/index.ts`), not to the existing `ExceptionIssue` type `DisputesTab.tsx` is built against. These aren't quite the same concept — `ExceptionIssue` covers non-monetary exceptions too (`WORKER_NO_SHOW`, etc.), while `disputes` is escrow-specific. Reconciling that is a joint call, not something to guess at from either side alone: either `disputes` becomes the escrow-specific subset `ExceptionIssue` delegates to, or the UI's escrow-dispute path moves onto `disputes` directly. Flagging rather than picking.
- `User.payout_bank_ref` and `Worker.bank_ref` (both already in `src/types/index.ts`): no format validation added server-side yet — `src/lib/bank.ts`'s `"<bank code> <account>"` convention is enforced client-side only today.

---

## Change requests

When one session needs something in the other's files, add a row here, in your own PR.

| Date | From | To | Request | Status |
|---|---|---|---|---|
| 2026-10-03 | S2 | S1 | `src/types/index.ts`: added optional `category` and `attributes` to `Estate`, `category` to `Worker` and `LabourJob`, optional `memberships` / `active_category` to `User`. S1-04 had made `memberships` required; it stays optional until the store migrates (pre-category mock users have none, and are coconut members). **S1: make it required in S1-07.** | **done by S1** — `memberships` is required again as of this merge; every user-construction site (seed data, mock `verifyOtp`, `src/lib/seed/construction.ts`, one test fixture) already set it, so this was a type-only change. `category`/`attributes` on `Estate` kept as-is (additive, harmless even though S1's own ADR-007 had argued against a generic `attributes` bag — not reverting your call here, just noting the tension for the record). |
| 2026-10-03 | S2 | S1 | `src/lib/store.ts`, additive only: `verifyOtp(phone, code, role?, membership?)`, `addMembership(m)` (mock of C3), category stamped by `addEstate` / `addWorker` / `createJob`, construction demo data merged into saved state. **S1-05 / S1-07 replace these** with the real auth and repositories; keep the signatures where you can so the UI keeps working. | **acknowledged, not replaced.** The mocks stay — they're what demo mode and e2e run against, and `VITE_AUTH_MODE=firebase` is the switch, not a code removal. The real paths (`src/lib/auth.ts`, `src/lib/data/*`, `store.startSync()`) exist alongside, same signatures. |
| 2026-10-03 | S2 | S1 | **S1-09 / SP5, how to switch the checkout to the real thing.** C4's types now live in `src/types/payments.ts` (`PayHereCheckout`, `FeeBreakdown`): import them in `src/lib/payments.ts` instead of redefining. The UI calls `paymentsApi` in `src/lib/paymentsApi.ts`; when `createPayment` ships, replace `mockCreatePayment` there with it and set `isMock: false` (and `startCheckout` with `livePayHereStartCheckout`). The PayHere popup code (`src/lib/payhereCheckout.ts`) is already written. The modal never sets escrow itself; it waits for `award.escrow_status` to become `held`. | **done by S1.** `payments.ts` now imports from `types/payments.ts`. `paymentsApi.ts` exports `mockPaymentsApi`/`livePaymentsApi`, selected by `usesBackend` (same gate as `authApi`) — **not** an unconditional `isMock: false`, since that would have pointed e2e and demo mode at a real backend they don't sign in to. |
| 2026-10-03 | S2 | S1 | **CI:** `npm run test:e2e` (Playwright, 13 tests, no backend needed today) is not in `.github/workflows/ci.yml` yet. Add a job: `npm ci`, `npx playwright install --with-deps chromium`, `npm run test:e2e`; upload `playwright-report/` on failure. Once the data layer moves to Firebase (S1-07/08), run it against the emulators. | **done by S1** — job added exactly as specified. Running it against the emulators instead is left open: that needs `VITE_AUTH_MODE=firebase` + `VITE_USE_EMULATORS=true` wired into the Playwright webServer command, which touches `playwright.config.ts` (your file) — your call on when. |
| 2026-10-03 | S2 | S1 | **SP2 received (thanks), wired but not enabled.** The sign-in and staff screens now call `src/lib/authApi.ts`, which uses your `auth.ts` when `VITE_AUTH_MODE=firebase` (sendOtp → confirmOtp → `addMembership`, `signInStaff`) and the demo sign-in otherwise. Every `AuthError.code` has a translated message (`authErrors.ts`; the compiler fails if you add a code without wording). **It can only be switched on once S1-07 makes the store read the signed-in user from Firestore**: today `state.currentUser` comes from the local store, so a real sign-in would not log anyone in. When you do that, the reCAPTCHA anchor (`#recaptcha-container`) is already on the sign-in page. | **S1-07 is done** — `store.startSync()` exists and reads `users/{uid}` via a real listener once signed in (see S2-08's own notes, already wired to it). Flipping `VITE_AUTH_MODE=firebase` on should be safe to try now; your call on timing/rollout. |
| 2026-10-03 | S2 | S1 | **S1-11 shapes the UI already assumes** (mock today, in `store.ts`): `openDispute({award_id, reason_code, description})` returns `{success:true, dispute}` or `{success:false, error}` with `error` one of `unauthorized \| not-found \| not-party \| not-disputable \| description-too-short` (the UI maps each to a translated message; keep these codes). A dispute needs the escrow in `held` or `release_requested`, either party can open it, and it freezes the escrow. `confirmCompletion` must also refuse a non-owner and a disputed/non-held escrow (the mock now does). New additive fields: `User.payout_bank_ref` (where an admin sends a contractor's payout) and `Worker.bank_ref` as `"<bank code> <account>"` (see `src/lib/bank.ts`). Workers' bank details are edited by their manager only (matches your rules). | **responded in CONTRACTS C7** (new section above) — the real `openDispute`/`confirmCompletion` use Firebase's own error codes, not this bespoke set; see C7 for the exact mapping and the `disputes` vs. `ExceptionIssue` question this raises. |
| 2026-10-03 | S2 | S1 | **S1-11 / S1-12: the mock now follows your state machine, and the admin UI is built on it.** Owner sign-off -> `release_requested`; admin `recordPayout(awardId, bankTransferRef)` -> `released` (errors: `unauthorized \| not-found \| not-awaiting-payout \| reference-required`; the reference needs 4+ chars); admin `adminResolveDispute({exception_id, outcome: 'refunded'\|'released', notes})` (errors: `unauthorized \| not-found \| not-open \| not-an-escrow-dispute \| notes-required`; a written reason is required). **Two deliberate differences from the spec, your call:** (1) I store the transfer reference in new `Award.payout_ref` / `payout_at` instead of overwriting `fee_payment_ref` (that is the PayHere reference; overwriting it loses information); (2) a dispute decision is recorded on the `ExceptionIssue` (`outcome`, `resolution`, `resolved_by`) as the UI shows it; map to your `disputes/{id}` fields. The payout queue needs the payee's account, so contractors/brokers set `User.payout_bank_ref` on their profile; the admin sees it unmasked. | **(1) done by S1:** `recordPayout` now writes `payout_ref`/`payout_at` alongside `fee_payment_ref`/`payout_amount` — `PayoutsTab.tsx` needs no change to work against the real Function. **(2) open, responded in C7:** `disputes`/`ExceptionIssue` aren't quite the same model (exceptions cover more than money); needs a joint decision, not a unilateral field-rename either way. |
| 2026-10-03 | S2 | S1 | **SP3 received (thanks); wired, with two requests.** `App.tsx` now calls `store.startSync()` instead of its own Firestore listeners, and shows `state.syncError` in a dismissible banner. Both only run when real auth is on (`authApi.usesBackend`, i.e. `VITE_AUTH_MODE=firebase`), because the rules need a signed-in user. **(1)** In demo mode your `createEstateRemote` / `createJobRemote` / `createBidRemote` calls still fire (and fail, and set `syncError`) on every post; please skip them when there is no signed-in Firebase user (or export a flag from `firebase.ts` I can reuse), so the demo and the e2e suite do not send writes to the real project. **(2)** I resolved the merge conflict on `category`: your hardcoded `'coconut'` is now only the fallback (`data.category ?? 'coconut'`, `estate.category ?? 'coconut'`); the category-aware forms pass the real one. | **(1) done by S1:** every repository write in `store.ts` now goes through a `fireRemoteWrite()` helper that checks `auth.currentUser` first and silently skips otherwise — no more spurious `syncError`s or writes in demo mode/e2e. **(2) acknowledged**, kept as merged. |
| 2026-10-03 | S2 | S1 | `src/lib/seed/construction.ts` holds the construction demo data (4 users, 2 sites, 5 workers, 3 jobs, bids, 1 funded award). **S1-06: port it into the emulator seed script** (the demo phones are in the file header). | **not ported, different layers:** `scripts/seed.ts` seeds the Firestore **emulator** for backend/integration tests (`npm run test:integration`), already has its own construction demo data (different uids/phones). `src/lib/seed/construction.ts` seeds the **in-browser mock store** for demo mode/e2e, which never touches Firestore. The two don't need to match — they're read by disjoint test layers — so treating this as resolved rather than merging them, unless e2e is later pointed at the real emulators (see the CI row above), at which point they'd need to agree. |
