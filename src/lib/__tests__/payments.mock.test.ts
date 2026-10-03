import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Store = typeof import('../store').store;
type Mock = typeof import('../payments.mock');

let store: Store;
let mock: Mock;
let memory: Record<string, string>;

beforeEach(async () => {
  memory = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in memory ? memory[k] : null),
    setItem: (k: string, v: string) => {
      memory[k] = v;
    },
    removeItem: (k: string) => {
      delete memory[k];
    },
  });
  vi.stubGlobal('window', { location: { href: 'http://localhost/#/coconut/dashboard' } });
  vi.useFakeTimers();
  vi.resetModules();
  store = (await import('../store')).store;
  mock = await import('../payments.mock');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fees', () => {
  it('adds a 5% platform fee on top of the bid price', () => {
    expect(mock.computeFees(35000)).toEqual({ bidPrice: 35000, platformFee: 1750, total: 36750, currency: 'LKR' });
  });

  it('rounds the fee to a whole rupee instead of truncating', () => {
    expect(mock.computeFees(33333).platformFee).toBe(1667); // 1666.65
    expect(mock.computeFees(33330).platformFee).toBe(1667); // 1666.50 rounds up
    expect(mock.computeFees(33329).platformFee).toBe(1666); // 1666.45
  });

  it('keeps total = bid price + fee', () => {
    for (const price of [1, 999, 45000, 123457]) {
      const fees = mock.computeFees(price);
      expect(fees.total).toBe(fees.bidPrice + fees.platformFee);
    }
  });

  it('formats amounts the way PayHere requires: two decimals, no separators', () => {
    expect(mock.formatPayHereAmount(36750)).toBe('36750.00');
    expect(mock.formatPayHereAmount(1234567.5)).toBe('1234567.50');
  });
});

describe('mockCreatePayment', () => {
  const create = async (awardId: string) => {
    const promise = mock.mockCreatePayment(awardId);
    const settled = promise.then(
      value => ({ value }),
      error => ({ error })
    );
    await vi.advanceTimersByTimeAsync(400);
    return settled;
  };

  const pendingAward = () => {
    store.verifyOtp('+94771234567', '123456', 'owner'); // seeded owner of job-101
    const res = store.awardBid('bid-201');
    expect(res.success).toBe(true);
    return res.award!;
  };

  it('returns the C4 shapes for the job owner', async () => {
    const award = pendingAward();
    const result = (await create(award.id)) as { value: Awaited<ReturnType<Mock['mockCreatePayment']>> };
    expect(result.value.fees.total).toBe(mock.computeFees(award.escrow_amount).total);
    expect(result.value.checkout.amount).toBe(result.value.fees.total.toFixed(2));
    expect(result.value.checkout.currency).toBe('LKR');
    expect(result.value.checkout.sandbox).toBe(true);
    expect(result.value.checkout.order_id).toContain(award.id);
  });

  it('rejects someone who does not own the job', async () => {
    const award = pendingAward();
    store.logout();
    store.verifyOtp('+94765551234', '123456', 'worker');
    const result = (await create(award.id)) as { error: Error };
    expect(result.error.message).toBe('permission-denied');
  });

  it('rejects a payment when nobody is signed in', async () => {
    const award = pendingAward();
    store.logout();
    expect(((await create(award.id)) as { error: Error }).error.message).toBe('permission-denied');
  });

  it('rejects an unknown award', async () => {
    store.verifyOtp('+94771234567', '123456', 'owner');
    expect(((await create('award-nope')) as { error: Error }).error.message).toBe('Award not found');
  });
});

describe('mockConfirmPayment (the webhook stand-in)', () => {
  it('does nothing until the confirmation fires, then holds the escrow and activates the job', async () => {
    store.verifyOtp('+94771234567', '123456', 'owner');
    const award = store.awardBid('bid-201').award!;
    expect(store.getState().awards.find(a => a.id === award.id)!.escrow_status).toBe('pending');

    mock.mockConfirmPayment(award.id, 1000);
    await vi.advanceTimersByTimeAsync(999);
    expect(store.getState().awards.find(a => a.id === award.id)!.escrow_status).toBe('pending');

    await vi.advanceTimersByTimeAsync(2);
    const held = store.getState().awards.find(a => a.id === award.id)!;
    expect(held.escrow_status).toBe('held');
    expect(held.contacts_released_at).toBeTruthy();
    expect(store.getState().jobs.find(j => j.id === award.job_id)!.status).toBe('ACTIVE');
  });
});
