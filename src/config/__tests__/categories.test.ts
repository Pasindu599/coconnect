import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_LIST,
  activeLegacyRoleIn,
  buildSitePayload,
  canRegisterWorkers,
  capabilityOfLegacyRole,
  categoryOf,
  formatSiteFieldValue,
  formatSiteSummary,
  getRole,
  hasCapabilityIn,
  isCategoryId,
  membershipsInCategory,
  membershipsOf,
  rolesWithCapability,
  siteFormDefaults,
  siteTotals,
  upgradeMemberships,
} from '../categories';
import { tReviewTag, tSkill, tTaskType, translations } from '../../lib/i18n';
import type { Language } from '../../lib/i18n';
import type { SiteValues } from '../categories';
import type { User } from '../../types';

const LANGS: Language[] = ['en', 'si', 'ta'];

const user = (overrides: Partial<User>): User => ({
  id: 'u1',
  phone: '+94770000000',
  name: 'Test',
  roles: ['owner'],
  active_role: 'owner',
  memberships: [],
  nic_status: 'unverified',
  preferred_language: 'en',
  trust_score: 4.5,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('registry invariants', () => {
  it('lists every category once and recognises ids', () => {
    expect(CATEGORY_LIST.map(c => c.id).sort()).toEqual(['coconut', 'construction']);
    expect(isCategoryId('coconut')).toBe(true);
    expect(isCategoryId('mining')).toBe(false);
    expect(isCategoryId(null)).toBe(false);
  });

  it.each(CATEGORY_LIST)('$id has a poster, a bidder who registers workers, and a crew role', category => {
    expect(rolesWithCapability(category.id, 'poster').length).toBeGreaterThan(0);
    expect(rolesWithCapability(category.id, 'crew').length).toBeGreaterThan(0);
    const bidders = rolesWithCapability(category.id, 'bidder');
    expect(bidders.length).toBeGreaterThan(0);
    expect(bidders.every(r => r.canRegisterWorkers)).toBe(true);
  });

  it.each(CATEGORY_LIST)('$id role ids are unique and every role has a full card', category => {
    const ids = category.roles.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const role of category.roles) {
      for (const lang of LANGS) {
        expect(role.label[lang]).toBeTruthy();
        expect(role.card.title[lang]).toBeTruthy();
        expect(role.card.desc[lang]).toBeTruthy();
        expect(role.card.action[lang]).toBeTruthy();
        role.card.bullets.forEach(b => expect(b[lang]).toBeTruthy());
      }
    }
  });

  it.each(CATEGORY_LIST)('$id defaults come from its own lists', category => {
    expect(category.taskTypes).toContain(category.defaults.taskType);
    category.defaults.skills.forEach(s => expect(category.skills).toContain(s));
    category.defaults.ratingTags.forEach(t => expect(category.ratingTags).toContain(t));
  });

  it.each(CATEGORY_LIST)('$id task types, skills and tags are translated into si and ta', category => {
    for (const lang of ['si', 'ta'] as Language[]) {
      category.taskTypes.forEach(k => expect(tTaskType(k, lang)).not.toBe(k));
      category.skills.forEach(k => expect(tSkill(k, lang), `${k} (${lang})`).not.toBe(k));
      category.ratingTags.forEach(k => expect(tReviewTag(k, lang), `${k} (${lang})`).not.toBe(k));
    }
  });

  it.each(CATEGORY_LIST)('$id labels and site fields exist in all languages', category => {
    for (const lang of LANGS) {
      expect(category.label[lang]).toBeTruthy();
      expect(category.tagline[lang]).toBeTruthy();
      expect(category.description[lang]).toBeTruthy();
      expect(category.siteLabel[lang]).toBeTruthy();
      category.siteFields.forEach(f => {
        expect(f.label[lang]).toBeTruthy();
        f.options?.forEach(o => expect(o.label[lang]).toBeTruthy());
      });
    }
  });

  it.each(['taskTypes', 'skills', 'ratingTags'] as const)('keeps the coconut and construction %s separate', list => {
    const coconut = new Set(CATEGORIES.coconut[list]);
    const shared = CATEGORIES.construction[list].filter(item => coconut.has(item));
    expect(shared).toEqual([]);
  });
});

describe('construction vocabulary', () => {
  const vocab = CATEGORIES.construction.vocab!;
  const placeholders = (s: string) => (s.match(/\{[a-z_]+\}/g) ?? []).sort().join(',');

  it('only overrides keys that exist in the base dictionary', () => {
    for (const key of Object.keys(vocab)) {
      expect(key in translations.en, key).toBe(true);
    }
  });

  it('is complete in every language and keeps the base placeholders', () => {
    for (const [key, value] of Object.entries(vocab)) {
      for (const lang of LANGS) {
        expect(value![lang], `${key} (${lang})`).toBeTruthy();
        const base = (translations[lang] as Record<string, string>)[key];
        expect(placeholders(value![lang]), `${key} (${lang}) placeholders`).toBe(placeholders(base));
      }
    }
  });
});

describe('roles and capabilities', () => {
  it('maps legacy roles to capabilities and refuses admin', () => {
    expect(capabilityOfLegacyRole('owner')).toBe('poster');
    expect(capabilityOfLegacyRole('supervisor')).toBe('bidder');
    expect(capabilityOfLegacyRole('worker')).toBe('crew');
    expect(capabilityOfLegacyRole('admin')).toBeNull();
    expect(capabilityOfLegacyRole(undefined)).toBeNull();
  });

  it('knows which roles register workers', () => {
    expect(canRegisterWorkers({ category: 'construction', role: 'contractor' })).toBe(true);
    expect(canRegisterWorkers({ category: 'construction', role: 'client' })).toBe(false);
    expect(canRegisterWorkers({ category: 'coconut', role: 'agent' })).toBe(true);
  });

  it('does not offer a role in a category that does not define it', () => {
    expect(getRole('coconut', 'contractor')).toBeUndefined();
    expect(getRole('construction', 'owner')).toBeUndefined();
  });
});

describe('memberships', () => {
  it('treats a user with only legacy roles as a coconut member', () => {
    const u = user({ roles: ['owner', 'supervisor'] });
    expect(membershipsOf(u)).toEqual([
      { category: 'coconut', role: 'owner' },
      { category: 'coconut', role: 'agent' },
    ]);
  });

  it('upgrades the retired broker and subcontractor roles, dropping duplicates', () => {
    expect(
      upgradeMemberships([
        { category: 'construction', role: 'contractor' },
        { category: 'coconut', role: 'broker' as never },
        { category: 'construction', role: 'subcontractor' as never },
      ])
    ).toEqual([
      { category: 'construction', role: 'contractor' },
      { category: 'coconut', role: 'agent' },
    ]);
  });

  it('never invents a membership from the admin role', () => {
    expect(membershipsOf(user({ roles: ['admin'] }))).toEqual([]);
  });

  it('prefers explicit memberships and filters by category', () => {
    const u = user({
      roles: ['owner'],
      memberships: [
        { category: 'coconut', role: 'owner' },
        { category: 'construction', role: 'client' },
      ],
    });
    expect(membershipsInCategory(u, 'construction')).toEqual([{ category: 'construction', role: 'client' }]);
    expect(membershipsOf(null)).toEqual([]);
  });

  it('acts in the role of the viewed category, keeping the active role when it fits', () => {
    const u = user({
      roles: ['owner', 'supervisor'],
      active_role: 'supervisor',
      memberships: [
        { category: 'coconut', role: 'owner' },
        { category: 'construction', role: 'contractor' },
      ],
    });
    expect(activeLegacyRoleIn(u, 'construction')).toBe('supervisor');
    expect(activeLegacyRoleIn(u, 'coconut')).toBe('owner');
  });

  it('returns null when the user has no role in the category', () => {
    const u = user({ memberships: [{ category: 'construction', role: 'client' }], roles: ['owner'] });
    expect(activeLegacyRoleIn(u, 'coconut')).toBeNull();
    expect(activeLegacyRoleIn(null, 'coconut')).toBeNull();
  });
});

describe('site helpers', () => {
  it('treats records without a category as coconut', () => {
    expect(categoryOf({})).toBe('coconut');
    expect(categoryOf(undefined)).toBe('coconut');
    expect(categoryOf({ category: 'construction' })).toBe('construction');
  });

  it('summarises coconut and construction sites from the registry fields', () => {
    expect(formatSiteSummary({ area_acres: 14.5, tree_count: 940 }, 'en')).toBe('14.5 acres • 940 palms');
    expect(
      formatSiteSummary(
        { category: 'construction', attributes: { site_type: 'House', floor_area_sqft: 2400, floors: 2 } },
        'en'
      )
    ).toBe('House • 2,400 sq ft • 2 floors');
  });

  it('translates select options and skips missing optional fields', () => {
    const site = { category: 'construction' as const, attributes: { site_type: 'House', floor_area_sqft: 900 } };
    expect(formatSiteSummary(site, 'en')).toBe('House • 900 sq ft');
    expect(formatSiteSummary(site, 'si')).toContain('නිවස');
  });
});

describe('site form helpers', () => {
  const coconut = CATEGORIES.coconut;
  const construction = CATEGORIES.construction;

  it('starts each form from the field defaults, or the first select option', () => {
    expect(siteFormDefaults(coconut)).toEqual({ area_acres: '10.0', tree_count: '650' });
    expect(siteFormDefaults(construction)).toEqual({ site_type: 'House', floor_area_sqft: '1500', floors: '1' });
  });

  it('keeps coconut acres and trees top-level', () => {
    const result = buildSitePayload(coconut, { area_acres: '12.5', tree_count: '800' });
    expect(result).toEqual({ ok: true, area_acres: 12.5, tree_count: 800, attributes: undefined });
  });

  it('puts construction fields in attributes and zeroes the coconut-only numbers', () => {
    const result = buildSitePayload(construction, { site_type: 'House', floor_area_sqft: '2400', floors: '2' });
    expect(result).toEqual({
      ok: true,
      area_acres: 0,
      tree_count: 0,
      attributes: { site_type: 'House', floor_area_sqft: 2400, floors: 2 },
    });
  });

  it('allows an optional field to be left blank', () => {
    const result = buildSitePayload(construction, { site_type: 'House', floor_area_sqft: '900', floors: '' });
    expect(result).toMatchObject({ ok: true, attributes: { site_type: 'House', floor_area_sqft: 900 } });
    expect((result as { attributes: object }).attributes).not.toHaveProperty('floors');
  });

  it('reports the required fields that are empty or not numbers', () => {
    expect(buildSitePayload(construction, { site_type: 'House', floor_area_sqft: '', floors: '1' })).toEqual({
      ok: false,
      missing: ['floor_area_sqft'],
    });
    expect(buildSitePayload(coconut, { area_acres: 'abc', tree_count: '' })).toEqual({
      ok: false,
      missing: ['area_acres', 'tree_count'],
    });
  });

  it('totals only the fields that have a total label', () => {
    const sites = [
      { area_acres: 10, tree_count: 100 },
      { area_acres: 4.5, tree_count: 50 },
    ];
    expect(siteTotals(sites, coconut).map(t => [t.field.key, t.total])).toEqual([
      ['area_acres', 14.5],
      ['tree_count', 150],
    ]);
    const buildings: SiteValues[] = [
      { attributes: { floor_area_sqft: 2400, floors: 2 } },
      { attributes: { floor_area_sqft: 900 } },
    ];
    expect(siteTotals(buildings, construction).map(t => [t.field.key, t.total])).toEqual([['floor_area_sqft', 3300]]);
  });

  it('formats a single field and leaves unset ones empty', () => {
    const field = construction.siteFields.find(f => f.key === 'floor_area_sqft')!;
    expect(formatSiteFieldValue({ attributes: { floor_area_sqft: 2400 } }, field, 'en')).toBe('2,400 sq ft');
    expect(formatSiteFieldValue({ attributes: {} }, field, 'en')).toBe('');
  });

  it('uses the singular unit for exactly one', () => {
    const floors = construction.siteFields.find(f => f.key === 'floors')!;
    expect(formatSiteFieldValue({ attributes: { floors: 1 } }, floors, 'en')).toBe('1 floor');
    expect(formatSiteFieldValue({ attributes: { floors: 2 } }, floors, 'en')).toBe('2 floors');
  });

  it('shows the coconut density metric only when it can be computed', () => {
    const density = coconut.siteMetrics![0];
    expect(density.value({ area_acres: 10, tree_count: 650 }, 'en')).toBe('65 / ac');
    expect(density.value({ area_acres: 0, tree_count: 0 }, 'en')).toBeNull();
  });
});

describe('capability checks', () => {
  it('knows who can post in a category', () => {
    const client = user({ roles: ['owner'], memberships: [{ category: 'construction', role: 'client' }] });
    expect(hasCapabilityIn(client, 'construction', 'poster')).toBe(true);
    expect(hasCapabilityIn(client, 'construction', 'bidder')).toBe(false);
    expect(hasCapabilityIn(client, 'coconut', 'poster')).toBe(false);
    expect(hasCapabilityIn(null, 'coconut', 'poster')).toBe(false);
  });

  it('counts a legacy owner as a coconut poster', () => {
    expect(hasCapabilityIn(user({ roles: ['owner'] }), 'coconut', 'poster')).toBe(true);
  });
});
