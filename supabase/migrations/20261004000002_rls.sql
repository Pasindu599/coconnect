-- Row Level Security (replaces firestore.rules; see ADR-014).
--
-- Model:
--   * `anon` gets nothing. Every table needs a signed-in user.
--   * `authenticated` gets only the table/column privileges granted below,
--     then RLS narrows them to rows. Column grants do what the Firestore
--     rules' `unchanged('field')` checks did: a client cannot set fields it
--     has no update grant on (memberships, rating, supervisor_id, ...).
--   * Money tables (awards, payments, ledger) and audit_logs get no write
--     grant at all; they change only through the security-definer functions
--     in 20261004000003_functions.sql or the PayHere Edge Functions.
--   * Unlike Firestore, a SELECT under RLS returns just the visible rows; it
--     does not reject the whole query. ADR-008/009's query-shaping rules are
--     not needed any more.

-- ---------------------------------------------------------------------------
-- Helpers. In `private` (not exposed by the API). Security definer so a
-- policy on `users` can read `users` without recursing into its own policy.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select u.is_admin from public.users u where u.id = (select auth.uid())), false);
$$;

create function private.has_membership(p_category text, p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.memberships @> jsonb_build_array(jsonb_build_object('category', p_category, 'role', p_role))
  );
$$;

-- Capabilities mirror src/types/category.ts (CONTRACTS C1). Duplicated on
-- purpose: the database never imports frontend config.
create function private.is_poster(p_category text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.has_membership(p_category, 'owner') or private.has_membership(p_category, 'client');
$$;

create function private.is_bidder(p_category text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.has_membership(p_category, 'broker')
      or private.has_membership(p_category, 'contractor')
      or private.has_membership(p_category, 'subcontractor');
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Start from nothing, then grant.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

alter table public.users enable row level security;
alter table public.user_pins enable row level security;
alter table public.platform_config enable row level security;
alter table public.estates enable row level security;
alter table public.jobs enable row level security;
alter table public.workers enable row level security;
alter table public.bids enable row level security;
alter table public.awards enable row level security;
alter table public.payments enable row level security;
alter table public.ledger enable row level security;
alter table public.audit_logs enable row level security;
alter table public.attendance_days enable row level security;
alter table public.attendance_entries enable row level security;
alter table public.completions enable row level security;
alter table public.ratings enable row level security;
alter table public.disputes enable row level security;
alter table public.nic_submissions enable row level security;

-- user_pins, platform_config, audit_logs: RLS on, no grants, no policies.
-- Only security-definer functions and the service role reach them.

-- ---- users ----
-- Rows carry NIC numbers and phone: self and admins only. Rows are created by
-- the auth trigger, never by the client. A user may change their own profile
-- fields, never memberships / nic_status / trust_score / is_admin.
grant select on public.users to authenticated;
grant update (name, active_category, preferred_language, avatar_url, location, payout_bank_ref)
  on public.users to authenticated;

create policy users_select on public.users for select to authenticated
  using (id = (select auth.uid()) or private.is_admin());

create policy users_update_self on public.users for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---- estates ("Estate" or "Site" per category; display only, ADR-007) ----
grant select, insert, delete on public.estates to authenticated;
grant update (attributes, name, area_acres, location, tree_count, notes, lat, lng)
  on public.estates to authenticated;

create policy estates_select on public.estates for select to authenticated using (true);

create policy estates_insert on public.estates for insert to authenticated
  with check (owner_id = (select auth.uid()) and private.is_poster(category));

create policy estates_update on public.estates for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy estates_delete on public.estates for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ---- jobs ----
-- The owner may edit while DRAFT/OPEN and may only move between DRAFT, OPEN
-- and CANCELLED. AWARDED_PENDING_FEE onward is written by award_bid() and the
-- escrow functions. No client deletes.
grant select, insert on public.jobs to authenticated;
grant update (
  owner_name, estate_id, estate_name, estate_location, task_type, starts_at, ends_at,
  worker_count, duration_days, required_skills, wage_budget, status, description, lat, lng
) on public.jobs to authenticated;

create policy jobs_select on public.jobs for select to authenticated using (true);

create policy jobs_insert on public.jobs for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and private.is_poster(category)
    and status in ('DRAFT', 'OPEN')
    and supervisor_id is null
  );

create policy jobs_update on public.jobs for update to authenticated
  using (owner_id = (select auth.uid()) and status in ('DRAFT', 'OPEN'))
  with check (owner_id = (select auth.uid()) and status in ('DRAFT', 'OPEN', 'CANCELLED'));

-- ---- workers ----
-- KNOWN_ISSUES #29 still applies: any signed-in user can read every worker's
-- nic_ref/bank_ref, because BidsModal/AttendanceTab resolve crews across
-- managers. Narrow this read once that UI reads Bid.crew_members instead.
grant select, insert on public.workers to authenticated;
grant update (name, phone, skills, nic_ref, bank_ref, consent_captured_at, consent_method, active)
  on public.workers to authenticated;

create policy workers_select on public.workers for select to authenticated using (true);

create policy workers_insert on public.workers for insert to authenticated
  with check (supervisor_id = (select auth.uid()) and private.is_bidder(category));

create policy workers_update on public.workers for update to authenticated
  using (supervisor_id = (select auth.uid()))
  with check (supervisor_id = (select auth.uid()));

-- ---- bids (sealed) ----
-- Only the bidder and the job's owner can see a bid. owner_id is client-set
-- (denormalized) but must equal the real job's owner, or a bidder could hide
-- the bid from the owner or leak it to someone else.
grant select, insert on public.bids to authenticated;
grant update (
  supervisor_name, supervisor_phone, supervisor_trust_score, price, supervisor_fee,
  payment_schedule, status, crew_member_ids, crew_members
) on public.bids to authenticated;

create policy bids_select on public.bids for select to authenticated
  using (supervisor_id = (select auth.uid()) or owner_id = (select auth.uid()));

create policy bids_insert on public.bids for insert to authenticated
  with check (
    supervisor_id = (select auth.uid())
    and status = 'pending'
    and private.is_bidder(category)
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.status = 'OPEN' and j.owner_id = bids.owner_id
    )
  );

