# Spec: data model

Status: draft, for team review (S1-02). Builds on [ARCHITECTURE.md](../ARCHITECTURE.md) and the frozen [CONTRACTS.md](../plans/CONTRACTS.md) C1/C2. This is the source of truth for `firestore.rules` (S1-04) and the `src/lib/data/*` repositories (S1-07, S1-08).

## Conventions

- All documents carry `category: CategoryId` (`'coconut' | 'construction'`) except `users` and top-level `audit_logs`, so rules and queries can scope by category. In the actual TS types (`Estate`, `LabourJob`, `Bid`, `Worker`, `Award`), `category` is typed optional (`category?: CategoryId`) since it's a field added onto pre-existing interfaces (ADR-007) — but every write path sets it (hardcoded to `'coconut'` in `store.ts`'s `addEstate`/`createJob`/`submitBid` until a category-aware posting UI exists), and every rule that checks capability (`isPoster`/`isBidder`) depends on it actually being present on the document.
- Timestamps are Firestore `Timestamp`, not strings (the current prototype uses ISO strings in `localStorage`; the migration in S1-07/08 converts on read for existing UI code, see C2).
- IDs are Firestore auto-IDs. No document ever stores another collection's data inline except small denormalized display fields already present in the current types (`owner_name`, `estate_name`, ...) — kept for now to avoid a UI rewrite; may be dropped later.
- Every collection below lists: fields, who **writes**, who **reads**. "Functions only" means the client has no `create`/`update`/`delete` rule at all — only a Cloud Function using the Admin SDK (which bypasses rules) can write it.

## Collections

### `users/{uid}`
Replaces the current `User` (`src/types/index.ts`). Adds the multi-category fields from CONTRACTS C1.

| Field | Type | Notes |
|---|---|---|
| `phone` | string | E.164. Set at Firebase Auth sign-up, immutable by the client. |
| `name` | string | |
| `memberships` | `Membership[]` | `{category, role}`. **Written only by the `addMembership` Function** — never directly by the client (CONTRACTS C3). |
| `active_category` | `CategoryId` | Which category's UI the user is currently in. Client may write (it's a UI preference, not an authorization grant). |
| `active_role` | `CategoryRoleId` | Must be one of `memberships[].role` for `active_category`; a Function validates this on `addMembership`, the client may switch between roles it already holds. |
| `nic_status`, `nic_number`, `nic_submitted_at`, `nic_rejection_reason` | as today | `nic_status` moves `pending → verified|rejected` only via admin review (Function or admin-claim write — see auth spec). |
| `preferred_language` | `'en' \| 'si' \| 'ta'` | |
| `trust_score` | number | **Functions only** once trust scoring is server-side (post-MVP per ROADMAP "Later"); until then it's seed data, client cannot write it even so — see rules below. |
| `created_at` | Timestamp | |

NIC image URLs (`nic_front_url`, `nic_back_url`) move out of `users` into `nic_submissions` (unchanged shape) once S1-08 lands Storage uploads, to keep the user doc small and avoid re-exposing Storage paths to every reader of a profile.

**Rules (implemented in S1-04, superseding the first draft of this paragraph):** a user may `read, update` only `users/{request.auth.uid}`; admins may also `read` any user doc. Update rejects any change to `memberships`, `trust_score` or `nic_status`. No client `delete`. Reads are all-or-nothing at the document level (no field-level split) — since the doc carries NIC numbers and phone, this spec originally proposed letting any authenticated user read any profile, but S1-04 tightened it to self+admin only instead, since nothing in the UI actually needs to read a *stranger's* full profile (jobs/bids already denormalize `owner_name`/`bidder_name` for display). See ADR-006.

### `estates/{id}`
**Correction (S1-07, see ADR-007):** this spec originally proposed generalizing `Estate` into a renamed `sites` collection with a free-form `attributes` bag. That never shipped — `Estate` (and `LabourJob.estate_id`/`estate_name`/`estate_location`) is read by ~100 call sites across `src/components/**` (Session 2's files, not S1's to edit), so S1-04's rules and S1-07's repositories keep the **existing collection name (`estates`) and field names** for every category, not just coconut. `siteLabel` per category (Estate / Site) stays purely a display string in `src/config/categories.ts` — the schema underneath is unchanged. Construction estates reuse `Estate`'s `area_acres`/`tree_count` fields as rough placeholders (documented in `scripts/seed.ts`) until Session 2 requests a proper per-category site-fields schema through CONTRACTS.md.

