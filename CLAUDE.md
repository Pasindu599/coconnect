# Coconnect

Labour-hiring marketplace for Sri Lanka. People who need work done (land owners, construction clients) post jobs. Brokers/contractors bid and supply crews of workers they have registered. The owner's payment is **held in escrow until the work is confirmed complete**, then released.

The product is expanding from coconut-only into a **multi-category platform**. The first two categories are **Coconut** and **Construction**. The user picks a category on the home page and continues into that category's flow.

> Status (Oct 2026): front-end prototype. Data lives in `localStorage`; OTP, PIN, admin login and payments are mocked. The 2-week plan to make it real is in [.claude/docs/ROADMAP.md](.claude/docs/ROADMAP.md).

## Shared team context — read these first
| File | What's in it |
|---|---|
| [.claude/docs/ROADMAP.md](.claude/docs/ROADMAP.md) | 2-week plan, task owners (A/B/C), status |
| [.claude/docs/ARCHITECTURE.md](.claude/docs/ARCHITECTURE.md) | Current vs target architecture, data model, escrow state machine |
| [.claude/docs/KNOWN_ISSUES.md](.claude/docs/KNOWN_ISSUES.md) | Security and design issues in the current code |
| [.claude/docs/DECISIONS.md](.claude/docs/DECISIONS.md) | Decision log (ADRs) |
| [.claude/docs/categories.md](.claude/docs/categories.md) | Roles, tasks, skills per category |
| [.claude/docs/AI_SDLC.md](.claude/docs/AI_SDLC.md) | How the team uses Claude Code across the SDLC |
| `.claude/docs/specs/` | One spec per feature, written before building it |
| `.claude/docs/runbooks/` | Operational runbooks (key rotation, deploys) |

**Keep these up to date.** After you finish a task, update its status in `ROADMAP.md`. When the team decides something, add an entry to `DECISIONS.md`. When you find or fix an issue, update `KNOWN_ISSUES.md`. These files are how every teammate's Claude session shares the same context; personal Claude memory is not shared.

## Stack
- React 19 + TypeScript + Vite + Tailwind v4, `motion`, `lucide-react`
- Firebase (Auth, Firestore, Storage; Cloud Functions planned): config in `firebase-applet-config.json`
- Google Maps via `@vis.gl/react-google-maps` (`VITE_GOOGLE_MAPS_API_KEY`)
- Payments: PayHere (planned; sandbox first)
- i18n: English / Sinhala / Tamil in `src/lib/i18n.ts`

## Commands
```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev      # http://localhost:3000
npm run lint     # tsc --noEmit (type check)
npm run build
```
Planned: `npm test` (Vitest), `firebase emulators:start`, `npx playwright test`.

### Local environment
`.env.local` is gitignored; `.env.example` holds placeholders only. Ask the team
for a **dev** Google Maps key (referrer-restricted to `http://localhost:3000/*` —
we do not share one key across environments) and put it in
`VITE_GOOGLE_MAPS_API_KEY`. Without it the app runs fine and the map area shows a
"map unavailable" panel; there is deliberately no fallback key in the source.
Env vars are declared in `src/vite-env.d.ts` — add new `VITE_*` vars there or they
will not type-check. See [.claude/docs/runbooks/google-maps-key.md](.claude/docs/runbooks/google-maps-key.md).

## Code map
- `src/App.tsx`: top-level view switching (no router yet) + Firestore sync
- `src/lib/store.ts`: mock in-memory/localStorage store, seed data, all business logic (to be replaced by `src/lib/data/*` repositories + Cloud Functions)
- `src/lib/firebase.ts`: Firebase init, Google sign-in, Firestore helpers
- `src/types/index.ts`: domain types (`LabourJob`, `Bid`, `Award`, `EscrowStatus`, ...)
- `src/components/<role>/`: dashboards per role (`owner`, `supervisor` = broker, `worker`, `admin`)
- `src/components/home/LandingWebsite.tsx`: public home page

## Conventions (follow these in new code)
- **Category config is the single source of truth.** Task types, skills, roles, rating tags and site fields come from `src/config/categories.ts` (being built). Don't hardcode coconut-specific values in components.
- **The job engine is generic.** Check role *capabilities* (`poster`, `bidder`, `crew`), not role names like `'owner'`.
- **Money is only changed server-side.** Escrow status, payments and ledger entries are written by Cloud Functions, never by the client. The PayHere merchant secret never goes into front-end code.
- **No secrets in git.** Keep `.env.example` placeholder-only.
- Every user-facing string goes through `i18n.ts` with `en`, `si` and `ta` keys.
- Small PRs, one branch per roadmap task (`feat/...`, `fix/...`). Run `/code-review` before asking for human review; run `/security-review` on auth, rules and payment changes.
