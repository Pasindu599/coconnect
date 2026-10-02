# Roadmap: 2 weeks to a multi-category, Firebase-backed MVP

**Goal:** Coconut + Construction categories selectable from the home page, real Firebase auth and data, and PayHere payments held in escrow until completion is confirmed.

**Team**
| Dev | Ownership |
|---|---|
| **A: Backend** | Firebase project, Firestore model + rules, Auth (phone OTP + custom claims), Cloud Functions, PayHere integration, ledger |
| **B: Frontend** | Router, category registry, home category picker, config-driven dashboards, construction UI, i18n |
| **C: QA / DevOps / Security + domain** | CI, emulators, tests (rules, functions, e2e), security fixes, construction domain content, keeping `.claude/docs` current |

> **Since day 1, the work runs as two parallel Claude sessions.** Status for every task below is tracked in [plans/SESSION_1_BACKEND.md](plans/SESSION_1_BACKEND.md) and [plans/SESSION_2_FRONTEND.md](plans/SESSION_2_FRONTEND.md); this file stays as the overview. 1C-4 is handled by a person outside both sessions.

Status values: `todo` · `doing` · `done` · `blocked`. Update the row when you start or finish a task.

## Week 1: Foundations + categories

Tasks are arranged so A, B and C can all work in parallel. "Depends on" lists task IDs that must be **merged** first; `—` means it can start right away. When a dependency is someone else's task, it's always from an earlier day.

### File ownership (avoids merge conflicts in week 1)
| File(s) | Owner | Others |
|---|---|---|
| `package.json`, lockfile | C merges the cleanup (1C-1) first thing on day 1 | A and B rebase on it before adding deps |
| `src/App.tsx`, routing | B | A and C don't edit it in week 1; ask B for routing changes |
| `src/lib/store.ts` | C (days 1–3) | A takes over from day 4 (repositories) |
| `src/components/admin/AdminLogin.tsx` | C | |
| `src/config/categories.ts` | B owns the structure | C edits only the construction data (2C-2) |
| `firebase.json`, `firestore.rules`, `storage.rules`, `functions/` | A | C adds tests under `tests/rules/` |

### Day 1: everyone starts at once, no cross-dependencies
| ID | Owner | Task | Depends on | Status |
|---|---|---|---|---|
| 1C-1 | C | Clean deps (remove unused `@google/genai`, `express`, `dotenv`), keep one lockfile, rename package. **Merge by mid-morning.** | — | done |
| 1C-2 | C | Rotate the Google Maps key, restrict by referrer, placeholder in `.env.example` | — | done |
| 1C-3 | C | Remove `switchRole` role escalation + fake admin login (`store.ts`, `AdminLogin.tsx`) | — | done |
| 1C-4 | C | Contact PayHere: sandbox account + whether escrow/marketplace holding is allowed | — | doing |
| 1A-1 | A | Specs in `.claude/docs/specs/`: data model, auth, payments | — | todo |
| 1A-2 | A | Firebase project + Emulator Suite (`firebase.json`, `firebase-tools`) | 1C-1 (rebase only) | todo |
| 1B-1 | B | Category UX spec + `src/config/categories.ts` registry + `CategoryContext` (use the drafts in `categories.md`) | — | todo |
| 1B-2 | B | Hash router: `#/`, `#/:category`, `#/:category/dashboard`, `#/admin` | — | todo |

### Day 2
| ID | Owner | Task | Depends on | Status |
|---|---|---|---|---|
| 2A-1 | A | Firestore data model + security rules (per role; money fields read-only to clients) + `storage.rules` | 1A-1, 1A-2 | todo |
| 2B-1 | B | Home page category picker (Coconut / Construction cards, trilingual) wired to `#/:category` | 1B-1, 1B-2 | todo |
| 2B-2 | B | Replace hardcoded coconut task types/skills/tags with registry lookups | 1B-1 | todo |
| 2C-1 | C | GitHub Actions (typecheck + build) + Vitest setup | 1C-1 | todo |
| 2C-2 | C | Finalize construction content (roles, trades, tasks, tags, site fields) in `categories.md` and in the registry data | 1B-1 | todo |
| 2C-3 | C | Rules tests, written test-first from the spec, running on the emulator | 1A-1, 1A-2, 2C-1 | todo |

### Day 3
| ID | Owner | Task | Depends on | Status |
|---|---|---|---|---|
| 3A-1 | A | Firebase phone OTP auth + `onUserCreate` / `setRoles` Functions (custom claims) | 2A-1 | todo |
| 3B-1 | B | Split `OwnerDashboard.tsx` + `SupervisorDashboard.tsx` into smaller components | 2B-2 | todo |
| 3C-1 | C | Finish rules tests against A's merged rules; add to CI | 2A-1, 2C-3 | todo |
| 3C-2 | C | Emulator seed script (move mock data out of `store.ts`) | 1A-2 | todo |

### Day 4
| ID | Owner | Task | Depends on | Status |
|---|---|---|---|---|
| 4A-1 | A | `src/lib/data/*` repositories: users, sites, jobs, bids (replace localStorage) | 2A-1, 3C-2 | todo |
| 4B-1 | B | Login/registration with category + role selection (incl. construction roles) | 2C-2; uses 3A-1 auth | todo |
| 4C-1 | C | Vitest + React Testing Library tests for registry, router and category picker | 2B-1, 2C-1 | todo |

### Day 5
| ID | Owner | Task | Depends on | Status |
|---|---|---|---|---|
| 5A-1 | A | Repositories: workers, awards, attendance, completions; NIC images → Storage | 4A-1 | todo |
| 5B-1 | B | Construction landing/dashboard variants (Site instead of Estate, dynamic site fields) | 3B-1, 2C-2 | todo |
| 5C-1 | C | Week-1 demo, `/code-review`, `/security-review`, update KNOWN_ISSUES and this roadmap | all week-1 tasks | todo |

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
