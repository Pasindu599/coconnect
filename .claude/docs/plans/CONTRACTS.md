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

## C5. NIC upload (S1 adds in S1-08)

S1 replaces this section with the exact signature in the S1-08 PR. Planned shape:

```ts
uploadNicImage(file: File, side: 'front' | 'back'): Promise<string>  // returns a Storage path
```

Until then, `NicSubmissionModal` keeps its current behaviour.

## C6. Error and status strings

S1 never adds user-facing text. Functions and libraries return **codes**; S2 owns all wording in `i18n.ts` (en / si / ta).

---

## Change requests

When one session needs something in the other's files, add a row here, in your own PR.

| Date | From | To | Request | Status |
|---|---|---|---|---|
| 2026-10-03 | S2 | S1 | `src/types/index.ts`: added optional `category` and `attributes` to `Estate`, `category` to `Worker` and `LabourJob`, optional `memberships` / `active_category` to `User`. S1-04 had made `memberships` required; it stays optional until the store migrates (pre-category mock users have none, and are coconut members). **S1: make it required in S1-07.** | done by S2 (additive) |
| 2026-10-03 | S2 | S1 | `src/lib/store.ts`, additive only: `verifyOtp(phone, code, role?, membership?)`, `addMembership(m)` (mock of C3), category stamped by `addEstate` / `addWorker` / `createJob`, construction demo data merged into saved state. **S1-05 / S1-07 replace these** with the real auth and repositories; keep the signatures where you can so the UI keeps working. | done by S2 (additive, interim) |
| 2026-10-03 | S2 | S1 | **S1-09 / SP5, how to switch the checkout to the real thing.** C4's types now live in `src/types/payments.ts` (`PayHereCheckout`, `FeeBreakdown`): import them in `src/lib/payments.ts` instead of redefining. The UI calls `paymentsApi` in `src/lib/paymentsApi.ts`; when `createPayment` ships, replace `mockCreatePayment` there with it and set `isMock: false` (and `startCheckout` with `livePayHereStartCheckout`). The PayHere popup code (`src/lib/payhereCheckout.ts`) is already written. The modal never sets escrow itself; it waits for `award.escrow_status` to become `held`. | open |
| 2026-10-03 | S2 | S1 | **CI:** `npm run test:e2e` (Playwright, 13 tests, no backend needed today) is not in `.github/workflows/ci.yml` yet. Add a job: `npm ci`, `npx playwright install --with-deps chromium`, `npm run test:e2e`; upload `playwright-report/` on failure. Once the data layer moves to Firebase (S1-07/08), run it against the emulators. | open |
| 2026-10-03 | S2 | S1 | `src/lib/seed/construction.ts` holds the construction demo data (4 users, 2 sites, 5 workers, 3 jobs, bids, 1 funded award). **S1-06: port it into the emulator seed script** (the demo phones are in the file header). | open |
