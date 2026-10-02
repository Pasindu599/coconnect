import {
  User,
  Role,
  Estate,
  Worker,
  LabourJob,
  Bid,
  Award,
  AttendanceDay,
  AttendanceEntry,
  Completion,
  WageRecord,
  RatingSubmission,
  TrustScore,
  VerificationDoc,
  ExceptionIssue,
  AuditLogEntry,
  ScoringRuleVersion,
  NicSubmission
} from '../types';
import type { CategoryId, Membership } from '../types/category';
import { constructionSeed } from './seed/construction';
import { getRole, membershipsOf } from '../config/categories';
import { contactsUnlocked } from '../config/escrow';
import { getSampleSriLankaNicCard, validateAndParseSriLankanNic } from './nicValidator';
import { saveNicSubmissionToFirestore, updateNicSubmissionInFirestore } from './firebase';
import { createEstate as createEstateRemote, subscribeToEstates } from './data/estates';
import { createJob as createJobRemote, subscribeToJobs } from './data/jobs';
import { createBid as createBidRemote, subscribeToBids } from './data/bids';
import { subscribeToUsers } from './data/users';
import { reconcile, type RemoteChanges } from './data/firestoreSync';

const STORAGE_KEY = 'coconnect_app_state_v1';

// Initial Seed Data
const initialUsers: User[] = [
  {
    id: 'user-owner-1',
    name: 'Sunil Perera',
    phone: '+94771234567',
    roles: ['owner', 'supervisor'],
    active_role: 'owner',
    memberships: [{ category: 'coconut', role: 'owner' }, { category: 'coconut', role: 'broker' }],
    active_category: 'coconut',
    nic_status: 'verified',
    nic_number: '197418204921',
    preferred_language: 'en',
    trust_score: 4.88,
    pin_hash: '1234',
    created_at: '2025-11-10T08:00:00Z',
    location: 'Kurunegala, North Western Province',
  },
  {
    id: 'user-sup-1',
    name: 'Kusal Mendis',
    phone: '+94719876543',
    roles: ['supervisor'],
    active_role: 'supervisor',
    memberships: [{ category: 'coconut', role: 'broker' }],
    active_category: 'coconut',
    nic_status: 'verified',
    nic_number: '198223901928',
    preferred_language: 'en',
    trust_score: 4.92,
    pin_hash: '2244',
    created_at: '2025-10-15T09:30:00Z',
    location: 'Kuliyapitiya / Chilaw',
  },
  {
    id: 'user-worker-1',
    name: 'Chaminda Silva',
    phone: '+94765551234',
    roles: ['worker'],
    active_role: 'worker',
    memberships: [{ category: 'coconut', role: 'worker' }],
    active_category: 'coconut',
    nic_status: 'verified',
    nic_number: '199044201193',
    preferred_language: 'en',
    trust_score: 4.85,
    pin_hash: '5555',
    created_at: '2026-01-05T11:00:00Z',
    location: 'Narammala',
  },
  {
    id: 'user-worker-2',
    name: 'Ruwan Kumara',
    phone: '+94784449876',
    roles: ['worker'],
    active_role: 'worker',
    memberships: [{ category: 'coconut', role: 'worker' }],
    active_category: 'coconut',
    nic_status: 'pending',
    nic_number: '199581029384',
    preferred_language: 'si',
    trust_score: 4.70,
    pin_hash: '8888',
    created_at: '2026-02-12T14:15:00Z',
    location: 'Madampe',
  },
  {
    id: 'user-admin-1',
    name: 'Niluka Fernando',
    phone: '+94770001122',
    email: 'niluka.fernando@coconnect.gov.lk',
    roles: ['admin'],
    active_role: 'admin',
    memberships: [],
    nic_status: 'verified',
    nic_number: '198859302194',
    preferred_language: 'en',
    trust_score: 5.0,
    pin_hash: '9999',
    created_at: '2025-08-01T08:00:00Z',
    location: 'Coconnect HQ, Colombo',
  }
];

const initialEstates: Estate[] = [
  {
    id: 'est-1',
    owner_id: 'user-owner-1',
    name: 'Silver Palm Estate',
    area_acres: 14.5,
    location: 'Narammala, Kurunegala',
    tree_count: 940,
    notes: 'Well-spaced mature tall palms. Good tractor access road.',
    lat: 7.4344,
    lng: 80.2181,
    created_at: '2025-11-12T10:00:00Z'
  },
  {
    id: 'est-2',
    owner_id: 'user-owner-1',
    name: 'Chilaw Coastal Coconut Grove',
    area_acres: 8.0,
    location: 'Madampe, Chilaw',
    tree_count: 530,
    notes: 'Sandy soil grove, young and mature mixed cultivars.',
    lat: 7.4988,
    lng: 79.8458,
    created_at: '2025-12-01T09:00:00Z'
  },
  {
    id: 'est-3',
    owner_id: 'user-owner-1',
    name: 'Kuliyapitiya Model Plantation',
    area_acres: 11.2,
    location: 'Kuliyapitiya, Wayamba',
    tree_count: 720,
    notes: 'Drip irrigated hybrid dwarf-tall coconut plantation.',
    lat: 7.4689,
    lng: 80.0436,
    created_at: '2026-01-15T09:00:00Z'
  }
];

const initialWorkers: Worker[] = [
  {
    id: 'worker-1',
    supervisor_id: 'user-sup-1',
    name: 'Chaminda Silva',
    phone: '+94765551234',
    skills: ['Coconut Plucking', 'Tree Climbing', 'Inspection'],
    nic_ref: '199044201193',
    bank_ref: 'BOC Narammala 77889922',
    consent_captured_at: '2026-01-05T11:05:00Z',
    consent_method: 'sms',
    rating: 4.85,
    jobs_completed: 34,
    active: true
  },
  {
    id: 'worker-2',
    supervisor_id: 'user-sup-1',
    name: 'Ruwan Kumara',
    phone: '+94784449876',
    skills: ['Nut Husking', 'Copra Bagging', 'Field Clearing'],
    nic_ref: '199581029384',
    bank_ref: 'Peoples Bank Madampe 1029384',
    consent_captured_at: '2026-02-12T14:20:00Z',
    consent_method: 'written',
    rating: 4.70,
    jobs_completed: 21,
    active: true
  },
  {
    id: 'worker-3',
    supervisor_id: 'user-sup-1',
    name: 'Samantha Bandara',
    phone: '+94701122334',
    skills: ['Tree Climbing', 'Nut Gathering', 'Crown Cleaning'],
    nic_ref: '198734902194',
    consent_captured_at: '2026-01-10T10:00:00Z',
    consent_method: 'verbal_recorded',
    rating: 4.90,
    jobs_completed: 42,
    active: true
  },
  {
    id: 'worker-4',
    supervisor_id: 'user-sup-1',
    name: 'Priyantha Jayasuriya',
    phone: '+94723344556',
    skills: ['Fertilizer Trenching', 'Organic Mulching'],
    nic_ref: '198429103948',
    consent_captured_at: '2026-01-15T09:00:00Z',
    consent_method: 'written',
    rating: 4.65,
    jobs_completed: 18,
    active: true
  },
  {
    id: 'worker-5',
    supervisor_id: 'user-sup-1',
    name: 'Nimal Dissanayake',
    phone: '+94754455667',
    skills: ['Tractor Transport', 'Nut Counting & Grading'],
    nic_ref: '198129304958',
    consent_captured_at: '2026-01-20T08:30:00Z',
    consent_method: 'sms',
    rating: 4.80,
    jobs_completed: 29,
    active: true
  }
];

