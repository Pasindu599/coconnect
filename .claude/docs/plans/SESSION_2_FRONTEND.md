# Session 2: Frontend & Categories

**You are Session 2.** You own the router, the category registry, the home page category picker, the dashboards, construction UI, i18n, UI tests and e2e. Session 1 is building the backend in parallel, in another worktree.

Before starting, read [README.md](README.md) (file ownership, sync points, rules) and [CONTRACTS.md](CONTRACTS.md) (the APIs Session 1 will deliver, and the mocks to use until then). Don't edit Session 1's files; add a change request instead.

**Start prompt** (run Claude Code inside the `../coconnect-s2` worktree):
> You are Session 2. Read `.claude/docs/plans/SESSION_2_FRONTEND.md`, `README.md` and `CONTRACTS.md` in that folder. Work on the next task whose status is `todo` and whose dependencies are `done`. Use plan mode first.

## Task list

Status: `todo` · `doing` · `done` · `blocked`. Update this table when you start or finish a task.

| ID | Roadmap | Day | Task | Depends on | Waits for S1 | Status |
|---|---|---|---|---|---|---|
| S2-01 | 1B-1 | 1 | Category registry `src/config/categories.ts` + `CategoryContext` | — | | todo |
| S2-02 | 1B-2 | 1 | Hash router + deep links | — | | todo |
| S2-03 | 2B-1 | 2 | Home page category picker | S2-01, S2-02 | | todo |
| S2-04 | 2C-2 | 2 | Final construction content (registry + `categories.md`) | S2-01 | | todo |
| S2-05 | 2B-2 | 2–3 | Replace hardcoded coconut values with registry lookups | S2-01 | | todo |
| S2-06 | 3B-1 | 3 | Split `OwnerDashboard` + `SupervisorDashboard` | S2-05 | | todo |
| S2-07 | 4B-1 | 4 | Login/registration with category + role; staff login | S2-04 | SP2 (S1-05) | todo |
| S2-08 | — | 4 | `App.tsx`: use `store.startSync()` | S2-02 | SP3 (S1-07) | todo |
| S2-09 | 4C-1 | 4–5 | UI tests: registry, router, picker, login | S2-03, S2-07 | SP1 (S1-01) | todo |
| S2-10 | 5B-1 | 5 | Construction landing/dashboard variants; NIC upload to Storage | S2-06, S2-04 | S1-08 for NIC | todo |
| — | 5C-1 | 5 | **SP4: week-1 demo + reviews (humans, both sessions)** | | | todo |
| S2-11 | 6B | 6 | Payment UI: award → fee breakdown → PayHere checkout | S2-06 | SP5 (S1-09) | todo |
| S2-12 | 7B | 7 | Escrow timeline + contact gate from server state | S2-11 | | todo |
| S2-13 | 7C | 7–8 | Playwright setup + e2e happy path | S2-11 | SP6 (S1-10) | todo |
| S2-14 | 8B | 8 | Completion + dispute UI; worker consent; payout bank details | S2-12 | S1-11 | todo |
| S2-15 | 8C (e2e) | 8 | e2e: completion + dispute | S2-13, S2-14 | S1-11 | todo |
| S2-16 | 9B | 9 | Admin portal: payouts queue, disputes, NIC review | S2-14 | S1-12 | todo |
| S2-17 | 10B | 10 | Bug fixes; responsive + i18n pass (si/ta) | S2-16 | SP7 (S1-13) | todo |
| — | 10C | 10 | **Final `/code-review` + `/security-review`, docs, retro (humans, both sessions)** | | | todo |

---

## Task details

### S2-01: Category registry
- **Files:** `src/config/categories.ts`, `src/config/CategoryContext.tsx`.
- Build on the frozen types in `src/types/category.ts` (CONTRACTS C1). Shape: see `ARCHITECTURE.md` (Category registry). Content: the drafts in `categories.md`.
- Each role has a `capability` (`poster` / `bidder` / `crew`). UI code checks capabilities, never role ids.
- Remember the selected category (URL first, `localStorage` as fallback).
- **Done when:** both categories are defined, with en/si/ta labels, and any component can read the active category from context.

