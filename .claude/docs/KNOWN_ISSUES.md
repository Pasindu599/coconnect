# Known issues

Found during the code review on 2026-10-02. Update the **Status** column as issues are fixed, and add new ones at the bottom.

## Critical: security and money

| # | Issue | Where | Fix | Status |
|---|---|---|---|---|
| 1 | Firestore rules allow anyone to read and write everything, including NIC (national ID) records | `firestore.rules`, `firebase-blueprint.json` | Per-collection rules by owner/role; money collections written only by Functions | open |
| 2 | A real Google Maps API key is committed | `.env.example`, hardcoded fallback in `EstateMapView.tsx` | Rotate the key, restrict it by HTTP referrer, keep a placeholder | **code done, key rotation pending** — both copies removed and `.env.example` is a placeholder; the key is still in git history, so it must be deleted in Google Cloud Console per [runbooks/google-maps-key.md](runbooks/google-maps-key.md) |
| 3 | OTP hardcoded to `123456`/`654321`; new users get PIN `1234`; PINs stored and compared in plaintext | `src/lib/store.ts` (`requestOtp`, `verifyOtp`, `confirmCompletion`) | Firebase phone auth; hash PINs server-side | open |
| 4 | Admin login lets anyone in without checking the email or PIN; default PIN prefilled; "quick admin" button | `src/components/admin/AdminLogin.tsx` (lines 37-63) | Admin via Firebase custom claim only | open |
| 5 | `switchRole()` grants any requested role, including `admin`, to the current user | `src/lib/store.ts` (`switchRole`) | Only switch among roles the user actually has; roles assigned server-side | open |
| 6 | Escrow is marked `held` and contacts are released without any real payment; completion "releases" money client-side | `src/lib/store.ts` (`payEscrow`, `confirmCompletion`) | PayHere checkout + verified webhook in Cloud Functions | open |
| 7 | Escrow amount is `bid.price` only: no platform fee, no ledger, no refund or dispute path for money | `src/lib/store.ts` (`awardBid`) | Fee calc + append-only ledger + dispute/refund flow | open |
| 8 | NIC images stored as base64 in `localStorage` (PII on device, ~5 MB quota) | `src/components/verification/NicSubmissionModal.tsx` | Upload to Firebase Storage with owner/admin-only rules | open |
| 9 | Google sign-in requests the full `drive` scope | `src/lib/firebase.ts` (`WORKSPACE_SCOPES`) | Drop it, or use only `drive.file` | open |

## Architecture and quality

| # | Issue | Where | Fix | Status |
|---|---|---|---|---|
| 10 | Global mutable store backed by `localStorage`. Firestore sync only adds missing IDs (never updates or deletes) and mutates state directly, bypassing `notify()` | `src/lib/store.ts`, `src/App.tsx` (subscribe handlers) | Repository layer over Firestore listeners (`src/lib/data/*`) | open |
| 11 | Firestore write errors are swallowed as warnings, so data loss is silent | `src/lib/firebase.ts` | Surface errors to the UI; retry or fail visibly | open |
| 12 | No router: views are a `useState` string; deep links and the back button don't work | `src/App.tsx` | Hash router with category in the path | open |
| 13 | Coconut domain hardcoded in components (task types, skills, rating tags, landing copy, `Estate.tree_count`) | `src/components/owner/OwnerDashboard.tsx` (lines ~54-80, 578, 1014), `LandingWebsite.tsx`, `src/types/index.ts` | Category registry `src/config/categories.ts` | open |
| 14 | Very large components | `OwnerDashboard.tsx` (1069 lines), `SupervisorDashboard.tsx` (872 lines) | Split into smaller components per tab/feature | open |
| 15 | No tests, no CI; two lockfiles (`bun.lock` + `package-lock.json`); unused deps (`@google/genai`, `express`, `dotenv`); package name `react-example` | repo root | Vitest + CI; pick one package manager; clean `package.json` | open |
| 16 | `Worker.consent_*` and `bank_ref` exist, but there is no consent capture UI or payout bank details flow | `src/types/index.ts`, supervisor dashboard | Consent + bank details forms (week 2, day 8) | open |