create policy bids_update on public.bids for update to authenticated
  using (status = 'pending' and (supervisor_id = (select auth.uid()) or owner_id = (select auth.uid())))
  with check (supervisor_id = (select auth.uid()) or owner_id = (select auth.uid()));

-- Which columns each party may change can't be said in a policy (no access to
-- OLD), so a trigger does it. Two kinds of client update, both narrow:
--   * the bidder revises their own pending bid, but may not change its status
--     (no self-accept / self-reject);
--   * the job owner accepts or rejects, changing nothing else.
-- Security-definer functions (award_bid) run as the table owner and skip this.
create function private.bids_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if old.status <> 'pending' then
    raise exception 'permission-denied' using hint = 'Only a pending bid can change.';
  end if;
  if uid = old.supervisor_id then
    if new.status is distinct from old.status then
      raise exception 'permission-denied' using hint = 'A bidder cannot accept or reject their own bid.';
    end if;
    return new;
  end if;
  if uid = old.owner_id then
    if new.status not in ('accepted', 'rejected')
       or (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
      raise exception 'permission-denied' using hint = 'The job owner may only accept or reject a bid.';
    end if;
    return new;
  end if;
  raise exception 'permission-denied';
end;
$$;

create trigger bids_guard_update
  before update on public.bids
  for each row execute function private.bids_guard_update();

-- ---- awards, payments, ledger: read by the two parties and admins ----
grant select on public.awards, public.payments, public.ledger to authenticated;

create policy awards_select on public.awards for select to authenticated
  using (owner_id = (select auth.uid()) or supervisor_id = (select auth.uid()) or private.is_admin());

create policy payments_select on public.payments for select to authenticated
  using (owner_id = (select auth.uid()) or supervisor_id = (select auth.uid()) or private.is_admin());

create policy ledger_select on public.ledger for select to authenticated
  using (owner_id = (select auth.uid()) or supervisor_id = (select auth.uid()) or private.is_admin());

-- ---- attendance ----
grant select, insert on public.attendance_days to authenticated;
grant update (status) on public.attendance_days to authenticated;

create policy attendance_days_select on public.attendance_days for select to authenticated
  using (owner_id = (select auth.uid()) or supervisor_id = (select auth.uid()) or private.is_admin());

-- The caller is a party, and the owner/supervisor named must be the job's real ones.
create policy attendance_days_insert on public.attendance_days for insert to authenticated
  with check (
    (owner_id = (select auth.uid()) or supervisor_id = (select auth.uid()))
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.owner_id = attendance_days.owner_id and j.supervisor_id = attendance_days.supervisor_id
    )
  );

