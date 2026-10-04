-- Coconnect schema (replaces the Firestore collections; see ADR-014).
--
-- Column names match src/types/index.ts exactly (snake_case already, and
-- "estates"/"estate_id"/"supervisor_id" kept for every category, ADR-007),
-- so the client maps rows to its domain types without renaming anything.
--
-- Ids: rows the client creates keep the client-chosen text id
-- (`job-${Date.now()}`, ...) so an optimistic local record and the row the
-- Realtime feed sends back reconcile as one record. Rows only the server
-- creates (payments, ledger, disputes, audit_logs) default to a uuid.
-- People are auth.users ids (uuid).

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- users: one row per auth user, created by the on_auth_user_created trigger
-- (replaces the onUserCreate Function).
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text,
  email text,
  name text not null default '',
  -- Legacy single-category roles (Role in src/types). Kept for the type's shape; authorization uses memberships.
  roles text[] not null default '{}',
  active_role text,
  -- [{category, role}], written only by add_membership() (CONTRACTS C1/C3).
  memberships jsonb not null default '[]'::jsonb,
  active_category text check (active_category in ('coconut', 'construction')),
  nic_status text not null default 'unverified' check (nic_status in ('unverified', 'pending', 'verified', 'rejected')),
  nic_number text,
  nic_front_url text,
  nic_back_url text,
  nic_submitted_at timestamptz,
  nic_rejection_reason text,
  preferred_language text not null default 'en',
  trust_score numeric not null default 0,
  -- Staff flag (was the `admin` custom claim). Only set_admin() or SQL by a project owner changes it.
  is_admin boolean not null default false,
  avatar_url text,
  location text,
  payout_bank_ref text,
  created_at timestamptz not null default now()
);

