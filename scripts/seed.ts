/**
 * Fills a Supabase project with a usable demo for both categories (coconut,
 * construction): auth users, their profiles and memberships, estates/sites,
 * workers, jobs, bids and funded awards.
 *
 * Field names match the types in src/types/index.ts (Estate, LabourJob, Bid,
 * Worker, Award; "estate_id", "supervisor_id", ...) for every category, not
 * just coconut. See DECISIONS.md ADR-007.
 *
 * Uses the service_role key (bypasses RLS) to write memberships, is_admin and
 * the money tables directly, skipping add_membership()/award_bid(). That is
 * only acceptable for demo data; never reuse this pattern in app code.
 * Re-running is safe: users are matched by phone/email, rows are upserted.
 *
 * Run with: npm run seed -- --yes   (URL and service_role key from .env.local)
 * Never against production.
 */
import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv, requireEnv } from './lib/env';

loadLocalEnv();
const SUPABASE_URL = requireEnv('VITE_SUPABASE_URL');
const admin = createClient(SUPABASE_URL, requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Postgres parses both full ISO timestamps and plain dates (starts_at/ends_at are `date` columns).
const iso = (s: string) => s;

interface Membership {
  category: 'coconut' | 'construction';
  role: string;
}

interface SeedUser {
  uid: string;
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  memberships: Membership[];
  active_category?: 'coconut' | 'construction';
  admin?: boolean;
  nic_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  /** Demo completion-confirmation PIN (confirm_completion) — hashed by set_user_pin(), never stored plain. */
  completionPin?: string;
}

// ---------------------------------------------------------------------------
// Coconut — ported from store.ts's initialUsers/Estates/Workers/Jobs/Bids/Awards
// ---------------------------------------------------------------------------

const coconutUsers: SeedUser[] = [
  {
    uid: 'user-owner-1',
    name: 'Sunil Perera',
    phone: '+94771234567',
    memberships: [{ category: 'coconut', role: 'owner' }, { category: 'coconut', role: 'agent' }],
    active_category: 'coconut',
    nic_status: 'verified',
    completionPin: '1234',
  },
  {
    uid: 'user-sup-1',
    name: 'Kusal Mendis',
    phone: '+94719876543',
    memberships: [{ category: 'coconut', role: 'agent' }],
    active_category: 'coconut',
    nic_status: 'verified',
  },
  {
    uid: 'user-worker-1',
    name: 'Chaminda Silva',
    phone: '+94765551234',
    memberships: [{ category: 'coconut', role: 'worker' }],
    active_category: 'coconut',
    nic_status: 'verified',
  },
  {
    uid: 'user-worker-2',
    name: 'Ruwan Kumara',
    phone: '+94784449876',
    memberships: [{ category: 'coconut', role: 'worker' }],
    active_category: 'coconut',
    nic_status: 'pending',
  },
  {
    uid: 'user-admin-1',
    name: 'Niluka Fernando',
    email: 'niluka.fernando@coconnect.gov.lk',
    password: 'coconnect-admin-demo-pw',
    memberships: [],
    admin: true,
    nic_status: 'verified',
  },
];

const coconutEstates = [
  {
    id: 'est-1',
    category: 'coconut' as const,
    owner_id: 'user-owner-1',
    name: 'Silver Palm Estate',
    location: 'Narammala, Kurunegala',
    lat: 7.4344,
    lng: 80.2181,
    area_acres: 14.5,
    tree_count: 940,
    notes: 'Well-spaced mature tall palms. Good tractor access road.',
    created_at: iso('2025-11-12T10:00:00Z'),
  },
  {
    id: 'est-2',
    category: 'coconut' as const,
    owner_id: 'user-owner-1',
    name: 'Chilaw Coastal Coconut Grove',
    location: 'Madampe, Chilaw',
    lat: 7.4988,
    lng: 79.8458,
    area_acres: 8.0,
    tree_count: 530,
    notes: 'Sandy soil grove, young and mature mixed cultivars.',
    created_at: iso('2025-12-01T09:00:00Z'),
  },
  {
    id: 'est-3',
    category: 'coconut' as const,
    owner_id: 'user-owner-1',
    name: 'Kuliyapitiya Model Plantation',
    location: 'Kuliyapitiya, Wayamba',
    lat: 7.4689,
    lng: 80.0436,
    area_acres: 11.2,
    tree_count: 720,
    notes: 'Drip irrigated hybrid dwarf-tall coconut plantation.',
    created_at: iso('2026-01-15T09:00:00Z'),
  },
];

const coconutWorkers = [
  {
    id: 'worker-1', category: 'coconut' as const, supervisor_id: 'user-sup-1', name: 'Chaminda Silva', phone: '+94765551234',
    skills: ['Coconut Plucking', 'Tree Climbing', 'Inspection'], nic_ref: '199044201193', bank_ref: 'BOC Narammala 77889922',
    consent_captured_at: iso('2026-01-05T11:05:00Z'), consent_method: 'sms', rating: 4.85, jobs_completed: 34, active: true,
  },
  {
    id: 'worker-2', category: 'coconut' as const, supervisor_id: 'user-sup-1', name: 'Ruwan Kumara', phone: '+94784449876',
    skills: ['Nut Husking', 'Copra Bagging', 'Field Clearing'], nic_ref: '199581029384', bank_ref: 'Peoples Bank Madampe 1029384',
    consent_captured_at: iso('2026-02-12T14:20:00Z'), consent_method: 'written', rating: 4.70, jobs_completed: 21, active: true,
  },
  {
    id: 'worker-3', category: 'coconut' as const, supervisor_id: 'user-sup-1', name: 'Samantha Bandara', phone: '+94701122334',
    skills: ['Tree Climbing', 'Nut Gathering', 'Crown Cleaning'], nic_ref: '198734902194',
    consent_captured_at: iso('2026-01-10T10:00:00Z'), consent_method: 'verbal_recorded', rating: 4.90, jobs_completed: 42, active: true,
  },
  {
    id: 'worker-4', category: 'coconut' as const, supervisor_id: 'user-sup-1', name: 'Priyantha Jayasuriya', phone: '+94723344556',
    skills: ['Fertilizer Trenching', 'Organic Mulching'], nic_ref: '198429103948',
    consent_captured_at: iso('2026-01-15T09:00:00Z'), consent_method: 'written', rating: 4.65, jobs_completed: 18, active: true,
  },
  {
    id: 'worker-5', category: 'coconut' as const, supervisor_id: 'user-sup-1', name: 'Nimal Dissanayake', phone: '+94754455667',
    skills: ['Tractor Transport', 'Nut Counting & Grading'], nic_ref: '198129304958',
    consent_captured_at: iso('2026-01-20T08:30:00Z'), consent_method: 'sms', rating: 4.80, jobs_completed: 29, active: true,
  },
];

const coconutJobs = [
  {
    id: 'job-101', category: 'coconut' as const, owner_id: 'user-owner-1', owner_name: 'Sunil Perera',
    estate_id: 'est-1', estate_name: 'Silver Palm Estate', estate_location: 'Narammala, Kurunegala',
    task_type: 'Coconut Harvesting & Bunch Lowering', starts_at: iso('2026-09-24'), ends_at: iso('2026-09-26'),
    worker_count: 4, duration_days: 2, required_skills: ['Tree Climbing', 'Coconut Plucking', 'Nut Gathering'],
    wage_budget: 48000, status: 'OPEN', created_at: iso('2026-09-18T10:00:00Z'),
    description: 'Bi-monthly harvest of approx 940 palms. Requires experienced climbers with safety harnesses.',
  },
  {
    id: 'job-102', category: 'coconut' as const, owner_id: 'user-owner-1', owner_name: 'Sunil Perera',
    estate_id: 'est-2', estate_name: 'Chilaw Coastal Coconut Grove', estate_location: 'Madampe, Chilaw',
    task_type: 'Fertilizer Ring Application & Mulching', starts_at: iso('2026-09-22'), ends_at: iso('2026-09-23'),
    worker_count: 3, duration_days: 2, required_skills: ['Fertilizer Trenching', 'Organic Mulching'],
    wage_budget: 36000, status: 'ACTIVE', supervisor_id: 'user-sup-1', created_at: iso('2026-09-16T08:30:00Z'),
    description: 'Applying inorganic fertilizer mix in 6-foot circular trenches around 500 palms with coir dust mulching.',
  },
  {
    id: 'job-103', category: 'coconut' as const, owner_id: 'user-owner-1', owner_name: 'Sunil Perera',
    estate_id: 'est-1', estate_name: 'Silver Palm Estate', estate_location: 'Narammala, Kurunegala',
    task_type: 'Dry Frond Trimming & Crown Cleaning', starts_at: iso('2026-09-20'), ends_at: iso('2026-09-21'),
    worker_count: 3, duration_days: 2, required_skills: ['Tree Climbing', 'Crown Cleaning'],
    wage_budget: 39000, status: 'IN_PROGRESS', supervisor_id: 'user-sup-1', created_at: iso('2026-09-14T11:00:00Z'),
    description: 'Preventative maintenance against rhinoceros beetle and clearing dead petioles.',
  },
  {
    id: 'job-104', category: 'coconut' as const, owner_id: 'user-owner-1', owner_name: 'Sunil Perera',
    estate_id: 'est-2', estate_name: 'Chilaw Coastal Coconut Grove', estate_location: 'Madampe, Chilaw',
    task_type: 'Nut Husking & Copra Drying Batch', starts_at: iso('2026-09-05'), ends_at: iso('2026-09-07'),
    worker_count: 3, duration_days: 3, required_skills: ['Nut Husking', 'Copra Bagging'],
    wage_budget: 45000, status: 'COMPLETED', created_at: iso('2026-09-01T09:00:00Z'),
    description: 'Husking 8,000 harvested nuts and loading into the drying kiln.',
  },
];

const coconutBids = [
  {
    id: 'bid-201', category: 'coconut' as const, owner_id: 'user-owner-1', job_id: 'job-101', supervisor_id: 'user-sup-1', supervisor_name: 'Kusal Mendis',
    supervisor_phone: '+94719876543', supervisor_trust_score: 4.92, price: 46000, supervisor_fee: 4000,
    payment_schedule: 'daily', status: 'pending', submitted_at: iso('2026-09-18T14:30:00Z'),
    crew_member_ids: ['worker-1', 'worker-2', 'worker-3', 'worker-5'],
  },
  {
    id: 'bid-202', category: 'coconut' as const, owner_id: 'user-owner-1', job_id: 'job-102', supervisor_id: 'user-sup-1', supervisor_name: 'Kusal Mendis',
    supervisor_phone: '+94719876543', supervisor_trust_score: 4.92, price: 35000, supervisor_fee: 3500,
    payment_schedule: 'lump_sum', status: 'accepted', submitted_at: iso('2026-09-16T10:00:00Z'),
    crew_member_ids: ['worker-2', 'worker-4', 'worker-5'],
  },
  {
    id: 'bid-203', category: 'coconut' as const, owner_id: 'user-owner-1', job_id: 'job-103', supervisor_id: 'user-sup-1', supervisor_name: 'Kusal Mendis',
    supervisor_phone: '+94719876543', supervisor_trust_score: 4.92, price: 38000, supervisor_fee: 3800,
    payment_schedule: 'daily', status: 'accepted', submitted_at: iso('2026-09-15T08:00:00Z'),
    crew_member_ids: ['worker-1', 'worker-3', 'worker-4'],
  },
];

const coconutAwards = [
  {
    id: 'award-302', category: 'coconut' as const, owner_id: 'user-owner-1', owner_name: 'Sunil Perera', owner_phone: '+94771234567', job_id: 'job-102', bid_id: 'bid-202', supervisor_id: 'user-sup-1', supervisor_name: 'Kusal Mendis',
    awarded_at: iso('2026-09-17T09:00:00Z'), escrow_status: 'held', escrow_amount: 35000,
    contacts_released_at: iso('2026-09-17T09:05:00Z'), fee_payment_ref: 'PAYHERE-ESCROW-882910',
  },
  {
    id: 'award-303', category: 'coconut' as const, owner_id: 'user-owner-1', owner_name: 'Sunil Perera', owner_phone: '+94771234567', job_id: 'job-103', bid_id: 'bid-203', supervisor_id: 'user-sup-1', supervisor_name: 'Kusal Mendis',
    awarded_at: iso('2026-09-15T10:00:00Z'), escrow_status: 'held', escrow_amount: 38000,
    contacts_released_at: iso('2026-09-15T10:02:00Z'), fee_payment_ref: 'PAYHERE-ESCROW-773019',
  },
];

// ---------------------------------------------------------------------------
// Construction — from .claude/docs/categories.md's draft content.
//
// The Estate type (src/types/index.ts) requires area_acres/tree_count,
// which are coconut-specific. Rather than widen that type (it's read by
// ~100 call sites in src/components/**, Session 2's files — see ADR-007),
// construction estates fill those fields with a plot-size-derived
// placeholder for now and put the real detail in `notes`. A generic
// per-category site-fields bag (categories.md's "siteFields") is a
// Session 2 config/UI concern to request through CONTRACTS.md when they
// build the construction site form, not something to half-build here.
// ---------------------------------------------------------------------------

const constructionUsers: SeedUser[] = [
  {
    uid: 'user-client-1',
    name: 'Priya Jayawardena',
    phone: '+94772223344',
    memberships: [{ category: 'construction', role: 'client' }],
    active_category: 'construction',
    nic_status: 'verified',
    completionPin: '1234',
  },
  {
    uid: 'user-contractor-1',
    name: 'Ajith Gunawardena (Lanka Builders)',
    phone: '+94773334455',
    memberships: [{ category: 'construction', role: 'contractor' }],
    active_category: 'construction',
    nic_status: 'verified',
  },
  {
    uid: 'user-subcontractor-1',
    name: 'Ruwanthi Electrical Services',
    phone: '+94774445566',
    memberships: [{ category: 'construction', role: 'contractor' }],
    active_category: 'construction',
    nic_status: 'verified',
  },
  {
    uid: 'user-worker-c1',
    name: 'Gamini Rathnayake',
    phone: '+94775556677',
    memberships: [{ category: 'construction', role: 'worker' }],
    active_category: 'construction',
    nic_status: 'verified',
  },
];

const constructionEstates = [
  {
    id: 'site-c1',
    category: 'construction' as const,
    owner_id: 'user-client-1',
    name: 'New House Construction — Nugegoda',
    location: 'Nugegoda, Colombo',
    lat: 6.8649,
    lng: 79.8997,
    area_acres: 2400 / 43560, // 2,400 sq ft plot, converted so the (coconut-shaped) Estate type still holds a real number
    tree_count: 0,
    notes: 'New two-storey residential build (2,400 sq ft, 2 floors). Foundation work starting.',
    created_at: iso('2026-09-10T09:00:00Z'),
  },
  {
    id: 'site-c2',
    category: 'construction' as const,
    owner_id: 'user-client-1',
    name: 'Shop Renovation — Maharagama',
    location: 'Maharagama, Colombo',
    lat: 6.8481,
    lng: 79.9269,
    area_acres: 800 / 43560,
    tree_count: 0,
    notes: 'Retail unit renovation (800 sq ft, 1 floor): rewiring, tiling, painting.',
    created_at: iso('2026-09-20T09:00:00Z'),
  },
];

const constructionWorkers = [
  {
    id: 'worker-c1', category: 'construction' as const, supervisor_id: 'user-contractor-1', name: 'Gamini Rathnayake', phone: '+94775556677',
    skills: ['Mason', 'Steel Fixer'], nic_ref: '198845102938', bank_ref: 'Commercial Bank Nugegoda 5567788',
    consent_captured_at: iso('2026-09-10T09:30:00Z'), consent_method: 'sms', rating: 4.75, jobs_completed: 27, active: true,
  },
  {
    id: 'worker-c2', category: 'construction' as const, supervisor_id: 'user-contractor-1', name: 'Saman Kodikara', phone: '+94776667788',
    skills: ['Carpenter', 'Formwork'], nic_ref: '199123948571',
    consent_captured_at: iso('2026-09-10T09:35:00Z'), consent_method: 'written', rating: 4.60, jobs_completed: 15, active: true,
  },
  {
    id: 'worker-c3', category: 'construction' as const, supervisor_id: 'user-subcontractor-1', name: 'Nadeesha Peris', phone: '+94777778899',
    skills: ['Electrician'], nic_ref: '199534029381',
    consent_captured_at: iso('2026-09-21T09:00:00Z'), consent_method: 'sms', rating: 4.95, jobs_completed: 33, active: true,
  },
];

const constructionJobs = [
  {
    id: 'job-c101', category: 'construction' as const, owner_id: 'user-client-1', owner_name: 'Priya Jayawardena',
    estate_id: 'site-c1', estate_name: 'New House Construction — Nugegoda', estate_location: 'Nugegoda, Colombo',
    task_type: 'Foundation & Masonry Work', starts_at: iso('2026-10-05'), ends_at: iso('2026-10-20'),
    worker_count: 5, duration_days: 15, required_skills: ['Mason', 'Steel Fixer', 'Helper (Labourer)'],
    wage_budget: 650000, status: 'OPEN', created_at: iso('2026-09-25T09:00:00Z'),
    description: 'Foundation excavation, footing and column base masonry for a two-storey house.',
  },
  {
    id: 'job-c102', category: 'construction' as const, owner_id: 'user-client-1', owner_name: 'Priya Jayawardena',
    estate_id: 'site-c2', estate_name: 'Shop Renovation — Maharagama', estate_location: 'Maharagama, Colombo',
    task_type: 'Electrical Wiring', starts_at: iso('2026-09-28'), ends_at: iso('2026-10-02'),
    worker_count: 2, duration_days: 5, required_skills: ['Electrician'],
    wage_budget: 120000, status: 'ACTIVE', supervisor_id: 'user-subcontractor-1', created_at: iso('2026-09-21T10:00:00Z'),
    description: 'Full rewire of a retail unit: new consumer unit, lighting circuits, socket outlets.',
  },
  {
    id: 'job-c103', category: 'construction' as const, owner_id: 'user-client-1', owner_name: 'Priya Jayawardena',
    estate_id: 'site-c1', estate_name: 'New House Construction — Nugegoda', estate_location: 'Nugegoda, Colombo',
    task_type: 'Carpentry & Formwork', starts_at: iso('2026-10-21'), ends_at: iso('2026-10-28'),
    worker_count: 3, duration_days: 7, required_skills: ['Carpenter', 'Formwork'],
    wage_budget: 210000, status: 'DRAFT', created_at: iso('2026-09-25T09:10:00Z'),
    description: 'Formwork for the ground-floor slab and columns.',
  },
];

const constructionBids = [
  {
    id: 'bid-c201', category: 'construction' as const, owner_id: 'user-client-1', job_id: 'job-c101', supervisor_id: 'user-contractor-1', supervisor_name: 'Ajith Gunawardena (Lanka Builders)',
    supervisor_phone: '+94773334455', supervisor_trust_score: 4.80, price: 620000, supervisor_fee: 31000,
    payment_schedule: 'lump_sum', status: 'pending', submitted_at: iso('2026-09-26T09:00:00Z'),
    crew_member_ids: ['worker-c1', 'worker-c2'],
  },
  {
    id: 'bid-c202', category: 'construction' as const, owner_id: 'user-client-1', job_id: 'job-c102', supervisor_id: 'user-subcontractor-1', supervisor_name: 'Ruwanthi Electrical Services',
    supervisor_phone: '+94774445566', supervisor_trust_score: 4.95, price: 115000, supervisor_fee: 5750,
    payment_schedule: 'lump_sum', status: 'accepted', submitted_at: iso('2026-09-22T09:00:00Z'),
    crew_member_ids: ['worker-c3'],
  },
];

const constructionAwards = [
  {
    id: 'award-c302', category: 'construction' as const, owner_id: 'user-client-1', owner_name: 'Priya Jayawardena', owner_phone: '+94772223344', job_id: 'job-c102', bid_id: 'bid-c202', supervisor_id: 'user-subcontractor-1', supervisor_name: 'Ruwanthi Electrical Services',
    awarded_at: iso('2026-09-23T09:00:00Z'), escrow_status: 'held', escrow_amount: 115000,
    contacts_released_at: iso('2026-09-23T09:05:00Z'), fee_payment_ref: 'PAYHERE-ESCROW-559012',
  },
];

// ---------------------------------------------------------------------------

/** Seed uid ('user-owner-1', ...) -> the real auth.users id it got in this project. */
const uidMap = new Map<string, string>();

async function findAuthUser(u: SeedUser): Promise<string | null> {
  const phone = u.phone?.replace(/^\+/, '');
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((x) => (phone && x.phone === phone) || (u.email && x.email === u.email));
    if (match) return match.id;
    if (data.users.length < 1000) return null;
  }
}

