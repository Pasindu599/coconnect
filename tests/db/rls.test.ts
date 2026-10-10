/**
 * Row Level Security (supabase/migrations/*_rls.sql). Ported from the old
 * tests/rules/firestore.test.ts case by case, plus the checks RLS added.
 *
 * Two kinds of "no" under Postgres: a denied INSERT, or a write to a column
 * the client has no grant on, returns an error; an UPDATE/DELETE that RLS
 * filters out just touches zero rows. `touched()` counts rows for the latter.
 */
import { afterAll, describe, expect, it } from 'vitest';
import {
  admin,
  anon,
  awardedJob,
  bidder,
  bidRow,
  cleanup,
  createTestUser,
  estateRow,
  jobRow,
  ok,
  openJobWithBid,
  poster,
  uid,
} from './helpers';

afterAll(cleanup);

async function touched(op: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) {
  const { data, error } = await op;
  if (error) return -1;
  return data?.length ?? 0;
}

describe('users', () => {
  it('a user can read and update their own profile fields', async () => {
    const me = await poster();
    const { data } = await ok(me.client.from('users').select('*').eq('id', me.id).single());
    expect(data.id).toBe(me.id);
    expect(await touched(me.client.from('users').update({ active_category: 'construction' }).eq('id', me.id).select('id'))).toBe(1);
  });

  it('a stranger cannot read another user; an admin can', async () => {
    const me = await poster();
    const stranger = await poster();
    const staff = await createTestUser({ isAdmin: true });
    expect((await stranger.client.from('users').select('id').eq('id', me.id)).data).toEqual([]);
    expect((await staff.client.from('users').select('id').eq('id', me.id)).data).toHaveLength(1);
  });

  it('a client cannot grant itself a membership, admin, or verify its own NIC', async () => {
    const me = await poster();
    for (const patch of [
      { memberships: [{ category: 'coconut', role: 'agent' }] },
      { is_admin: true },
      { nic_status: 'verified' },
      { trust_score: 5 },
    ]) {
      const { error } = await me.client.from('users').update(patch).eq('id', me.id);
      expect(error, JSON.stringify(patch)).not.toBeNull();
    }
  });

  it('a client cannot insert a profile row (the auth trigger does)', async () => {
    const me = await poster();
    const { error } = await me.client.from('users').insert({ id: me.id, name: 'x' });
    expect(error).not.toBeNull();
  });

  it('nobody but the server can read completion PINs', async () => {
    const me = await createTestUser({ pin: '1234' });
    const { data, error } = await me.client.from('user_pins').select('*');
    expect(error ?? data?.length === 0).toBeTruthy();
  });
});

describe('estates', () => {
  it('a poster can create their own estate; a bidder cannot', async () => {
    const owner = await poster();
    const broker = await bidder();
    await ok(owner.client.from('estates').insert(estateRow(owner.id)));
    expect((await broker.client.from('estates').insert(estateRow(broker.id))).error).not.toBeNull();
  });

  it('cannot create an estate owned by someone else', async () => {
    const owner = await poster();
    const other = await poster();
    expect((await owner.client.from('estates').insert(estateRow(other.id))).error).not.toBeNull();
  });

  it('a construction client is not a coconut poster', async () => {
    const client = await poster('construction');
    expect((await client.client.from('estates').insert(estateRow(client.id))).error).not.toBeNull();
    await ok(client.client.from('estates').insert(estateRow(client.id, { category: 'construction' })));
  });

  it('any signed-in user can read; only the owner can update or delete', async () => {
    const owner = await poster();
    const other = await poster();
    const estate = estateRow(owner.id);
    await ok(owner.client.from('estates').insert(estate));
    expect((await other.client.from('estates').select('id').eq('id', estate.id)).data).toHaveLength(1);
    expect(await touched(other.client.from('estates').update({ name: 'hijack' }).eq('id', estate.id).select('id'))).toBe(0);
    expect(await touched(other.client.from('estates').delete().eq('id', estate.id).select('id'))).toBe(0);
    expect(await touched(owner.client.from('estates').update({ name: 'renamed' }).eq('id', estate.id).select('id'))).toBe(1);
  });
});

