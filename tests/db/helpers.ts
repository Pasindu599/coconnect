/**
 * Shared setup for tests/db: real users signed in to the real project, so
 * every check below goes through RLS exactly as the app does. Throwaway
 * users get random emails; `cleanup()` deletes their rows and then them.
 */
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from '../../scripts/lib/env';
import type { Membership } from '../../src/types/category';

const url = requireEnv('VITE_SUPABASE_URL');
const anonKey = requireEnv('VITE_SUPABASE_ANON_KEY');
/**
 * Retries a request whose connection dropped (fetch threw) up to 3 times.
 * HTTP error responses are returned as-is: a denied write must stay denied.
 */
const retryingFetch: typeof fetch = async (input, init) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      if (attempt >= 4) throw err;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
};

const noSession = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: retryingFetch } };

/** Service role: bypasses RLS. Only for fixtures and assertions, never for the thing under test. */
export const admin = createClient(url, requireEnv('SUPABASE_SERVICE_ROLE_KEY'), noSession);

/** Not signed in at all. */
export const anon = createClient(url, anonKey, noSession);

export interface TestUser {
  id: string;
  client: SupabaseClient;
}

const createdUserIds: string[] = [];

export const uid = (prefix: string) => `${prefix}-${randomUUID()}`;

export async function createTestUser(opts: { memberships?: Membership[]; isAdmin?: boolean; pin?: string } = {}): Promise<TestUser> {
  const email = `test-${randomUUID()}@coconnect.test`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const id = data.user.id;
  createdUserIds.push(id);

  const { error: profileError } = await admin
    .from('users')
    .update({ name: 'Test User', memberships: opts.memberships ?? [], is_admin: opts.isAdmin === true })
    .eq('id', id);
  if (profileError) throw profileError;

  if (opts.pin) {
    const { error: pinError } = await admin.rpc('set_user_pin', { p_user_id: id, p_pin: opts.pin });
    if (pinError) throw pinError;
  }

  const client = createClient(url, anonKey, noSession);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id, client };
}

export const poster = (category: 'coconut' | 'construction' = 'coconut') =>
  createTestUser({ memberships: [{ category, role: category === 'coconut' ? 'owner' : 'client' }] });
export const bidder = (category: 'coconut' | 'construction' = 'coconut') =>
  createTestUser({ memberships: [{ category, role: category === 'coconut' ? 'agent' : 'contractor' }] });

export function estateRow(ownerId: string, overrides: Record<string, unknown> = {}) {
  return { id: uid('est'), category: 'coconut', owner_id: ownerId, name: 'Test Estate', area_acres: 1, location: 'Test', tree_count: 10, ...overrides };
}

export function jobRow(ownerId: string, estateId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: uid('job'),
    category: 'coconut',
    owner_id: ownerId,
    owner_name: 'Owner',
    estate_id: estateId,
    estate_name: 'Test Estate',
    estate_location: 'Test',
    task_type: 'Harvest',
    starts_at: '2026-10-10',
    ends_at: '2026-10-12',
    worker_count: 2,
    duration_days: 2,
    required_skills: [],
    wage_budget: 10000,
    status: 'OPEN',
    ...overrides,
  };
}

export function bidRow(jobId: string, ownerId: string, supervisorId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: uid('bid'),
    category: 'coconut',
    job_id: jobId,
    owner_id: ownerId,
    supervisor_id: supervisorId,
    supervisor_name: 'Broker',
    price: 10000,
    supervisor_fee: 500,
    payment_schedule: 'lump_sum',
    status: 'pending',
    crew_member_ids: [],
    ...overrides,
  };
}

/** Throws with the PostgREST message if a call that should succeed did not. */
export async function ok<T extends { data: unknown; error: { message: string } | null }>(
  op: PromiseLike<T>
): Promise<T & { data: NonNullable<T['data']> }> {
  const result = await op;
  if (result.error) throw new Error(result.error.message);
  return result as T & { data: NonNullable<T['data']> };
}

/** An open job with one pending bid, both written through RLS by their real owners. */
export async function openJobWithBid(owner: TestUser, broker: TestUser, price = 10000) {
  const estate = estateRow(owner.id);
  await ok(owner.client.from('estates').insert(estate));
  const job = jobRow(owner.id, estate.id);
  await ok(owner.client.from('jobs').insert(job));
  const bid = bidRow(job.id, owner.id, broker.id, { price });
  await ok(broker.client.from('bids').insert(bid));
  return { estate, job, bid };
}

/** openJobWithBid, then awarded through award_bid(). */
export async function awardedJob(owner: TestUser, broker: TestUser, price = 10000) {
  const fixture = await openJobWithBid(owner, broker, price);
  const awardId = uid('award');
  await ok(owner.client.rpc('award_bid', { p_bid_id: fixture.bid.id, p_award_id: awardId }));
  return { ...fixture, awardId };
}

/** awardedJob, then paid: create_payment_intent as the owner, a verified PayHere notify via the service role. */
export async function heldEscrow(owner: TestUser, broker: TestUser, price = 10000) {
  const fixture = await awardedJob(owner, broker, price);
  const { data: intent } = await ok(owner.client.rpc('create_payment_intent', { p_award_id: fixture.awardId }));
  const { paymentId, fees } = intent as { paymentId: string; fees: { total: number } };
  const { data: outcome } = await ok(
    admin.rpc('payhere_apply_notify', { p_order_id: paymentId, p_amount: Number(fees.total).toFixed(2), p_status_code: '2', p_provider_ref: 'PH-TEST' })
  );
  if (outcome !== 'held') throw new Error(`expected held, got ${outcome}`);
  return { ...fixture, paymentId, total: Number(fees.total) };
}

/** Test users left behind by an earlier, interrupted run (createTestUser's email domain). */
async function leftoverTestUserIds(): Promise<string[]> {
  const ids: string[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    ids.push(...data.users.filter((u) => u.email?.endsWith('@coconnect.test')).map((u) => u.id));
    if (data.users.length < 1000) return ids;
  }
}

/** Deletes every row the test users touched, then the users (this run's, plus leftovers from interrupted runs). */
export async function cleanup(): Promise<void> {
  const ids = [...new Set([...createdUserIds.splice(0), ...(await leftoverTestUserIds())])];
  if (!ids.length) return;
  const byParty = async (table: string, columns: string[]) => {
    for (const column of columns) {
      const { error } = await admin.from(table).delete().in(column, ids);
      if (error) throw new Error(`cleanup ${table}: ${error.message}`);
    }
  };
  await byParty('ledger', ['owner_id', 'supervisor_id']);
  await byParty('payments', ['owner_id', 'supervisor_id']);
  await byParty('disputes', ['owner_id', 'supervisor_id']);
  await byParty('completions', ['owner_id', 'submitted_by']);
  await byParty('attendance_entries', ['owner_id', 'supervisor_id']);
  await byParty('attendance_days', ['owner_id', 'supervisor_id']);
  await byParty('awards', ['owner_id', 'supervisor_id']);
  await byParty('bids', ['owner_id', 'supervisor_id']);
  await byParty('ratings', ['from_user_id', 'to_user_id']);
  await byParty('workers', ['supervisor_id']);
  await byParty('nic_submissions', ['user_id']);
  await byParty('jobs', ['owner_id']);
  await byParty('estates', ['owner_id']);
  await admin.from('audit_logs').delete().in('actor_id', ids);
  for (const id of ids) {
    await admin.storage.from('nic').remove([`${id}/front.png`, `${id}/back.png`]);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error(`cleanup user ${id}: ${error.message}`);
  }
}
