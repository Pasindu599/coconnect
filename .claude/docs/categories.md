# Categories

Each category defines its own roles, task types, skills, rating tags and site fields. In code, all of this lives in `src/config/categories.ts`; this file is the human-readable version. Keep them in sync.

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

**Task types** (from the current `OwnerDashboard.tsx`; move them into the registry):
- Coconut harvesting & bunch lowering
- Nut husking & copra drying batch
- (add the remaining options from `OwnerDashboard.tsx` around line 578)

**Skills:** tree climbing, coconut plucking, nut husking (plus the rest of the list in `OwnerDashboard.tsx` around line 78)

**Rating tags:** punctual crew, zero nut damage, safe tree climbing, clean estate, fast harvest

**Site fields:** area (acres), tree count, location (map pin)

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

**Trades / skills:** mason, carpenter, electrician, plumber, painter, tiler, steel fixer, helper (labourer)

**Task types** (draft; owner C to finalize on day 3):
- Foundation & masonry work
- Concreting (slab / column / beam)
- Carpentry & formwork
- Electrical wiring
- Plumbing
- Plastering & painting
- Tiling & finishing
- Site clearing & general labour

**Rating tags** (draft): on schedule, quality workmanship, safe site practices, clean site, good communication

**Site fields** (draft): site type (house / commercial / renovation), floor area (sq ft), number of floors, location (map pin)

## Adding a category later
1. Add an entry to `src/config/categories.ts`, with labels in en/si/ta.
2. Document it in this file.
3. Add i18n strings for any new copy.

No engine or dashboard changes should be needed. If they are, the registry is missing something; fix the registry rather than special-casing the category.