create policy attendance_days_update on public.attendance_days for update to authenticated
  using (status <> 'reconciled' and (owner_id = (select auth.uid()) or supervisor_id = (select auth.uid())))
  with check (owner_id = (select auth.uid()) or supervisor_id = (select auth.uid()));

grant select, insert on public.attendance_entries to authenticated;

create policy attendance_entries_select on public.attendance_entries for select to authenticated
  using (owner_id = (select auth.uid()) or supervisor_id = (select auth.uid()) or private.is_admin());

-- Each party records only their own side, on a day that really is theirs.
create policy attendance_entries_insert on public.attendance_entries for insert to authenticated
  with check (
    recorded_by = (select auth.uid())
    and (
      (party = 'owner' and owner_id = (select auth.uid()))
      or (party = 'supervisor' and supervisor_id = (select auth.uid()))
    )
    and exists (
      select 1 from public.attendance_days d
      where d.id = attendance_day_id
        and d.owner_id = attendance_entries.owner_id
        and d.supervisor_id = attendance_entries.supervisor_id
    )
  );

-- ---- completions ----
-- owner_id/submitted_by are checked against the job's real owner and awarded
-- bidder (jobs.supervisor_id, set by award_bid), so nobody can forge a
-- completion into another owner's confirm feed. Confirming is
-- confirm_completion() only (hashed PIN, server-side).
grant select on public.completions to authenticated;
grant insert (id, job_id, owner_id, submitted_by, submitted_at, status, wage_records, total_wages, supervisor_fee, notes)
  on public.completions to authenticated;

create policy completions_select on public.completions for select to authenticated
  using (owner_id = (select auth.uid()) or submitted_by = (select auth.uid()) or private.is_admin());

create policy completions_insert on public.completions for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.owner_id = completions.owner_id and j.supervisor_id = completions.submitted_by
    )
  );

-- ---- ratings ----
grant select, insert on public.ratings to authenticated;

create policy ratings_select on public.ratings for select to authenticated using (true);

create policy ratings_insert on public.ratings for insert to authenticated
  with check (from_user_id = (select auth.uid()));

-- ---- disputes ----
-- open_dispute() is the normal path (it also freezes the escrow). A direct
-- insert is allowed for parity with the old rules but must name the award's
-- real parties. Resolving is resolve_dispute() (admin) only.
grant select on public.disputes to authenticated;
grant insert (id, category, job_id, award_id, owner_id, supervisor_id, opened_by, reason, opened_at, status)
  on public.disputes to authenticated;

create policy disputes_select on public.disputes for select to authenticated
  using (owner_id = (select auth.uid()) or supervisor_id = (select auth.uid()) or private.is_admin());

create policy disputes_insert on public.disputes for insert to authenticated
  with check (
    opened_by = (select auth.uid())
    and (owner_id = (select auth.uid()) or supervisor_id = (select auth.uid()))
    and status = 'open'
    and exists (
      select 1 from public.awards a
      where a.id = award_id and a.owner_id = disputes.owner_id and a.supervisor_id = disputes.supervisor_id
    )
  );

-- ---- NIC submissions ----
grant select, insert on public.nic_submissions to authenticated;
grant update (status, reviewed_at, reviewed_by, rejection_reason) on public.nic_submissions to authenticated;

create policy nic_submissions_select on public.nic_submissions for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());

create policy nic_submissions_insert on public.nic_submissions for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');

create policy nic_submissions_update on public.nic_submissions for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());
