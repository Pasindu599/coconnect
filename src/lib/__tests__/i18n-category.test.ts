import { describe, expect, it } from 'vitest';
import { getCategoryT, getT, translations, type Language } from '../i18n';

const LANGS: Language[] = ['en', 'si', 'ta'];

describe('getCategoryT', () => {
  it('returns the base dictionary for coconut and for no category', () => {
    for (const lang of LANGS) {
      expect(getCategoryT(lang, 'coconut')).toBe(getT(lang));
      expect(getCategoryT(lang, null)).toBe(getT(lang));
      expect(getCategoryT(lang, undefined)).toBe(getT(lang));
    }
  });

  it('replaces coconut wording with construction wording', () => {
    const t = getCategoryT('en', 'construction');
    expect(t.my_lands).toBe('My Construction Sites');
    expect(t.owner_hub_title).toBe('Client Operations Hub');
    expect(t.sup_portal_title).toBe('Contractor Portal');
    expect(getT('en').sup_portal_title).toBe('Agent Portal');
    expect(getT('en').my_lands).toContain('Coconut');
  });

  it('keeps keys that construction does not override', () => {
    const t = getCategoryT('en', 'construction');
    expect(t.login).toBe(getT('en').login);
    expect(t.common_cancel).toBe(getT('en').common_cancel);
  });

  it('works in every language and leaves no key empty', () => {
    for (const lang of LANGS) {
      const t = getCategoryT(lang, 'construction');
      expect(Object.keys(t).sort()).toEqual(Object.keys(translations[lang]).sort());
      for (const [key, value] of Object.entries(t)) {
        expect(value, `${key} (${lang})`).toBeTruthy();
      }
    }
  });

  it('does not leak the construction wording into the base dictionary', () => {
    getCategoryT('en', 'construction');
    expect(getT('en').my_lands).not.toContain('Construction');
  });

  it('caches the merged dictionary', () => {
    expect(getCategoryT('si', 'construction')).toBe(getCategoryT('si', 'construction'));
  });
});

describe('dictionaries', () => {
  it('has the same keys in English, Sinhala and Tamil', () => {
    const en = Object.keys(translations.en).sort();
    expect(Object.keys(translations.si).sort()).toEqual(en);
    expect(Object.keys(translations.ta).sort()).toEqual(en);
  });

  it('keeps {placeholders} identical across languages', () => {
    const placeholders = (s: string) => (s.match(/\{[a-z_]+\}/g) ?? []).sort().join(',');
    for (const [key, value] of Object.entries(translations.en)) {
      for (const lang of ['si', 'ta'] as Language[]) {
        const other = (translations[lang] as Record<string, string>)[key];
        expect(placeholders(other), `${key} (${lang})`).toBe(placeholders(value));
      }
    }
  });
});
