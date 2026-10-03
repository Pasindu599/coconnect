import { describe, expect, it } from 'vitest';
import { AUTH_ERROR_CODES, authErrorKey, authErrorMessage } from '../authErrors';
import { translations, type Language } from '../i18n';

const LANGS: Language[] = ['en', 'si', 'ta'];

describe('authErrors', () => {
  it('has wording for every AuthError code in every language', () => {
    expect(AUTH_ERROR_CODES.length).toBeGreaterThanOrEqual(8);
    for (const code of AUTH_ERROR_CODES) {
      for (const lang of LANGS) {
        const text = translations[lang][authErrorKey(code)];
        expect(text, `${code} (${lang})`).toBeTruthy();
      }
    }
  });

  it('gives each code its own message, except not-staff which reuses the staff wording', () => {
    const texts = AUTH_ERROR_CODES.map(code => translations.en[authErrorKey(code)]);
    expect(new Set(texts).size).toBe(AUTH_ERROR_CODES.length);
  });

  it('falls back to the generic message for an unknown code', () => {
    expect(authErrorKey('something-new')).toBe('auth_err_unknown');
  });

  it('reads the code off an error, and treats anything else as unknown', () => {
    const t = translations.en;
    expect(authErrorMessage({ code: 'code-expired' }, t)).toBe(t.auth_err_code_expired);
    expect(authErrorMessage(new Error('x'), t)).toBe(t.auth_err_unknown);
    expect(authErrorMessage(undefined, t)).toBe(t.auth_err_unknown);
    expect(authErrorMessage('oops', t)).toBe(t.auth_err_unknown);
  });
});
