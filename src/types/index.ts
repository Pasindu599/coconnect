import type { CategoryId, Membership } from './category';

export type Role = 'owner' | 'supervisor' | 'worker' | 'admin';

export type NicStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type JobStatus = 
  | 'DRAFT'
  | 'OPEN'
  | 'AWARDED_PENDING_FEE'
  | 'CANCELLED'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'PENDING_COMPLETION'
  | 'COMPLETED'
  | 'EXCEPTION_OPEN'
  | 'CLOSED_DISPUTED';

export type PaymentSchedule = 'daily' | 'lump_sum';

export type EscrowStatus = 'pending' | 'held' | 'release_requested' | 'released' | 'disputed' | 'refunded';

export type ReconciliationStatus = 'MATCH' | 'MISMATCH' | 'AWAITING_COUNTERPARTY';

export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  roles: Role[];
  active_role: Role;
  /** Multi-category memberships (CONTRACTS C1). Written only by the `addMembership` Function. */
  memberships: Membership[];
  /** Which category's UI the user is currently in; a client-writable UI preference. */
  active_category?: CategoryId;
  nic_status: NicStatus;
  nic_number?: string;
  nic_front_url?: string;
  nic_back_url?: string;
  nic_submitted_at?: string;
  nic_rejection_reason?: string;
  preferred_language: 'en' | 'si';
  trust_score: number;
  pin_hash?: string;
  created_at: string;
  avatar_url?: string;
  location?: string;
}

export interface NicSubmission {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  role: Role;
  nic_number: string;
  nic_format: 'OLD_9V' | 'NEW_12' | 'UNKNOWN';
  dob?: string;
  gender?: 'MALE' | 'FEMALE';
  front_image_url: string;
  back_image_url: string;
  front_file_name: string;
  back_file_name: string;
  front_file_size_kb?: number;
  back_file_size_kb?: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
}

export interface Estate {
  id: string;
  /** Optional, defaults to 'coconut' at write time (see store.ts) until a category-aware posting UI sets it explicitly. Required by firestore.rules' isPoster() check. */
  category?: CategoryId;
  owner_id: string;
  name: string;
  area_acres: number;
  location: string;
  tree_count: number;
  notes?: string;
  lat?: number;
  lng?: number;
  created_at: string;
}

export interface Worker {
  id: string;
  /** Optional, see Estate.category. */
  category?: CategoryId;
  supervisor_id: string;
  name: string;
  phone: string;
  skills: string[];
  nic_ref: string;
  bank_ref?: string;
  consent_captured_at: string;
  consent_method: 'sms' | 'written' | 'verbal_recorded';
  rating: number;
  jobs_completed: number;
  active: boolean;
}

export interface LabourJob {
  id: string;
  /** Optional, see Estate.category. */
  category?: CategoryId;
  owner_id: string;
  owner_name: string;
  estate_id: string;
  estate_name: string;
  estate_location: string;
  task_type: string;
  starts_at: string;
  ends_at: string;
  worker_count: number;
  duration_days: number;
  required_skills: string[];
  wage_budget: number;
  status: JobStatus;
  created_at: string;
  description?: string;
  lat?: number;
  lng?: number;
}

export interface Bid {
  id: string;
  /** Optional, see Estate.category. */
  category?: CategoryId;
  job_id: string;
  /** Denormalized from the job at submission time — lets firestore.rules' sealed-bid read check stay a simple field equality instead of a cross-document get(), which a `list`/onSnapshot query can't safely use (ADR-008/009). */
  owner_id?: string;
  supervisor_id: string;
  supervisor_name: string;
  supervisor_phone: string;
  supervisor_trust_score: number;
  price: number;
  supervisor_fee: number;
  payment_schedule: PaymentSchedule;
  status: 'pending' | 'accepted' | 'rejected';
  submitted_at: string;
  crew_member_ids: string[];
  crew_members?: Worker[];
}

