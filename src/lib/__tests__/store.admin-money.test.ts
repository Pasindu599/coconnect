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

const OWNER = '+94771234567'; // user-owner-1
const AWARD = 'award-302'; // job-102, held
const award = () => store.getState().awards.find(a => a.id === AWARD)!;
const job = () => store.getState().jobs.find(j => j.id === 'job-102')!;

const asOwner = () => {
  store.logout();
  store.verifyOtp(OWNER, '123456', 'owner');
};
const asAdmin = () => {
  store.logout();
  expect(store.adminLogin('niluka.fernando@coconnect.gov.lk', '9999').success).toBe(true);
};
const requestRelease = () => {
  asOwner();
  expect(store.confirmCompletion('job-102', '1234').success).toBe(true);
};
const openDispute = () => {
  asOwner();
  const res = store.openDispute({ award_id: AWARD, reason_code: 'WAGE_DISPUTE', description: 'The agreed rate was not honoured.' });
  expect(res.success).toBe(true);
  return res.success ? res.dispute.id : '';
};

describe('recordPayout', () => {
  it('moves an owner-confirmed job from "release requested" to "released" and keeps the transfer reference', () => {
    requestRelease();
    asAdmin();
    expect(store.recordPayout(AWARD, '  TRX-20261003-001 ')).toEqual({ success: true });
    expect(award()).toMatchObject({ escrow_status: 'released', payout_ref: 'TRX-20261003-001' });
    expect(award().payout_at).toBeTruthy();
    expect(store.getState().auditLogs.some(a => a.action === 'escrow.payout_recorded')).toBe(true);
  });

  it('needs a transfer reference', () => {
    requestRelease();
    asAdmin();
    expect(store.recordPayout(AWARD, '  ')).toEqual({ success: false, error: 'reference-required' });
    expect(store.recordPayout(AWARD, 'abc')).toEqual({ success: false, error: 'reference-required' });
    expect(award().escrow_status).toBe('release_requested');
  });

  it('is for admins only', () => {
    requestRelease();
    expect(store.recordPayout(AWARD, 'TRX-1')).toEqual({ success: false, error: 'unauthorized' }); // the owner
    store.logout();
    expect(store.recordPayout(AWARD, 'TRX-1')).toEqual({ success: false, error: 'unauthorized' }); // nobody
    store.verifyOtp('+94719876543', '123456', 'supervisor'); // the agent being paid
    expect(store.recordPayout(AWARD, 'TRX-1')).toEqual({ success: false, error: 'unauthorized' });
    expect(award().escrow_status).toBe('release_requested');
  });

  it('only pays out after the owner has confirmed completion', () => {
    asAdmin();
    expect(store.recordPayout(AWARD, 'TRX-1')).toEqual({ success: false, error: 'not-awaiting-payout' }); // still held
    expect(award().escrow_status).toBe('held');
  });

  it('cannot pay the same job twice', () => {
    requestRelease();
    asAdmin();
    expect(store.recordPayout(AWARD, 'TRX-1').success).toBe(true);
    expect(store.recordPayout(AWARD, 'TRX-2')).toEqual({ success: false, error: 'not-awaiting-payout' });
    expect(award().payout_ref).toBe('TRX-1');
  });

  it('rejects an unknown award', () => {
    asAdmin();
    expect(store.recordPayout('award-nope', 'TRX-1')).toEqual({ success: false, error: 'not-found' });
  });
});

describe('adminResolveDispute', () => {
  it('refunds the payment and closes the job', () => {
    const id = openDispute();
    asAdmin();
    expect(store.adminResolveDispute({ exception_id: id, outcome: 'refunded', notes: 'Workers confirmed absent.' })).toEqual({ success: true });
    expect(award().escrow_status).toBe('refunded');
    expect(job().status).toBe('CLOSED_DISPUTED');
    const dispute = store.getState().exceptions.find(e => e.id === id)!;
    expect(dispute).toMatchObject({ status: 'resolved', outcome: 'refunded', resolution: 'Workers confirmed absent.', resolved_by: 'Niluka Fernando' });
    expect(store.getState().auditLogs.some(a => a.action === 'dispute.refunded')).toBe(true);
  });

  it('can instead release the payment', () => {
    const id = openDispute();
    asAdmin();
    expect(store.adminResolveDispute({ exception_id: id, outcome: 'released', notes: 'Work was completed to standard.' }).success).toBe(true);
    expect(award().escrow_status).toBe('released');
    expect(job().status).toBe('COMPLETED');
  });

  it('needs a written reason', () => {
    const id = openDispute();
    asAdmin();
    expect(store.adminResolveDispute({ exception_id: id, outcome: 'refunded', notes: '  ' })).toEqual({ success: false, error: 'notes-required' });
    expect(award().escrow_status).toBe('disputed');
  });

  it('is for admins only', () => {
    const id = openDispute(); // signed in as the owner
    expect(store.adminResolveDispute({ exception_id: id, outcome: 'refunded', notes: 'I would like my money back' })).toEqual({ success: false, error: 'unauthorized' });
    expect(award().escrow_status).toBe('disputed');
  });

  it('cannot be resolved twice', () => {
    const id = openDispute();
    asAdmin();
    store.adminResolveDispute({ exception_id: id, outcome: 'refunded', notes: 'Refunded in full.' });
    expect(store.adminResolveDispute({ exception_id: id, outcome: 'released', notes: 'Changed my mind.' })).toEqual({ success: false, error: 'not-open' });
    expect(award().escrow_status).toBe('refunded');
  });

  it('leaves other kinds of exceptions to the text-only resolution', () => {
    asAdmin();
    expect(store.adminResolveDispute({ exception_id: 'exc-901', outcome: 'refunded', notes: 'Refund the whole job.' })).toEqual({ success: false, error: 'not-an-escrow-dispute' });
    expect(store.adminResolveException('exc-901', 'Wage adjusted.')).toBe(true);
  });

  it('rejects an unknown dispute', () => {
    asAdmin();
    expect(store.adminResolveDispute({ exception_id: 'exc-nope', outcome: 'refunded', notes: 'Does not exist.' })).toEqual({ success: false, error: 'not-found' });
  });

  it('leaves a refunded award closed: it cannot be funded or disputed again', () => {
    const id = openDispute();
    asAdmin();
    store.adminResolveDispute({ exception_id: id, outcome: 'refunded', notes: 'Refunded in full.' });
    asOwner();
    expect(store.payEscrow(AWARD).success).toBe(false);
    expect(store.openDispute({ award_id: AWARD, reason_code: 'WAGE_DISPUTE', description: 'Trying again after the refund.' })).toEqual({ success: false, error: 'not-disputable' });
  });
});

describe('the whole money lifecycle', () => {
  it('goes pending -> held -> release requested -> released, one step at a time', () => {
    asOwner();
    const pending = store.awardBid('bid-201').award!;
    expect(pending.escrow_status).toBe('pending');
    expect(store.payEscrow(pending.id).success).toBe(true);
    expect(store.getState().awards.find(a => a.id === pending.id)!.escrow_status).toBe('held');
    expect(store.confirmCompletion(pending.job_id, '1234').success).toBe(true);
    expect(store.getState().awards.find(a => a.id === pending.id)!.escrow_status).toBe('release_requested');
    asAdmin();
    expect(store.recordPayout(pending.id, 'TRX-LIFECYCLE-1').success).toBe(true);
    expect(store.getState().awards.find(a => a.id === pending.id)!.escrow_status).toBe('released');
  });
});
