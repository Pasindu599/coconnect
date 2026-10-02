# Roadmap: 2 weeks to a multi-category, Firebase-backed MVP

**Goal:** Coconut + Construction categories selectable from the home page, real Firebase auth and data, and PayHere payments held in escrow until completion is confirmed.

**Team**
| Dev | Ownership |
|---|---|
| **A: Backend** | Firebase project, Firestore model + rules, Auth (phone OTP + custom claims), Cloud Functions, PayHere integration, ledger |
| **B: Frontend** | Router, category registry, home category picker, config-driven dashboards, construction UI, i18n |
| **C: QA / DevOps / Security + domain** | CI, emulators, tests (rules, functions, e2e), security fixes, construction domain content, keeping `.claude/docs` current |

Status values: `todo` · `doing` · `done` · `blocked`. Update the row when you start or finish a task.

## Week 1: Foundations + categories

| Day | Owner | Task | Status |
|---|---|---|---|
| 1 | A | Write specs in `.claude/docs/specs/` (categories, payments, auth) | todo |
| 1 | A | Firebase project setup + Emulator Suite (`firebase.json`) | todo |
| 1 | B | Spec the category UX; add a hash router (`#/`, `#/:category`, `#/:category/dashboard`, `#/admin`) | todo |
| 1 | C | Rotate the Google Maps key, restrict by referrer, placeholder in `.env.example` | todo |
| 1 | C | Clean deps (`@google/genai`, `express`, `dotenv` unused), pick one lockfile, rename package | todo |
| 1 | C | GitHub Actions: typecheck + build; Vitest setup | todo |
| 1 | C | Contact PayHere: sandbox account + whether escrow/marketplace holding is allowed | todo |
| 2 | A | Firestore data model + security rules (per role; money fields read-only to clients) | todo |
| 2 | B | `src/config/categories.ts` registry + `CategoryContext` | todo |
| 2 | B | Home page category picker (Coconut / Construction cards, trilingual) | todo |
| 2 | C | Rules unit tests (`@firebase/rules-unit-testing`) | todo |
| 2 | C | Remove `switchRole` role escalation and the fake admin login | todo |
| 3 | A | Firebase phone OTP auth + `onUserCreate` / `setRoles` Functions (custom claims) | todo |
| 3 | B | Replace hardcoded coconut task types/skills/tags with registry lookups | todo |
| 3 | B | Split `OwnerDashboard.tsx` into smaller components | todo |
| 3 | C | Construction domain content in `categories.md` (roles, trades, tasks, tags, site fields) | todo |
| 4 | A | `src/lib/data/*` repositories: users, sites, jobs, bids (replace localStorage) | todo |
| 4 | B | Login/registration with category + role selection (incl. construction roles) | todo |
| 4 | C | Emulator seed script (move mock data out of `store.ts`) | todo |
| 5 | A | Repositories: workers, awards, attendance, completions; NIC images → Storage | todo |
| 5 | B | Construction landing/dashboard variants (Site instead of Estate, dynamic site fields) | todo |
| 5 | C | Week-1 demo, `/code-review`, `/security-review`, update KNOWN_ISSUES | todo |

## Week 2: Payments + hardening

| Day | Owner | Task | Status |
|---|---|---|---|
| 6 | A | `createPayment` Function: platform fee calc + PayHere checkout hash (server-side) | todo |
| 6 | B | Payment UI: award → fee breakdown → PayHere checkout → pending state | todo |
| 6 | C | Functions unit tests (hash/signature, fee calc) | todo |
| 7 | A | `payhereNotify` webhook: verify `md5sig`, idempotent → escrow `held`, ledger, contact release | todo |
| 7 | B | Escrow status timeline on owner + broker dashboards; contact gate driven by server state | todo |
| 7 | C | Playwright e2e: post job → bid → award → sandbox pay | todo |
| 8 | A | `confirmCompletion` (server-side hashed PIN) → `release_requested`; dispute freeze; refund | todo |
| 8 | B | Completion + dispute UI; worker consent capture; payout bank details | todo |
| 8 | C | e2e: completion + dispute; rules tests for `payments` / `ledger` | todo |
| 9 | A | Admin payout recording + ledger reconciliation API | todo |
| 9 | B | Admin portal: payouts queue, disputes, NIC review | todo |
| 9 | C | Staging deploy to Firebase Hosting via CI; error monitoring | todo |
| 10 | A | Bug fixes from staging | todo |
| 10 | B | Bug fixes; responsive + i18n pass (si/ta for new strings) | todo |
| 10 | C | Final `/code-review` + `/security-review`, release checklist, update `.claude/docs`, retro | todo |

## Definition of done (end of week 2)
On staging, for **both** Coconut and Construction:
1. Pick the category on the home page.
2. Register as a poster (owner / client) with a real SMS OTP and post a job.
3. Register as a bidder (broker / contractor / subcontractor) and bid with a crew.
4. Award the bid and pay with a PayHere sandbox card. The webhook moves escrow to `held` and contacts are revealed.
5. Confirm completion with the PIN. Escrow moves to `release_requested`.
6. Admin records the payout. Escrow moves to `released` and a ledger entry exists.

Also: CI is green (typecheck, unit, rules, e2e), and a client write to `payments` / `ledger` is rejected by rules.

## Later (after the 2 weeks)
- Automated payouts and splits to brokers/workers
- Contractor hires subcontractor (nested jobs)
- More categories (the registry should make these cheap)
- Trust score computed server-side
- Offline attendance sync
- PayHere live mode (only after the compliance check)
