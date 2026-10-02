import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  ADMIN,
  BIDDER,
  OTHER_BIDDER,
  OTHER_OWNER,
  OWNER,
  WORKER,
  makeFirestoreTestEnv,
} from './setup';

const testEnv: RulesTestEnvironment = await makeFirestoreTestEnv('rules-test-firestore');

afterAll(() => testEnv.cleanup());
beforeEach(() => testEnv.clearFirestore());

function ctx(user: { uid: string; token?: Record<string, unknown> } | null) {
  return user ? testEnv.authenticatedContext(user.uid, user.token) : testEnv.unauthenticatedContext();
}

type Db = ReturnType<ReturnType<typeof ctx>['firestore']>;

async function seed(fn: (db: Db) => Promise<void>) {
  await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
    await fn(adminCtx.firestore());
  });
}

describe('users', () => {
  it('lets a user create their own profile with empty memberships', async () => {
    const db = ctx(OWNER).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'users', OWNER.uid), { phone: '+94770000000', name: 'Owner', memberships: [] })
    );
  });

  it('rejects creating a profile with non-empty memberships', async () => {
    const db = ctx(OWNER).firestore();
    await assertFails(
      setDoc(doc(db, 'users', OWNER.uid), {
        phone: '+94770000000',
        name: 'Owner',
        memberships: [{ category: 'coconut', role: 'owner' }],
      })
    );
  });

  it('rejects creating another uid\'s profile', async () => {
    const db = ctx(OWNER).firestore();
    await assertFails(setDoc(doc(db, 'users', OTHER_OWNER.uid), { phone: '+1', name: 'x', memberships: [] }));
  });

  it('owner can read and update their own non-protected fields', async () => {
    await seed((db) => setDoc(doc(db, 'users', OWNER.uid), { phone: '+94', name: 'Owner', memberships: [], nic_status: 'unverified', trust_score: 0 }));
    const db = ctx(OWNER).firestore();
    await assertSucceeds(getDoc(doc(db, 'users', OWNER.uid)));
    await assertSucceeds(updateDoc(doc(db, 'users', OWNER.uid), { name: 'Owner Updated' }));
  });

  it('a stranger cannot read another user\'s profile', async () => {
    await seed((db) => setDoc(doc(db, 'users', OWNER.uid), { phone: '+94', name: 'Owner', memberships: [], nic_status: 'unverified', trust_score: 0 }));
    const db = ctx(OTHER_OWNER).firestore();
    await assertFails(getDoc(doc(db, 'users', OWNER.uid)));
  });

  it('admin can read any profile', async () => {
    await seed((db) => setDoc(doc(db, 'users', OWNER.uid), { phone: '+94', name: 'Owner', memberships: [], nic_status: 'unverified', trust_score: 0 }));
    const db = ctx(ADMIN).firestore();
    await assertSucceeds(getDoc(doc(db, 'users', OWNER.uid)));
  });

  it('rejects a client trying to grant itself a membership', async () => {
    await seed((db) => setDoc(doc(db, 'users', OWNER.uid), { phone: '+94', name: 'Owner', memberships: [], nic_status: 'unverified', trust_score: 0 }));
    const db = ctx(OWNER).firestore();
    await assertFails(updateDoc(doc(db, 'users', OWNER.uid), { memberships: [{ category: 'coconut', role: 'owner' }] }));
  });

  it('rejects a client trying to verify their own NIC', async () => {
    await seed((db) => setDoc(doc(db, 'users', OWNER.uid), { phone: '+94', name: 'Owner', memberships: [], nic_status: 'unverified', trust_score: 0 }));
    const db = ctx(OWNER).firestore();
    await assertFails(updateDoc(doc(db, 'users', OWNER.uid), { nic_status: 'verified' }));
  });
});

