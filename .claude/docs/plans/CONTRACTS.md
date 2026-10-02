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

---

## Change requests

When one session needs something in the other's files, add a row here, in your own PR.

| Date | From | To | Request | Status |
|---|---|---|---|---|
| | | | | |