describe('jobs', () => {
  it('a poster can create an OPEN job, not one already past OPEN', async () => {
    const owner = await poster();
    const estate = estateRow(owner.id);
    await ok(owner.client.from('estates').insert(estate));
    await ok(owner.client.from('jobs').insert(jobRow(owner.id, estate.id)));
    expect((await owner.client.from('jobs').insert(jobRow(owner.id, estate.id, { status: 'ACTIVE' }))).error).not.toBeNull();
  });

  it('owner can move OPEN -> CANCELLED, not to ACTIVE; a non-owner cannot edit', async () => {
    const owner = await poster();
    const other = await poster();
    const estate = estateRow(owner.id);
    await ok(owner.client.from('estates').insert(estate));
    const job = jobRow(owner.id, estate.id);
    await ok(owner.client.from('jobs').insert(job));

    expect(await touched(owner.client.from('jobs').update({ status: 'ACTIVE' }).eq('id', job.id).select('id'))).toBe(-1);
    expect(await touched(other.client.from('jobs').update({ status: 'CANCELLED' }).eq('id', job.id).select('id'))).toBe(0);
    expect(await touched(owner.client.from('jobs').update({ status: 'CANCELLED' }).eq('id', job.id).select('id'))).toBe(1);
    // CANCELLED is past the editable states
    expect(await touched(owner.client.from('jobs').update({ status: 'OPEN' }).eq('id', job.id).select('id'))).toBe(0);
  });

  it('the owner cannot set supervisor_id themselves, and no client can delete a job', async () => {
    const owner = await poster();
    const estate = estateRow(owner.id);
    await ok(owner.client.from('estates').insert(estate));
    const job = jobRow(owner.id, estate.id);
    await ok(owner.client.from('jobs').insert(job));
    expect((await owner.client.from('jobs').update({ supervisor_id: owner.id }).eq('id', job.id)).error).not.toBeNull();
    expect(await touched(owner.client.from('jobs').delete().eq('id', job.id).select('id'))).toBe(-1);
  });
});

describe('bids (sealed)', () => {
  it('a bidder can bid on an open job; a poster cannot bid', async () => {
    const owner = await poster();
    const broker = await bidder();
    const { job } = await openJobWithBid(owner, broker);
    expect((await owner.client.from('bids').insert(bidRow(job.id, owner.id, owner.id))).error).not.toBeNull();
  });

  it('cannot bid on a job that is not OPEN, or create a bid already accepted', async () => {
    const owner = await poster();
    const broker = await bidder();
    const estate = estateRow(owner.id);
    await ok(owner.client.from('estates').insert(estate));
    const draft = jobRow(owner.id, estate.id, { status: 'DRAFT' });
    await ok(owner.client.from('jobs').insert(draft));
    expect((await broker.client.from('bids').insert(bidRow(draft.id, owner.id, broker.id))).error).not.toBeNull();

    const open = jobRow(owner.id, estate.id);
    await ok(owner.client.from('jobs').insert(open));
    expect((await broker.client.from('bids').insert(bidRow(open.id, owner.id, broker.id, { status: 'accepted' }))).error).not.toBeNull();
  });

  it('a bidder cannot forge owner_id to hide a bid from the real owner', async () => {
    const owner = await poster();
    const accomplice = await poster();
    const broker = await bidder();
    const estate = estateRow(owner.id);
    await ok(owner.client.from('estates').insert(estate));
    const job = jobRow(owner.id, estate.id);
    await ok(owner.client.from('jobs').insert(job));
    expect((await broker.client.from('bids').insert(bidRow(job.id, accomplice.id, broker.id))).error).not.toBeNull();
  });

  it('other bidders cannot read a sealed bid; the job owner and the bidder can', async () => {
    const owner = await poster();
    const broker = await bidder();
    const rival = await bidder();
    const { bid } = await openJobWithBid(owner, broker);
    expect((await rival.client.from('bids').select('id').eq('id', bid.id)).data).toEqual([]);
    expect((await owner.client.from('bids').select('id').eq('id', bid.id)).data).toHaveLength(1);
    expect((await broker.client.from('bids').select('id').eq('id', bid.id)).data).toHaveLength(1);
  });

  it('the bidder can revise price but cannot self-accept', async () => {
    const owner = await poster();
    const broker = await bidder();
    const { bid } = await openJobWithBid(owner, broker);
    expect(await touched(broker.client.from('bids').update({ price: 9000 }).eq('id', bid.id).select('id'))).toBe(1);
    expect((await broker.client.from('bids').update({ status: 'accepted' }).eq('id', bid.id)).error).not.toBeNull();
  });

  it('the job owner can accept/reject but not change the price; a stranger cannot do either', async () => {
    const owner = await poster();
    const broker = await bidder();
    const stranger = await poster();
    const { bid } = await openJobWithBid(owner, broker);
    expect((await owner.client.from('bids').update({ price: 1 }).eq('id', bid.id)).error).not.toBeNull();
    expect(await touched(stranger.client.from('bids').update({ status: 'rejected' }).eq('id', bid.id).select('id'))).toBe(0);
    expect(await touched(owner.client.from('bids').update({ status: 'rejected' }).eq('id', bid.id).select('id'))).toBe(1);
  });
});

