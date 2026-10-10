/**
 * The security-definer SQL functions (supabase/migrations/*_functions.sql):
 * the escrow state machine end to end, as the real parties, through
 * supabase.rpc() exactly as src/lib/{escrow,payments}.ts call them.
 * Replaces functions/src/** tests and tests/integration.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { admin, awardedJob, bidder, cleanup, createTestUser, heldEscrow, ok, openJobWithBid, poster, uid, type TestUser } from './helpers';

afterAll(cleanup);

/** The `raise exception '<code>'` code, or the `{error}` a function returned. */
async function codeOf(op: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<string | null> {
  const { data, error } = await op;
  if (error) return error.message;
  if (data && typeof data === 'object' && 'error' in data) return String((data as { error: unknown }).error);
  return null;
}

async function submitCompletion(owner: TestUser, broker: TestUser, jobId: string) {
  const id = uid('comp');
  await ok(
    broker.client
      .from('completions')
      .insert({ id, job_id: jobId, owner_id: owner.id, submitted_by: broker.id, status: 'pending', wage_records: [], total_wages: 0, supervisor_fee: 0 })
  );
  return id;
}

describe('add_membership', () => {
  it('adds a valid role once (idempotent) and refuses admin or a role from another category', async () => {
    const me = await createTestUser();
    await ok(me.client.rpc('add_membership', { p_category: 'construction', p_role: 'client' }));
    await ok(me.client.rpc('add_membership', { p_category: 'construction', p_role: 'client' }));
    const { data } = await ok(admin.from('users').select('memberships').eq('id', me.id).single());
    expect(data.memberships).toEqual([{ category: 'construction', role: 'client' }]);

    expect(await codeOf(me.client.rpc('add_membership', { p_category: 'coconut', p_role: 'admin' }))).toBe('invalid-argument');
    expect(await codeOf(me.client.rpc('add_membership', { p_category: 'coconut', p_role: 'contractor' }))).toBe('invalid-argument');
  });

  it('refuses the retired broker and subcontractor roles (ADR-015)', async () => {
    const me = await createTestUser();
    expect(await codeOf(me.client.rpc('add_membership', { p_category: 'coconut', p_role: 'broker' }))).toBe('invalid-argument');
    expect(await codeOf(me.client.rpc('add_membership', { p_category: 'construction', p_role: 'subcontractor' }))).toBe('invalid-argument');
    await ok(me.client.rpc('add_membership', { p_category: 'coconut', p_role: 'agent' }));
  });

  it('takes effect in RLS immediately, with no token refresh', async () => {
    const me = await createTestUser();
    const estate = { id: uid('est'), category: 'coconut', owner_id: me.id, name: 'E' };
    expect((await me.client.from('estates').insert(estate)).error).not.toBeNull();
    await ok(me.client.rpc('add_membership', { p_category: 'coconut', p_role: 'owner' }));
    await ok(me.client.from('estates').insert(estate));
  });
});

describe('set_admin', () => {
  it('only an existing admin can grant admin', async () => {
    const me = await createTestUser();
    const staff = await createTestUser({ isAdmin: true });
    expect(await codeOf(me.client.rpc('set_admin', { p_uid: me.id }))).toBe('permission-denied');
    await ok(staff.client.rpc('set_admin', { p_uid: me.id }));
    const { data } = await ok(admin.from('users').select('is_admin').eq('id', me.id).single());
    expect(data.is_admin).toBe(true);
  });
});

describe('award_bid', () => {
  it('accepts the bid, rejects the rest, moves the job on and creates the award', async () => {
    const owner = await poster();
    const broker = await bidder();
    const rival = await bidder();
    const { job, bid } = await openJobWithBid(owner, broker, 12000);
    const rivalBid = { ...bid, id: uid('bid'), supervisor_id: rival.id };
    await ok(rival.client.from('bids').insert(rivalBid));

    const awardId = uid('award');
    const { data } = await ok(owner.client.rpc('award_bid', { p_bid_id: bid.id, p_award_id: awardId }));
    expect(data).toEqual({ awardId });

    const [{ data: bids }, { data: jobRow }, { data: award }] = await Promise.all([
      admin.from('bids').select('id, status').eq('job_id', job.id),
      admin.from('jobs').select('status, supervisor_id').eq('id', job.id).single(),
      admin.from('awards').select('*').eq('id', awardId).single(),
    ]);
    expect(Object.fromEntries((bids ?? []).map((b) => [b.id, b.status]))).toEqual({ [bid.id]: 'accepted', [rivalBid.id]: 'rejected' });
    expect(jobRow).toEqual({ status: 'AWARDED_PENDING_FEE', supervisor_id: broker.id });
    expect(award).toMatchObject({ owner_id: owner.id, supervisor_id: broker.id, escrow_status: 'pending', escrow_amount: 12000 });
  });

  it('only the job owner can award, only once, only while OPEN', async () => {
    const owner = await poster();
    const broker = await bidder();
    const { bid } = await openJobWithBid(owner, broker);
    expect(await codeOf(broker.client.rpc('award_bid', { p_bid_id: bid.id, p_award_id: uid('award') }))).toBe('permission-denied');
    await ok(owner.client.rpc('award_bid', { p_bid_id: bid.id, p_award_id: uid('award') }));
    expect(await codeOf(owner.client.rpc('award_bid', { p_bid_id: bid.id, p_award_id: uid('award') }))).toBe('failed-precondition');
    expect(await codeOf(owner.client.rpc('award_bid', { p_bid_id: 'nope', p_award_id: uid('award') }))).toBe('not-found');
  });
});

describe('create_payment_intent + payhere_apply_notify', () => {
  it('computes the 5% fee, reuses a fresh pending payment, and refuses non-owners', async () => {
    const owner = await poster();
    const broker = await bidder();
    const { awardId } = await awardedJob(owner, broker, 10000);
    const first = await ok(owner.client.rpc('create_payment_intent', { p_award_id: awardId }));
    expect(first.data.fees).toEqual({ bidPrice: 10000, platformFee: 500, total: 10500, currency: 'LKR' });
    const second = await ok(owner.client.rpc('create_payment_intent', { p_award_id: awardId }));
    expect(second.data.paymentId).toBe(first.data.paymentId);
    expect(await codeOf(broker.client.rpc('create_payment_intent', { p_award_id: awardId }))).toBe('permission-denied');
  });

  it('a verified notify holds escrow once, writes the hold ledger entry, and is idempotent', async () => {
    const owner = await poster();
    const broker = await bidder();
    const { awardId, paymentId, job } = await heldEscrow(owner, broker, 10000);

    const { data: award } = await ok(admin.from('awards').select('escrow_status, escrow_amount').eq('id', awardId).single());
    expect(award).toEqual({ escrow_status: 'held', escrow_amount: 10500 });
    const { data: jobRow } = await ok(admin.from('jobs').select('status').eq('id', job.id).single());
    expect(jobRow.status).toBe('ACTIVE');

    const again = await ok(admin.rpc('payhere_apply_notify', { p_order_id: paymentId, p_amount: '10500.00', p_status_code: '2', p_provider_ref: 'PH-TEST' }));
    expect(again.data).toBe('already-paid');
    const { data: ledger } = await ok(admin.from('ledger').select('type, amount').eq('award_id', awardId));
    expect(ledger).toEqual([{ type: 'hold', amount: 10500 }]);

    expect(await codeOf(owner.client.rpc('create_payment_intent', { p_award_id: awardId }))).toBe('already-exists');
  });

  it('a notify with the wrong amount changes nothing; clients cannot call it at all', async () => {
    const owner = await poster();
    const broker = await bidder();
    const { awardId } = await awardedJob(owner, broker, 10000);
    const { data: intent } = await ok(owner.client.rpc('create_payment_intent', { p_award_id: awardId }));
    const tampered = await ok(admin.rpc('payhere_apply_notify', { p_order_id: intent.paymentId, p_amount: '1.00', p_status_code: '2', p_provider_ref: null }));
    expect(tampered.data).toBe('amount-mismatch');
    const { data: award } = await ok(admin.from('awards').select('escrow_status').eq('id', awardId).single());
    expect(award.escrow_status).toBe('pending');

    expect((await owner.client.rpc('payhere_apply_notify', { p_order_id: intent.paymentId, p_amount: '10500.00', p_status_code: '2', p_provider_ref: null })).error).not.toBeNull();
  });
});

describe('confirm_completion', () => {
  it('with the right PIN: held -> release_requested and the job COMPLETED', async () => {
    const owner = await createTestUser({ memberships: [{ category: 'coconut', role: 'owner' }], pin: '1234' });
    const broker = await bidder();
    const { awardId, job } = await heldEscrow(owner, broker);
    const completionId = await submitCompletion(owner, broker, job.id);

    expect(await codeOf(broker.client.rpc('confirm_completion', { p_completion_id: completionId, p_pin: '1234' }))).toBe('permission-denied');
    await ok(owner.client.rpc('confirm_completion', { p_completion_id: completionId, p_pin: '1234' }));
    const { data: award } = await ok(admin.from('awards').select('escrow_status').eq('id', awardId).single());
    expect(award.escrow_status).toBe('release_requested');
  });

  it('locks out after 5 wrong PINs (the attempt counter survives each failure)', async () => {
    const owner = await createTestUser({ memberships: [{ category: 'coconut', role: 'owner' }], pin: '1234' });
    const broker = await bidder();
    const { job } = await heldEscrow(owner, broker);
    const completionId = await submitCompletion(owner, broker, job.id);
    for (let i = 0; i < 5; i++) {
      expect(await codeOf(owner.client.rpc('confirm_completion', { p_completion_id: completionId, p_pin: '0000' }))).toBe('permission-denied');
    }
    expect(await codeOf(owner.client.rpc('confirm_completion', { p_completion_id: completionId, p_pin: '1234' }))).toBe('resource-exhausted');
  });

  it('refuses while escrow is not held', async () => {
    const owner = await createTestUser({ memberships: [{ category: 'coconut', role: 'owner' }], pin: '1234' });
    const broker = await bidder();
    const { job } = await awardedJob(owner, broker);
    const completionId = await submitCompletion(owner, broker, job.id);
    expect(await codeOf(owner.client.rpc('confirm_completion', { p_completion_id: completionId, p_pin: '1234' }))).toBe('failed-precondition');
  });
});

describe('disputes and payouts', () => {
  it('a party opens a dispute (escrow frozen); an admin releases it', async () => {
    const owner = await poster();
    const broker = await bidder();
    const stranger = await poster();
    const staff = await createTestUser({ isAdmin: true });
    const { awardId } = await heldEscrow(owner, broker);

    expect(await codeOf(stranger.client.rpc('open_dispute', { p_award_id: awardId, p_reason: 'x' }))).toBe('permission-denied');
    const { data } = await ok(broker.client.rpc('open_dispute', { p_award_id: awardId, p_reason: 'Owner unreachable' }));
    const disputeId = (data as { disputeId: string }).disputeId;
    const { data: frozen } = await ok(admin.from('awards').select('escrow_status').eq('id', awardId).single());
    expect(frozen.escrow_status).toBe('disputed');

    expect(await codeOf(owner.client.rpc('resolve_dispute', { p_dispute_id: disputeId, p_resolution: 'released' }))).toBe('permission-denied');
    // Refunds need the PayHere refund API (1C-4): always `internal`, dispute stays open
    expect(await codeOf(staff.client.rpc('resolve_dispute', { p_dispute_id: disputeId, p_resolution: 'refunded' }))).toBe('internal');
    await ok(staff.client.rpc('resolve_dispute', { p_dispute_id: disputeId, p_resolution: 'released' }));
    const { data: released } = await ok(admin.from('awards').select('escrow_status').eq('id', awardId).single());
    expect(released.escrow_status).toBe('released');
  });

  it('an admin records a payout of escrow minus the fee, and the award reconciles', async () => {
    const owner = await createTestUser({ memberships: [{ category: 'coconut', role: 'owner' }], pin: '1234' });
    const broker = await bidder();
    const staff = await createTestUser({ isAdmin: true });
    const { awardId, job } = await heldEscrow(owner, broker, 10000);

    expect(await codeOf(staff.client.rpc('record_payout', { p_award_id: awardId, p_bank_transfer_ref: 'TX-1' }))).toBe('failed-precondition');
    const completionId = await submitCompletion(owner, broker, job.id);
    await ok(owner.client.rpc('confirm_completion', { p_completion_id: completionId, p_pin: '1234' }));

    expect(await codeOf(owner.client.rpc('record_payout', { p_award_id: awardId, p_bank_transfer_ref: 'TX-1' }))).toBe('permission-denied');
    const { data } = await ok(staff.client.rpc('record_payout', { p_award_id: awardId, p_bank_transfer_ref: 'TX-1' }));
    expect(data).toEqual({ ok: true, payoutAmount: 10000 });

    const { data: award } = await ok(admin.from('awards').select('escrow_status, payout_ref, payout_amount').eq('id', awardId).single());
    expect(award).toEqual({ escrow_status: 'released', payout_ref: 'TX-1', payout_amount: 10000 });

    const { data: rows } = await ok(staff.client.rpc('reconcile_awards'));
    expect((rows as Array<{ award_id: string; balanced: boolean }>).find((r) => r.award_id === awardId)?.balanced).toBe(true);
    expect(await codeOf(owner.client.rpc('reconcile_awards'))).toBe('permission-denied');
  });
});