export interface Award {
  id: string;
  /** Optional, see Estate.category. */
  category?: CategoryId;
  job_id: string;
  /** Denormalized, same reason as Bid.owner_id above. owner_phone/owner_name close the "supervisor can't see who to call" gap (S1-11) — the supervisor can read the award but not users/{owner_id} directly. */
  owner_id?: string;
  owner_name?: string;
  owner_phone?: string;
  bid_id: string;
  supervisor_id: string;
  supervisor_name: string;
  awarded_at: string;
  escrow_status: EscrowStatus;
  escrow_amount: number;
  contacts_released_at?: string;
  fee_payment_ref?: string;
}

export interface AttendanceDay {
  id: string;
  job_id: string;
  /** Denormalized from the job/award so firestore.rules can authorize without a query — see ADR-006/S1-08. */
  owner_id?: string;
  supervisor_id?: string;
  work_date: string;
  status: 'open' | 'reconciled' | 'disputed';
  created_at: string;
}

export interface AttendanceEntry {
  id: string;
  attendance_day_id: string;
  /** Denormalized, same reason as AttendanceDay above. */
  owner_id?: string;
  supervisor_id?: string;
  worker_id: string;
  worker_name: string;
  party: 'supervisor' | 'owner';
  present: boolean;
  recorded_by: string;
  recorded_at: string;
  evidence_blob_ref?: string;
  sync_status: 'synced' | 'pending_offline';
  notes?: string;
}

export interface WageRecord {
  worker_id: string;
  worker_name: string;
  days_worked: number;
  daily_rate: number;
  amount: number;
  currency: string;
}

export interface Completion {
  id: string;
  job_id: string;
  /** Denormalized, same reason as AttendanceDay above; submitted_by already identifies the supervisor side. */
  owner_id?: string;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'confirmed' | 'disputed';
  wage_records: WageRecord[];
  total_wages: number;
  supervisor_fee: number;
  notes?: string;
}

/** New in S1-11 — see .claude/docs/specs/payments.md's dispute/resolveDispute section. */
export interface Dispute {
  id: string;
  category?: CategoryId;
  job_id: string;
  award_id: string;
  owner_id: string;
  supervisor_id: string;
  opened_by: string;
  reason: string;
  opened_at: string;
  status: 'open' | 'resolved';
  resolution?: 'refunded' | 'released';
  resolved_by?: string;
  resolved_at?: string;
}

export interface RatingSubmission {
  id: string;
  job_id: string;
  from_user_id: string;
  from_name: string;
  to_user_id: string;
  to_role: Role;
  score: number; // 1 to 5
  review_tags: string[];
  comment: string;
  submitted_at: string;
}

export interface TrustScore {
  user_id: string;
  score: number;
  components: {
    rating_score: number;
    completion_rate: number;
    verification_bonus: number;
    dispute_penalty: number;
    raw_ratings_count: number;
  };
  rule_version: string;
  computed_at: string;
  trigger_event: string;
}

export interface VerificationDoc {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  role: Role;
  doc_type: 'NIC_FRONT' | 'NIC_BACK' | 'LAND_DEED' | 'BUSINESS_REG';
  blob_ref: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface ExceptionIssue {
  id: string;
  job_id: string;
  subject_type: string;
  subject_id: string;
  raised_by: string;
  raised_by_name: string;
  reason_code: 'WORKER_NO_SHOW' | 'WAGE_DISPUTE' | 'POOR_WORKMANSHIP' | 'ESTATE_ACCESS_ISSUE';
  description: string;
  evidence_blob_refs: string[];
  status: 'open' | 'under_review' | 'resolved';
  response_deadline: string;
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  subject_type: string;
  subject_id: string;
  details: string;
  at: string;
}

export interface ScoringRuleVersion {
  id: string;
  version: string;
  weights: {
    ratings: number;
    completion_rate: number;
    verification_bonus: number;
    dispute_penalty: number;
  };
  bands: {
    elite: number;
    trusted: number;
    standard: number;
    restricted: number;
  };
  published_at: string;
  frozen_until: string;
}
