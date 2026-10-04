# Spec: payments & escrow

> **2026-10-04 — backend moved to Supabase (ADR-014).** This spec was written for Firebase. Its rules still hold (who may do what, the state machine, error codes, the fee model), but the mechanics are now: `createPayment` = the `create-payment` Edge Function + `create_payment_intent()`; `payhereNotify` = the `payhere-notify` Edge Function + `payhere_apply_notify()`; confirm/dispute/payout are SQL functions; the fee config is the `platform_config` table. Where this file and `supabase/migrations/*` disagree, the migrations win.

Status: draft, for team review (S1-02). Implements CONTRACTS C4, ADR-002, and the escrow state machine in [ARCHITECTURE.md](../ARCHITECTURE.md). Implementation spans S1-09 through S1-12.

**Open dependency:** 1C-4 (a human contacting PayHere for sandbox credentials and confirming marketplace/escrow holding is permitted) is not done yet as of this writing. Everything below is buildable and testable against mocked PayHere responses on the emulator; the hash format is written from PayHere's public docs and must be re-verified against the actual sandbox once credentials exist, per the task note in SESSION_1_BACKEND.md S1-09.

## Fee model
Total charged to the poster = `bidPrice + platformFee`. `platformFee` is computed server-side only, from a config value (not sent by the client), so a compromised or buggy client can't understate the fee.

