import { beforeEach, describe, expect, it, vi } from 'vitest';

type Store = typeof import('../store').store;

// The store reads and writes localStorage and is a singleton, so each test gets a fresh module.
let store: Store;
let memory: Record<string, string>;

beforeEach(async () => {
  memory = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in memory ? memory[k] : null),
    setItem: (k: string, v: string) => {
      memory[k] = v;
    },
    removeItem: (k: string) => {
      delete memory[k];
    },
  });
  vi.resetModules();
  store = (await import('../store')).store;
});

const current = () => store.getState().currentUser;

describe('verifyOtp with a category role', () => {
  it('registers a new user with the chosen category and role', () => {
    const res = store.verifyOtp('+94700000001', '123456', undefined, { category: 'construction', role: 'contractor' });
    expect(res.success).toBe(true);
    expect(current()?.memberships).toEqual([{ category: 'construction', role: 'contractor' }]);
    expect(current()?.roles).toEqual(['supervisor']);
    expect(current()?.active_role).toBe('supervisor');
    expect(current()?.active_category).toBe('construction');
  });

  it('lets an existing user join another category without losing the first', () => {
    store.verifyOtp('+94771234567', '123456', 'owner', { category: 'coconut', role: 'owner' });
    store.logout();
    const res = store.verifyOtp('+94771234567', '123456', undefined, { category: 'construction', role: 'client' });
    expect(res.success).toBe(true);
    const roles = current()!.memberships!.map(m => `${m.category}:${m.role}`);
    expect(roles).toContain('coconut:owner');
    expect(roles).toContain('construction:client');
    expect(current()!.active_category).toBe('construction');
  });

  it('does not duplicate a membership the user already has', () => {
    store.verifyOtp('+94700000002', '123456', undefined, { category: 'construction', role: 'client' });
    store.logout();
    store.verifyOtp('+94700000002', '123456', undefined, { category: 'construction', role: 'client' });
    expect(current()!.memberships).toHaveLength(1);
  });

  it('rejects a role the category does not define', () => {
    const res = store.verifyOtp('+94700000003', '123456', undefined, { category: 'coconut', role: 'contractor' });
    expect(res.success).toBe(false);
    expect(current()).toBeNull();
  });

  it('rejects a wrong code', () => {
    expect(store.verifyOtp('+94700000004', '000000', undefined, { category: 'coconut', role: 'owner' }).success).toBe(false);
  });

  it('keeps the old role-only sign-in working', () => {
    const res = store.verifyOtp('+94765551234', '123456', 'worker');
    expect(res.success).toBe(true);
    expect(current()?.id).toBe('user-worker-1');
  });
});

describe('admin accounts', () => {
  it('cannot be reached or created through phone sign-in', () => {
    expect(store.verifyOtp('+94770001122', '123456').success).toBe(false); // the seeded admin's phone
    expect(store.verifyOtp('+94700000005', '123456', 'admin').success).toBe(false);
    expect(current()).toBeNull();
    expect(store.getState().users.filter(u => u.roles.includes('admin'))).toHaveLength(1);
  });

  it('is never granted by joining a category', () => {
    store.verifyOtp('+94700000006', '123456', undefined, { category: 'coconut', role: 'owner' });
    const res = store.addMembership({ category: 'coconut', role: 'admin' as never });
    expect(res.success).toBe(false);
    expect(current()?.roles).not.toContain('admin');
  });
});

