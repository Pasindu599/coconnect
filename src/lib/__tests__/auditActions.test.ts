import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { tAuditAction, type Language } from '../i18n';

/** Every action the store writes to the audit log must read as words, not a raw code, in each language. */
describe('audit action labels', () => {
  const source = readFileSync('src/lib/store.ts', 'utf8');
  // logAudit(actor, name, 'action.name', ...) — the third argument
  const actions = [...source.matchAll(/logAudit\([^,]+,\s*[^,]+,\s*'([a-z_.]+)'/g)].map(m => m[1]);

  it('finds the actions the store logs', () => {
    expect(actions.length).toBeGreaterThan(10);
  });

  it.each([...new Set(actions)])('%s is translated in every language', action => {
    for (const lang of ['en', 'si', 'ta'] as Language[]) {
      const label = tAuditAction(action, lang);
      expect(label, `${action} (${lang})`).not.toBe(action);
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

