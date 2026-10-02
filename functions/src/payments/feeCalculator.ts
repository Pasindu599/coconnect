export interface FeeBreakdown {
  bidPrice: number;
  platformFee: number;
  total: number;
  currency: 'LKR';
}

/**
 * ADR-011: 5% flat, read from config/platform so it's adjustable without a
 * redeploy. platformFee is rounded to the nearest LKR 1 (not truncated —
 * payments.md flags truncation as a source of 1-cent reconciliation drift).
 */
export function calculateFees(bidPrice: number, feePercent: number): FeeBreakdown {
  const platformFee = Math.round(bidPrice * (feePercent / 100));
  return { bidPrice, platformFee, total: bidPrice + platformFee, currency: 'LKR' };
}