const initialJobs: LabourJob[] = [
  {
    id: 'job-101',
    owner_id: 'user-owner-1',
    owner_name: 'Sunil Perera',
    estate_id: 'est-1',
    estate_name: 'Silver Palm Estate',
    estate_location: 'Narammala, Kurunegala',
    task_type: 'Coconut Harvesting & Bunch Lowering',
    starts_at: '2026-09-24',
    ends_at: '2026-09-26',
    worker_count: 4,
    duration_days: 2,
    required_skills: ['Tree Climbing', 'Coconut Plucking', 'Nut Gathering'],
    wage_budget: 48000,
    status: 'OPEN',
    created_at: '2026-09-18T10:00:00Z',
    description: 'Bi-monthly harvest of approx 940 palms. Requires experienced climbers with safety harnesses. Transport to estate gate provided.'
  },
  {
    id: 'job-102',
    owner_id: 'user-owner-1',
    owner_name: 'Sunil Perera',
    estate_id: 'est-2',
    estate_name: 'Chilaw Coastal Coconut Grove',
    estate_location: 'Madampe, Chilaw',
    task_type: 'Fertilizer Ring Application & Mulching',
    starts_at: '2026-09-22',
    ends_at: '2026-09-23',
    worker_count: 3,
    duration_days: 2,
    required_skills: ['Fertilizer Trenching', 'Organic Mulching'],
    wage_budget: 36000,
    status: 'ACTIVE',
    created_at: '2026-09-16T08:30:00Z',
    description: 'Applying inorganic fertilizer mix in 6-foot circular trenches around 500 palms with coir dust mulching.'
  },
  {
    id: 'job-103',
    owner_id: 'user-owner-1',
    owner_name: 'Sunil Perera',
    estate_id: 'est-1',
    estate_name: 'Silver Palm Estate',
    estate_location: 'Narammala, Kurunegala',
    task_type: 'Dry Frond Trimming & Crown Cleaning',
    starts_at: '2026-09-20',
    ends_at: '2026-09-21',
    worker_count: 3,
    duration_days: 2,
    required_skills: ['Tree Climbing', 'Crown Cleaning'],
    wage_budget: 39000,
    status: 'IN_PROGRESS',
    created_at: '2026-09-14T11:00:00Z',
    description: 'Preventative maintenance against rhinoceros beetle and clearing dead petioles.'
  },
  {
    id: 'job-104',
    owner_id: 'user-owner-1',
    owner_name: 'Sunil Perera',
    estate_id: 'est-2',
    estate_name: 'Chilaw Coastal Coconut Grove',
    estate_location: 'Madampe, Chilaw',
    task_type: 'Nut Husking & Copra Drying Batch',
    starts_at: '2026-09-05',
    ends_at: '2026-09-07',
    worker_count: 3,
    duration_days: 3,
    required_skills: ['Nut Husking', 'Copra Bagging'],
    wage_budget: 45000,
    status: 'COMPLETED',
    created_at: '2026-09-01T09:00:00Z',
    description: 'Husking 8,000 harvested nuts and loading into the drying kiln.'
  }
];

const initialBids: Bid[] = [
  {
    id: 'bid-201',
    job_id: 'job-101',
    supervisor_id: 'user-sup-1',
    supervisor_name: 'Kusal Mendis',
    supervisor_phone: '+94719876543',
    supervisor_trust_score: 4.92,
    price: 46000,
    supervisor_fee: 4000,
    payment_schedule: 'daily',
    status: 'pending',
    submitted_at: '2026-09-18T14:30:00Z',
    crew_member_ids: ['worker-1', 'worker-2', 'worker-3', 'worker-5']
  },
  {
    id: 'bid-202',
    job_id: 'job-102',
    supervisor_id: 'user-sup-1',
    supervisor_name: 'Kusal Mendis',
    supervisor_phone: '+94719876543',
    supervisor_trust_score: 4.92,
    price: 35000,
    supervisor_fee: 3500,
    payment_schedule: 'lump_sum',
    status: 'accepted',
    submitted_at: '2026-09-16T10:00:00Z',
    crew_member_ids: ['worker-2', 'worker-4', 'worker-5']
  },
  {
    id: 'bid-203',
    job_id: 'job-103',
    supervisor_id: 'user-sup-1',
    supervisor_name: 'Kusal Mendis',
    supervisor_phone: '+94719876543',
    supervisor_trust_score: 4.92,
    price: 38000,
    supervisor_fee: 3800,
    payment_schedule: 'daily',
    status: 'accepted',
    submitted_at: '2026-09-15T08:00:00Z',
    crew_member_ids: ['worker-1', 'worker-3', 'worker-4']
  }
];

const initialAwards: Award[] = [
  {
    id: 'award-302',
    job_id: 'job-102',
    bid_id: 'bid-202',
    supervisor_id: 'user-sup-1',
    supervisor_name: 'Kusal Mendis',
    awarded_at: '2026-09-17T09:00:00Z',
    escrow_status: 'held',
    escrow_amount: 35000,
    contacts_released_at: '2026-09-17T09:05:00Z',
    fee_payment_ref: 'PAYHERE-ESCROW-882910'
  },
  {
    id: 'award-303',
    job_id: 'job-103',
    bid_id: 'bid-203',
    supervisor_id: 'user-sup-1',
    supervisor_name: 'Kusal Mendis',
    awarded_at: '2026-09-15T10:00:00Z',
    escrow_status: 'held',
    escrow_amount: 38000,
    contacts_released_at: '2026-09-15T10:02:00Z',
    fee_payment_ref: 'PAYHERE-ESCROW-773019'
  },
  {
    id: 'award-304',
    job_id: 'job-104',
    bid_id: 'bid-legacy-1',
    supervisor_id: 'user-sup-1',
    supervisor_name: 'Kusal Mendis',
    awarded_at: '2026-09-02T08:00:00Z',
    escrow_status: 'released',
    escrow_amount: 45000,
    contacts_released_at: '2026-09-02T08:03:00Z',
    fee_payment_ref: 'PAYHERE-ESCROW-661029'
  }
];

const initialAttendanceDays: AttendanceDay[] = [
  {
    id: 'day-401',
    job_id: 'job-103',
    work_date: '2026-09-20',
    status: 'reconciled',
    created_at: '2026-09-20T07:30:00Z'
  },
  {
    id: 'day-402',
    job_id: 'job-103',
    work_date: '2026-09-21',
    status: 'open',
    created_at: '2026-09-21T07:15:00Z'
  }
];

const initialAttendanceEntries: AttendanceEntry[] = [
  {
    id: 'entry-501',
    attendance_day_id: 'day-401',
    worker_id: 'worker-1',
    worker_name: 'Chaminda Silva',
    party: 'supervisor',
    present: true,
    recorded_by: 'user-sup-1',
    recorded_at: '2026-09-20T07:45:00Z',
    evidence_blob_ref: 'blob://evidence/attendance/day401_worker1.jpg',
    sync_status: 'synced',
    notes: 'Arrived on time with climbing spikes and harness'
  },
  {
    id: 'entry-502',
    attendance_day_id: 'day-401',
    worker_id: 'worker-1',
    worker_name: 'Chaminda Silva',
    party: 'owner',
    present: true,
    recorded_by: 'user-owner-1',
    recorded_at: '2026-09-20T08:15:00Z',
    sync_status: 'synced'
  },
  {
    id: 'entry-503',
    attendance_day_id: 'day-401',
    worker_id: 'worker-3',
    worker_name: 'Samantha Bandara',
    party: 'supervisor',
    present: true,
    recorded_by: 'user-sup-1',
    recorded_at: '2026-09-20T07:46:00Z',
    evidence_blob_ref: 'blob://evidence/attendance/day401_worker3.jpg',
    sync_status: 'synced'
  },
  {
    id: 'entry-504',
    attendance_day_id: 'day-401',
    worker_id: 'worker-3',
    worker_name: 'Samantha Bandara',
    party: 'owner',
    present: true,
    recorded_by: 'user-owner-1',
    recorded_at: '2026-09-20T08:15:00Z',
    sync_status: 'synced'
  },
  {
    id: 'entry-505',
    attendance_day_id: 'day-401',
    worker_id: 'worker-4',
    worker_name: 'Priyantha Jayasuriya',
    party: 'supervisor',
    present: true,
    recorded_by: 'user-sup-1',
    recorded_at: '2026-09-20T07:47:00Z',
    sync_status: 'synced'
  },
  {
    id: 'entry-506',
    attendance_day_id: 'day-401',
    worker_id: 'worker-4',
    worker_name: 'Priyantha Jayasuriya',
    party: 'owner',
    present: true,
    recorded_by: 'user-owner-1',
    recorded_at: '2026-09-20T08:16:00Z',
    sync_status: 'synced'
  }
];

