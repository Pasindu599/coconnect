# Spec: auth

> **2026-10-04 — backend moved to Supabase (ADR-014).** This spec was written for Firebase. Its rules still hold (who may do what, the state machine, error codes, the fee model), but the mechanics are now: Supabase Auth (phone OTP, email/password for staff); memberships and the admin flag are columns on `public.users` read directly by RLS (no custom claims, no token refresh); `add_membership()` / `set_admin()` are SQL functions; a new auth user gets a profile row from the `on_auth_user_created` trigger; the first admin is set with SQL (runbooks/supabase-setup.md). Where this file and `supabase/migrations/*` disagree, the migrations win.

Status: draft, for team review (S1-02). Implements CONTRACTS C3 exactly; implementation is S1-05, delivering **SP2**.

## Principles
- **Roles and admin status are custom claims, set only by Cloud Functions.** The client never writes `memberships`, `active_role` is a client-writable UI preference but is validated against `memberships` server-side when it matters (rules check `memberships`, not `active_role`, for authorization — see data-model spec).
- Two sign-in paths, never mixed:
  1. **Phone OTP** (Firebase Phone Auth) — regular users (posters, bidders, crew-registering accounts).
  2. **Email/password** (`signInStaff`) — admins only, and only accounts with the `admin` custom claim can complete it; everyone else gets `AuthError('not-staff')`.
- `addMembership` **rejects** `role: 'admin'` outright — there is no `admin` `CategoryRoleId` in CONTRACTS C1, and the Function additionally rejects any attempt to pass it, so a future client bug can't request it either.

## Flows

### Phone OTP sign-up / sign-in
```
sendOtp(phone, recaptchaContainerId)
  → Firebase Phone Auth sends SMS, returns a confirmation handle (held in module state, not returned to the caller — matches CONTRACTS C3 signature)
confirmOtp(code)
  → confirms against the handle from sendOtp
  → on success: Firebase Auth user exists (created if new)
  → onUserCreate Function trigger fires for genuinely new users:
      - creates users/{uid} with empty memberships, active_category unset, nic_status 'unverified'
  → confirmOtp returns { uid, isNewUser }
  → if isNewUser, the client (S2) sends the user to category + role picker, which calls addMembership
```

`onUserCreate` is an Auth-triggered Function (`functions/src/auth/onUserCreate.ts`), not a Firestore-triggered one — it must run before any client Firestore write to `users/{uid}`, and Auth triggers fire before the client gets its ID token refreshed with claims, so the client's first Firestore read of its own profile waits on this (document it in the S2 handoff: show a loading state between `confirmOtp` resolving and the profile doc existing — a `onSnapshot` with a brief "setting up your account" state is enough, no polling needed since the client already has one listener).

### addMembership
```
addMembership({ category, role })
  → callable Function `addMembership`
  → server checks: role !== 'admin' (reject with 'invalid-argument' otherwise); role is a valid CategoryRoleId for category (reject otherwise, using the same category role list CONTRACTS C1 defines — duplicated server-side in functions/src/auth/roles.ts so Functions don't import src/config/categories.ts, which is a frontend/S2-owned file; keep the two lists in sync manually for the MVP, flag in DECISIONS.md if this causes drift)
  → appends {category, role} to users/{uid}.memberships if not already present (idempotent)
  → sets/updates the Firebase Auth custom claim: claims.memberships = memberships (mirrors the Firestore array so rules can read request.auth.token.memberships without a get() on every request — cheaper and avoids a read-your-own-writes race right after signup)
  → client must call getIdToken(true) (force refresh) after this resolves before relying on the new claim in a rules-gated write; src/lib/auth.ts does this internally so callers of addMembership never need to remember it
```

Rules then check **either** the custom claim (`request.auth.token.memberships`) **or**, as a fallback for the brief window before a token refresh, a `get()` on the user's own Firestore doc — the spec recommends claims-only for performance and documents the refresh requirement instead of paying for a `get()` on every rule evaluation. This is a decision for S1-04 to confirm during rules-test writing; record the final call in `DECISIONS.md`.

### signInStaff (admin)
```
signInStaff(email, password)
  → Firebase Auth signInWithEmailAndPassword
  → on success, client checks the ID token's admin claim
  → if absent: throw AuthError('not-staff'), and sign the (non-admin) session back out immediately — we don't leave a half-authenticated non-admin session sitting around just because they guessed a valid email/password for some other account type (in practice, admin accounts are email/password-only and regular users are phone-only, so this should only trigger on a misconfigured account)
```

Admin accounts are provisioned out-of-band: a human with existing admin access runs `setAdmin` (a callable, admin-claim-gated, or an `onCall` Function invoked via the Firebase console/CLI for the *first* admin — see bootstrap note below), never via a public sign-up form. This replaces KNOWN_ISSUES #18's client-side PIN check and #4's bypassed login entirely.

**Bootstrapping the first admin:** `setAdmin` requires an existing admin caller, which doesn't exist yet on a fresh project. Resolve with a one-time `scripts/seed.ts` step (S1-06) that uses the Admin SDK directly (not the callable) against the **emulator only** to set the first admin claim; for a real deployed project, a human runs a one-off `firebase functions:shell` or Admin SDK script with their own GCP credentials. Document this as a manual step in the deploy runbook, not something CI does automatically (we don't want a well-known "create yourself an admin" code path reachable from the deployed app).

### signOut
Plain `firebase/auth` `signOut()`. Clears local state; `store.ts`'s `onAuthStateChanged` listener (already wired for Google sign-in today) resets to the logged-out state.

## Error codes (CONTRACTS C3)
| Code | When |
|---|---|
| `invalid-phone` | `sendOtp` — Firebase rejects the phone format |
| `invalid-code` | `confirmOtp` — wrong code, confirmation not yet expired |
| `code-expired` | `confirmOtp` — Firebase's `auth/code-expired` |
| `too-many-requests` | either call — Firebase rate limiting |
| `staff-account` | `confirmOtp`/`sendOtp` — the phone number belongs to an account with the `admin` claim (admins don't use OTP at all, by design) |
| `not-staff` | `signInStaff` — valid credentials, no `admin` claim |
| `network` | any Firebase `auth/network-request-failed` |
| `unknown` | anything else, logged with the original Firebase code for debugging (not shown to the user) |

S1 never produces user-facing text for these — S2 maps each to an `i18n.ts` key (CONTRACTS C6). `auth.ts`'s job is only to normalize every Firebase Auth error into one of this fixed set.

## Google sign-in scope fix (closes KNOWN_ISSUES #9)
Today `firebase.ts` requests the full `drive` scope for a Drive-backup feature. S1-05 drops it to `drive.file` (access only to files the app itself creates), or removes the Drive feature's scope request entirely if nothing currently reads existing Drive files. Confirm which with whoever owns that feature before changing — flag in the PR description either way.

## Testing (S1-05 "done when")
- Emulator: Firebase Auth emulator supports [test phone numbers](https://firebase.google.com/docs/auth/web/phone-auth#test-with-fictional-phone-numbers) with fixed codes — use these in the rules/functions test suite, not real SMS, so CI never needs a real phone number or SMS quota.
- Functions unit tests (Vitest + `firebase-functions-test` against the emulator): `onUserCreate` creates the expected doc shape; `addMembership` rejects `admin`, rejects an invalid role for the category, is idempotent on double-call, and the claim ends up matching Firestore; `setAdmin` rejects a non-admin caller.
- Manual/CI-emulator check: a freshly seeded admin (from `scripts/seed.ts`) can `signInStaff`; a non-admin email/password account (if one exists) gets `not-staff`.
