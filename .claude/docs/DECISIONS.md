# Decision log

Add a new entry at the bottom when the team decides something that affects more than one task. Keep each entry short: what was decided, why, and what it means for the code.

---

## ADR-001: Firebase as the backend (2026-10-02)
**Decision:** Use Firebase: Auth (phone OTP), Firestore, Storage, Cloud Functions.
**Why:** The SDK and config already exist in the app, so it needs the least rework within 2 weeks.
**Consequences:** Business rules move from `store.ts` into Firestore security rules and Cloud Functions. Use the Emulator Suite for local development and tests. Money ledgers in Firestore must be append-only and Functions-only.

## ADR-002: PayHere for payments, with platform-held escrow (2026-10-02)
**Decision:** Owners pay through PayHere into the platform's merchant account. The platform holds the funds until completion is confirmed, then pays out. In the MVP, payouts are bank transfers recorded by an admin.
**Why:** A Sri Lankan gateway, already referenced in the prototype.
**Consequences:** The checkout hash and webhook verification run in Cloud Functions; the merchant secret is never in the client. A `PaymentProvider` interface keeps the gateway swappable. **Open question:** confirm with PayHere and a business advisor that holding third-party funds is allowed before going live.

## ADR-003: Construction gets its own roles (2026-10-02)
**Decision:** Each category defines its own roles. Construction uses client, contractor, subcontractor and worker. Coconut keeps owner, broker (supervisor) and worker.
**Why:** Construction has a different hierarchy than coconut harvesting.
**Consequences:** Roles map onto shared capabilities (`poster`, `bidder`, `crew`) so the job engine stays generic. A user can hold different roles in different categories (`memberships: [{category, role}]`). In the MVP, a subcontractor bids directly to clients like a contractor; contractor-hires-subcontractor comes later.

## ADR-004: Shared Claude context is committed to git (2026-10-02)
**Decision:** Root `CLAUDE.md` plus `.claude/docs/` hold the plan, architecture, issues and decisions, and are committed.
**Why:** Claude Code loads `CLAUDE.md` automatically for every teammate, so all three sessions share the same context. Personal Claude memory is not shared.
**Consequences:** Updating these docs is part of finishing a task. `.claude/settings.local.json` stays personal and is not committed.
