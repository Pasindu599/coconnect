import { store } from './store';
import type { FeeBreakdown, PayHereCheckout } from '../types/payments';

/**
 * Sandbox stand-in for Session 1's `createPayment` Function (CONTRACTS C4), used until S1-09
 * ships. It returns the same shapes, so the checkout UI does not change when the real one
 * replaces it. Nothing here is signed or secure: the hash is a placeholder.
 */

/** Matches the proposed default in .claude/docs/specs/payments.md; the real fee is decided server-side. */
export const MOCK_PLATFORM_FEE_PERCENT = 5;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** PayHere wants exactly two decimals and no thousands separator. */
export const formatPayHereAmount = (amount: number): string => amount.toFixed(2);

export const computeFees = (bidPrice: number): FeeBreakdown => {
  const platformFee = Math.round((bidPrice * MOCK_PLATFORM_FEE_PERCENT) / 100);
  return { bidPrice, platformFee, total: bidPrice + platformFee, currency: 'LKR' };
};

export const mockCreatePayment = async (awardId: string): Promise<{ checkout: PayHereCheckout; fees: FeeBreakdown }> => {
  await wait(350);
  const { awards, jobs, currentUser } = store.getState();
  const award = awards.find(a => a.id === awardId);
  if (!award) throw new Error('Award not found');
  const job = jobs.find(j => j.id === award.job_id);
  if (!currentUser || job?.owner_id !== currentUser.id) throw new Error('permission-denied');

  const fees = computeFees(award.escrow_amount);
  const [first, ...rest] = currentUser.name.split(' ');
  return {
    fees,
    checkout: {
      sandbox: true,
      merchant_id: 'SANDBOX-MOCK',
      order_id: `mock-${award.id}`,
      items: job ? job.task_type : 'Labour job',
      amount: formatPayHereAmount(fees.total),
      currency: 'LKR',
      hash: 'MOCK-HASH-NOT-SIGNED',
      return_url: window.location.href,
      cancel_url: window.location.href,
      notify_url: 'https://example.invalid/payhere/notify',
      first_name: first,
      last_name: rest.join(' ') || first,
      email: 'sandbox@coconnect.invalid',
      phone: currentUser.phone,
      address: currentUser.location ?? 'Sri Lanka',
      city: 'Colombo',
      country: 'Sri Lanka',
    },
  };
};

/**
 * Stands in for the PayHere webhook: a moment after "payment", the escrow turns `held`. In the
 * real flow only the `payhereNotify` Function can do this; the UI never does.
 */
export const mockConfirmPayment = (awardId: string, delayMs = 1200): void => {
  setTimeout(() => store.payEscrow(awardId), delayMs);
};
