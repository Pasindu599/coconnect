# Architecture

## Current (prototype, as of 2026-10-02)

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

## Target (end of the 2-week plan)

```
Browser (React SPA)
 ├─ hash router: #/ → #/:category → #/:category/dashboard, #/admin
 ├─ CategoryContext ← src/config/categories.ts (roles, tasks, skills, fields)
 ├─ src/lib/data/*: repositories over Firestore listeners (read + permitted writes)
 └─ PayHere JS checkout (params come from a Function)

Firebase
 ├─ Auth: phone OTP; custom claims {memberships, admin}
 ├─ Firestore: security rules enforce ownership and roles
 ├─ Storage: nic/{uid}/*, owner + admin read only
 └─ Cloud Functions
      ├─ auth:    onUserCreate, setRoles (admin only)
      ├─ payments: createPayment (callable), payhereNotify (HTTPS webhook), refundPayment
      └─ escrow:  confirmCompletion, openDispute, resolveDispute, recordPayout
```

### Category registry
```ts
type CategoryId = 'coconut' | 'construction';
type Capability = 'poster' | 'bidder' | 'crew';

interface CategoryRole {
  id: string;                 // 'owner' | 'broker' | 'client' | 'contractor' | 'subcontractor' | 'worker'
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

### Firestore data model
| Collection | Key fields | Written by |
|---|---|---|
| `users/{uid}` | name, phone, `memberships: [{category, role}]`, activeCategory, activeRole, nicStatus, preferredLanguage | user (profile fields only); roles via Function |
| `sites` | category, ownerId, name, location, lat/lng, `attributes` (category-specific) | poster |
| `jobs` | category, ownerId, siteId, taskType, dates, workerCount, budget, status | poster; status changes via Functions once paid |
| `bids` | category, jobId, bidderId, price, fee, crewMemberIds, status | bidder; accept via poster |
| `workers` | category, managerId (broker/contractor), name, phone, skills, consent, bankRef | bidder |
| `awards` | jobId, bidId, escrowStatus, amount, paymentId | **Functions only** |
| `payments` | awardId, amount, platformFee, provider, providerRef, status | **Functions only** |
| `ledger` | append-only money movements (in, hold, release, refund, fee) | **Functions only** |
| `attendance`, `completions`, `ratings`, `disputes` | jobId, category, ... | per-role, money effects via Functions |
| `nic_submissions` | metadata + Storage paths (no image data) | user create; admin review |
| `audit_logs` | actor, action, subject, at | **Functions only** |

### Escrow state machine
```
pending ──(payhereNotify verified)──▶ held ──(confirmCompletion + PIN)──▶ release_requested ──(admin recordPayout)──▶ released
                                       │                                        │
                                       └──────────(openDispute)─────────────────┴──▶ disputed ──(resolveDispute)──▶ refunded | released
```
Rules:
- Contacts are released only when escrow is `held` or later (the existing gate in `store.getAwardContacts`, moved server-side).
- Every transition writes a ledger entry and an audit log entry in the same transaction.
- `payhereNotify` is idempotent. It checks `md5sig`, merchant id, amount and currency before changing anything.
- Total charged = bid price + platform fee. The fee percentage is a config value (to be decided; record it in `DECISIONS.md`).