const initialCompletions: Completion[] = [
  {
    id: 'comp-604',
    job_id: 'job-104',
    submitted_by: 'user-sup-1',
    submitted_at: '2026-09-07T16:00:00Z',
    status: 'confirmed',
    wage_records: [
      { worker_id: 'worker-2', worker_name: 'Ruwan Kumara', days_worked: 3, daily_rate: 4500, amount: 13500, currency: 'LKR' },
      { worker_id: 'worker-4', worker_name: 'Priyantha Jayasuriya', days_worked: 3, daily_rate: 4500, amount: 13500, currency: 'LKR' },
      { worker_id: 'worker-5', worker_name: 'Nimal Dissanayake', days_worked: 3, daily_rate: 4500, amount: 13500, currency: 'LKR' },
    ],
    total_wages: 40500,
    supervisor_fee: 4500,
    notes: '8,240 nuts husked and sorted into drying batches without damage.'
  }
];

const initialRatings: RatingSubmission[] = [
  {
    id: 'rate-701',
    job_id: 'job-104',
    from_user_id: 'user-owner-1',
    from_name: 'Sunil Perera',
    to_user_id: 'user-sup-1',
    to_role: 'supervisor',
    score: 5,
    review_tags: ['Punctual Crew', 'Zero Nut Damage', 'Accurate Husking'],
    comment: 'Exceptional work by Kusal and his team. High discipline and safe work practices.',
    submitted_at: '2026-09-08T09:30:00Z'
  },
  {
    id: 'rate-702',
    job_id: 'job-104',
    from_user_id: 'user-sup-1',
    from_name: 'Kusal Mendis',
    to_user_id: 'user-owner-1',
    to_role: 'owner',
    score: 5,
    review_tags: ['Prompt Escrow Release', 'Clear Estate Instructions', 'Clean Drinking Water'],
    comment: 'Mr. Sunil provided excellent refreshments and immediate PIN sign-off upon job completion.',
    submitted_at: '2026-09-08T10:15:00Z'
  }
];

const initialVerificationDocs: VerificationDoc[] = [
  {
    id: 'doc-801',
    user_id: 'user-owner-1',
    user_name: 'Sunil Perera',
    user_phone: '+94771234567',
    role: 'owner',
    doc_type: 'NIC_FRONT',
    blob_ref: 'blob://verifications/user_owner_1_nic_front.jpg',
    status: 'approved',
    notes: 'NIC verified against official registry format.',
    submitted_at: '2025-11-10T08:30:00Z',
    reviewed_at: '2025-11-10T11:00:00Z',
    reviewed_by: 'Niluka Fernando (Admin)'
  },
  {
    id: 'doc-802',
    user_id: 'user-worker-2',
    user_name: 'Ruwan Kumara',
    user_phone: '+94784449876',
    role: 'worker',
    doc_type: 'NIC_FRONT',
    blob_ref: 'blob://verifications/user_worker_2_nic.jpg',
    status: 'pending',
    notes: 'Submitted via mobile app; awaiting officer review.',
    submitted_at: '2026-09-18T16:00:00Z'
  }
];

const initialExceptions: ExceptionIssue[] = [
  {
    id: 'exc-901',
    job_id: 'job-103',
    subject_type: 'attendance_day',
    subject_id: 'day-402',
    raised_by: 'user-owner-1',
    raised_by_name: 'Sunil Perera',
    reason_code: 'WORKER_NO_SHOW',
    description: 'Supervisor marked 3 workers on site, but only 2 were present at 8:00 AM gate check.',
    evidence_blob_refs: ['blob://disputes/exc901_gate_log.jpg'],
    status: 'under_review',
    response_deadline: '2026-09-24T12:00:00Z'
  }
];

const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'aud-1',
    actor_id: 'user-owner-1',
    actor_name: 'Sunil Perera',
    action: 'job.created',
    subject_type: 'labour_job',
    subject_id: 'job-101',
    details: 'Posted Coconut Harvesting job with wage budget LKR 48,000',
    at: '2026-09-18T10:00:00Z'
  },
  {
    id: 'aud-2',
    actor_id: 'user-sup-1',
    actor_name: 'Kusal Mendis',
    action: 'bid.submitted',
    subject_type: 'bid',
    subject_id: 'bid-201',
    details: 'Submitted crew bid LKR 46,000 for job-101 with 4 workers',
    at: '2026-09-18T14:30:00Z'
  },
  {
    id: 'aud-3',
    actor_id: 'user-owner-1',
    actor_name: 'Sunil Perera',
    action: 'escrow.funded',
    subject_type: 'award',
    subject_id: 'award-302',
    details: 'Deposited LKR 35,000 into Escrow holding account via PayHere gateway',
    at: '2026-09-17T09:05:00Z'
  },
  {
    id: 'aud-4',
    actor_id: 'system',
    actor_name: 'Coconnect Escrow Engine',
    action: 'contacts.released',
    subject_type: 'award',
    subject_id: 'award-302',
    details: 'Escrow confirmed verified; telephone and direct contacts unlocked for both parties',
    at: '2026-09-17T09:05:01Z'
  }
];

const initialScoringRules: ScoringRuleVersion = {
  id: 'rule-v2.1',
  version: 'v2.1-2026',
  weights: {
    ratings: 0.40,
    completion_rate: 0.35,
    verification_bonus: 0.15,
    dispute_penalty: 0.10
  },
  bands: {
    elite: 4.80,
    trusted: 4.50,
    standard: 4.00,
    restricted: 3.50
  },
  published_at: '2026-01-01T00:00:00Z',
  frozen_until: '2026-10-31T00:00:00Z' // 90+ day stability guarantee
};

const initialNicSubmissions: NicSubmission[] = [
  {
    id: 'nic-sub-101',
    user_id: 'user-worker-2',
    user_name: 'Ruwan Kumara',
    user_phone: '+94784449876',
    role: 'worker',
    nic_number: '199581029384',
    nic_format: 'NEW_12',
    dob: '1995-10-21',
    gender: 'MALE',
    front_image_url: getSampleSriLankaNicCard('FRONT', 'Ruwan Kumara', '199581029384'),
    back_image_url: getSampleSriLankaNicCard('BACK', 'Ruwan Kumara', '199581029384'),
    front_file_name: 'ruwan_nic_front.jpg',
    back_file_name: 'ruwan_nic_back.jpg',
    front_file_size_kb: 245,
    back_file_size_kb: 218,
    notes: 'Submitted for coconut plucking & nut husking verified badge',
    status: 'pending',
    submitted_at: '2026-02-12T14:20:00Z'
  }
];

export type PayoutError = 'unauthorized' | 'not-found' | 'not-awaiting-payout' | 'reference-required';
export type ResolveDisputeError = 'unauthorized' | 'not-found' | 'not-open' | 'not-an-escrow-dispute' | 'notes-required';
export type DisputeError = 'unauthorized' | 'not-found' | 'not-party' | 'not-disputable' | 'description-too-short';

export interface AppState {
  currentUser: User | null;
  users: User[];
  estates: Estate[];
  workers: Worker[];
  jobs: LabourJob[];
  bids: Bid[];
  awards: Award[];
  attendanceDays: AttendanceDay[];
  attendanceEntries: AttendanceEntry[];
  completions: Completion[];
  ratings: RatingSubmission[];
  verificationDocs: VerificationDoc[];
  nicSubmissions: NicSubmission[];
  exceptions: ExceptionIssue[];
  auditLogs: AuditLogEntry[];
  scoringRule: ScoringRuleVersion;
  offlineQueue: Array<{
    id: string;
    action: string;
    payload: any;
    queuedAt: string;
  }>;
  isOfflineSimulated: boolean;
  /**
   * The most recent Firestore write failure, surfaced through normal
   * subscribe()/notify() re-renders rather than a silent console.warn
   * (closes KNOWN_ISSUES #11). Cleared by the next successful write of the
   * same kind; callers that want a toast/banner read this field.
   */
  syncError: { action: string; message: string; at: string } | null;
}

function mergeMissing<T extends { id: string }>(existing: T[] | undefined, seed: T[]): T[] {
  const list = existing ?? [];
  const ids = new Set(list.map(item => item.id));
  return [...list, ...seed.filter(item => !ids.has(item.id))];
}