async function seedUser(u: SeedUser) {
  let id = await findAuthUser(u);
  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      phone: u.phone,
      phone_confirm: Boolean(u.phone),
      email: u.email,
      email_confirm: Boolean(u.email),
      password: u.password,
      user_metadata: { full_name: u.name },
    });
    if (error) throw error;
    id = data.user.id;
  }
  uidMap.set(u.uid, id);

  // The on_auth_user_created trigger made the row; fill in the demo profile.
  const { error } = await admin
    .from('users')
    .update({
      name: u.name,
      memberships: u.memberships,
      active_category: u.active_category ?? null,
      nic_status: u.nic_status ?? 'unverified',
      is_admin: u.admin === true,
      trust_score: 4.8,
    })
    .eq('id', id);
  if (error) throw error;

  if (u.completionPin) {
    const { error: pinError } = await admin.rpc('set_user_pin', { p_user_id: id, p_pin: u.completionPin });
    if (pinError) throw pinError;
  }
}

const USER_FIELDS = ['owner_id', 'supervisor_id'] as const;

/** Swaps seed uids for real ones in the user-reference columns. */
function withRealUids<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const field of USER_FIELDS) {
    const seedUid = out[field];
    if (typeof seedUid === 'string') {
      const real = uidMap.get(seedUid);
      if (!real) throw new Error(`No seeded user for ${field}=${seedUid}`);
      out[field] = real;
    }
  }
  return out as T;
}

