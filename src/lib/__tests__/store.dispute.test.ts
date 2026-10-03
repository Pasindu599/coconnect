import { beforeEach, describe, expect, it, vi } from 'vitest';

type Store = typeof import('../store').store;
let store: Store;

beforeEach(async () => {
  const memory: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in memory ? memory[k] : null),
    setItem: (k: string, v: string) => void (memory[k] = v),
    removeItem: (k: string) => void delete memory[k],
  });
  vi.resetModules();
  store = (await import('../store')).store;
});

const OWNER = '+94771234567'; // user-owner-1, owns job-102
const BROKER = '+94719876543'; // user-sup-1, the supervisor on award-302
const HELD_AWARD = 'award-302'; // job-102, escrow held
const award = (id: string) => store.getState().awards.find(a => a.id === id)!;
const dispute = (awardId = HELD_AWARD, description = 'Three of the five workers never turned up on site.') =>
  store.openDispute({ award_id: awardId, reason_code: 'WORKER_NO_SHOW', description });

describe('openDispute', () => {
  it('lets the job owner freeze a held escrow', () => {
    store.verifyOtp(OWNER, '123456', 'owner');
    const res = dispute();
    expect(res.success).toBe(true);
    expect(award(HELD_AWARD).escrow_status).toBe('disputed');
    expect(store.getState().jobs.find(j => j.id === 'job-102')!.status).toBe('EXCEPTION_OPEN');
    if (res.success) {
      expect(res.dispute).toMatchObject({ status: 'open', subject_id: HELD_AWARD, raised_by: 'user-owner-1', reason_code: 'WORKER_NO_SHOW' });
      expect(store.getState().exceptions[0]).toBe(res.dispute);
    }
    expect(store.getState().auditLogs.some(a => a.action === 'dispute.opened')).toBe(true);
  });

  it('lets the supervisor on the award open one too', () => {
    store.verifyOtp(BROKER, '123456', 'supervisor');
    expect(dispute().success).toBe(true);
    expect(award(HELD_AWARD).escrow_status).toBe('disputed');
  });

  it('refuses anyone who is not a party to the award', () => {
    store.verifyOtp('+94765551234', '123456', 'worker');
    expect(dispute()).toEqual({ success: false, error: 'not-party' });
    expect(award(HELD_AWARD).escrow_status).toBe('held');
  });

  it('refuses when nobody is signed in', () => {
    expect(dispute()).toEqual({ success: false, error: 'unauthorized' });
  });

  it('refuses an unknown award', () => {
    store.verifyOtp(OWNER, '123456', 'owner');
    expect(dispute('award-nope')).toEqual({ success: false, error: 'not-found' });
  });

  it('only disputes money that is in escrow', () => {
    store.verifyOtp(OWNER, '123456', 'owner');
    const pending = store.awardBid('bid-201').award!; // awarded, not paid yet
    expect(dispute(pending.id)).toEqual({ success: false, error: 'not-disputable' });

    const released = store.getState().awards.find(a => a.escrow_status === 'released')!;
    expect(dispute(released.id)).toEqual({ success: false, error: 'not-disputable' });
  });

  it('cannot be opened twice for the same award', () => {
    store.verifyOtp(OWNER, '123456', 'owner');
    expect(dispute().success).toBe(true);
    expect(dispute()).toEqual({ success: false, error: 'not-disputable' });
    expect(store.getState().exceptions.filter(e => e.subject_id === HELD_AWARD && e.status === 'open')).toHaveLength(1);
  });

  it('needs a real description', () => {
    store.verifyOtp(OWNER, '123456', 'owner');
    expect(dispute(HELD_AWARD, '   short  ')).toEqual({ success: false, error: 'description-too-short' });
    expect(award(HELD_AWARD).escrow_status).toBe('held');
  });
});

describe('a dispute freezes the money', () => {
  it('stops the owner confirming completion and releasing it', () => {
    store.verifyOtp(OWNER, '123456', 'owner');
    dispute();
    const res = store.confirmCompletion('job-102', '1234');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/frozen/i);
    expect(award(HELD_AWARD).escrow_status).toBe('disputed');
  });

  it('stops a late payment confirmation from turning the escrow back to held', () => {
    store.verifyOtp(OWNER, '123456', 'owner');
    dispute();
    expect(store.payEscrow(HELD_AWARD).success).toBe(false);
    expect(award(HELD_AWARD).escrow_status).toBe('disputed');
  });
});

describe('confirmCompletion guards', () => {
  it('only lets the job owner confirm', () => {
    store.verifyOtp(BROKER, '123456', 'supervisor');
    const res = store.confirmCompletion('job-102', '2244');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/owner/i);
    expect(award(HELD_AWARD).escrow_status).toBe('held');
  });

  it('needs money in escrow', () => {
    store.verifyOtp(OWNER, '123456', 'owner');
    expect(store.confirmCompletion('job-101', '1234').success).toBe(false); // no award yet
  });

  it('requests the release for the owner with the right PIN; the money has not left escrow yet', () => {
    store.verifyOtp(OWNER, '123456', 'owner');
    expect(store.confirmCompletion('job-102', '1234').success).toBe(true);
    expect(award(HELD_AWARD).escrow_status).toBe('release_requested');
  });

  it('rejects a wrong PIN without releasing anything', () => {
    store.verifyOtp(OWNER, '123456', 'owner');
    expect(store.confirmCompletion('job-102', '0000').success).toBe(false);
    expect(award(HELD_AWARD).escrow_status).toBe('held');
  });
});

describe('payEscrow guard', () => {
  it('only funds an award that is waiting for payment', () => {
    store.verifyOtp(OWNER, '123456', 'owner');
    expect(store.payEscrow(HELD_AWARD).success).toBe(false); // already held
    const pending = store.awardBid('bid-201').award!;
    expect(store.payEscrow(pending.id).success).toBe(true);
    expect(store.payEscrow(pending.id).success).toBe(false); // second confirmation is a no-op
  });
});

describe('bank updates', () => {
  it('lets a supervisor change the bank details of their own worker only', () => {
    store.verifyOtp(BROKER, '123456', 'supervisor');
    expect(store.updateWorkerBank('worker-1', 'SAM 11112222')).toEqual({ success: true });
    expect(store.getState().workers.find(w => w.id === 'worker-1')!.bank_ref).toBe('SAM 11112222');

    store.logout();
    store.verifyOtp('+94772000002', '123456'); // a construction contractor
    expect(store.updateWorkerBank('worker-1', 'BOC 99999999')).toEqual({ success: false, error: 'unauthorized' });
    expect(store.updateWorkerBank('worker-nope', 'BOC 99999999')).toEqual({ success: false, error: 'not-found' });
    expect(store.getState().workers.find(w => w.id === 'worker-1')!.bank_ref).toBe('SAM 11112222');
  });

  it('keeps a person payout account on their own record', () => {
    expect(store.updatePayoutBank('BOC 123456')).toEqual({ success: false, error: 'unauthorized' });
    store.verifyOtp(BROKER, '123456', 'supervisor');
    expect(store.updatePayoutBank('COM 55556666')).toEqual({ success: true });
    expect(store.getState().currentUser!.payout_bank_ref).toBe('COM 55556666');
  });
});