function loadInitialState(): AppState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Sessions are intentionally not persisted across site loads.
      parsed.currentUser = null;
      const seedAdmin = initialUsers.find(u => u.id === 'user-admin-1');
      parsed.users?.forEach((u: User) => {
        if (seedAdmin && u.id === seedAdmin.id && !u.email) u.email = seedAdmin.email;
      });
      if (!parsed.nicSubmissions) {
        parsed.nicSubmissions = initialNicSubmissions;
      }
      parsed.syncError = null;
      // Browsers with state saved before the Construction category existed get its demo data.
      parsed.users = mergeMissing(parsed.users, constructionSeed.users);
      parsed.estates = mergeMissing(parsed.estates, constructionSeed.estates);
      parsed.workers = mergeMissing(parsed.workers, constructionSeed.workers);
      parsed.jobs = mergeMissing(parsed.jobs, constructionSeed.jobs);
      parsed.bids = mergeMissing(parsed.bids, constructionSeed.bids);
      parsed.awards = mergeMissing(parsed.awards, constructionSeed.awards);
      return parsed;
    } catch {
      // ignore
    }
  }

  return {
    currentUser: null,
    users: [...initialUsers, ...constructionSeed.users],
    estates: [...initialEstates, ...constructionSeed.estates],
    workers: [...initialWorkers, ...constructionSeed.workers],
    jobs: [...initialJobs, ...constructionSeed.jobs],
    bids: [...initialBids, ...constructionSeed.bids],
    awards: [...initialAwards, ...constructionSeed.awards],
    attendanceDays: initialAttendanceDays,
    attendanceEntries: initialAttendanceEntries,
    completions: initialCompletions,
    ratings: initialRatings,
    verificationDocs: initialVerificationDocs,
    nicSubmissions: initialNicSubmissions,
    exceptions: initialExceptions,
    auditLogs: initialAuditLogs,
    scoringRule: initialScoringRules,
    offlineQueue: [],
    isOfflineSimulated: false,
    syncError: null
  };
}

class StoreService {
  private state: AppState;
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = loadInitialState();
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Starts Firestore listeners for users, estates, jobs and bids (CONTRACTS
   * C2). Each one reconciles adds, modifications AND removals into state —
   * the previous ad-hoc sync in App.tsx only ever merged in adds (closes
   * KNOWN_ISSUES #10 for these four collections; workers/awards/attendance/
   * completions follow in S1-08). Returns one combined unsubscribe.
   */
  public startSync(): () => void {
    const unsubscribers = [
      subscribeToUsers(
        (changes) => this.applyRemoteChanges('users', changes),
        (err) => this.reportSyncError('users.sync', err)
      ),
      subscribeToEstates(
        (changes) => this.applyRemoteChanges('estates', changes),
        (err) => this.reportSyncError('estates.sync', err)
      ),
      subscribeToJobs(
        (changes) => this.applyRemoteChanges('jobs', changes),
        (err) => this.reportSyncError('jobs.sync', err)
      ),
      subscribeToBids(
        (changes) => this.applyRemoteChanges('bids', changes),
        (err) => this.reportSyncError('bids.sync', err)
      ),
    ];

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  private applyRemoteChanges<K extends 'users' | 'estates' | 'jobs' | 'bids'>(
    key: K,
    changes: RemoteChanges<AppState[K][number]>
  ) {
    type Item = AppState[K][number] & { id: string };
    (this.state[key] as unknown as Item[]) = reconcile(this.state[key] as unknown as Item[], changes);
    this.notify();
  }

  private reportSyncError(action: string, err: unknown) {
    console.error(`Firestore sync error (${action}):`, err);
    this.state.syncError = {
      action,
      message: err instanceof Error ? err.message : 'Unknown sync error',
      at: new Date().toISOString(),
    };
    this.notify();
  }

  private notify() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    for (const listener of this.listeners) {
      listener();
    }
  }

  // --- Auth & Session ---
  public requestOtp(phone: string): { success: boolean; code: string; message: string } {
    // Standard mock OTP code 123456 or 654321
    const code = '123456';
    return {
      success: true,
      code,
      message: `OTP code ${code} sent to ${phone} (Valid for 15 minutes)`
    };
  }

  /**
   * Phone OTP sign-in (mock). `membership` is the category + role the person chose; a new
   * user is registered with it, and an existing user who lacks it joins it. This stands in
   * for Firebase phone auth + the `addMembership` Function (CONTRACTS C3).
   */
  public verifyOtp(
    phone: string,
    code: string,
    requestedRole?: Role,
    membership?: Membership
  ): { success: boolean; user?: User; error?: string } {
    if (code !== '123456' && code !== '654321') {
      return { success: false, error: 'Invalid 6-digit OTP verification code' };
    }

    if (requestedRole === 'admin') {
      return { success: false, error: 'Staff accounts cannot sign in here. Use the staff portal.' };
    }

    const categoryRole = membership ? getRole(membership.category, membership.role) : undefined;
    if (membership && !categoryRole) {
      return { success: false, error: 'Unknown role for this category' };
    }
    const wantedRole: Role | undefined = categoryRole?.legacyRole ?? requestedRole;

    let user = this.state.users.find(u => u.phone.replace(/\s+/g, '') === phone.replace(/\s+/g, ''));

    // Admins authenticate only through adminLogin(); the public demo OTP must never open a staff account.
    if (user?.roles.includes('admin')) {
      return { success: false, error: 'Staff accounts cannot sign in here. Use the staff portal.' };
    }

    let joined = false;
    if (!user) {
      // Auto register demo new user
      const newRole = wantedRole || 'owner';
      user = {
        id: `user-${Date.now()}`,
        name: `User (${phone.slice(-4)})`,
        phone,
        roles: [newRole],
        active_role: newRole,
        memberships: [],
        nic_status: 'unverified',
        preferred_language: 'en',
        trust_score: 4.50,
        pin_hash: '1234',
        created_at: new Date().toISOString()
      };
      if (membership) user.memberships = [membership];
      this.state.users.push(user);
    } else if (membership) {
      joined = this.grantMembership(user, membership);
    }

    if (wantedRole && user.roles.includes(wantedRole)) {
      user.active_role = wantedRole;
    }
    if (membership) user.active_category = membership.category;

    this.state.currentUser = user;
    this.logAudit(user.id, user.name, 'auth.login_otp', 'user', user.id, `User logged in with verified OTP`);
    if (joined && membership) {
      this.logAudit(user.id, user.name, 'auth.membership_added', 'user', user.id, `Joined ${membership.category} as ${membership.role}`);
    }
    this.notify();

    return { success: true, user };
  }

  /** Add a category role to the signed-in user (mock of the `addMembership` Function). Never grants admin. */
  public addMembership(membership: Membership): { success: boolean; error?: string } {
    const user = this.state.currentUser;
    if (!user) return { success: false, error: 'Unauthorized' };
    const role = getRole(membership.category, membership.role);
    if (!role) return { success: false, error: 'Unknown role for this category' };

    const added = this.grantMembership(user, membership);
    user.active_role = role.legacyRole;
    user.active_category = membership.category;
    if (added) {
      this.logAudit(user.id, user.name, 'auth.membership_added', 'user', user.id, `Joined ${membership.category} as ${membership.role}`);
    }
    this.notify();
    return { success: true };
  }

  /** Returns true if the membership was new. Keeps the legacy `roles` list in step until S1-07 migrates it. */
  private grantMembership(user: User, membership: Membership): boolean {
    const existing = membershipsOf(user);
    if (existing.some(m => m.category === membership.category && m.role === membership.role)) return false;
    user.memberships = [...existing, membership];
    const legacy = getRole(membership.category, membership.role)?.legacyRole;
    if (legacy && !user.roles.includes(legacy)) user.roles.push(legacy);
    return true;
  }

  // Staff sign-in. Interim client-side check against the seeded admin record until real
  // Firebase auth with custom claims lands (ROADMAP 3A-1). The same message is returned for a
  // wrong email or a wrong PIN so the form doesn't reveal which one was right.
  public adminLogin(email: string, pin: string): { success: boolean; user?: User; error?: string } {
    const admin = this.state.users.find(
      u => u.roles.includes('admin') && !!u.email && u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!admin || !admin.pin_hash || admin.pin_hash !== pin) {
      this.logAudit('system', 'Coconnect Auth', 'auth.admin_login_failed', 'user', admin?.id ?? 'unknown', 'Failed staff sign-in attempt');
      this.notify();
      return { success: false, error: 'Administrative credentials rejected. Access is strictly audited.' };
    }

    admin.active_role = 'admin';
    this.state.currentUser = admin;
    this.logAudit(admin.id, admin.name, 'auth.admin_login', 'user', admin.id, 'Staff sign-in');
    this.notify();
    return { success: true, user: admin };
  }

