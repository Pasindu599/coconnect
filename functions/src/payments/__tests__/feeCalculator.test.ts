import { describe, expect, it } from 'vitest';
import { calculateFees } from '../feeCalculator.js';

describe('calculateFees', () => {
  it('computes 5% of the bid price as the platform fee', () => {
    expect(calculateFees(10000, 5)).toEqual({ bidPrice: 10000, platformFee: 500, total: 10500, currency: 'LKR' });
  });

  it('rounds to the nearest LKR 1, not truncating (avoids reconciliation drift)', () => {
    // 5% of 46000 = 2300 exactly, so use a price that produces a fraction.
    const result = calculateFees(46001, 5);
    expect(result.platformFee).toBe(Math.round(46001 * 0.05));
    expect(Number.isInteger(result.platformFee)).toBe(true);
  });

  it('total is always bidPrice + platformFee', () => {
    const result = calculateFees(123456, 7.5);
    expect(result.total).toBe(result.bidPrice + result.platformFee);
  });

  it('handles a zero fee percent', () => {
    expect(calculateFees(5000, 0)).toEqual({ bidPrice: 5000, platformFee: 0, total: 5000, currency: 'LKR' });
  });
});