describe('addMembership', () => {
  it('requires a signed-in user', () => {
    expect(store.addMembership({ category: 'construction', role: 'client' })).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('adds the role, switches to it, and records an audit entry', () => {
    store.verifyOtp('+94700000007', '123456', undefined, { category: 'coconut', role: 'worker' });
    const before = store.getState().auditLogs.length;
    expect(store.addMembership({ category: 'construction', role: 'contractor' }).success).toBe(true);
    expect(current()!.active_role).toBe('supervisor');
    expect(current()!.active_category).toBe('construction');
    expect(current()!.roles).toEqual(expect.arrayContaining(['worker', 'supervisor']));
    expect(store.getState().auditLogs.length).toBeGreaterThan(before);
    expect(store.getState().auditLogs.some(a => a.action === 'auth.membership_added')).toBe(true);
  });

  it('rejects an unknown role for the category', () => {
    store.verifyOtp('+94700000008', '123456', undefined, { category: 'coconut', role: 'owner' });
    expect(store.addMembership({ category: 'coconut', role: 'client' }).success).toBe(false);
  });
});

describe('switchRole', () => {
  it('only switches between roles the user already holds', () => {
    store.verifyOtp('+94765551234', '123456', 'worker');
    expect(store.switchRole('admin')).toBe(false);
    expect(store.switchRole('owner')).toBe(false);
    expect(current()?.roles).toEqual(['worker']);
    expect(current()?.active_role).toBe('worker');
  });

  it('switches to a held role', () => {
    store.verifyOtp('+94771234567', '123456', 'owner'); // seeded owner who is also a supervisor
    expect(store.switchRole('supervisor')).toBe(true);
    expect(current()?.active_role).toBe('supervisor');
  });
});

describe('adminLogin', () => {
  const email = 'niluka.fernando@coconnect.gov.lk';

  it('rejects a wrong PIN, a wrong email and an empty PIN', () => {
    expect(store.adminLogin(email, '000000').success).toBe(false);
    expect(store.adminLogin('someone@else.lk', '9999').success).toBe(false);
    expect(store.adminLogin(email, '').success).toBe(false);
    expect(current()).toBeNull();
  });

  it('accepts the right credentials, ignoring email case and spaces', () => {
    expect(store.adminLogin(`  ${email.toUpperCase()} `, '9999').success).toBe(true);
    expect(current()?.active_role).toBe('admin');
  });

  it('lets a non-admin never reach admin-only actions', () => {
    store.verifyOtp('+94765551234', '123456', 'worker');
    expect(() => store.adminDecideNicSubmission('x', 'approved')).toThrow(/403/);
  });
});

describe('category data', () => {
  it('seeds construction demo data next to the coconut data', () => {
    const { jobs, estates } = store.getState();
    expect(jobs.filter(j => j.category === 'construction').length).toBeGreaterThan(0);
    expect(estates.filter(e => (e.category ?? 'coconut') === 'coconut').length).toBeGreaterThan(0);
  });

  it('stamps new estates, jobs and workers with their category', () => {
    store.verifyOtp('+94772000001', '123456'); // seeded construction client
    const site = store.addEstate({
      name: 'Test site', area_acres: 0, tree_count: 0, location: 'Colombo',
      category: 'construction', attributes: { site_type: 'House', floor_area_sqft: 1000, floors: 1 },
    });
    expect(site.category).toBe('construction');
    const job = store.createJob({
      estate_id: site.id, task_type: 'Plumbing & Sanitary Installation', starts_at: '2026-11-01', ends_at: '2026-11-02',
      worker_count: 1, duration_days: 1, required_skills: ['Plumber'], wage_budget: 10000,
    });
    expect(job.category).toBe('construction');
    store.logout();
    store.verifyOtp('+94772000002', '123456'); // seeded contractor
    const worker = store.addWorker({
      name: 'New Mason', phone: '+94772100099', skills: ['Mason'], nic_ref: '199000000000', consent_method: 'sms', category: 'construction',
    });
    expect(worker.category).toBe('construction');
  });

  it('adds construction demo data to a browser that saved state before categories existed', async () => {
    store.logout();
    const saved = JSON.parse(memory['coconnect_app_state_v1']);
    saved.users = saved.users.filter((u: { id: string }) => !u.id.startsWith('user-client'));
    saved.jobs = saved.jobs.filter((j: { category?: string }) => j.category !== 'construction');
    memory['coconnect_app_state_v1'] = JSON.stringify(saved);
    vi.resetModules();
    const fresh = (await import('../store')).store;
    expect(fresh.getState().users.some(u => u.id === 'user-client-1')).toBe(true);
    expect(fresh.getState().jobs.some(j => j.id === 'job-c-1')).toBe(true);
  });
});