| Field | Type | Notes |
|---|---|---|
| `category` | `CategoryId` | |
| `owner_id` | string (uid) | |
| `name`, `location`, `lat`, `lng`, `notes`, `area_acres`, `tree_count` | as today (`Estate` in `src/types/index.ts`) | |
| `created_at` | Timestamp | |

**Rules:** `create` if `request.auth.uid == request.resource.data.owner_id` and the user's `memberships` include a `poster` capability role for `category`. `update, delete` only by `owner_id`. `read`: any authenticated user (jobs reference estates by name/location so bidders need to read them; no PII in an estate doc).

### `jobs/{id}`
Generalizes `LabourJob`.

| Field | Type | Notes |
|---|---|---|
| `category` | `CategoryId` | |
| `owner_id`, `owner_name`, `estate_id`, `estate_name`, `estate_location` | as today (`LabourJob`) — **not** renamed, see the `estates` section above and ADR-007 | |
| `task_type` | string | from `categories.ts` `taskTypes` |
| `starts_at`, `ends_at` | Timestamp | |
| `worker_count`, `duration_days` | number | |
| `required_skills` | string[] | |
| `wage_budget` | number | poster's stated budget; **not** the escrow amount (that's on `awards`, includes platform fee) |
| `status` | `JobStatus` | see below |
| `created_at` | Timestamp | |

`JobStatus` keeps the existing enum (`DRAFT ... CLOSED_DISPUTED`). The only change: transitions from `AWARDED_PENDING_FEE → ACTIVE` and anything after `ACTIVE` driven by money events happen **only** via Cloud Functions (today `store.ts` does this client-side — KNOWN_ISSUES #6, #10).

**Rules:** `create, update` by `owner_id` while `status` is `DRAFT` or `OPEN` only (a poster can edit/cancel an open job, not one already awarded). Status changes from `AWARDED_PENDING_FEE` onward: deny client writes to the `status` field specifically — enforced with a rules helper that diffs `request.resource.data.status` against `resource.data.status` and only allows the subset `{DRAFT→OPEN, OPEN→DRAFT, OPEN→CANCELLED, DRAFT→CANCELLED}` for the owner; every other transition is Functions-only. `read`: any authenticated user (job board is public within the app).

### `bids/{id}`
| Field | Type | Notes |
|---|---|---|
| `category`, `job_id` | | |
| `supervisor_id`, `supervisor_name`, `supervisor_phone`, `supervisor_trust_score` | | `Bid`'s existing field names, kept as-is for every category (not renamed to `bidder_*` — ADR-007) |
| `price`, `supervisor_fee`, `payment_schedule` | | |
| `status` | `'pending' \| 'accepted' \| 'rejected'` | |
| `submitted_at` | Timestamp | |
| `crew_member_ids` | string[] | references `workers` |

**Rules:** `create` by `supervisor_id == auth.uid` if the user holds a `bidder` capability role for `category`, and only while the referenced `jobs/{job_id}.status == 'OPEN'`. `update` (price, crew before acceptance) by `supervisor_id` while `status == 'pending'`. The job's `owner_id` may update **only** `status` (`pending → accepted|rejected`), and only through the `awardBid` path — see below: accepting a bid is a multi-document write (bid → accepted, other bids on the job → rejected, job → `AWARDED_PENDING_FEE`, `awards/{new}` created) that must be atomic. We do this as a **Function-wrapped transaction** (`awardBid` callable) rather than three separate client writes, both for atomicity and so `awards` (Functions-only, see below) can be created in the same transaction. Rules still allow the plain bid/job field updates (for cases the Function doesn't cover, e.g. a poster rejecting a single bid without awarding), but `awards` creation is never a direct client write. `read`: the job's owner and the bid's own `supervisor_id`; other bidders don't see each other's prices (sealed-bid).

