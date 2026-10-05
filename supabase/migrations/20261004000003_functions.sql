-- Server-side business logic (replaces functions/src/**; see ADR-014).
--
-- Each function runs in one transaction, as the table owner (security
-- definer), so it may write what clients cannot. Called from the client via
-- supabase.rpc() (src/lib/supabase.ts `callRpc`).
--
-- Errors: `raise exception '<code>'`, where <code> is the same string the
-- Cloud Functions used for HttpsError (CONTRACTS C7): unauthenticated,
-- invalid-argument, not-found, already-exists, permission-denied,
-- failed-precondition, resource-exhausted, internal. The message is only the
-- code; human detail goes in `hint`. callRpc turns the message back into
-- BackendError.code. User-facing wording stays in i18n.ts (C6).

-- ---------------------------------------------------------------------------
-- Memberships and staff
-- ---------------------------------------------------------------------------

-- Mirrors CONTRACTS C1 / .claude/docs/categories.md; kept in sync by hand.
create function private.is_valid_category_role(p_category text, p_role text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_category
    when 'coconut' then p_role in ('owner', 'broker', 'worker')
    when 'construction' then p_role in ('client', 'contractor', 'subcontractor', 'worker')
    else false
  end;
$$;

-- CONTRACTS C3. Never `admin`; idempotent. RLS reads memberships from this
-- table directly, so (unlike the old custom claim) there is no token to refresh.
create function public.add_membership(p_category text, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_membership jsonb := jsonb_build_object('category', p_category, 'role', p_role);
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  if p_category is null or p_role is null or not private.is_valid_category_role(p_category, p_role) then
    raise exception 'invalid-argument' using hint = format('"%s" is not a valid role for category "%s".', p_role, p_category);
  end if;

  update public.users
     set memberships = case
           when memberships @> jsonb_build_array(v_membership) then memberships
           else memberships || jsonb_build_array(v_membership)
         end
   where id = v_uid;
  if not found then
    raise exception 'not-found' using hint = 'No profile row for this user.';
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- Only an existing admin can grant admin. The first admin is bootstrapped
-- with SQL by a project owner (see .claude/docs/specs/auth.md).
create function public.set_admin(p_uid uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'permission-denied' using hint = 'Only an existing admin can grant admin.';
  end if;
  if p_uid is null then
    raise exception 'invalid-argument' using hint = 'uid is required.';
  end if;
  update public.users set is_admin = true where id = p_uid;
  if not found then
    raise exception 'not-found';
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- The signed-in user sets their own completion PIN (4 to 6 digits), stored
-- only as a bcrypt hash. Closes the "no set-PIN step" gap S1-11 noted; the UI
-- for it is not built yet.
create function public.set_completion_pin(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then
    raise exception 'invalid-argument' using hint = 'PIN must be 4 to 6 digits.';
  end if;
  insert into public.user_pins (user_id, pin_hash, updated_at)
  values (v_uid, extensions.crypt(p_pin, extensions.gen_salt('bf', 10)), now())
  on conflict (user_id) do update set pin_hash = excluded.pin_hash, updated_at = excluded.updated_at;
  return jsonb_build_object('ok', true);
end;
$$;

-- Service role only (seed script, support tooling).
create function public.set_user_pin(p_user_id uuid, p_pin text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.user_pins (user_id, pin_hash, updated_at)
  values (p_user_id, extensions.crypt(p_pin, extensions.gen_salt('bf', 10)), now())
  on conflict (user_id) do update set pin_hash = excluded.pin_hash, updated_at = excluded.updated_at;
$$;

-- ---------------------------------------------------------------------------
-- award_bid: the one way a bid becomes an award (was functions/src/jobs/awardBid.ts).
-- Accept the winning bid, reject the other pending bids, move the job to
-- AWARDED_PENDING_FEE (recording the winner as jobs.supervisor_id), create
-- the award with escrow 'pending'. p_award_id is the client's own id, so the
-- optimistic local award and the real row reconcile as one record.
-- ---------------------------------------------------------------------------
create function public.award_bid(p_bid_id text, p_award_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_bid public.bids;
  v_job public.jobs;
  v_owner public.users;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  if coalesce(p_bid_id, '') = '' or coalesce(p_award_id, '') = '' then
    raise exception 'invalid-argument' using hint = 'bidId and awardId are required.';
  end if;

  select * into v_bid from public.bids where id = p_bid_id for update;
  if not found then
    raise exception 'not-found' using hint = 'Bid not found.';
  end if;
  if exists (select 1 from public.awards where id = p_award_id) then
    raise exception 'already-exists' using hint = 'An award with this id already exists.';
  end if;

  select * into v_job from public.jobs where id = v_bid.job_id for update;
  if not found then
    raise exception 'not-found' using hint = 'Job not found.';
  end if;
  if v_job.owner_id <> v_uid then
    raise exception 'permission-denied' using hint = 'Only the job owner can award a bid.';
  end if;
  if v_bid.status <> 'pending' then
    raise exception 'failed-precondition' using hint = 'This bid is no longer pending.';
  end if;
  if v_job.status <> 'OPEN' then
    raise exception 'failed-precondition' using hint = 'This job is not open for awarding.';
  end if;

  select * into v_owner from public.users where id = v_job.owner_id;

  update public.bids set status = 'accepted' where id = p_bid_id;
  update public.bids set status = 'rejected'
   where job_id = v_bid.job_id and id <> p_bid_id and status = 'pending';

  update public.jobs set status = 'AWARDED_PENDING_FEE', supervisor_id = v_bid.supervisor_id where id = v_job.id;

  insert into public.awards (
    id, category, job_id, owner_id, owner_name, owner_phone, bid_id,
    supervisor_id, supervisor_name, awarded_at, escrow_status, escrow_amount
  ) values (
    p_award_id, v_job.category, v_job.id, v_job.owner_id,
    coalesce(nullif(v_job.owner_name, ''), v_owner.name), v_owner.phone, p_bid_id,
    v_bid.supervisor_id, v_bid.supervisor_name, now(), 'pending', v_bid.price
  );

  insert into public.audit_logs (actor_id, actor_name, action, subject_type, subject_id, details)
  values (v_uid::text, coalesce(nullif(v_job.owner_name, ''), v_uid::text), 'award.created', 'award', p_award_id,
          format('Owner accepted bid %s for job %s', p_bid_id, v_bid.job_id));

  return jsonb_build_object('awardId', p_award_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Escrow (was functions/src/escrow/*.ts). Payments.md's state machine:
--   pending -> held -> release_requested -> released
--   side path: held|release_requested -> disputed -> refunded|released
-- ---------------------------------------------------------------------------

-- held -> release_requested, after a server-side bcrypt PIN check, limited to
-- 5 wrong attempts per completion per hour. A wrong PIN is RETURNED as
-- {"error":"permission-denied"} rather than raised: raising would roll back
-- the attempt counter and the limit would never trigger. callRpc treats the
-- returned error exactly like a raised one.
create function public.confirm_completion(p_completion_id text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_completion public.completions;
  v_award public.awards;
  v_attempts integer;
  v_hash text;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  if coalesce(p_completion_id, '') = '' or coalesce(p_pin, '') = '' then
    raise exception 'invalid-argument' using hint = 'completionId and pin are required.';
  end if;

  select * into v_completion from public.completions where id = p_completion_id for update;
  if not found then
    raise exception 'not-found' using hint = 'Completion not found.';
  end if;
  if v_completion.owner_id <> v_uid then
    raise exception 'permission-denied' using hint = 'Only the job owner can confirm this completion.';
  end if;
  if v_completion.status <> 'pending' then
    raise exception 'failed-precondition' using hint = 'This completion is not awaiting confirmation.';
  end if;

  v_attempts := case
    when v_completion.pin_attempts_window_start is not null
         and now() - v_completion.pin_attempts_window_start < interval '1 hour'
      then v_completion.pin_attempts
    else 0
  end;
  if v_attempts >= 5 then
    raise exception 'resource-exhausted' using hint = 'Too many attempts. Try again later.';
  end if;

  select pin_hash into v_hash from public.user_pins where user_id = v_completion.owner_id;
  if v_hash is null or extensions.crypt(p_pin, v_hash) <> v_hash then
    update public.completions
       set pin_attempts = v_attempts + 1,
           pin_attempts_window_start = case when v_attempts = 0 then now() else v_completion.pin_attempts_window_start end
     where id = v_completion.id;
    return jsonb_build_object('error', 'permission-denied');
  end if;

  select * into v_award from public.awards where job_id = v_completion.job_id for update;
  if not found then
    raise exception 'failed-precondition' using hint = 'No award found for this job.';
  end if;
  if v_award.escrow_status <> 'held' then
    raise exception 'failed-precondition' using hint = format('Escrow is "%s", not held.', v_award.escrow_status);
  end if;
  -- Defense in depth alongside the completions insert policy.
  if v_award.owner_id <> v_completion.owner_id or v_award.supervisor_id <> v_completion.submitted_by then
    raise exception 'failed-precondition' using hint = 'Completion does not match this award''s parties.';
  end if;

  update public.completions set status = 'confirmed', pin_attempts = 0 where id = v_completion.id;
  update public.awards set escrow_status = 'release_requested' where id = v_award.id;
  update public.jobs set status = 'COMPLETED' where id = v_completion.job_id;

  insert into public.audit_logs (actor_id, actor_name, action, subject_type, subject_id, details)
  values (v_uid::text, 'owner', 'completion.confirmed', 'award', v_award.id,
          format('Completion %s confirmed with PIN; escrow release_requested', p_completion_id));

  return jsonb_build_object('ok', true);
end;
$$;

-- Either party; freezes the escrow in `disputed` and records the dispute, in
-- one transaction.
create function public.open_dispute(p_award_id text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_award public.awards;
  v_dispute_id text;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  if coalesce(p_award_id, '') = '' or coalesce(trim(p_reason), '') = '' then
    raise exception 'invalid-argument' using hint = 'awardId and reason are required.';
  end if;

  select * into v_award from public.awards where id = p_award_id for update;
  if not found then
    raise exception 'not-found' using hint = 'Award not found.';
  end if;
  if v_award.owner_id <> v_uid and v_award.supervisor_id <> v_uid then
    raise exception 'permission-denied' using hint = 'Only a party to this award can open a dispute.';
  end if;
  if v_award.escrow_status not in ('held', 'release_requested') then
    raise exception 'failed-precondition' using hint = format('Cannot dispute escrow in status "%s".', v_award.escrow_status);
  end if;

  insert into public.disputes (category, job_id, award_id, owner_id, supervisor_id, opened_by, reason, status)
  values (v_award.category, v_award.job_id, v_award.id, v_award.owner_id, v_award.supervisor_id, v_uid, p_reason, 'open')
  returning id into v_dispute_id;

  update public.awards set escrow_status = 'disputed' where id = v_award.id;

  insert into public.audit_logs (actor_id, actor_name, action, subject_type, subject_id, details)
  values (v_uid::text, case when v_uid = v_award.owner_id then 'owner' else 'supervisor' end,
          'dispute.opened', 'award', v_award.id, format('Dispute opened: %s', p_reason));

  return jsonb_build_object('disputeId', v_dispute_id);
end;
$$;

-- Admin only. `released` works fully. `refunded` always fails with
-- `internal` today, on purpose: there is no PayHere refund API access yet
-- (1C-4), and the dispute stays open for a human. When it exists, the
-- refund call moves to an Edge Function that calls back into SQL on success.
create function public.resolve_dispute(p_dispute_id text, p_resolution text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_dispute public.disputes;
  v_award public.awards;
  v_payment public.payments;
begin
  if not private.is_admin() then
    raise exception 'permission-denied' using hint = 'Only an admin can resolve a dispute.';
  end if;
  if coalesce(p_dispute_id, '') = '' or p_resolution is null or p_resolution not in ('refunded', 'released') then
    raise exception 'invalid-argument' using hint = 'disputeId and a valid resolution are required.';
  end if;

  select * into v_dispute from public.disputes where id = p_dispute_id for update;
  if not found then
    raise exception 'not-found' using hint = 'Dispute not found.';
  end if;
  if v_dispute.status <> 'open' then
    raise exception 'failed-precondition' using hint = 'This dispute is already resolved.';
  end if;

  select * into v_award from public.awards where id = v_dispute.award_id for update;
  if not found then
    raise exception 'not-found' using hint = 'Award not found.';
  end if;

  select * into v_payment from public.payments where award_id = v_dispute.award_id and status = 'paid' limit 1;

  if p_resolution = 'refunded' then
    if v_payment.id is null then
      raise exception 'failed-precondition' using hint = 'No paid payment found for this award to refund.';
    end if;
    raise exception 'internal' using hint = 'Refund failed: PayHere refund API is not available yet (1C-4). Dispute remains open.';
  end if;

  update public.awards set escrow_status = 'released' where id = v_award.id;
  update public.disputes
     set status = 'resolved', resolution = 'released', resolved_by = v_uid, resolved_at = now()
   where id = v_dispute.id;

  insert into public.ledger (category, award_id, payment_id, owner_id, supervisor_id, type, amount, currency, created_by)
  values (v_award.category, v_award.id, v_payment.id, v_award.owner_id, v_award.supervisor_id,
          'release', v_award.escrow_amount, 'LKR', v_uid::text);

  insert into public.audit_logs (actor_id, actor_name, action, subject_type, subject_id, details)
  values (v_uid::text, 'admin', 'dispute.resolved_released', 'award', v_award.id,
          format('Dispute %s resolved: released', p_dispute_id));

  return jsonb_build_object('ok', true);
end;
$$;

-- Admin only. release_requested -> released, recording the manual bank
-- transfer. The ledger `release` is the full escrow_amount (matching the
-- `hold`); the bidder's payout is escrow_amount minus the platform fee.
-- Writes both fee_payment_ref/payout_amount and payout_ref/payout_at
-- (CONTRACTS C7: PayoutsTab reads the latter).
create function public.record_payout(p_award_id text, p_bank_transfer_ref text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_award public.awards;
  v_payment public.payments;
  v_payout numeric;
begin
  if not private.is_admin() then
    raise exception 'permission-denied' using hint = 'Only an admin can record a payout.';
  end if;
  if coalesce(p_award_id, '') = '' or coalesce(trim(p_bank_transfer_ref), '') = '' then
    raise exception 'invalid-argument' using hint = 'awardId and bankTransferRef are required.';
  end if;

  select * into v_award from public.awards where id = p_award_id for update;
  if not found then
    raise exception 'not-found' using hint = 'Award not found.';
  end if;
  if v_award.escrow_status <> 'release_requested' then
    raise exception 'failed-precondition' using hint = format('Escrow is "%s", not release_requested.', v_award.escrow_status);
  end if;

  select * into v_payment from public.payments where award_id = p_award_id and status = 'paid' limit 1;
  v_payout := v_award.escrow_amount - coalesce(v_payment.platform_fee, 0);

  update public.awards
     set escrow_status = 'released',
         fee_payment_ref = p_bank_transfer_ref,
         payout_amount = v_payout,
         payout_ref = p_bank_transfer_ref,
         payout_at = now()
   where id = v_award.id;

  insert into public.ledger (category, award_id, payment_id, owner_id, supervisor_id, type, amount, currency, created_by)
  values (v_award.category, v_award.id, v_payment.id, v_award.owner_id, v_award.supervisor_id,
          'release', v_award.escrow_amount, 'LKR', v_uid::text);

  insert into public.audit_logs (actor_id, actor_name, action, subject_type, subject_id, details)
  values (v_uid::text, 'admin', 'payout.recorded', 'award', v_award.id,
          format('Payout of LKR %s recorded via bank transfer %s', v_payout, p_bank_transfer_ref));

  return jsonb_build_object('ok', true, 'payoutAmount', v_payout);
end;
$$;

-- ---------------------------------------------------------------------------
-- Payments (the database half of the createPayment / payhereNotify Edge
-- Functions; the PayHere secret and hash never touch SQL).
-- ---------------------------------------------------------------------------

-- Called by the create-payment Edge Function with the caller's JWT. Only the
-- job's poster may pay, never twice for one award; a pending payment younger
-- than 30 minutes is reused instead of creating a duplicate.
create function public.create_payment_intent(p_award_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_award public.awards;
  v_job public.jobs;
  v_owner public.users;
  v_fee_percent numeric;
  v_platform_fee numeric;
  v_total numeric;
  v_payment_id text;
begin
  if v_uid is null then
    raise exception 'unauthenticated';
  end if;
  if coalesce(p_award_id, '') = '' then
    raise exception 'invalid-argument' using hint = 'awardId is required.';
  end if;

  select * into v_award from public.awards where id = p_award_id for update;
  if not found then
    raise exception 'not-found' using hint = 'Award not found.';
  end if;
  select * into v_job from public.jobs where id = v_award.job_id;
  if not found then
    raise exception 'not-found' using hint = 'Job not found.';
  end if;
  if v_job.owner_id <> v_uid then
    raise exception 'permission-denied' using hint = 'Only the job owner can create a payment for this award.';
  end if;
  if exists (select 1 from public.payments where award_id = p_award_id and status = 'paid') then
    raise exception 'already-exists' using hint = 'This award has already been paid.';
  end if;

  -- ADR-011: 5% unless platform_config says otherwise; fee rounded to the nearest LKR 1.
  select coalesce((select (value #>> '{}')::numeric from public.platform_config where key = 'fee_percent'), 5)
    into v_fee_percent;
  v_platform_fee := round(v_award.escrow_amount * v_fee_percent / 100);
  v_total := v_award.escrow_amount + v_platform_fee;

  select id into v_payment_id from public.payments
   where award_id = p_award_id and status = 'pending' and created_at > now() - interval '30 minutes'
   order by created_at desc
   limit 1;

  if v_payment_id is null then
    insert into public.payments (category, award_id, job_id, owner_id, supervisor_id, amount, platform_fee, currency, provider, status)
    values (v_award.category, v_award.id, v_award.job_id, v_job.owner_id, v_award.supervisor_id,
            v_total, v_platform_fee, 'LKR', 'payhere', 'pending')
    returning id into v_payment_id;
  end if;

  select * into v_owner from public.users where id = v_job.owner_id;

  return jsonb_build_object(
    'paymentId', v_payment_id,
    'jobId', v_award.job_id,
    'fees', jsonb_build_object('bidPrice', v_award.escrow_amount, 'platformFee', v_platform_fee, 'total', v_total, 'currency', 'LKR'),
    'customer', jsonb_build_object('name', v_owner.name, 'email', v_owner.email, 'phone', v_owner.phone, 'location', v_owner.location)
  );
end;
$$;

-- Service role only: called by the payhere-notify Edge Function AFTER it has
-- verified merchant_id and md5sig. Idempotent. Only status_code 2 moves
-- escrow; other codes just update payments.status. Returns what it did.
create function public.payhere_apply_notify(p_order_id text, p_amount text, p_status_code text, p_provider_ref text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments;
  v_new_status text;
begin
  select * into v_payment from public.payments where id = p_order_id for update;
  if not found then
    return 'unknown-order';
  end if;

  if to_char(v_payment.amount, 'FM999999999990.00') <> p_amount then
    insert into public.audit_logs (actor_id, actor_name, action, subject_type, subject_id, details)
    values ('system', 'payhereNotify', 'payment.amount_mismatch', 'payment', p_order_id,
            format('Expected %s, notify claimed %s', v_payment.amount, p_amount));
    return 'amount-mismatch';
  end if;

  if v_payment.status = 'paid' then
    return 'already-paid';
  end if;

  if p_status_code = '2' then
    update public.payments
       set status = 'paid', paid_at = now(), provider_ref = coalesce(nullif(p_provider_ref, ''), provider_ref)
     where id = v_payment.id;
    -- ADR-012: escrow_amount becomes the real charged total (bid price + fee).
    update public.awards
       set escrow_status = 'held', contacts_released_at = now(), escrow_amount = v_payment.amount
     where id = v_payment.award_id;
    update public.jobs set status = 'ACTIVE' where id = v_payment.job_id;

    insert into public.ledger (category, award_id, payment_id, owner_id, supervisor_id, type, amount, currency, created_by)
    values (v_payment.category, v_payment.award_id, v_payment.id, v_payment.owner_id, v_payment.supervisor_id,
            'hold', v_payment.amount, 'LKR', 'system');
    insert into public.audit_logs (actor_id, actor_name, action, subject_type, subject_id, details)
    values ('system', 'payhereNotify', 'payment.held', 'award', v_payment.award_id,
            format('Payment %s verified; escrow held for award %s', v_payment.id, v_payment.award_id));
    return 'held';
  end if;

  v_new_status := case p_status_code
    when '0' then 'pending'
    when '-1' then 'cancelled'
    when '-2' then 'failed'
    when '-3' then 'failed'
  end;
  if v_new_status is null then
    return 'ignored';
  end if;
  if v_payment.status <> v_new_status then
    update public.payments set status = v_new_status where id = v_payment.id;
  end if;
  return v_new_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin diagnostics (was src/lib/data/reconciliation.ts's client-side sums).
-- For each award: sum(hold) must equal sum(release + refund) plus whatever
-- is still in escrow. A mismatch is a bug, not a user error.
-- ---------------------------------------------------------------------------
create function public.reconcile_awards()
returns table (
  award_id text,
  escrow_status text,
  held numeric,
  released_or_refunded numeric,
  still_in_escrow numeric,
  balanced boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not private.is_admin() then
    raise exception 'permission-denied' using hint = 'Admins only.';
  end if;
  return query
  select a.id,
         a.escrow_status,
         coalesce(s.hold, 0),
         coalesce(s.release, 0) + coalesce(s.refund, 0),
         case when a.escrow_status in ('held', 'release_requested') then a.escrow_amount else 0 end,
         coalesce(s.hold, 0) = coalesce(s.release, 0) + coalesce(s.refund, 0)
           + case when a.escrow_status in ('held', 'release_requested') then a.escrow_amount else 0 end
    from public.awards a
    left join (
      select l.award_id,
             sum(l.amount) filter (where l.type = 'hold') as hold,
             sum(l.amount) filter (where l.type = 'release') as release,
             sum(l.amount) filter (where l.type = 'refund') as refund
        from public.ledger l
       group by l.award_id
    ) s on s.award_id = a.id
   order by a.awarded_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Who may call what. Supabase grants EXECUTE to anon/authenticated by
-- default, so start from nothing.
-- ---------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.add_membership(text, text),
  public.set_admin(uuid),
  public.set_completion_pin(text),
  public.award_bid(text, text),
  public.confirm_completion(text, text),
  public.open_dispute(text, text),
  public.resolve_dispute(text, text),
  public.record_payout(text, text),
  public.create_payment_intent(text),
  public.reconcile_awards()
to authenticated;

grant execute on function
  public.set_user_pin(uuid, text),
  public.payhere_apply_notify(text, text, text, text)
to service_role;

revoke execute on function private.is_valid_category_role(text, text) from public;
grant execute on function private.is_valid_category_role(text, text) to authenticated, service_role;