  // Switch between roles the user already holds. Roles are never granted from the client.
  public switchRole(newRole: Role): boolean {
    if (!this.state.currentUser) return false;
    if (!this.state.currentUser.roles.includes(newRole)) return false;
    this.state.currentUser.active_role = newRole;
    this.logAudit(
      this.state.currentUser.id,
      this.state.currentUser.name,
      'auth.switch_role',
      'user',
      this.state.currentUser.id,
      `Switched active role to ${newRole}`
    );
    this.notify();
    return true;
  }

  public logout(): void {
    this.state.currentUser = null;
    this.notify();
  }

  // --- Estates (Lands) ---
  public addEstate(data: { 
    name: string; 
    area_acres: number; 
    location: string; 
    tree_count: number; 
    notes?: string;
    lat?: number;
    lng?: number;
    category?: CategoryId;
    attributes?: Record<string, string | number>;
  }): Estate {
    if (!this.state.currentUser) throw new Error('Unauthorized');
    const newEstate: Estate = {
      id: `est-${Date.now()}`,
      // Falls back to coconut (pre-category behaviour); the category-aware form always passes one
      category: data.category ?? 'coconut',
      attributes: data.attributes,
      owner_id: this.state.currentUser.id,
      name: data.name,
      area_acres: Number(data.area_acres),
      location: data.location,
      tree_count: Number(data.tree_count),
      notes: data.notes,
      lat: data.lat || 7.4344,
      lng: data.lng || 80.2181,
      created_at: new Date().toISOString()
    };
    this.state.estates.unshift(newEstate);
    this.logAudit(this.state.currentUser.id, this.state.currentUser.name, 'estate.created', 'estate', newEstate.id, `Registered land "${data.name}" (${data.area_acres} acres)`);
    this.notify();
    createEstateRemote(newEstate).catch((err) => this.reportSyncError('estate.created', err));
    return newEstate;
  }

  // --- Workers & Consent ---
  public addWorker(data: {
    name: string;
    phone: string;
    skills: string[];
    nic_ref: string;
    bank_ref?: string;
    consent_method: 'sms' | 'written' | 'verbal_recorded';
    category?: CategoryId;
  }): Worker {
    if (!this.state.currentUser) throw new Error('Unauthorized');
    const newWorker: Worker = {
      id: `worker-${Date.now()}`,
      category: data.category,
      supervisor_id: this.state.currentUser.id,
      name: data.name,
      phone: data.phone,
      skills: data.skills,
      nic_ref: data.nic_ref,
      bank_ref: data.bank_ref,
      consent_captured_at: new Date().toISOString(),
      consent_method: data.consent_method,
      rating: 4.80,
      jobs_completed: 0,
      active: true
    };
    this.state.workers.unshift(newWorker);
    this.logAudit(this.state.currentUser.id, this.state.currentUser.name, 'worker.registered', 'worker', newWorker.id, `Supervisor registered worker ${data.name} with consent via ${data.consent_method}`);
    this.notify();
    return newWorker;
  }

  /** Set or change a worker's payout bank details. Only the person who registered the worker may. */
  public updateWorkerBank(workerId: string, bankRef: string): { success: boolean; error?: 'unauthorized' | 'not-found' } {
    const user = this.state.currentUser;
    if (!user) return { success: false, error: 'unauthorized' };
    const worker = this.state.workers.find(w => w.id === workerId);
    if (!worker) return { success: false, error: 'not-found' };
    if (worker.supervisor_id !== user.id) return { success: false, error: 'unauthorized' };

    worker.bank_ref = bankRef;
    this.logAudit(user.id, user.name, 'worker.bank_updated', 'worker', worker.id, `Updated payout bank details for ${worker.name}`);
    this.notify();
    return { success: true };
  }

  /** Set the signed-in person's own payout account (where an admin sends their payout). */
  public updatePayoutBank(bankRef: string): { success: boolean; error?: 'unauthorized' } {
    const user = this.state.currentUser;
    if (!user) return { success: false, error: 'unauthorized' };
    user.payout_bank_ref = bankRef;
    this.logAudit(user.id, user.name, 'user.payout_bank_updated', 'user', user.id, 'Updated payout bank account');
    this.notify();
    return { success: true };
  }

  // --- Labour Jobs & Bids ---
  public createJob(data: {
    estate_id: string;
    task_type: string;
    starts_at: string;
    ends_at: string;
    worker_count: number;
    duration_days: number;
    required_skills: string[];
    wage_budget: number;
    description?: string;
  }): LabourJob {
    if (!this.state.currentUser) throw new Error('Unauthorized');
    const estate = this.state.estates.find(e => e.id === data.estate_id);
    if (!estate) throw new Error('Estate not found');

    const newJob: LabourJob = {
      id: `job-${Date.now()}`,
      category: estate.category ?? 'coconut',
      owner_id: this.state.currentUser.id,
      owner_name: this.state.currentUser.name,
      estate_id: estate.id,
      estate_name: estate.name,
      estate_location: estate.location,
      task_type: data.task_type,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      worker_count: Number(data.worker_count),
      duration_days: Number(data.duration_days),
      required_skills: data.required_skills,
      wage_budget: Number(data.wage_budget),
      status: 'OPEN',
      created_at: new Date().toISOString(),
      description: data.description,
      lat: estate.lat || 7.4344,
      lng: estate.lng || 80.2181
    };

    this.state.jobs.unshift(newJob);
    this.logAudit(this.state.currentUser.id, this.state.currentUser.name, 'job.published', 'labour_job', newJob.id, `Owner published job "${data.task_type}" at ${estate.name}`);
    this.notify();
    createJobRemote(newJob).catch((err) => this.reportSyncError('job.published', err));
    return newJob;
  }

  public submitBid(data: {
    job_id: string;
    price: number;
    supervisor_fee: number;
    payment_schedule: 'daily' | 'lump_sum';
    crew_member_ids: string[];
  }): { success: boolean; bid?: Bid; error?: string } {
    if (!this.state.currentUser) return { success: false, error: 'Unauthorized' };
    const job = this.state.jobs.find(j => j.id === data.job_id);
    if (!job) return { success: false, error: 'Job not found' };
    if (job.status !== 'OPEN') return { success: false, error: 'Job is not open for bidding' };

    // Check Worker Double-Booking Overlap!
    // As mandated by Section 4.2 of the Architecture Document:
    // Confirmed assignments on active overlapping dates block confirmation!
    const overlappingActiveJobs = this.state.jobs.filter(j => 
      ['ACTIVE', 'IN_PROGRESS'].includes(j.status) &&
      j.starts_at <= job.ends_at &&
      j.ends_at >= job.starts_at
    );

    for (const workerId of data.crew_member_ids) {
      for (const activeJob of overlappingActiveJobs) {
        const matchingAward = this.state.awards.find(a => a.job_id === activeJob.id);
        if (matchingAward) {
          const matchingBid = this.state.bids.find(b => b.id === matchingAward.bid_id);
          if (matchingBid && matchingBid.crew_member_ids.includes(workerId)) {
            const conflictingWorker = this.state.workers.find(w => w.id === workerId);
            return {
              success: false,
              error: `Worker clash detected: ${conflictingWorker?.name || workerId} is already confirmed on job #${activeJob.id} during this date window.`
            };
          }
        }
      }
    }

    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      category: 'coconut',
      job_id: data.job_id,
      supervisor_id: this.state.currentUser.id,
      supervisor_name: this.state.currentUser.name,
      supervisor_phone: this.state.currentUser.phone,
      supervisor_trust_score: this.state.currentUser.trust_score,
      price: Number(data.price),
      supervisor_fee: Number(data.supervisor_fee),
      payment_schedule: data.payment_schedule,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      crew_member_ids: data.crew_member_ids
    };