### `workers/{id}`
| Field | Type | Notes |
|---|---|---|
| `category` | | |
| `supervisor_id` | string (uid) | the broker/contractor/subcontractor who registered this worker — `Worker`'s existing field name, kept for every category (ADR-007) |
| `name`, `phone`, `skills`, `nic_ref`, `bank_ref` | | |
| `consent_captured_at`, `consent_method` | | KNOWN_ISSUES #16 — UI for this lands in week 2 day 8; schema exists now |
| `rating`, `jobs_completed`, `active` | | `rating`/`jobs_completed` **Functions only** (derived from completions/ratings) |

**Rules:** `create, update` (name/phone/skills/consent/active) by `supervisor_id == auth.uid` with a `crew`-registering (bidder) capability for `category`. `rating`/`jobs_completed` fields rejected on client writes. `read`: `supervisor_id` and, for workers in `crew_member_ids` of a bid on their job, the job's `owner_id` (so an owner can see who's assigned) — implemented as "any authenticated user may read `workers`" for the MVP (same sealed-bid caveat doesn't apply to workers — their info isn't competitively sensitive) unless the team decides otherwise in rules review.

### `awards/{id}` — Functions only
| Field | Type |
|---|---|
| `category`, `job_id`, `bid_id` | |
| `supervisor_id`, `supervisor_name`, `awarded_at` | |
| `escrow_status` | `EscrowStatus` (`pending \| held \| release_requested \| released \| disputed \| refunded`) |
| `escrow_amount` | number — bid price + platform fee, i.e. the total charged (CONTRACTS C4 `FeeBreakdown.total`) |
| `payment_id` | reference to `payments/{id}` once created |
| `contacts_released_at` | Timestamp, set when `escrow_status` first reaches `held` |
| `fee_payment_ref` | string |

**Rules:** no client `create/update/delete`. `read`: the job's `owner_id` and the award's `supervisor_id`.

### `payments/{id}` — Functions only
| Field | Type |
|---|---|
| `category`, `award_id`, `job_id` | |
| `owner_id`, `supervisor_id` | denormalized from the award at creation time (ADR-008/009 — a `list`/`onSnapshot` query needs a plain field check, a cross-document `get()` on `award_id` can't satisfy Firestore's list-safety check) |
| `amount`, `platform_fee`, `currency` | |
| `provider` | `'payhere'` (kept as a string, not hardcoded logic, so `PaymentProvider` can be swapped per ADR-002) |
| `provider_order_id` | = the document ID, per CONTRACTS C4 `order_id: "payments/{id}"` |
| `provider_ref` | PayHere's `payment_id` from the notify payload |
| `status` | `'pending' \| 'paid' \| 'failed' \| 'cancelled' \| 'refunded'` |
| `created_at`, `paid_at` | |

**Rules:** no client writes at all. `read`: `owner_id`/`supervisor_id` equal the caller, or admin.

### `ledger/{id}` — Functions only, append-only
| Field | Type |
|---|---|
| `category`, `award_id`, `payment_id` | |
| `owner_id`, `supervisor_id` | denormalized, same reason as `payments` above |
| `type` | `'charge' \| 'hold' \| 'release' \| 'refund' \| 'fee'` |
| `amount` | number (always positive; `type` gives direction) |
| `currency` | `'LKR'` |
| `created_at` | |
| `created_by` | `'system'` or an admin uid, for `recordPayout` entries |

No `update`/`delete` rule exists for anyone, including Functions logically (the Admin SDK *can* bypass rules, but no Function in this spec ever calls `update`/`delete` on `ledger` — only `create`). **Reconciliation invariant** (checked by S1-12's helper and worth a rules-adjacent unit test): for a given `award_id`, `sum(hold) == sum(release) + sum(refund) + current held balance`.

### `attendance_days/{id}`, `attendance_entries/{id}`
Unchanged shape from today's `AttendanceDay`/`AttendanceEntry`, plus `category`, **plus denormalized `owner_id` and `supervisor_id`** (see ADR-006 — Firestore rules can't run a query to find "the award for this job", only `get()` a known document path, so the job's two parties are copied onto these docs the same way `jobs.owner_name` is already denormalized; named `supervisor_id` rather than a new `bidder_id` term, per ADR-007). **Rules:** `create` by either party (`owner_id` or `supervisor_id`) recording their own side (`party` field must equal the caller's role); no cross-party edits, no edits to a `reconciled` day, no deletes.