**Decision needed:** the fee percentage itself. Proposed default **5% of `bidPrice`, flat** (no tiers) for the MVP, configured as a single Functions config value (`functions.config().platform.fee_percent` or a Firestore `config/platform` doc read at cold start and cached — prefer the Firestore doc so it's adjustable without a redeploy, protected by rules as Functions-only like `awards`). Record whichever is chosen in `DECISIONS.md` before S1-09 ships, since `FeeBreakdown` is a frozen contract shape (C4) — only the *value* is open, not the field names.

```
FeeBreakdown {
  bidPrice: number       // award.escrow_amount basis — the bidder's accepted price
  platformFee: number    // round to the nearest LKR 1.00 (PayHere amounts are 2-decimal strings; round before formatting, don't truncate, to avoid a 1-cent reconciliation drift)
  total: number          // bidPrice + platformFee
  currency: 'LKR'
}
```

## createPayment (delivers SP5)

```
createPayment(awardId) → { checkout: PayHereCheckout, fees: FeeBreakdown }
```

Server-side (`functions/src/payments/createPayment.ts`), a callable Function:
1. Load `awards/{awardId}`. 404 → error.
2. Authorize: `auth.uid` must equal the job's `owner_id` (resolve via the award's `job_id`) — **only the poster who owns the job can create a payment for it**. Anyone else → `permission-denied`.
3. Check no existing **paid** payment exists for this award (`payments` where `award_id == awardId and status == 'paid'`) — **cannot pay twice for one award**. If a `pending` payment exists and is recent, it's fine to return the same checkout again (idempotent retry after e.g. a closed PayHere popup); if it's stale (details TBD — propose 30 minutes), create a fresh one so the order_id/hash don't go stale against PayHere's side.
4. Compute `FeeBreakdown` from `award.escrow_amount`'s basis (the bid price) and the fee config.
5. Create `payments/{id}` with `status: 'pending'`.
6. Build the `PayHereCheckout` object (CONTRACTS C4 shape exactly):
   - `order_id = "payments/{id}"` (the full path-like string, per CONTRACTS C4's comment) — **must exactly match** what `payhereNotify` will look up, so pick one canonical form now (recommend just the bare `{id}` as `order_id`, and treat the CONTRACTS comment as documentation of *what it maps to*, not the literal string — confirm this reading with S2 since they don't construct this value, only display/pass it through, so it's a backend-only decision. Flag this in the PR if the literal contract text is meant otherwise.)
   - `amount` formatted `"35700.00"` — PayHere requires exactly 2 decimals, no thousands separator.
   - `hash`: see below.
7. Return `{ checkout, fees }`.

### Hash
Per PayHere's checkout integration docs (re-verify exact casing/algorithm against their current docs when sandbox access exists — this is written from the documented v1 checkout flow):

```
hash = MD5(
  merchant_id +
  order_id +
  amount +
  currency +
  MD5(merchant_secret).toUpperCase()
).toUpperCase()
```

`merchant_secret` is a Functions secret (`firebase functions:secrets:set PAYHERE_MERCHANT_SECRET`), **never** read from a `VITE_*` env var or committed anywhere (ADR-005). `merchant_id` is not secret (it's sent to the browser as part of the checkout form either way) but is still sourced from Functions config/secrets rather than hardcoded, so sandbox vs. live can be swapped without a code change.

### Tests (S1-09 "done when")
- Fee calculation: known inputs → known `FeeBreakdown`, including a rounding edge case (e.g. a bid price that produces a fractional fee).
- Hash: a fixed merchant_id/order_id/amount/currency/secret fixture → a known expected hash (compute it once by hand/script against PayHere's documented algorithm and pin it as the test fixture, so a future accidental change to the hash logic is caught even before real sandbox credentials exist).
- Authorization: a non-owner uid calling `createPayment` is rejected.
- Double-pay: calling `createPayment` again after a `paid` payment exists for the award is rejected (or returns the existing paid record's info without creating a second charge — pick one behavior and test it; recommend rejecting with a clear `already-paid` error code, since a UI retry after success should never reach this Function in the first place).

## payhereNotify webhook (delivers SP6)

`functions/src/payments/payhereNotify.ts` — an HTTPS Function (not callable; PayHere POSTs to it directly, unauthenticated except for the signature it includes).

### Verification (reject, do nothing, respond 200 anyway — see note)
1. Recompute the expected `md5sig` the same way as the checkout hash but using PayHere's documented *notify* formula (includes `status_code` — re-verify exact field order against current docs): reject if it doesn't match the payload's `md5sig`.
2. `merchant_id` in the payload matches ours.
3. Look up `payments/{order_id}`. 404 → log and reject (unknown order — could be a stale/forged notify).
4. `amount` in the payload matches `payments/{id}.amount` (string-compare after normalizing to 2 decimals, not a float `==`) and `currency` matches. Mismatch → reject **and** flag for manual review (write an `audit_logs` entry even on rejection, since an amount mismatch on an otherwise-valid signature is suspicious, not just a bug).
5. **Idempotency:** if `payments/{id}.status` is already `paid`, return success immediately without redoing the transaction (a repeated notify for the same order changes nothing — PayHere does retry notifies).
6. `status_code` per PayHere's convention: `2` = success, `0` = pending, `-1` = cancelled, `-2` = failed, `-3` = chargedback. Only `2` proceeds to the success transaction below; `0`/-codes update `payments/{id}.status` to `'pending'`/`'failed'`/`'cancelled'` respectively (no escrow/ledger effect) with their own idempotency check.

**Response note:** PayHere expects a `200` response to stop retrying; always return `200` once the payload is parsed and *acknowledged* (including the reject cases above, after logging), so a bad/forged request doesn't cause PayHere to hammer the endpoint with retries. Validation failures are logged server-side, not surfaced as HTTP errors to the caller.

### Success transaction (status_code 2, not already paid)
All in **one Firestore transaction**:
1. `payments/{id}.status = 'paid'`, `paid_at = now`, `provider_ref = payload.payment_id`.
2. `awards/{award_id}.escrow_status = 'held'`, `contacts_released_at = now`.
3. `jobs/{job_id}.status = 'ACTIVE'`.
4. `ledger` entry: `{type: 'hold', amount: payment.amount, award_id, payment_id}`.
5. `audit_logs` entry: `{action: 'payment_held', subject_type: 'award', subject_id: award_id, ...}`.
6. "Contacts released" (KNOWN_ISSUES #6's gate) is now just: the client reads `award.escrow_status == 'held'` and *then* is allowed (by rules, or by a small `getAwardContacts`-equivalent callable that returns phone numbers only once held — prefer a callable over exposing phone numbers via Firestore rules, since rules can't easily redact a single field conditionally) to see the other party's phone number. Decide callable-vs-rules in S1-11/S2 handoff; note the choice in `DECISIONS.md`.

### Tests (S1-10 "done when")
- Valid notify → all 5 writes happen, exactly once.
- Bad signature → no writes, payment stays `pending`.
- Amount mismatch → no writes, audit log entry created, payment stays `pending`.
- Duplicate notify (same order, status_code 2, called twice) → second call is a no-op (no duplicate ledger entry — this is the one most worth a dedicated test, since a duplicated `hold` entry would break the reconciliation invariant in the data-model spec).
- Unknown order_id → rejected, no writes, no crash.
- `status_code` -1/-2/-3 → `payments.status` updates, no escrow/ledger/job effect.

## Completion, dispute, refund (S1-11)

### confirmCompletion
Callable. Input includes a PIN. Server hashes the submitted PIN (same hash function used when the PIN was set — bcrypt or equivalent; never plaintext compare, closing KNOWN_ISSUES #3's completion-side issue) and compares to the stored hash on the job/award (field TBD — likely `awards/{id}.completion_pin_hash` or a dedicated field on `completions`; decide during implementation and document here via a follow-up edit). On match: `completions/{id}.status = 'confirmed'`, `awards/{id}.escrow_status = 'release_requested'`. On mismatch: generic failure, no state change, and the attempt is rate-limited (reuse the OTP-style rate limit pattern; exact limits TBD — propose 5 attempts per completion per hour).

### openDispute
Callable, either party to the award. Requires `awards/{id}.escrow_status` to be `held` or `release_requested` (can't dispute money that's already `released`/`refunded`, and can't dispute before it's even `held`). Sets `escrow_status = 'disputed'` and creates the `disputes/{id}` doc. **A dispute freezes the escrow:** `recordPayout` (S1-12) and any future automatic transition must check `escrow_status !== 'disputed'` before proceeding — this is enforced by the state machine (disputed is a dead-end state except via `resolveDispute`), not by an extra flag.

### resolveDispute
Callable, admin-claim only. Input: `disputeId`, `resolution: 'refunded' | 'released'`.
- `refunded`: calls PayHere's refund API (full or partial — MVP: full refund only, partial is a "Later" item) with the original `provider_ref`. On success: `payments.status = 'refunded'`, `awards.escrow_status = 'refunded'`, `ledger` entry `{type: 'refund', ...}`, `audit_logs` entry. On PayHere API failure: dispute stays `open`, error surfaced to the admin caller (not silently retried — a failed refund needs human eyes).
- `released`: same as a normal `recordPayout` effectively, but originating from a dispute resolution rather than a clean completion — `awards.escrow_status = 'released'`, ledger `release` entry, `audit_logs`. `disputes/{id}.status = 'resolved'`, `resolution`, `resolved_by`, `resolved_at` either way.

### Tests (S1-11 "done when")
- Every listed state transition (`held→release_requested`, `held→disputed`, `release_requested→disputed`, `disputed→refunded`, `disputed→released`) succeeds under the right caller/preconditions.
- Every illegal transition is rejected: wrong PIN, disputing an already-`released` award, non-admin calling `resolveDispute`, double-confirming completion.
- Rules tests (in `tests/rules/`, not Functions unit tests): a client write attempt to `payments` or `ledger` of any kind is denied, for every role including admin (admins act through Functions too, never direct writes — keeps the audit trail complete).

## Admin payouts & reconciliation (S1-12)

`recordPayout` (callable, admin-claim only): input `awardId`, `bankTransferRef`. Precondition: `escrow_status == 'release_requested'`. Effect: `escrow_status = 'released'`, `ledger` entry `{type: 'release', amount: award.escrow_amount - platformFee or the net payout amount — confirm which figure: likely the bidder's payout, i.e. bidPrice, since platformFee was never owed to the bidder}`, `fee_payment_ref = bankTransferRef`, `audit_logs` entry.

**Reconciliation query** (`src/lib/data/` helper, read-only, admin UI calls it): for each award, `sum(ledger where type in [hold]) == sum(ledger where type in [release, refund]) + (escrow_amount if status in [held, release_requested] else 0)`. A mismatch means a bug, not a user-facing error — surface it on an admin reconciliation dashboard (post-MVP UI; the query/helper itself is in scope for S1-12).

## Failure cases summary (for the "done when" checklists above)
| Case | Where handled | Behavior |
|---|---|---|
| Duplicate webhook notify | `payhereNotify` | No-op after first success |
| Amount mismatch | `payhereNotify` | Reject, audit log, payment stays pending |
| Double payment attempt for one award | `createPayment` | Rejected (`already-paid`) |
| Refund after release | `resolveDispute` | Not reachable — `disputed` can only be entered from `held`/`release_requested`, and `released` is a dead end for disputes by construction. If a real-world chargeback arrives after release (PayHere `status_code` for chargebacks on an already-settled payment), that's an out-of-band admin process in the MVP, not an automated state transition — log it, don't silently move money. |
| Wrong completion PIN | `confirmCompletion` | Rejected, rate-limited, no state change |
| Non-owner creates payment | `createPayment` | `permission-denied` |
| Client writes `payments`/`ledger`/`awards` directly | Firestore rules | Denied for every role |