    this.state.bids.unshift(newBid);
    this.logAudit(this.state.currentUser.id, this.state.currentUser.name, 'bid.submitted', 'bid', newBid.id, `Supervisor bid LKR ${data.price} with ${data.crew_member_ids.length} crew members`);
    this.notify();
    createBidRemote(newBid).catch((err) => this.reportSyncError('bid.submitted', err));
    return { success: true, bid: newBid };
  }

  // --- Awards & Escrow Payment ---
  public awardBid(bidId: string): { success: boolean; award?: Award; error?: string } {
    if (!this.state.currentUser) return { success: false, error: 'Unauthorized' };
    const bid = this.state.bids.find(b => b.id === bidId);
    if (!bid) return { success: false, error: 'Bid not found' };

    const job = this.state.jobs.find(j => j.id === bid.job_id);
    if (!job) return { success: false, error: 'Job not found' };
    if (job.owner_id !== this.state.currentUser.id) return { success: false, error: 'Only job owner can award' };

    bid.status = 'accepted';
    job.status = 'AWARDED_PENDING_FEE';

    // Reject other bids
    this.state.bids.filter(b => b.job_id === job.id && b.id !== bid.id).forEach(b => {
      b.status = 'rejected';
    });

    const award: Award = {
      id: `award-${Date.now()}`,
      job_id: job.id,
      bid_id: bid.id,
      supervisor_id: bid.supervisor_id,
      supervisor_name: bid.supervisor_name,
      awarded_at: new Date().toISOString(),
      escrow_status: 'pending',
      escrow_amount: bid.price
    };

    this.state.awards.unshift(award);
    this.logAudit(this.state.currentUser.id, this.state.currentUser.name, 'award.created', 'award', award.id, `Owner accepted bid #${bid.id}. Escrow deposit of LKR ${bid.price} pending.`);
    this.notify();
    return { success: true, award };
  }

  // --- Escrow Deposit ---
  public payEscrow(awardId: string, paymentMethod = 'PayHere Escrow Gateway'): { success: boolean; error?: string } {
    if (!this.state.currentUser) return { success: false, error: 'Unauthorized' };
    const award = this.state.awards.find(a => a.id === awardId);
    if (!award) return { success: false, error: 'Award not found' };

    const job = this.state.jobs.find(j => j.id === award.job_id);
    if (!job) return { success: false, error: 'Job not found' };
    // Funding only applies to an award still waiting for payment; it must never undo a dispute or a release
    if (award.escrow_status !== 'pending') return { success: false, error: 'Award is not awaiting payment' };

    award.escrow_status = 'held';
    award.contacts_released_at = new Date().toISOString();
    award.fee_payment_ref = `PAYHERE-ESCROW-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Transition job to ACTIVE
    job.status = 'ACTIVE';

    this.logAudit(
      this.state.currentUser.id,
      this.state.currentUser.name,
      'escrow.funded',
      'award',
      award.id,
      `Owner deposited LKR ${award.escrow_amount.toLocaleString()} into Escrow holding account via ${paymentMethod}`
    );

    this.logAudit(
      'system',
      'Coconnect Escrow Engine',
      'contacts.released',
      'award',
      award.id,
      `Escrow payment verified. Released contact details for job #${job.id}`
    );

    this.notify();
    return { success: true };
  }

  // --- Contact Release Endpoint ---
  // Must strictly adhere to Section 5.2 & Requirement: contacts released ONLY when escrow is held or released!
  public getAwardContacts(awardId: string): {
    success: boolean;
    error?: string;
    contacts?: {
      supervisor_name: string;
      supervisor_phone: string;
      crew: Array<{ name: string; phone: string; skills: string[] }>;
    };
  } {
    const award = this.state.awards.find(a => a.id === awardId);
    if (!award) return { success: false, error: 'Award not found' };

    if (!contactsUnlocked(award.escrow_status)) {
      return {
        success: false,
        error: 'ESCROW_NOT_VERIFIED: Contact details are protected and will only be released once funds are verified in escrow.'
      };
    }

    const bid = this.state.bids.find(b => b.id === award.bid_id);
    const supervisor = this.state.users.find(u => u.id === award.supervisor_id);
    const crewMembers = this.state.workers.filter(w => bid?.crew_member_ids.includes(w.id));

    return {
      success: true,
      contacts: {
        supervisor_name: supervisor?.name || award.supervisor_name,
        supervisor_phone: supervisor?.phone || '+94719876543',
        crew: crewMembers.map(w => ({
          name: w.name,
          phone: w.phone,
          skills: w.skills
        }))
      }
    };
  }

  // --- Attendance ---
  public openAttendanceDay(jobId: string, dateStr?: string): AttendanceDay {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const existing = this.state.attendanceDays.find(d => d.job_id === jobId && d.work_date === today);
    if (existing) return existing;

    const newDay: AttendanceDay = {
      id: `day-${Date.now()}`,
      job_id: jobId,
      work_date: today,
      status: 'open',
      created_at: new Date().toISOString()
    };
    this.state.attendanceDays.unshift(newDay);
    
    const job = this.state.jobs.find(j => j.id === jobId);
    if (job && job.status === 'ACTIVE') {
      job.status = 'IN_PROGRESS';
    }

    this.notify();
    return newDay;
  }

  public recordAttendanceEntry(data: {
    attendance_day_id: string;
    worker_id: string;
    party: 'supervisor' | 'owner';
    present: boolean;
    evidence_blob_ref?: string;
    notes?: string;
  }): AttendanceEntry {
    if (!this.state.currentUser) throw new Error('Unauthorized');
    const worker = this.state.workers.find(w => w.id === data.worker_id);

    const entry: AttendanceEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      attendance_day_id: data.attendance_day_id,
      worker_id: data.worker_id,
      worker_name: worker?.name || 'Worker',
      party: data.party,
      present: data.present,
      recorded_by: this.state.currentUser.id,
      recorded_at: new Date().toISOString(),
      evidence_blob_ref: data.evidence_blob_ref,
      sync_status: this.state.isOfflineSimulated ? 'pending_offline' : 'synced',
      notes: data.notes
    };

    if (this.state.isOfflineSimulated) {
      this.state.offlineQueue.push({
        id: entry.id,
        action: 'attendance_entry',
        payload: entry,
        queuedAt: new Date().toISOString()
      });
    }

    this.state.attendanceEntries.push(entry);

    // Check Dual-Confirmation Reconciliation
    this.reconcileAttendanceDay(data.attendance_day_id);

    this.notify();
    return entry;
  }

  private reconcileAttendanceDay(dayId: string): void {
    const day = this.state.attendanceDays.find(d => d.id === dayId);
    if (!day) return;

    const entries = this.state.attendanceEntries.filter(e => e.attendance_day_id === dayId);
    const workerIds = Array.from(new Set(entries.map(e => e.worker_id)));

    let allMatched = true;
    let hasMismatch = false;

    for (const wid of workerIds) {
      const supEntry = entries.find(e => e.worker_id === wid && e.party === 'supervisor');
      const ownerEntry = entries.find(e => e.worker_id === wid && e.party === 'owner');

      if (!supEntry || !ownerEntry) {
        allMatched = false;
      } else if (supEntry.present !== ownerEntry.present) {
        hasMismatch = true;
      }
    }

    if (hasMismatch) {
      day.status = 'disputed';
    } else if (allMatched && workerIds.length > 0) {
      day.status = 'reconciled';
    }
  }

  public toggleOfflineMode(): boolean {
    this.state.isOfflineSimulated = !this.state.isOfflineSimulated;
    if (!this.state.isOfflineSimulated && this.state.offlineQueue.length > 0) {
      // Sync outbox
      for (const item of this.state.offlineQueue) {
        const found = this.state.attendanceEntries.find(e => e.id === item.id);
        if (found) {
          found.sync_status = 'synced';
        }
      }
      this.state.offlineQueue = [];
    }
    this.notify();
    return this.state.isOfflineSimulated;
  }

  // --- Job Completion & Dual Confirmation ---
  public submitCompletion(jobId: string, wageRecords: WageRecord[], supervisorFee: number, notes?: string): Completion {
    if (!this.state.currentUser) throw new Error('Unauthorized');
    const job = this.state.jobs.find(j => j.id === jobId);
    if (!job) throw new Error('Job not found');

    const totalWages = wageRecords.reduce((sum, r) => sum + r.amount, 0);

    const completion: Completion = {
      id: `comp-${Date.now()}`,
      job_id: jobId,
      submitted_by: this.state.currentUser.id,
      submitted_at: new Date().toISOString(),
      status: 'pending',
      wage_records: wageRecords,
      total_wages: totalWages,
      supervisor_fee: supervisorFee,
      notes
    };

    job.status = 'PENDING_COMPLETION';
    this.state.completions.unshift(completion);
    this.logAudit(this.state.currentUser.id, this.state.currentUser.name, 'completion.submitted', 'completion', completion.id, `Supervisor submitted completion with wage records total LKR ${totalWages + supervisorFee}`);
    this.notify();
    return completion;
  }

  public confirmCompletion(
    jobId: string,
    pin: string,
    rating?: { score: number; review_tags: string[]; comment: string }
  ): { success: boolean; error?: string } {
    if (!this.state.currentUser) return { success: false, error: 'Unauthorized' };
    const job = this.state.jobs.find(j => j.id === jobId);
    if (!job) return { success: false, error: 'Job not found' };
    if (job.owner_id !== this.state.currentUser.id) {
      return { success: false, error: 'Only the job owner can confirm completion' };
    }
    const heldAward = this.state.awards.find(a => a.job_id === jobId);
    if (heldAward?.escrow_status === 'disputed') {
      return { success: false, error: 'The escrow is frozen by an open dispute' };
    }
    if (!heldAward || (heldAward.escrow_status !== 'held' && heldAward.escrow_status !== 'release_requested')) {
      return { success: false, error: 'There is no escrow held for this job' };
    }

    // PIN check
    if (this.state.currentUser.pin_hash && this.state.currentUser.pin_hash !== pin) {
      return { success: false, error: 'Invalid PIN. Dual-confirmation requires correct owner PIN signature.' };
    }

    const completion = this.state.completions.find(c => c.job_id === jobId);
    if (completion) {
      completion.status = 'confirmed';
    }

    // Advance Job State
    job.status = 'COMPLETED';

    // Release Escrow Funds!
    // The owner's sign-off requests the release. The money only leaves escrow when an admin
    // records the bank transfer (recordPayout), as in the real Functions.
    const award = this.state.awards.find(a => a.job_id === jobId);
    if (award) {
      award.escrow_status = 'release_requested';
      this.logAudit(
        'system',
        'Coconnect Escrow Engine',
        'escrow.release_requested',
        'award',
        award.id,
        `Completion confirmed with PIN signature. Release of LKR ${award.escrow_amount.toLocaleString()} requested; awaiting the admin payout.`
      );
    }

    // Submit Rating if provided
    if (rating && award) {
      this.submitRating({
        job_id: jobId,
        from_user_id: this.state.currentUser.id,
        from_name: this.state.currentUser.name,
        to_user_id: award.supervisor_id,
        to_role: 'supervisor',
        score: rating.score,
        review_tags: rating.review_tags,
        comment: rating.comment
      });
    }

    this.notify();
    return { success: true };
  }

  // --- Ratings & Asynchronous Trust Score Engine ---
  public submitRating(data: {
    job_id: string;
    from_user_id: string;
    from_name: string;
    to_user_id: string;
    to_role: Role;
    score: number;
    review_tags: string[];
    comment: string;
  }): RatingSubmission {
    const newRating: RatingSubmission = {
      id: `rate-${Date.now()}`,
      job_id: data.job_id,
      from_user_id: data.from_user_id,
      from_name: data.from_name,
      to_user_id: data.to_user_id,
      to_role: data.to_role,
      score: data.score,
      review_tags: data.review_tags,
      comment: data.comment,
      submitted_at: new Date().toISOString()
    };

    this.state.ratings.unshift(newRating);
    this.recomputeTrustScore(data.to_user_id, `completion_rating_received`);
    this.notify();
    return newRating;
  }

  private recomputeTrustScore(userId: string, triggerEvent: string): void {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return;

    const userRatings = this.state.ratings.filter(r => r.to_user_id === userId);
    const avgRating = userRatings.length > 0 
      ? userRatings.reduce((sum, r) => sum + r.score, 0) / userRatings.length 
      : 4.50;

    const userExceptions = this.state.exceptions.filter(e => e.raised_by !== userId && e.status === 'open');
    const disputePenalty = userExceptions.length * 0.20;
    const verificationBonus = user.nic_status === 'verified' ? 0.25 : 0.0;

    const rules = this.state.scoringRule.weights;
    // Formula based on v2.1 weights
    const calculated = (avgRating * rules.ratings) +
      (4.8 * rules.completion_rate) +
      (verificationBonus * rules.verification_bonus) -
      (disputePenalty * rules.dispute_penalty);

    const clamped = Math.min(5.0, Math.max(1.0, Math.round(calculated * 100) / 100));
    user.trust_score = clamped;

    this.logAudit(
      'system',
      'Trust Score Engine (ARQ)',
      'trust_score.recomputed',
      'user',
      userId,
      `Recomputed trust score for ${user.name} to ${clamped.toFixed(2)} based on ${userRatings.length} ratings (rule: ${this.state.scoringRule.version}, trigger: ${triggerEvent})`
    );
  }

  // --- Verification ---
  public uploadVerificationDoc(docType: 'NIC_FRONT' | 'NIC_BACK' | 'LAND_DEED' | 'BUSINESS_REG', fileRefName: string): VerificationDoc {
    if (!this.state.currentUser) throw new Error('Unauthorized');

    const newDoc: VerificationDoc = {
      id: `doc-${Date.now()}`,
      user_id: this.state.currentUser.id,
      user_name: this.state.currentUser.name,
      user_phone: this.state.currentUser.phone,
      role: this.state.currentUser.active_role,
      doc_type: docType,
      blob_ref: `blob://verifications/${fileRefName}`,
      status: 'pending',
      submitted_at: new Date().toISOString()
    };

    this.state.verificationDocs.unshift(newDoc);
    this.state.currentUser.nic_status = 'pending';
    this.logAudit(this.state.currentUser.id, this.state.currentUser.name, 'verification.submitted', 'verification_doc', newDoc.id, `Uploaded ${docType} for identity verification`);
    this.notify();
    return newDoc;
  }

  public submitNic(data: {
    nic_number: string;
    front_image_url: string;
    back_image_url: string;
    front_file_name?: string;
    back_file_name?: string;
    front_file_size_kb?: number;
    back_file_size_kb?: number;
    notes?: string;
  }): NicSubmission {
    if (!this.state.currentUser) throw new Error('Unauthorized');
    const user = this.state.currentUser;
    const parsed = validateAndParseSriLankanNic(data.nic_number);

    const newSub: NicSubmission = {
      id: `nic-sub-${Date.now()}`,
      user_id: user.id,
      user_name: user.name,
      user_phone: user.phone,
      role: user.active_role,
      nic_number: parsed.isValid ? parsed.formattedNumber : data.nic_number.trim(),
      nic_format: parsed.format === 'INVALID' ? 'UNKNOWN' : parsed.format,
      dob: parsed.approxDob,
      gender: parsed.gender,
      front_image_url: data.front_image_url,
      back_image_url: data.back_image_url,
      front_file_name: data.front_file_name || 'nic_front.jpg',
      back_file_name: data.back_file_name || 'nic_back.jpg',
      front_file_size_kb: data.front_file_size_kb || 250,
      back_file_size_kb: data.back_file_size_kb || 230,
      notes: data.notes,
      status: 'pending',
      submitted_at: new Date().toISOString()
    };

    this.state.nicSubmissions.unshift(newSub);
    user.nic_status = 'pending';
    user.nic_number = newSub.nic_number;
    user.nic_front_url = newSub.front_image_url;
    user.nic_back_url = newSub.back_image_url;
    user.nic_submitted_at = newSub.submitted_at;

    // Create verification docs for historical audit
    this.uploadVerificationDoc('NIC_FRONT', newSub.front_file_name);
    this.uploadVerificationDoc('NIC_BACK', newSub.back_file_name);

    // Save to Firestore for durable cloud persistence
    saveNicSubmissionToFirestore(newSub);

    this.logAudit(
      user.id,
      user.name,
      'kyc.nic_submitted',
      'nic_submission',
      newSub.id,
      `Submitted NIC Front & Back attachments (${newSub.nic_number}, format: ${newSub.nic_format})`
    );

    this.notify();
    return newSub;
  }

  public adminDecideNicSubmission(submissionId: string, decision: 'approved' | 'rejected', reviewNotes?: string): boolean {
    if (!this.state.currentUser || this.state.currentUser.active_role !== 'admin') {
      throw new Error('403 Forbidden: Admin role required');
    }

    const sub = this.state.nicSubmissions.find(s => s.id === submissionId);
    if (!sub) return false;

    sub.status = decision;
    sub.reviewed_at = new Date().toISOString();
    sub.reviewed_by = this.state.currentUser.name;
    if (decision === 'rejected') {
      sub.rejection_reason = reviewNotes || 'Unclear card photo or mismatched identity details';
    }

    const targetUser = this.state.users.find(u => u.id === sub.user_id);
    if (targetUser) {
      targetUser.nic_status = decision === 'approved' ? 'verified' : 'rejected';
      if (decision === 'approved') {
        targetUser.nic_number = sub.nic_number;
        targetUser.nic_rejection_reason = undefined;
      } else {
        targetUser.nic_rejection_reason = sub.rejection_reason;
      }
      this.recomputeTrustScore(targetUser.id, 'nic_status_changed');
    }

    // Persist to Firestore
    updateNicSubmissionInFirestore(sub.id, {
      status: sub.status,
      reviewed_at: sub.reviewed_at,
      reviewed_by: sub.reviewed_by,
      rejection_reason: sub.rejection_reason
    });

    this.logAudit(
      this.state.currentUser.id,
      this.state.currentUser.name,
      `admin.nic.${decision}`,
      'nic_submission',
      submissionId,
      `Admin ${decision} NIC verification for ${sub.user_name} (${sub.nic_number}): ${reviewNotes || 'Standard verification'}`
    );

    this.notify();
    return true;
  }

  // --- Admin Endpoints (/admin/*) ---
  public adminDecideVerification(docId: string, decision: 'approved' | 'rejected', notes?: string): boolean {
    if (!this.state.currentUser || this.state.currentUser.active_role !== 'admin') {
      throw new Error('403 Forbidden: Admin role required');
    }

    const doc = this.state.verificationDocs.find(d => d.id === docId);
    if (!doc) return false;

    doc.status = decision;
    doc.notes = notes;
    doc.reviewed_at = new Date().toISOString();
    doc.reviewed_by = this.state.currentUser.name;

    const targetUser = this.state.users.find(u => u.id === doc.user_id);
    if (targetUser) {
      targetUser.nic_status = decision === 'approved' ? 'verified' : 'rejected';
      this.recomputeTrustScore(targetUser.id, 'nic_status_changed');
    }

    this.logAudit(
      this.state.currentUser.id,
      this.state.currentUser.name,
      `admin.verification.${decision}`,
      'verification_doc',
      docId,
      `Admin ${decision} verification doc for ${doc.user_name}: ${notes || 'Standard validation check'}`
    );

    this.notify();
    return true;
  }

  /** An admin pays a confirmed job out by bank transfer and records the reference: the escrow is then released. */
  public recordPayout(
    awardId: string,
    bankTransferRef: string
  ): { success: true } | { success: false; error: PayoutError } {
    const admin = this.state.currentUser;
    if (!admin || admin.active_role !== 'admin') return { success: false, error: 'unauthorized' };
    const award = this.state.awards.find(a => a.id === awardId);
    if (!award) return { success: false, error: 'not-found' };
    if (award.escrow_status !== 'release_requested') return { success: false, error: 'not-awaiting-payout' };
    if (bankTransferRef.trim().length < 4) return { success: false, error: 'reference-required' };

    award.escrow_status = 'released';
    award.payout_ref = bankTransferRef.trim();
    award.payout_at = new Date().toISOString();
    this.logAudit(
      admin.id,
      admin.name,
      'escrow.payout_recorded',
      'award',
      award.id,
      `Paid out LKR ${award.escrow_amount.toLocaleString()} to ${award.supervisor_name}; transfer ref ${award.payout_ref}`
    );
    this.notify();
    return { success: true };
  }

  /** An admin decides a dispute over an award: refund the payment or release it. Either ends the freeze. */
  public adminResolveDispute(data: {
    exception_id: string;
    outcome: 'refunded' | 'released';
    notes: string;
  }): { success: true } | { success: false; error: ResolveDisputeError } {
    const admin = this.state.currentUser;
    if (!admin || admin.active_role !== 'admin') return { success: false, error: 'unauthorized' };
    const dispute = this.state.exceptions.find(e => e.id === data.exception_id);
    if (!dispute) return { success: false, error: 'not-found' };
    if (dispute.status === 'resolved') return { success: false, error: 'not-open' };
    const award = this.state.awards.find(a => a.id === dispute.subject_id);
    if (dispute.subject_type !== 'award' || !award || award.escrow_status !== 'disputed') {
      return { success: false, error: 'not-an-escrow-dispute' };
    }
    if (data.notes.trim().length < 5) return { success: false, error: 'notes-required' };

    const job = this.state.jobs.find(j => j.id === award.job_id);
    award.escrow_status = data.outcome;
    if (job) job.status = data.outcome === 'refunded' ? 'CLOSED_DISPUTED' : 'COMPLETED';

    dispute.status = 'resolved';
    dispute.outcome = data.outcome;
    dispute.resolution = data.notes.trim();
    dispute.resolved_by = admin.name;
    dispute.resolved_at = new Date().toISOString();

    this.logAudit(
      admin.id,
      admin.name,
      data.outcome === 'refunded' ? 'dispute.refunded' : 'dispute.released',
      'award',
      award.id,
      `Resolved dispute #${dispute.id} (${data.outcome}): ${dispute.resolution}`
    );
    this.notify();
    return { success: true };
  }

  /**
   * Either party to an award can open a dispute while the money is in escrow. That freezes the
   * escrow: nothing moves until an admin resolves it (mock of the `openDispute` Function).
   */
  public openDispute(data: {
    award_id: string;
    reason_code: ExceptionIssue['reason_code'];
    description: string;
  }): { success: true; dispute: ExceptionIssue } | { success: false; error: DisputeError } {
    const user = this.state.currentUser;
    if (!user) return { success: false, error: 'unauthorized' };
    const award = this.state.awards.find(a => a.id === data.award_id);
    const job = this.state.jobs.find(j => j.id === award?.job_id);
    if (!award || !job) return { success: false, error: 'not-found' };
    if (user.id !== job.owner_id && user.id !== award.supervisor_id) return { success: false, error: 'not-party' };
    if (award.escrow_status !== 'held' && award.escrow_status !== 'release_requested') {
      return { success: false, error: 'not-disputable' };
    }
    if (data.description.trim().length < 10) return { success: false, error: 'description-too-short' };

    const dispute: ExceptionIssue = {
      id: `exc-${Date.now()}`,
      job_id: job.id,
      subject_type: 'award',
      subject_id: award.id,
      raised_by: user.id,
      raised_by_name: user.name,
      reason_code: data.reason_code,
      description: data.description.trim(),
      evidence_blob_refs: [],
      status: 'open',
      response_deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    };
    this.state.exceptions.unshift(dispute);
    award.escrow_status = 'disputed';
    job.status = 'EXCEPTION_OPEN';

    this.logAudit(user.id, user.name, 'dispute.opened', 'award', award.id, `Opened a dispute (${data.reason_code}); escrow frozen`);
    this.notify();
    return { success: true, dispute };
  }

  public adminResolveException(exceptionId: string, resolution: string): boolean {
    if (!this.state.currentUser || this.state.currentUser.active_role !== 'admin') {
      throw new Error('403 Forbidden: Admin role required');
    }

    const exc = this.state.exceptions.find(e => e.id === exceptionId);
    if (!exc) return false;

    exc.status = 'resolved';
    exc.resolution = resolution;
    exc.resolved_by = this.state.currentUser.name;
    exc.resolved_at = new Date().toISOString();

    this.logAudit(
      this.state.currentUser.id,
      this.state.currentUser.name,
      'admin.exception.resolved',
      'exception',
      exceptionId,
      `Resolved dispute #${exceptionId}: ${resolution}`
    );

    this.notify();
    return true;
  }

  private logAudit(actorId: string, actorName: string, action: string, subjectType: string, subjectId: string, details: string): void {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actor_id: actorId,
      actor_name: actorName,
      action,
      subject_type: subjectType,
      subject_id: subjectId,
      details,
      at: new Date().toISOString()
    };
    this.state.auditLogs.unshift(entry);
  }
}

export const store = new StoreService();
