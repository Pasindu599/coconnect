import { describe, expect, it } from 'vitest';
import { formatMoney } from '../money';

describe('formatMoney', () => {
  it('uses each language\'s own currency prefix', () => {
    expect(formatMoney(145000, 'en')).toBe('LKR 145,000');
    expect(formatMoney(145000, 'si')).toBe('රු. 145,000');
    expect(formatMoney(145000, 'ta')).toBe('ரூ. 145,000');
  });

  it('groups thousands the same way whatever the browser locale', () => {
    expect(formatMoney(1234567, 'en')).toBe('LKR 1,234,567');
  });

  it('rounds to whole rupees and handles zero', () => {
    expect(formatMoney(0, 'en')).toBe('LKR 0');
    expect(formatMoney(1749.6, 'en')).toBe('LKR 1,750');
  });
});