### `completions/{id}`
Unchanged shape plus `category`, plus denormalized `owner_id`/`supervisor_id` (same reason as attendance). **Rules:** `create` by the bidder (`submitted_by` / `supervisor_id`), starting `status: 'pending'`. No client `update` at all — confirmation happens through `confirmCompletion`, a Function, because it checks the hashed PIN (see payments spec). This closes the client-side "releases money" hole in KNOWN_ISSUES #6.

### `ratings/{id}`
Unchanged shape (`RatingSubmission`) plus `category`. **Rules:** `create` by `from_user_id == auth.uid`, once per `(job_id, from_user_id)` pair (checked via a rules `exists()` query or a Function — a rule-only unique check is awkward in Firestore, so this is enforced best-effort in rules with a documented gap: a Function-based `submitRating` is a candidate for week-2 hardening if abuse shows up). No `update`/`delete` (ratings are immutable once submitted).

### `disputes/{id}`
| Field | Type |
|---|---|
| `category`, `job_id`, `award_id` | |
| `owner_id`, `supervisor_id` | denormalized, same reason as attendance/completions above |
| `opened_by` (uid), `reason`, `opened_at` | |
| `status` | `'open' \| 'resolved'` |
| `resolution` | `'refunded' \| 'released'`, set by `resolveDispute` |
| `resolved_by` (admin uid), `resolved_at` | |

**Rules:** `create` by either party to the award (`owner_id` or `supervisor_id`) — this is what freezes the escrow (the Function reads for an open dispute before allowing `recordPayout`). `status`/`resolution`/`resolved_by` fields: Functions only (admin-triggered `resolveDispute`).

### `nic_submissions/{id}`
Unchanged shape, but `front_image_url`/`back_image_url` become Storage **paths** (`nic/{uid}/front.jpg`), not data URLs (closes KNOWN_ISSUES #8). **Rules:** `create` by `user_id == auth.uid`. `read`: `user_id` and admins. `status`/review fields: admin-claim only.

### `audit_logs/{id}` — Functions only
Unchanged shape (`AuditLogEntry`). Every money-moving Function appends one entry in the same transaction as its main write. **Rules:** no client read or write. (Admins view these through a Function-backed admin query, not direct Firestore reads, since there's no per-category/per-user scoping that would make a client rule practical — see KNOWN_ISSUES follow-up if the team wants direct admin read access later.)

## Role → collection write matrix

| Collection | poster (owner/client) | bidder (broker/contractor/subcontractor) | crew (worker) | admin | Functions |
|---|---|---|---|---|---|
| `users` (own doc, non-protected fields) | ✓ | ✓ | ✓ | ✓ | `memberships`, `nic_status`, `trust_score` |
| `estates` | ✓ (own) | — | — | — | — |
| `jobs` | ✓ (own, limited transitions) | — | — | — | status transitions post-award |
| `bids` | accept/reject only | ✓ (own) | — | — | award transaction |
| `workers` | — | ✓ (own crew) | — | — | rating/jobs_completed |
| `awards` | — | — | — | — | ✓ only |
| `payments` | — | — | — | — | ✓ only |
| `ledger` | — | — | — | — | ✓ only |
| `attendance_*` | ✓ (own side) | ✓ (own side) | — | — | — |
| `completions` | — | ✓ (submit) | — | — | status/confirm |
| `ratings` | ✓ (create) | ✓ (create) | — | — | — |
| `disputes` | ✓ (open) | ✓ (open) | — | resolve | — |
| `nic_submissions` | ✓ (own) | ✓ (own) | ✓ (own) | review | — |
| `audit_logs` | — | — | — | — | ✓ only |

"Worker" here is the crew-capability *user account* (if/when workers get their own logins — today crew members are records owned by their manager, not necessarily Firebase users themselves; this matrix reserves the column for when that changes).

## Open questions for review
1. Should `ratings` get a Function-enforced one-per-job uniqueness now, or is the best-effort rule acceptable for the MVP? (leaning: rule now, Function later if abused)
2. `workers` read access ("any authenticated user") — confirm this is acceptable, or scope it to the job's participants only.
3. Do we need a `jobs` composite index for `(category, status)` list queries now, or add it reactively from the emulator's "missing index" errors during S1-07?
