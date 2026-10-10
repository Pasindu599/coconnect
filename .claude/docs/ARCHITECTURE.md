# Architecture

## Frontend as built (2026-10-03)

```
App.tsx (hash router + CategoryProvider)
 ├─ config/categories.ts      registry: roles/capabilities, tasks, skills, tags, site fields, vocab
 ├─ components/*              screens read the registry; money screens read config/escrow.ts
 ├─ lib/authApi.ts            demo sign-in | real Supabase auth (VITE_AUTH_MODE=supabase)
 ├─ lib/paymentsApi.ts        sandbox stand-in | real createPayment + PayHere popup (S1-09)
 └─ lib/store.ts              demo data + business logic (mock of the server) + Supabase Realtime sync
```
The escrow state machine in the UI and the mock store matches the diagram below: owner sign-off -> `release_requested`, admin `recordPayout` -> `released`, a dispute freezes the escrow and an admin refunds or releases. Details and the swap points for Session 1 are in `plans/CONTRACTS.md`.

## Prototype it started from (as of 2026-10-02)

```
Browser (React SPA)
 ├─ App.tsx: activeView string → which component renders (no router)
 ├─ lib/store.ts: StoreService singleton
 │    ├─ seed data (users, estates, jobs, bids, awards, ...)
 │    ├─ ALL business logic (OTP, awarding, escrow, attendance, completion, ratings)
 │    └─ persists the whole state to localStorage on every change
 └─ lib/firebase.ts: Firestore listeners for estates/jobs/nic_submissions (add-only merge into the store),
                    Google sign-in for the Drive backup feature
```

Everything is mocked: OTP, PINs, admin login, payment, payouts. There is no server-side code. See `KNOWN_ISSUES.md`.

## Backend (Supabase, ADR-014)

```
Browser (React SPA)
 ├─ hash router: #/ → #/:category → #/:category/dashboard, #/admin
 ├─ CategoryContext ← src/config/categories.ts (roles, tasks, skills, fields)
 ├─ src/lib/supabase.ts: the client, callRpc/invokeFunction, BackendError
 ├─ src/lib/data/*: table modules over Realtime (first load + live changes; permitted writes)
 └─ PayHere JS checkout (params come from the create-payment Edge Function)

Supabase
 ├─ Auth: phone OTP, staff email/password, Google (Drive page); new user → public.users row (trigger)
 ├─ Postgres + RLS (supabase/migrations/*_rls.sql): ownership/role checks read users.memberships / is_admin
 ├─ SQL functions, security definer (supabase/migrations/*_functions.sql):
 │    add_membership, set_admin, set_completion_pin, award_bid,
 │    confirm_completion, open_dispute, resolve_dispute, record_payout,
 │    create_payment_intent, payhere_apply_notify (service role), reconcile_awards (admin)
 ├─ Edge Functions (supabase/functions/): create-payment (signs the PayHere checkout), payhere-notify (webhook)
 ├─ Storage: private bucket `nic`, {uid}/*, owner + admin read only
 └─ Realtime: postgres_changes on the synced tables, filtered by RLS
Vercel: hosts the static build
```

### Category registry
```ts
type CategoryId = 'coconut' | 'construction';
type Capability = 'poster' | 'bidder' | 'crew';

interface CategoryRole {
  id: string;                 // 'owner' | 'agent' | 'client' | 'contractor' | 'worker'
  label: { en: string; si: string; ta: string };
  capability: Capability;
  canRegisterWorkers: boolean;
}

interface CategoryConfig {
  id: CategoryId;
  label: { en: string; si: string; ta: string };
  icon: string;
  siteLabel: { en: string; si: string; ta: string };  // Estate / Site
  roles: CategoryRole[];
  taskTypes: string[];
  skills: string[];
  ratingTags: string[];
  siteFields: SiteField[];    // dynamic form fields stored in site.attributes
  pricingUnit: 'per_palm' | 'per_day' | 'lump_sum';
}
```
Components and engine code check `capability`, never a role id.

### Data model (Postgres)
Column names equal the `src/types/index.ts` field names (ADR-007), so the full list lives in `supabase/migrations/20261004000001_schema.sql`. Summary:

| Table | Key columns | Written by |
|---|---|---|
| `users` (id = auth user) | name, phone, `memberships jsonb [{category, role}]`, active_category, nic_status, is_admin | auth trigger creates; user updates profile columns only; memberships via `add_membership()`, admin via `set_admin()` |
| `user_pins` | bcrypt pin_hash | `set_completion_pin()` only; no client read |
| `estates` | category, owner_id, name, location, lat/lng, `attributes jsonb` | poster |
| `jobs` | category, owner_id, supervisor_id (set on award), estate_id, task_type, dates, status | poster while DRAFT/OPEN; later statuses by SQL functions |
| `bids` | category, job_id, owner_id (checked), supervisor_id, price, crew_member_ids, status | bidder; owner accepts/rejects (trigger-guarded) |
| `workers` | category, supervisor_id, name, phone, skills, consent, bank_ref | bidder |
| `awards` | job_id (unique), bid_id, escrow_status, escrow_amount, payout_* | **server only** |
| `payments` | award_id, amount, platform_fee, provider_ref, status (one `paid` per award) | **server only** |
| `ledger` | append-only hold / release / refund | **server only** |
| `attendance_days`, `attendance_entries`, `completions`, `ratings`, `disputes` | job_id + denormalized owner/supervisor | per-party, checked against the real job/award; money effects via SQL functions |
| `nic_submissions` | metadata + Storage paths (no image data) | user create; admin review |
| `audit_logs`, `platform_config` | | **server only** |

### Escrow state machine
```
pending ──(payhere-notify verified)──▶ held ──(confirm_completion + PIN)──▶ release_requested ──(admin record_payout)──▶ released
                                       │                                        │
                                       └──────────(open_dispute)─────────────────┴──▶ disputed ──(resolve_dispute)──▶ refunded | released
```
Rules:
- Contacts are released only when escrow is `held` or later (the existing gate in `store.getAwardContacts`, moved server-side).
- Every transition writes a ledger entry and an audit log entry in the same transaction.
- `payhere-notify` / `payhere_apply_notify()` is idempotent. It checks `md5sig`, merchant id, amount and currency before changing anything.
- Total charged = bid price + platform fee (5%, `platform_config`, ADR-011).