describe('estates', () => {
  it('a poster can create their own estate', async () => {
    const db = ctx(OWNER).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'estates', 's1'), { category: 'coconut', owner_id: OWNER.uid, name: 'Estate 1' })
    );
  });

  it('a bidder (not a poster) cannot create an estate', async () => {
    const db = ctx(BIDDER).firestore();
    await assertFails(
      setDoc(doc(db, 'estates', 's2'), { category: 'coconut', owner_id: BIDDER.uid, name: 'Estate 2' })
    );
  });

  it('cannot create an estate owned by someone else', async () => {
    const db = ctx(OWNER).firestore();
    await assertFails(
      setDoc(doc(db, 'estates', 's3'), { category: 'coconut', owner_id: OTHER_OWNER.uid, name: 'Estate 3' })
    );
  });

  it('only the owner can update their estate', async () => {
    await seed((db) => setDoc(doc(db, 'estates', 's1'), { category: 'coconut', owner_id: OWNER.uid, name: 'Estate 1' }));
    await assertSucceeds(updateDoc(doc(ctx(OWNER).firestore(), 'estates', 's1'), { name: 'Renamed' }));
    await assertFails(updateDoc(doc(ctx(OTHER_OWNER).firestore(), 'estates', 's1'), { name: 'Hijacked' }));
  });

  it('any signed-in user can read an estate', async () => {
    await seed((db) => setDoc(doc(db, 'estates', 's1'), { category: 'coconut', owner_id: OWNER.uid, name: 'Estate 1' }));
    await assertSucceeds(getDoc(doc(ctx(BIDDER).firestore(), 'estates', 's1')));
  });
});

describe('jobs', () => {
  it('a poster can create an OPEN job', async () => {
    const db = ctx(OWNER).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'jobs', 'j1'), { category: 'coconut', owner_id: OWNER.uid, status: 'OPEN' })
    );
  });

  it('cannot create a job already past OPEN', async () => {
    const db = ctx(OWNER).firestore();
    await assertFails(
      setDoc(doc(db, 'jobs', 'j2'), { category: 'coconut', owner_id: OWNER.uid, status: 'ACTIVE' })
    );
  });

  it('owner can move OPEN -> CANCELLED, not to ACTIVE', async () => {
    await seed((db) => setDoc(doc(db, 'jobs', 'j1'), { category: 'coconut', owner_id: OWNER.uid, status: 'OPEN' }));
    await assertSucceeds(updateDoc(doc(ctx(OWNER).firestore(), 'jobs', 'j1'), { status: 'CANCELLED' }));
    await seed((db) => setDoc(doc(db, 'jobs', 'j3'), { category: 'coconut', owner_id: OWNER.uid, status: 'OPEN' }));
    await assertFails(updateDoc(doc(ctx(OWNER).firestore(), 'jobs', 'j3'), { status: 'ACTIVE' }));
  });

  it('a non-owner cannot edit the job', async () => {
    await seed((db) => setDoc(doc(db, 'jobs', 'j1'), { category: 'coconut', owner_id: OWNER.uid, status: 'OPEN' }));
    await assertFails(updateDoc(doc(ctx(OTHER_OWNER).firestore(), 'jobs', 'j1'), { status: 'CANCELLED' }));
  });

  it('cannot edit a job once it is past OPEN (Functions-only territory)', async () => {
    await seed((db) => setDoc(doc(db, 'jobs', 'j1'), { category: 'coconut', owner_id: OWNER.uid, status: 'ACTIVE' }));
    await assertFails(updateDoc(doc(ctx(OWNER).firestore(), 'jobs', 'j1'), { status: 'CANCELLED' }));
  });

  it('no client can delete a job', async () => {
    await seed((db) => setDoc(doc(db, 'jobs', 'j1'), { category: 'coconut', owner_id: OWNER.uid, status: 'OPEN' }));
    const { deleteDoc } = await import('firebase/firestore');
    await assertFails(deleteDoc(doc(ctx(OWNER).firestore(), 'jobs', 'j1')));
  });
});

