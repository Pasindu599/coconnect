# Categories

Each category defines its own roles, task types, skills, rating tags and site fields. In code, all of this lives in `src/config/categories.ts` (wording in `vocab.construction.ts`); this file is the human-readable version. A unit test (`src/config/__tests__/categories.test.ts`) checks the registry's structure and translations; keep this file in step by hand.

Every role maps to one **capability**, which is what the job engine checks:

| Capability | Can do |
|---|---|
| `poster` | Register sites, post jobs, award bids, pay into escrow, confirm completion |
| `bidder` | Bid on jobs, register and manage workers, mark attendance, submit completion |
| `crew` | See assigned jobs, attendance and wages |

## Coconut

- **Site label:** Estate
- **Pricing unit:** per palm, or per day

| Role | Capability | Registers workers |
|---|---|---|
| Land owner | `poster` | no |
| Broker (supervisor) | `bidder` | yes |
| Worker | `crew` | no |

**Task types:** Coconut Harvesting & Bunch Lowering, Fertilizer Ring Application & Mulching, Dry Frond Trimming & Crown Cleaning, Nut Husking & Copra Drying Batch, Undergrowth Tractor Clearing

**Skills:** Tree Climbing, Coconut Plucking, Nut Gathering, Nut Husking, Fertilizer Trenching, Organic Mulching, Crown Cleaning, Copra Bagging

**Rating tags:** punctual crew, zero nut damage, safe tree climbing, clean estate, fast harvest

**Site fields:** area (acres), tree count, location (map pin); a derived palms-per-acre figure on each card. Location presets: Narammala, Madampe, Kuliyapitiya. Map centred on the Coconut Triangle.

## Construction

- **Site label:** Site
- **Pricing unit:** per day, or lump sum

| Role | Capability | Registers workers |
|---|---|---|
| Client (property / site owner) | `poster` | no |
| Contractor | `bidder` | yes |
| Subcontractor | `bidder` | yes |
| Worker (tradesperson) | `crew` | no |

In the MVP, subcontractors bid directly to clients just like contractors. Contractors hiring subcontractors (nested jobs) comes after the 2 weeks.

**Trades / skills:** Mason, Carpenter, Electrician, Plumber, Painter, Tiler, Steel Fixer, Helper (Labourer)

**Task types:**
- Foundation & masonry work
- Concreting (slab / column / beam)
- Carpentry & formwork
- Electrical wiring
- Plumbing
- Plastering & painting
- Tiling & finishing
- Site clearing & general labour

**Rating tags:** On Schedule, Quality Workmanship, Safe Site Practices, Clean Site, Good Communication

**Site fields:** site type (House, Commercial Building, Renovation, Boundary Wall / Other), floor area (sq ft), number of floors, location (map pin). Location presets: Colombo, Nugegoda, Kandy, Galle. Default job budget LKR 150,000.

## Adding a category later
1. Add an entry to `CATEGORIES` and `CATEGORY_LIST` in `src/config/categories.ts`, with labels in en/si/ta (roles with a card each, task types, skills, tags, site fields, location presets, map centre).
2. Add si/ta entries for each new task type, skill and tag in the lookup tables in `src/lib/i18n.ts` (`TASK_TYPE`, `SKILL`, `REVIEW_TAG`); the registry test fails until they exist.
3. If the category should say things differently (e.g. "Site" instead of "Estate"), put the overrides in a `vocab` file like `vocab.construction.ts`.
4. Add demo data if you want it demonstrable (`src/lib/seed/`), and add the category to the e2e flows.
5. Document it in this file.

No engine or dashboard changes should be needed. If they are, the registry is missing something; fix the registry rather than special-casing the category.
