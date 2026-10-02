# AI-assisted SDLC: how we use Claude Code

Three developers, each running Claude Code. The shared context is root `CLAUDE.md` (loaded automatically) plus `.claude/docs/`. Personal Claude memory is not shared between teammates, so anything everyone needs to know goes into these files.

## The loop for every roadmap task

1. **Requirements.** Write a short spec in `.claude/docs/specs/<feature>.md`. Claude can draft it from the roadmap row; you edit it. Cover the user story, acceptance criteria, data touched and edge cases. The team reviews it in a 15-minute sync before building.
2. **Design.** Start Claude Code in **plan mode** for the feature. Point it at the spec. Approve the plan, or correct it before any code is written. Record team-level decisions in `DECISIONS.md`.
3. **Build.** One branch per task (`feat/category-registry`, `fix/admin-login`). Keep PRs small, ideally under ~400 changed lines.
4. **Test.** Ask Claude to write the tests together with the code: unit tests (Vitest), Firestore rules tests, and Playwright e2e for user flows. CI must be green before review.
5. **Review.**
   - Run `/code-review` on your branch and fix what it finds.
   - Run `/security-review` on anything touching auth, Firestore/Storage rules, Cloud Functions or payments.
   - Then one teammate reviews the PR.
6. **Deploy.** A merge to `main` deploys to staging (from day 9).
7. **Learn.** Before closing the task:
   - set its status in `ROADMAP.md`
   - add or close entries in `KNOWN_ISSUES.md`
   - put lasting conventions or gotchas in `CLAUDE.md`

## Team rituals
- **Daily, 15 min:** standup over `ROADMAP.md`: done, doing, blocked.
- **Day 5 and day 10:** demo on the emulator/staging, then a retro. Update the docs as part of the retro.

## Tips for working with Claude on this repo
- Start a session with the task: "Work on ROADMAP day 3, B: replace hardcoded coconut task types with the category registry." Claude will read `CLAUDE.md` and can open the docs it links to.
- When Claude gets something wrong because of missing context, fix the docs, not just the code, so the next session (yours or a teammate's) doesn't repeat it.
- Never paste real secrets (PayHere merchant secret, service-account keys) into a prompt or a committed file. Use Firebase Functions secrets / environment config.
- For money-related code, ask Claude to list the failure cases (duplicate webhook, amount mismatch, refund after release) and write a test for each.
