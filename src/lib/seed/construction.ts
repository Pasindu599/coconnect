import type { Award, Bid, Estate, LabourJob, User, Worker } from '../../types';

/**
 * Demo data for the Construction category (mock phase). The coconut demo data lives in
 * store.ts. Session 1's emulator seed script (ROADMAP S1-06) replaces both.
 *
 * Demo sign-ins (OTP 123456): client +94 77 200 0001, contractors +94 77 200 0002 and
 * +94 77 200 0003, tradesperson +94 77 200 0004.
 */

const users: User[] = [
  {
    id: 'user-client-1',
    name: 'Nimal Jayasuriya',
    phone: '+94772000001',
    roles: ['owner'],
    active_role: 'owner',
    memberships: [{ category: 'construction', role: 'client' }],
    active_category: 'construction',
    nic_status: 'verified',
    nic_number: '197825101234',
    preferred_language: 'en',
    trust_score: 4.8,
    pin_hash: '1234',
    created_at: '2026-08-10T08:00:00Z',
    location: 'Nugegoda, Colombo District',
  },
  {
    id: 'user-contractor-1',
    name: 'Ranjith Silva',
    phone: '+94772000002',
    roles: ['supervisor'],
    active_role: 'supervisor',
    memberships: [{ category: 'construction', role: 'contractor' }],
    active_category: 'construction',
    nic_status: 'verified',
    nic_number: '198134502211',
    preferred_language: 'en',
    trust_score: 4.9,
    pin_hash: '2244',
    created_at: '2026-07-21T09:30:00Z',
    location: 'Maharagama, Colombo District',
  },
  {
    id: 'user-subcontractor-1',
    name: 'Dilan Perera',
    phone: '+94772000003',
    roles: ['supervisor'],
    active_role: 'supervisor',
    memberships: [{ category: 'construction', role: 'contractor' }],
    active_category: 'construction',
    nic_status: 'verified',
    nic_number: '198567803345',
    preferred_language: 'en',
    trust_score: 4.7,
    pin_hash: '3344',
    created_at: '2026-08-02T10:15:00Z',
    location: 'Kandy',
  },
  {
    id: 'user-cworker-1',
    name: 'Saman Kumara',
    phone: '+94772000004',
    roles: ['worker'],
    active_role: 'worker',
    memberships: [{ category: 'construction', role: 'worker' }],
    active_category: 'construction',
    nic_status: 'verified',
    nic_number: '199245604455',
    preferred_language: 'en',
    trust_score: 4.6,
    pin_hash: '5555',
    created_at: '2026-08-15T11:00:00Z',
    location: 'Maharagama, Colombo District',
  },
];

const estates: Estate[] = [
  {
    id: 'site-c-1',
    category: 'construction',
    attributes: { site_type: 'House', floor_area_sqft: 2400, floors: 2 },
    owner_id: 'user-client-1',
    name: 'Two-storey house, Nugegoda',
    area_acres: 0,
    tree_count: 0,
    location: 'Nugegoda, Colombo District',
    notes: 'Corner plot, wide road access. Water and electricity available on site.',
    lat: 6.8649,
    lng: 79.8997,
    created_at: '2026-08-12T10:00:00Z',
  },
  {
    id: 'site-c-2',
    category: 'construction',
    attributes: { site_type: 'Renovation', floor_area_sqft: 900, floors: 1 },
    owner_id: 'user-client-1',
    name: 'Shop renovation, Kandy',
    area_acres: 0,
    tree_count: 0,
    location: 'Peradeniya Road, Kandy',
    notes: 'Ground-floor shop. Work only after 6 pm on weekdays.',
    lat: 7.2906,
    lng: 80.6337,
    created_at: '2026-08-20T09:00:00Z',
  },
];

const worker = (
  id: string,
  supervisor_id: string,
  name: string,
  phone: string,
  skills: string[],
  rating: number,
  jobs_completed: number
): Worker => ({
  id,
  category: 'construction',
  supervisor_id,
  name,
  phone,
  skills,
  nic_ref: '19900000000V',
  bank_ref: 'COM 11223344',
  consent_captured_at: '2026-08-16T10:00:00Z',
  consent_method: 'sms',
  rating,
  jobs_completed,
  active: true,
});