describe('bids (sealed)', () => {
  async function seedOpenJob() {
    await seed((db) => setDoc(doc(db, 'jobs', 'j1'), { category: 'coconut', owner_id: OWNER.uid, status: 'OPEN' }));
  }

  it('a bidder can bid on an open job', async () => {
    await seedOpenJob();
    const db = ctx(BIDDER).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'bids', 'b1'), { category: 'coconut', job_id: 'j1', supervisor_id: BIDDER.uid, price: 1000, status: 'pending' })
    );
  });

  it('cannot bid on a job that is not OPEN', async () => {
    await seed((db) => setDoc(doc(db, 'jobs', 'j1'), { category: 'coconut', owner_id: OWNER.uid, status: 'DRAFT' }));
    const db = ctx(BIDDER).firestore();
    await assertFails(
      setDoc(doc(db, 'bids', 'b1'), { category: 'coconut', job_id: 'j1', supervisor_id: BIDDER.uid, price: 1000, status: 'pending' })
    );
  });

  it('a poster cannot bid (not a bidder capability)', async () => {
    await seedOpenJob();
    const db = ctx(OWNER).firestore();
    await assertFails(
      setDoc(doc(db, 'bids', 'b1'), { category: 'coconut', job_id: 'j1', supervisor_id: OWNER.uid, price: 1000, status: 'pending' })
    );
  });

  it('other bidders cannot read a sealed bid; the job owner and the bidder can', async () => {
    await seedOpenJob();
    await seed((db) => setDoc(doc(db, 'bids', 'b1'), { category: 'coconut', job_id: 'j1', supervisor_id: BIDDER.uid, price: 1000, status: 'pending' }));
    await assertSucceeds(getDoc(doc(ctx(BIDDER).firestore(), 'bids', 'b1')));
    await assertSucceeds(getDoc(doc(ctx(OWNER).firestore(), 'bids', 'b1')));
    await assertFails(getDoc(doc(ctx(OTHER_BIDDER).firestore(), 'bids', 'b1')));
  });

  it('the bidder can edit their own pending bid', async () => {
    await seedOpenJob();
    await seed((db) => setDoc(doc(db, 'bids', 'b1'), { category: 'coconut', job_id: 'j1', supervisor_id: BIDDER.uid, price: 1000, status: 'pending' }));
    await assertSucceeds(updateDoc(doc(ctx(BIDDER).firestore(), 'bids', 'b1'), { price: 1200 }));
  });

  it('the job owner can accept/reject but not change the price', async () => {
    await seedOpenJob();
    await seed((db) => setDoc(doc(db, 'bids', 'b1'), { category: 'coconut', job_id: 'j1', supervisor_id: BIDDER.uid, price: 1000, status: 'pending' }));
    await assertFails(updateDoc(doc(ctx(OWNER).firestore(), 'bids', 'b1'), { price: 1 }));
    await assertSucceeds(updateDoc(doc(ctx(OWNER).firestore(), 'bids', 'b1'), { status: 'accepted' }));
  });

  it('a stranger cannot accept a bid', async () => {
    await seedOpenJob();
    await seed((db) => setDoc(doc(db, 'bids', 'b1'), { category: 'coconut', job_id: 'j1', supervisor_id: BIDDER.uid, price: 1000, status: 'pending' }));
    await assertFails(updateDoc(doc(ctx(OTHER_OWNER).firestore(), 'bids', 'b1'), { status: 'accepted' }));
  });
});

describe('workers', () => {
  it('a bidder can register a worker', async () => {
    const db = ctx(BIDDER).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'workers', 'w1'), { category: 'coconut', supervisor_id: BIDDER.uid, name: 'W', rating: 0, jobs_completed: 0 })
    );
  });

  it('a poster cannot register a worker', async () => {
    const db = ctx(OWNER).firestore();
    await assertFails(
      setDoc(doc(db, 'workers', 'w1'), { category: 'coconut', supervisor_id: OWNER.uid, name: 'W', rating: 0, jobs_completed: 0 })
    );
  });

  it('the manager can edit profile fields but not rating/jobs_completed', async () => {
    await seed((db) => setDoc(doc(db, 'workers', 'w1'), { category: 'coconut', supervisor_id: BIDDER.uid, name: 'W', rating: 3, jobs_completed: 1 }));
    await assertSucceeds(updateDoc(doc(ctx(BIDDER).firestore(), 'workers', 'w1'), { name: 'W2' }));
    await assertFails(updateDoc(doc(ctx(BIDDER).firestore(), 'workers', 'w1'), { rating: 5 }));
  });

  it('another manager cannot edit someone else\'s worker', async () => {
    await seed((db) => setDoc(doc(db, 'workers', 'w1'), { category: 'coconut', supervisor_id: BIDDER.uid, name: 'W', rating: 3, jobs_completed: 1 }));
    await assertFails(updateDoc(doc(ctx(OTHER_BIDDER).firestore(), 'workers', 'w1'), { name: 'Hijacked' }));
  });
});

