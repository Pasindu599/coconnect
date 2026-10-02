import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_LIST,
  activeLegacyRoleIn,
  canRegisterWorkers,
  capabilityOfLegacyRole,
  categoryOf,
  formatSiteSummary,
  getRole,
  isCategoryId,
  membershipsInCategory,
  membershipsOf,
  rolesWithCapability,
} from '../categories';
import { tReviewTag, tSkill, tTaskType, translations } from '../../lib/i18n';
import type { Language } from '../../lib/i18n';
import type { User } from '../../types';

const LANGS: Language[] = ['en', 'si', 'ta'];

const user = (overrides: Partial<User>): User => ({
  id: 'u1',
  phone: '+94770000000',
  name: 'Test',
  roles: ['owner'],
  active_role: 'owner',
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

  it('keeps the coconut and construction task lists separate', () => {
    const coconut = new Set(CATEGORIES.coconut.taskTypes);
    expect(CATEGORIES.construction.taskTypes.some(t => coconut.has(t))).toBe(false);
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
    expect(canRegisterWorkers({ category: 'construction', role: 'subcontractor' })).toBe(true);
    expect(canRegisterWorkers({ category: 'construction', role: 'client' })).toBe(false);
    expect(canRegisterWorkers({ category: 'coconut', role: 'broker' })).toBe(true);
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
      { category: 'coconut', role: 'broker' },
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