describe('workers', () => {
  it('a bidder can register a worker; a poster cannot', async () => {
    const broker = await bidder();
    const owner = await poster();
    const worker = { id: uid('worker'), category: 'coconut', supervisor_id: broker.id, name: 'W', consent_method: 'sms' };
    await ok(broker.client.from('workers').insert(worker));
    expect((await owner.client.from('workers').insert({ ...worker, id: uid('worker'), supervisor_id: owner.id })).error).not.toBeNull();
  });

  it('the manager can edit profile fields but not rating/jobs_completed; another manager cannot edit', async () => {
    const broker = await bidder();
    const other = await bidder();
    const worker = { id: uid('worker'), category: 'coconut', supervisor_id: broker.id, name: 'W', consent_method: 'sms' };
    await ok(broker.client.from('workers').insert(worker));
    expect(await touched(broker.client.from('workers').update({ name: 'W2' }).eq('id', worker.id).select('id'))).toBe(1);
    expect((await broker.client.from('workers').update({ rating: 5 }).eq('id', worker.id)).error).not.toBeNull();
    expect(await touched(other.client.from('workers').update({ name: 'stolen' }).eq('id', worker.id).select('id'))).toBe(0);
  });
});

describe('money tables are server-only', () => {
  it('no client can write awards, payments, ledger or audit_logs', async () => {
    const owner = await poster();
    const broker = await bidder();
    const { awardId } = await awardedJob(owner, broker);
    expect((await owner.client.from('awards').update({ escrow_status: 'released' }).eq('id', awardId)).error).not.toBeNull();
    for (const table of ['payments', 'ledger', 'audit_logs']) {
      expect((await owner.client.from(table).insert({ id: uid('x') })).error, table).not.toBeNull();
    }
  });

  it('the two parties can read the award; a stranger cannot; nobody reads audit_logs', async () => {
    const owner = await poster();
    const broker = await bidder();
    const stranger = await poster();
    const staff = await createTestUser({ isAdmin: true });
    const { awardId } = await awardedJob(owner, broker);
    expect((await owner.client.from('awards').select('id').eq('id', awardId)).data).toHaveLength(1);
    expect((await broker.client.from('awards').select('id').eq('id', awardId)).data).toHaveLength(1);
    expect((await stranger.client.from('awards').select('id').eq('id', awardId)).data).toEqual([]);
    const audit = await staff.client.from('audit_logs').select('id');
    expect(audit.error ?? audit.data?.length === 0).toBeTruthy();
  });
});

describe('attendance', () => {
  it('either party can open a day for their job; a stranger cannot, even naming themselves as owner', async () => {
    const owner = await poster();
    const broker = await bidder();
    const stranger = await poster();
    const { job } = await awardedJob(owner, broker);
    const day = { id: uid('day'), job_id: job.id, owner_id: owner.id, supervisor_id: broker.id, work_date: '2026-10-10' };
    await ok(broker.client.from('attendance_days').insert(day));
    const forged = { ...day, id: uid('day'), owner_id: stranger.id };
    expect((await stranger.client.from('attendance_days').insert(forged)).error).not.toBeNull();
  });

  it('a reconciled day cannot be edited, and each party records only their own side', async () => {
    const owner = await poster();
    const broker = await bidder();
    const { job } = await awardedJob(owner, broker);
    const day = { id: uid('day'), job_id: job.id, owner_id: owner.id, supervisor_id: broker.id, work_date: '2026-10-10' };
    await ok(owner.client.from('attendance_days').insert(day));

    const entry = {
      attendance_day_id: day.id,
      owner_id: owner.id,
      supervisor_id: broker.id,
      worker_id: 'w1',
      present: true,
    };
    await ok(owner.client.from('attendance_entries').insert({ ...entry, id: uid('entry'), party: 'owner', recorded_by: owner.id }));
    expect(
      (await owner.client.from('attendance_entries').insert({ ...entry, id: uid('entry'), party: 'supervisor', recorded_by: owner.id })).error
    ).not.toBeNull();

    await ok(admin.from('attendance_days').update({ status: 'reconciled' }).eq('id', day.id));
    expect(await touched(owner.client.from('attendance_days').update({ status: 'open' }).eq('id', day.id).select('id'))).toBe(0);
  });
});