describe('money collections are Functions-only', () => {
  it('no client can create/update/delete awards, payments, ledger or audit_logs', async () => {
    const ownerDb = ctx(OWNER).firestore();
    const adminDb = ctx(ADMIN).firestore();

    await assertFails(setDoc(doc(ownerDb, 'awards', 'a1'), { job_id: 'j1', supervisor_id: BIDDER.uid, escrow_status: 'held' }));
    await assertFails(setDoc(doc(adminDb, 'awards', 'a1'), { job_id: 'j1', supervisor_id: BIDDER.uid, escrow_status: 'held' }));

    await assertFails(setDoc(doc(ownerDb, 'payments', 'p1'), { award_id: 'a1', amount: 100, status: 'paid' }));
    await assertFails(setDoc(doc(adminDb, 'payments', 'p1'), { award_id: 'a1', amount: 100, status: 'paid' }));

    await assertFails(setDoc(doc(ownerDb, 'ledger', 'l1'), { award_id: 'a1', type: 'hold', amount: 100 }));
    await assertFails(setDoc(doc(adminDb, 'ledger', 'l1'), { award_id: 'a1', type: 'hold', amount: 100 }));

    await assertFails(setDoc(doc(ownerDb, 'audit_logs', 'log1'), { action: 'x' }));
    await assertFails(setDoc(doc(adminDb, 'audit_logs', 'log1'), { action: 'x' }));
  });

  it('the job owner and the award\'s bidder can read the award, payment and ledger entry; a stranger cannot', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'jobs', 'j1'), { category: 'coconut', owner_id: OWNER.uid, status: 'ACTIVE' });
      await setDoc(doc(db, 'awards', 'a1'), { job_id: 'j1', supervisor_id: BIDDER.uid, escrow_status: 'held' });
      await setDoc(doc(db, 'payments', 'p1'), { award_id: 'a1', amount: 100, status: 'paid' });
      await setDoc(doc(db, 'ledger', 'l1'), { award_id: 'a1', type: 'hold', amount: 100 });
    });

    await assertSucceeds(getDoc(doc(ctx(OWNER).firestore(), 'awards', 'a1')));
    await assertSucceeds(getDoc(doc(ctx(BIDDER).firestore(), 'awards', 'a1')));
    await assertFails(getDoc(doc(ctx(OTHER_OWNER).firestore(), 'awards', 'a1')));

    await assertSucceeds(getDoc(doc(ctx(OWNER).firestore(), 'payments', 'p1')));
    await assertFails(getDoc(doc(ctx(OTHER_BIDDER).firestore(), 'payments', 'p1')));

    await assertSucceeds(getDoc(doc(ctx(BIDDER).firestore(), 'ledger', 'l1')));
    await assertFails(getDoc(doc(ctx(OTHER_OWNER).firestore(), 'ledger', 'l1')));
  });

  it('nobody, not even admin, can read audit_logs directly', async () => {
    await seed((db) => setDoc(doc(db, 'audit_logs', 'log1'), { action: 'x' }));
    await assertFails(getDoc(doc(ctx(ADMIN).firestore(), 'audit_logs', 'log1')));
  });
});

describe('attendance', () => {
  it('either party can create an attendance day for their own job', async () => {
    await assertSucceeds(
      setDoc(doc(ctx(OWNER).firestore(), 'attendance_days', 'd1'), { job_id: 'j1', owner_id: OWNER.uid, supervisor_id: BIDDER.uid, status: 'open' })
    );
  });

  it('a stranger cannot create an attendance day for a job they are not party to', async () => {
    await assertFails(
      setDoc(doc(ctx(OTHER_OWNER).firestore(), 'attendance_days', 'd1'), { job_id: 'j1', owner_id: OWNER.uid, supervisor_id: BIDDER.uid, status: 'open' })
    );
  });

  it('a reconciled day cannot be edited by a client', async () => {
    await seed((db) => setDoc(doc(db, 'attendance_days', 'd1'), { job_id: 'j1', owner_id: OWNER.uid, supervisor_id: BIDDER.uid, status: 'reconciled' }));
    await assertFails(updateDoc(doc(ctx(OWNER).firestore(), 'attendance_days', 'd1'), { status: 'open' }));
  });

  it('each party can only record their own side of attendance entries', async () => {
    await assertSucceeds(
      setDoc(doc(ctx(OWNER).firestore(), 'attendance_entries', 'e1'), {
        attendance_day_id: 'd1', owner_id: OWNER.uid, supervisor_id: BIDDER.uid, party: 'owner', recorded_by: OWNER.uid, present: true,
      })
    );
    await assertFails(
      setDoc(doc(ctx(OWNER).firestore(), 'attendance_entries', 'e2'), {
        attendance_day_id: 'd1', owner_id: OWNER.uid, supervisor_id: BIDDER.uid, party: 'supervisor', recorded_by: OWNER.uid, present: true,
      })
    );
  });
});

