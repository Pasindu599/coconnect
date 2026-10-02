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

## ADR-005: Client-side keys are restricted, never hidden (2026-10-02)
**Decision:** Any key shipped to the browser (`VITE_*`, the Firebase web config) is treated as public. It is secured by provider-side restrictions — HTTP referrer + API allowlist + quota caps — and by one key per environment, not by keeping it out of the bundle. Secrets that must stay secret (the PayHere merchant secret, service accounts) never get a `VITE_` prefix and live only in Cloud Functions config.
**Why:** Vite inlines `VITE_*` at build time, so "hiding" such a key is not achievable and pretending otherwise leads to unrestricted keys. The leaked Maps key (KNOWN_ISSUES #2) was unrestricted, which made it a billing liability.
**Consequences:** No fallback keys in source — a missing key degrades to a visible "not configured" state rather than falling back to a shared one. `.env.example` holds placeholders only. Rotation steps live in [`runbooks/google-maps-key.md`](runbooks/google-maps-key.md). CI gets a secret scan with 2C-1. The Firebase web API key in `firebase-applet-config.json` is public by design and is **not** rotated; Firestore/Storage rules are what protect that data.

## ADR-006: Rules read authorization from custom claims; denormalize job parties onto sub-documents (2026-10-03)
**Decision:** Firestore rules check `request.auth.token.memberships` (a custom claim mirrored by the `addMembership` Function) rather than `get()`-ing the caller's own `users/{uid}` doc on every rule evaluation. Documents that belong to a job but aren't the job itself (`attendance_days`, `attendance_entries`, `completions`, `disputes`) carry denormalized `owner_id`/`bidder_id` fields copied from the job/award at creation time, the same pattern already used for `owner_name` on jobs. Also: `users/{uid}` reads are restricted to the user themself and admins, not "any authenticated user" as first drafted in `data-model.md` — nothing in the UI needs a stranger's full profile, and the doc carries NIC numbers and phone.
**Why:** Firestore rules can `get()` one document by a known path cheaply, but can't run a query (e.g. "find the award for this job") — so any rule that needs to know "is this caller a party to this job" either reads a custom claim (free) or needs the relevant IDs already sitting on the document being evaluated. Rules tests (`tests/rules/`, S1-04) confirmed both approaches work; claims + denormalization was simpler and cheaper than threading extra `get()` chains through every rule.
**Consequences:** Every Function that creates one of these sub-documents (or that calls `addMembership`) must keep the claim and the denormalized fields in sync with their source of truth — a stale claim after a role change, or a stale `owner_id` after... (jobs don't change owners, so this is low-risk in practice). `src/lib/auth.ts` force-refreshes the ID token after `addMembership` so the client never acts on a stale claim.