const workers: Worker[] = [
  worker('worker-c-1', 'user-contractor-1', 'Saman Kumara', '+94772000004', ['Mason'], 4.6, 12),
  worker('worker-c-2', 'user-contractor-1', 'Priyantha Fernando', '+94772100002', ['Mason', 'Helper (Labourer)'], 4.5, 9),
  worker('worker-c-3', 'user-contractor-1', 'Lasith Bandara', '+94772100003', ['Carpenter'], 4.8, 15),
  worker('worker-c-4', 'user-contractor-1', 'Kasun Rathnayake', '+94772100004', ['Helper (Labourer)'], 4.4, 6),
  worker('worker-c-5', 'user-subcontractor-1', 'Chamara Wijesinghe', '+94772100005', ['Electrician'], 4.9, 21),
];

const job = (
  id: string,
  estate: Estate,
  task_type: string,
  worker_count: number,
  duration_days: number,
  required_skills: string[],
  wage_budget: number,
  status: LabourJob['status'],
  starts_at: string,
  ends_at: string,
  description: string
): LabourJob => ({
  id,
  category: 'construction',
  owner_id: estate.owner_id,
  owner_name: 'Nimal Jayasuriya',
  estate_id: estate.id,
  estate_name: estate.name,
  estate_location: estate.location,
  task_type,
  starts_at,
  ends_at,
  worker_count,
  duration_days,
  required_skills,
  wage_budget,
  status,
  created_at: '2026-09-28T10:00:00Z',
  description,
  lat: estate.lat,
  lng: estate.lng,
});

const jobs: LabourJob[] = [
  job('job-c-1', estates[0], 'Foundation & Masonry Work', 3, 6, ['Mason', 'Helper (Labourer)'], 180000, 'OPEN', '2026-10-12', '2026-10-18',
    'Strip foundation and block work up to plinth level for the ground floor. Materials delivered to site.'),
  job('job-c-2', estates[1], 'Electrical Wiring & Fittings', 1, 4, ['Electrician'], 60000, 'OPEN', '2026-10-14', '2026-10-17',
    'Rewire the shop and fit new distribution board and lighting. Evenings only.'),
  job('job-c-3', estates[0], 'Plastering & Painting', 2, 5, ['Mason', 'Helper (Labourer)'], 150000, 'ACTIVE', '2026-10-05', '2026-10-09',
    'Internal plastering and first coat of paint for the first floor.'),
];

const bid = (
  id: string,
  job_id: string,
  supervisor: User,
  price: number,
  supervisor_fee: number,
  status: Bid['status'],
  crew_member_ids: string[]
): Bid => ({
  id,
  job_id,
  supervisor_id: supervisor.id,
  supervisor_name: supervisor.name,
  supervisor_phone: supervisor.phone,
  supervisor_trust_score: supervisor.trust_score,
  price,
  supervisor_fee,
  payment_schedule: 'daily',
  status,
  submitted_at: '2026-09-29T14:00:00Z',
  crew_member_ids,
});

const bids: Bid[] = [
  bid('bid-c-1', 'job-c-1', users[1], 175000, 15000, 'pending', ['worker-c-1', 'worker-c-2', 'worker-c-4']),
  bid('bid-c-2', 'job-c-2', users[2], 58000, 5000, 'pending', ['worker-c-5']),
  bid('bid-c-3', 'job-c-3', users[1], 145000, 12000, 'accepted', ['worker-c-1', 'worker-c-3']),
];

const awards: Award[] = [
  {
    id: 'award-c-3',
    job_id: 'job-c-3',
    bid_id: 'bid-c-3',
    supervisor_id: 'user-contractor-1',
    supervisor_name: 'Ranjith Silva',
    awarded_at: '2026-09-30T09:00:00Z',
    escrow_status: 'held',
    escrow_amount: 145000,
    contacts_released_at: '2026-09-30T09:05:00Z',
    fee_payment_ref: 'PAYHERE-ESCROW-554201',
  },
];

export const constructionSeed = { users, estates, workers, jobs, bids, awards };