describe('completions', () => {
  it('the bidder can submit a completion as pending', async () => {
    await assertSucceeds(
      setDoc(doc(ctx(BIDDER).firestore(), 'completions', 'c1'), { job_id: 'j1', owner_id: OWNER.uid, supervisor_id: BIDDER.uid, status: 'pending' })
    );
  });

  it('the job owner cannot submit a completion on the bidder\'s behalf', async () => {
    await assertFails(
      setDoc(doc(ctx(OWNER).firestore(), 'completions', 'c1'), { job_id: 'j1', owner_id: OWNER.uid, supervisor_id: BIDDER.uid, status: 'pending' })
    );
  });

  it('no client can confirm a completion directly (PIN check is server-side)', async () => {
    await seed((db) => setDoc(doc(db, 'completions', 'c1'), { job_id: 'j1', owner_id: OWNER.uid, supervisor_id: BIDDER.uid, status: 'pending' }));
    await assertFails(updateDoc(doc(ctx(OWNER).firestore(), 'completions', 'c1'), { status: 'confirmed' }));
    await assertFails(updateDoc(doc(ctx(BIDDER).firestore(), 'completions', 'c1'), { status: 'confirmed' }));
  });
});

describe('disputes', () => {
  it('either party to the award can open a dispute', async () => {
    await assertSucceeds(
      setDoc(doc(ctx(OWNER).firestore(), 'disputes', 'disp1'), {
        job_id: 'j1', owner_id: OWNER.uid, supervisor_id: BIDDER.uid, opened_by: OWNER.uid, status: 'open',
      })
    );
  });

  it('a stranger cannot open a dispute on someone else\'s award', async () => {
    await assertFails(
      setDoc(doc(ctx(OTHER_OWNER).firestore(), 'disputes', 'disp1'), {
        job_id: 'j1', owner_id: OWNER.uid, supervisor_id: BIDDER.uid, opened_by: OTHER_OWNER.uid, status: 'open',
      })
    );
  });

  it('only a Function (admin resolveDispute) can resolve it, not the client', async () => {
    await seed((db) => setDoc(doc(db, 'disputes', 'disp1'), { job_id: 'j1', owner_id: OWNER.uid, supervisor_id: BIDDER.uid, opened_by: OWNER.uid, status: 'open' }));
    await assertFails(updateDoc(doc(ctx(ADMIN).firestore(), 'disputes', 'disp1'), { status: 'resolved', resolution: 'released' }));
  });
});

describe('nic_submissions', () => {
  it('a user can submit their own NIC as pending', async () => {
    await assertSucceeds(
      setDoc(doc(ctx(OWNER).firestore(), 'nic_submissions', 'n1'), { user_id: OWNER.uid, status: 'pending' })
    );
  });

  it('cannot submit a NIC on someone else\'s behalf, or pre-approved', async () => {
    await assertFails(setDoc(doc(ctx(OWNER).firestore(), 'nic_submissions', 'n1'), { user_id: OTHER_OWNER.uid, status: 'pending' }));
    await assertFails(setDoc(doc(ctx(OWNER).firestore(), 'nic_submissions', 'n1'), { user_id: OWNER.uid, status: 'approved' }));
  });

  it('only the submitter and admin can read it; only admin can review it', async () => {
    await seed((db) => setDoc(doc(db, 'nic_submissions', 'n1'), { user_id: OWNER.uid, status: 'pending' }));
    await assertSucceeds(getDoc(doc(ctx(OWNER).firestore(), 'nic_submissions', 'n1')));
    await assertFails(getDoc(doc(ctx(OTHER_OWNER).firestore(), 'nic_submissions', 'n1')));
    await assertFails(updateDoc(doc(ctx(OWNER).firestore(), 'nic_submissions', 'n1'), { status: 'approved' }));
    await assertSucceeds(updateDoc(doc(ctx(ADMIN).firestore(), 'nic_submissions', 'n1'), { status: 'approved' }));
  });
});

describe('ratings', () => {
  it('a party to a job can submit a rating as themselves', async () => {
    await assertSucceeds(
      setDoc(doc(ctx(OWNER).firestore(), 'ratings', 'r1'), { job_id: 'j1', from_user_id: OWNER.uid, to_user_id: BIDDER.uid, score: 5 })
    );
  });

  it('cannot submit a rating pretending to be someone else', async () => {
    await assertFails(
      setDoc(doc(ctx(OWNER).firestore(), 'ratings', 'r1'), { job_id: 'j1', from_user_id: OTHER_OWNER.uid, to_user_id: BIDDER.uid, score: 5 })
    );
  });
});

describe('unauthenticated access', () => {
  it('is denied everywhere', async () => {
    const db = ctx(null).firestore();
    await assertFails(getDoc(doc(db, 'jobs', 'j1')));
    await assertFails(setDoc(doc(db, 'jobs', 'j1'), { category: 'coconut', owner_id: 'x', status: 'OPEN' }));
  });
});