describe('completions', () => {
  it('the awarded bidder can submit; the owner or a third party cannot forge one', async () => {
    const owner = await poster();
    const broker = await bidder();
    const thief = await bidder();
    const { job } = await awardedJob(owner, broker);
    const completion = { job_id: job.id, owner_id: owner.id, status: 'pending', wage_records: [], total_wages: 0, supervisor_fee: 0 };
    await ok(broker.client.from('completions').insert({ ...completion, id: uid('comp'), submitted_by: broker.id }));
    expect((await owner.client.from('completions').insert({ ...completion, id: uid('comp'), submitted_by: owner.id })).error).not.toBeNull();
    expect((await thief.client.from('completions').insert({ ...completion, id: uid('comp'), submitted_by: thief.id })).error).not.toBeNull();
  });

  it('no client can confirm a completion directly', async () => {
    const owner = await poster();
    const broker = await bidder();
    const { job } = await awardedJob(owner, broker);
    const id = uid('comp');
    await ok(
      broker.client
        .from('completions')
        .insert({ id, job_id: job.id, owner_id: owner.id, submitted_by: broker.id, status: 'pending', wage_records: [], total_wages: 0, supervisor_fee: 0 })
    );
    expect((await owner.client.from('completions').update({ status: 'confirmed' }).eq('id', id)).error).not.toBeNull();
  });
});

describe('disputes', () => {
  it('a stranger cannot open a dispute on someone else\'s award, and parties cannot resolve one', async () => {
    const owner = await poster();
    const broker = await bidder();
    const stranger = await poster();
    const { job, awardId } = await awardedJob(owner, broker);
    const dispute = { id: uid('disp'), job_id: job.id, award_id: awardId, owner_id: owner.id, supervisor_id: broker.id, reason: 'x', status: 'open' };
    expect((await stranger.client.from('disputes').insert({ ...dispute, opened_by: stranger.id })).error).not.toBeNull();
    await ok(owner.client.from('disputes').insert({ ...dispute, opened_by: owner.id }));
    expect((await owner.client.from('disputes').update({ status: 'resolved' }).eq('id', dispute.id)).error).not.toBeNull();
  });
});

describe('nic_submissions', () => {
  it('a user submits their own as pending; only they and admins read it; only admins review it', async () => {
    const me = await poster();
    const stranger = await poster();
    const staff = await createTestUser({ isAdmin: true });
    const sub = {
      id: uid('nic'),
      user_id: me.id,
      role: 'owner',
      nic_number: '199012345678',
      nic_format: 'NEW_12',
      front_image_url: `${me.id}/front.png`,
      back_image_url: `${me.id}/back.png`,
      status: 'pending',
    };
    expect((await me.client.from('nic_submissions').insert({ ...sub, id: uid('nic'), status: 'approved' })).error).not.toBeNull();
    expect((await stranger.client.from('nic_submissions').insert({ ...sub, id: uid('nic') })).error).not.toBeNull();
    await ok(me.client.from('nic_submissions').insert(sub));

    expect((await stranger.client.from('nic_submissions').select('id').eq('id', sub.id)).data).toEqual([]);
    expect(await touched(me.client.from('nic_submissions').update({ status: 'approved' }).eq('id', sub.id).select('id'))).toBe(0);
    expect(await touched(staff.client.from('nic_submissions').update({ status: 'approved' }).eq('id', sub.id).select('id'))).toBe(1);
  });
});

describe('ratings', () => {
  it('can rate as yourself, not as someone else, and only once per job and person', async () => {
    const owner = await poster();
    const broker = await bidder();
    const { job } = await awardedJob(owner, broker);
    const rating = { job_id: job.id, from_name: 'O', to_user_id: broker.id, to_role: 'supervisor', score: 5 };
    expect((await owner.client.from('ratings').insert({ ...rating, id: uid('rate'), from_user_id: broker.id })).error).not.toBeNull();
    await ok(owner.client.from('ratings').insert({ ...rating, id: uid('rate'), from_user_id: owner.id }));
    expect((await owner.client.from('ratings').insert({ ...rating, id: uid('rate'), from_user_id: owner.id })).error).not.toBeNull();
  });
});

describe('unauthenticated access', () => {
  it('is denied everywhere', async () => {
    for (const table of ['users', 'estates', 'jobs', 'workers', 'bids', 'awards', 'payments', 'ledger', 'completions', 'disputes', 'nic_submissions']) {
      const { data, error } = await anon.from(table).select('id').limit(1);
      expect(error ?? (data?.length === 0 ? null : 'rows visible'), table).not.toBeNull();
    }
    expect((await anon.rpc('award_bid', { p_bid_id: 'x', p_award_id: 'y' })).error).not.toBeNull();
  });
});