async function seedTable(table: string, rows: Array<{ id: string } & Record<string, unknown>>) {
  const { error } = await admin.from(table).upsert(rows.map(withRealUids));
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  if (!process.argv.includes('--yes')) {
    console.log(`This writes demo users and data into ${SUPABASE_URL}.`);
    console.log('Re-run with: npm run seed -- --yes');
    process.exit(1);
  }
  console.log(`Seeding ${SUPABASE_URL}...`);

  console.log('  users (auth + profiles)...');
  for (const u of [...coconutUsers, ...constructionUsers]) {
    await seedUser(u);
  }

  console.log('  estates, jobs, workers, bids, awards...');
  await seedTable('estates', [...coconutEstates, ...constructionEstates]);
  await seedTable('jobs', [...coconutJobs, ...constructionJobs]);
  await seedTable('workers', [...coconutWorkers, ...constructionWorkers]);
  await seedTable('bids', [...coconutBids, ...constructionBids]);
  await seedTable('awards', [...coconutAwards, ...constructionAwards]);

  console.log('Done. Demo accounts:');
  console.log('  coconut owner           : phone +94771234567');
  console.log('  coconut agent           : phone +94719876543');
  console.log('  coconut worker          : phone +94765551234');
  console.log('  construction client     : phone +94772223344');
  console.log('  construction contractors: phone +94773334455, +94774445566');
  console.log('  construction worker     : phone +94775556677');
  console.log('  admin (staff)           : niluka.fernando@coconnect.gov.lk / coconnect-admin-demo-pw');
  console.log('  completion PIN (both posters): 1234');
  console.log('  Phone sign-in needs an SMS provider, or these numbers added as test numbers');
  console.log('  (Dashboard > Authentication > Providers > Phone > Test phone numbers, e.g. OTP 123456).');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