-- Completion PINs live apart from users so a user's own select can never return the hash.
create table public.user_pins (
  user_id uuid primary key references public.users (id) on delete cascade,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

-- Platform settings, server-only (was config/platform). ADR-011: fee_percent defaults to 5.
create table public.platform_config (
  key text primary key,
  value jsonb not null
);
insert into public.platform_config (key, value) values ('fee_percent', '5'::jsonb);

-- ---------------------------------------------------------------------------
-- Marketplace
-- ---------------------------------------------------------------------------
create table public.estates (
  id text primary key,
  category text not null default 'coconut' check (category in ('coconut', 'construction')),
  attributes jsonb,
  owner_id uuid not null references public.users (id),
  name text not null,
  area_acres numeric not null default 0,
  location text not null default '',
  tree_count integer not null default 0,
  notes text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);
create index estates_owner_id_idx on public.estates (owner_id);

create table public.jobs (
  id text primary key,
  category text not null default 'coconut' check (category in ('coconut', 'construction')),
  owner_id uuid not null references public.users (id),
  owner_name text not null default '',
  -- Set by award_bid(); lets the completions policy check the submitter is the awarded bidder.
  supervisor_id uuid references public.users (id),
  -- No FK: an owner may delete an estate that old jobs still name.
  estate_id text not null,
  estate_name text not null default '',
  estate_location text not null default '',
  task_type text not null,
  starts_at date not null,
  ends_at date not null,
  worker_count integer not null default 1,
  duration_days integer not null default 1,
  required_skills text[] not null default '{}',
  wage_budget numeric not null default 0,
  status text not null default 'OPEN' check (status in (
    'DRAFT', 'OPEN', 'AWARDED_PENDING_FEE', 'CANCELLED', 'ACTIVE', 'IN_PROGRESS',
    'PENDING_COMPLETION', 'COMPLETED', 'EXCEPTION_OPEN', 'CLOSED_DISPUTED'
  )),
  description text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);
create index jobs_owner_id_idx on public.jobs (owner_id);
create index jobs_supervisor_id_idx on public.jobs (supervisor_id);

create table public.workers (
  id text primary key,
  category text not null default 'coconut' check (category in ('coconut', 'construction')),
  supervisor_id uuid not null references public.users (id),
  name text not null,
  phone text not null default '',
  skills text[] not null default '{}',
  nic_ref text not null default '',
  bank_ref text,
  consent_captured_at timestamptz not null default now(),
  consent_method text not null check (consent_method in ('sms', 'written', 'verbal_recorded')),
  rating numeric not null default 0,
  jobs_completed integer not null default 0,
  active boolean not null default true
);
create index workers_supervisor_id_idx on public.workers (supervisor_id);

create table public.bids (
  id text primary key,
  category text not null default 'coconut' check (category in ('coconut', 'construction')),
  job_id text not null references public.jobs (id),
  -- Denormalized from the job at submission; the insert policy checks it matches the real job owner.
  owner_id uuid not null references public.users (id),
  supervisor_id uuid not null references public.users (id),
  supervisor_name text not null default '',
  supervisor_phone text not null default '',
  supervisor_trust_score numeric not null default 0,
  price numeric not null,
  supervisor_fee numeric not null default 0,
  payment_schedule text not null check (payment_schedule in ('daily', 'lump_sum')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  submitted_at timestamptz not null default now(),
  crew_member_ids text[] not null default '{}',
  crew_members jsonb
);
create index bids_job_id_idx on public.bids (job_id);
create index bids_owner_id_idx on public.bids (owner_id);
create index bids_supervisor_id_idx on public.bids (supervisor_id);

-- ---------------------------------------------------------------------------
-- Money (server-written only: no client insert/update/delete grants)
-- ---------------------------------------------------------------------------
create table public.awards (
  id text primary key,
  category text not null default 'coconut',
  job_id text not null references public.jobs (id),
  owner_id uuid not null references public.users (id),
  owner_name text,
  owner_phone text,
  bid_id text not null references public.bids (id),
  supervisor_id uuid not null references public.users (id),
  supervisor_name text not null default '',
  awarded_at timestamptz not null default now(),
  escrow_status text not null default 'pending' check (escrow_status in (
    'pending', 'held', 'release_requested', 'released', 'disputed', 'refunded'
  )),
  escrow_amount numeric not null,
  contacts_released_at timestamptz,
  fee_payment_ref text,
  payout_ref text,
  payout_at timestamptz,
  payout_amount numeric
);
create unique index awards_job_id_key on public.awards (job_id);
create index awards_owner_id_idx on public.awards (owner_id);
create index awards_supervisor_id_idx on public.awards (supervisor_id);

create table public.payments (
  id text primary key default gen_random_uuid()::text,
  category text not null default 'coconut',
  award_id text not null references public.awards (id),
  job_id text not null references public.jobs (id),
  owner_id uuid not null references public.users (id),
  supervisor_id uuid not null references public.users (id),
  amount numeric not null,
  platform_fee numeric not null,
  currency text not null default 'LKR',
  provider text not null default 'payhere',
  provider_ref text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index payments_award_id_idx on public.payments (award_id);
-- At most one successful payment per award, enforced by the database rather than a read-then-write check.
create unique index payments_one_paid_per_award on public.payments (award_id) where status = 'paid';

create table public.ledger (
  id text primary key default gen_random_uuid()::text,
  category text not null default 'coconut',
  award_id text not null references public.awards (id),
  payment_id text references public.payments (id),
  owner_id uuid not null references public.users (id),
  supervisor_id uuid not null references public.users (id),
  type text not null check (type in ('hold', 'release', 'refund')),
  amount numeric not null,
  currency text not null default 'LKR',
  created_at timestamptz not null default now(),
  -- A user id, or 'system' for the PayHere webhook.
  created_by text not null
);
create index ledger_award_id_idx on public.ledger (award_id);

create table public.audit_logs (
  id text primary key default gen_random_uuid()::text,
  actor_id text not null,
  actor_name text not null default '',
  action text not null,
  subject_type text not null,
  subject_id text not null,
  details text not null default '',
  at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Work tracking
-- ---------------------------------------------------------------------------
create table public.attendance_days (
  id text primary key,
  job_id text not null references public.jobs (id),
  owner_id uuid not null references public.users (id),
  supervisor_id uuid not null references public.users (id),
  work_date date not null,
  status text not null default 'open' check (status in ('open', 'reconciled', 'disputed')),
  created_at timestamptz not null default now()
);
create index attendance_days_job_id_idx on public.attendance_days (job_id);

create table public.attendance_entries (
  id text primary key,
  attendance_day_id text not null references public.attendance_days (id),
  owner_id uuid not null references public.users (id),
  supervisor_id uuid not null references public.users (id),
  worker_id text not null,
  worker_name text not null default '',
  party text not null check (party in ('supervisor', 'owner')),
  present boolean not null,
  recorded_by uuid not null references public.users (id),
  recorded_at timestamptz not null default now(),
  evidence_blob_ref text,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'pending_offline')),
  notes text
);
create index attendance_entries_day_idx on public.attendance_entries (attendance_day_id);

create table public.completions (
  id text primary key,
  job_id text not null references public.jobs (id),
  owner_id uuid not null references public.users (id),
  submitted_by uuid not null references public.users (id),
  submitted_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'disputed')),
  wage_records jsonb not null default '[]'::jsonb,
  total_wages numeric not null default 0,
  supervisor_fee numeric not null default 0,
  notes text,
  -- Wrong-PIN rate limit for confirm_completion(); not client-writable.
  pin_attempts integer not null default 0,
  pin_attempts_window_start timestamptz
);
create index completions_job_id_idx on public.completions (job_id);

