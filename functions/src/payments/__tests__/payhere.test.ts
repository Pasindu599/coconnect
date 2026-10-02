import { describe, expect, it } from 'vitest';
import { computeHash, formatAmount, PayHereProvider } from '../payhere.js';

describe('computeHash', () => {
  // Pinned fixture: computed once by hand from PayHere's documented v1
  // formula (md5(merchant_id+order_id+amount+currency+UPPER(md5(secret)))),
  // so an accidental change to the hash logic is caught even before real
  // sandbox credentials exist (1C-4). Re-verify against the live sandbox
  // once credentials land — see payments.md's "Open dependency" note.
  it('matches a known fixture', () => {
    const hash = computeHash('1211149', 'ORDER123', '1000.00', 'LKR', 'testsecret123');
    expect(hash).toBe('B6FEF0FFF977CD6D1817CFEF71CCBBF7');
  });

  it('is sensitive to every input (amount, order id, currency, secret)', () => {
    const base = computeHash('1211149', 'ORDER123', '1000.00', 'LKR', 'testsecret123');
    expect(computeHash('1211149', 'ORDER124', '1000.00', 'LKR', 'testsecret123')).not.toBe(base);
    expect(computeHash('1211149', 'ORDER123', '1000.01', 'LKR', 'testsecret123')).not.toBe(base);
    expect(computeHash('1211149', 'ORDER123', '1000.00', 'USD', 'testsecret123')).not.toBe(base);
    expect(computeHash('1211149', 'ORDER123', '1000.00', 'LKR', 'different-secret')).not.toBe(base);
  });

  it('is always uppercase hex', () => {
    const hash = computeHash('1211149', 'ORDER123', '1000.00', 'LKR', 'testsecret123');
    expect(hash).toMatch(/^[0-9A-F]{32}$/);
  });
});

describe('formatAmount', () => {
  it('always has exactly 2 decimals, no thousands separator', () => {
    expect(formatAmount(35700)).toBe('35700.00');
    expect(formatAmount(35700.5)).toBe('35700.50');
    expect(formatAmount(0)).toBe('0.00');
  });
});

describe('PayHereProvider.buildCheckout', () => {
  it('produces every field CONTRACTS C4 requires, with a hash matching the inputs', () => {
    const provider = new PayHereProvider({ merchantId: '1211149', merchantSecret: 'testsecret123', sandbox: true });
    const checkout = provider.buildCheckout({
      orderId: 'ORDER123',
      amount: 1000,
      currency: 'LKR',
      items: 'Coconnect escrow',
      returnUrl: 'https://app.example/return',
      cancelUrl: 'https://app.example/cancel',
      notifyUrl: 'https://app.example/notify',
      customer: {
        firstName: 'Sunil',
        lastName: 'Perera',
        email: 'sunil@example.lk',
        phone: '+94771234567',
        address: 'Kurunegala',
        city: 'Kurunegala',
        country: 'Sri Lanka',
      },
    });

    expect(checkout).toMatchObject({
      sandbox: true,
      merchant_id: '1211149',
      order_id: 'ORDER123',
      amount: '1000.00',
      currency: 'LKR',
      hash: 'B6FEF0FFF977CD6D1817CFEF71CCBBF7',
      first_name: 'Sunil',
      last_name: 'Perera',
    });
  });
});