### S2-02: Hash router
- **Files:** `src/lib/router.ts`, `src/App.tsx`, `src/components/common/Navbar.tsx`.
- Routes: `#/`, `#/:category`, `#/:category/login`, `#/:category/dashboard`, `#/:category/map`, `#/:category/profile`, `#/admin`. Replace the `activeView` string state.
- Also: drop the unused `state` prop from `AdminLogin` (it's passed in `App.tsx`).
- **Done when:** deep links work, the back button works, refreshing keeps you on the same page. Closes KNOWN_ISSUES #12.

### S2-03: Category picker
- **Files:** `src/components/home/LandingWebsite.tsx` (or a new `CategoryPicker.tsx`), `src/lib/i18n.ts`.
- The home page shows Coconut and Construction cards. Choosing one goes to `#/:category`, and the role cards below come from that category's registry entry.
- **Done when:** works at phone width, all three languages.

### S2-04: Construction content
- **Files:** `src/config/categories.ts` (construction entry), `.claude/docs/categories.md`.
- Finalize roles, trades, task types, rating tags and site fields. Keep `categories.md` and the registry identical. Session 1's seed script (S1-06) uses this content.

### S2-05: Remove hardcoded coconut values
- **Files:** `src/components/**`, `src/lib/i18n.ts`.
- Task types, skills and rating tags in `OwnerDashboard.tsx` (around lines 54–80, 578, 1014), landing copy, "Estate" labels → registry lookups.
- **Done when:** `grep -ri coconut src/components` only finds content that belongs to the coconut registry entry. Closes KNOWN_ISSUES #13.

### S2-06: Split the dashboards
- **Files:** `src/components/owner/**`, `src/components/supervisor/**`.
- Split `OwnerDashboard.tsx` (≈1069 lines) and `SupervisorDashboard.tsx` (≈872 lines) into one component per tab/feature. Pure refactor: no behaviour change.
- **Done when:** no file above ~300 lines; the app behaves the same. Closes KNOWN_ISSUES #14.

### S2-07: Login/registration with category + role
- **Files:** `src/components/auth/UnifiedLogin.tsx`, `src/components/admin/AdminLogin.tsx`, `src/lib/i18n.ts`.
- Registration asks for category and role (the construction roles: client, contractor, subcontractor, worker). A user can hold different roles in different categories.
- **Before SP2:** build on the existing `store.verifyOtp` mock.
- **After SP2:** switch to `src/lib/auth.ts` (CONTRACTS C3): `sendOtp` / `confirmOtp` / `addMembership`, and `signInStaff` for `AdminLogin`. Map every `AuthError.code` to an i18n key.
- **Done when:** a new user can register as a construction contractor and land on the right dashboard.

### S2-08: Use store.startSync()
- **Files:** `src/App.tsx`.
- Replace the `subscribeToEstates` / `subscribeToJobs` block in `App.tsx` with `store.startSync()` (CONTRACTS C2). Small PR, right after SP3.

### S2-09: UI tests
- **Files:** `src/**/*.test.tsx`, `package.json` (add `@testing-library/react`, `jsdom` after rebasing on S1-01).
- Cover: registry lookups, router parsing, category picker navigation, login role selection, capability checks.

### S2-10: Construction variants + NIC upload
- **Files:** `src/components/**`.
- "Site" instead of "Estate", dynamic site fields from the registry (`siteFields`), construction-specific dashboard copy. `EstateMapView` works for sites of both categories.
- After S1-08: `NicSubmissionModal` uploads with `uploadNicImage` (CONTRACTS C5) instead of base64 in `localStorage`.

### S2-11: Payment UI
- **Files:** `src/components/owner/**` (award flow), `src/lib/i18n.ts`, `index.html` (PayHere JS SDK script tag).
- Award → fee breakdown (`FeeBreakdown`) → PayHere checkout → "waiting for payment" state.
- **Before SP5:** use a local stub for `createPayment` (CONTRACTS C4). **After SP5:** call the real one.
- The UI never marks escrow as held. It waits for `award.escrow_status` to change.

### S2-12: Escrow timeline + contact gate
- Show `pending → held → release_requested → released` (and disputed / refunded) on owner and bidder dashboards.
- Contacts appear only when the server says escrow is `held` or later.

### S2-13: e2e happy path
- **Files:** `playwright.config.ts`, `e2e/**`, `package.json`.
- Runs against the emulators + seed. Flow: pick category → post job → bid → award → sandbox pay → contacts visible. Run it for **both** categories.
- Write it against the stubbed payment first; the full run needs SP6.

### S2-14: Completion, dispute, consent, bank details
- Completion confirmation with PIN, dispute form, worker consent capture, payout bank details (KNOWN_ISSUES #16).
- The store actions for consent and bank details don't exist yet. Add a change request in CONTRACTS.md at the start of this task so Session 1 can add them.

### S2-15: e2e completion + dispute
- Extend the e2e suite: confirm completion → `release_requested`; open dispute → frozen.

### S2-16: Admin portal
- Payouts queue (record bank-transfer reference), disputes desk, NIC review using Storage URLs. Uses S1-11 and S1-12.

### S2-17: Bug fixes + polish
- Fix what the team finds on staging. Responsive check at phone width. Make sure every new string has si and ta translations.