create table public.ratings (
  id text primary key,
  job_id text not null references public.jobs (id),
  from_user_id uuid not null references public.users (id),
  from_name text not null default '',
  to_user_id uuid not null references public.users (id),
  to_role text not null,
  score integer not null check (score between 1 and 5),
  review_tags text[] not null default '{}',
  comment text not null default '',
  submitted_at timestamptz not null default now(),
  -- Closes the "no one-per-job uniqueness" gap the Firestore rules could not express.
  unique (job_id, from_user_id, to_user_id)
);

create table public.disputes (
  id text primary key default gen_random_uuid()::text,
  category text not null default 'coconut',
  job_id text not null references public.jobs (id),
  award_id text not null references public.awards (id),
  owner_id uuid not null references public.users (id),
  supervisor_id uuid not null references public.users (id),
  opened_by uuid not null references public.users (id),
  reason text not null,
  opened_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolution text check (resolution in ('refunded', 'released')),
  resolved_by uuid references public.users (id),
  resolved_at timestamptz
);
create index disputes_award_id_idx on public.disputes (award_id);

create table public.nic_submissions (
  id text primary key,
  user_id uuid not null references public.users (id),
  user_name text not null default '',
  user_phone text not null default '',
  role text not null,
  nic_number text not null,
  nic_format text not null check (nic_format in ('OLD_9V', 'NEW_12', 'UNKNOWN')),
  dob text,
  gender text check (gender in ('MALE', 'FEMALE')),
  -- Storage object paths in the private `nic` bucket (CONTRACTS C5), not public URLs.
  front_image_url text not null,
  back_image_url text not null,
  front_file_name text not null default '',
  back_file_name text not null default '',
  front_file_size_kb integer,
  back_file_size_kb integer,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  rejection_reason text
);
create index nic_submissions_user_id_idx on public.nic_submissions (user_id);

-- ---------------------------------------------------------------------------
-- New auth user -> public.users row (replaces the onUserCreate Function).
-- ---------------------------------------------------------------------------
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, phone, email, name)
  values (
    new.id,
    -- auth.users stores phone without the leading '+'
    case when new.phone is null or new.phone = '' then null else '+' || ltrim(new.phone, '+') end,
    nullif(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Realtime: the tables store.startSync() listens to. RLS applies to the feed.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table
  public.users, public.estates, public.jobs, public.workers, public.bids, public.awards,
  public.attendance_days, public.attendance_entries, public.completions, public.disputes,
  public.nic_submissions;
