import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// KNOWN_ISSUES #34: with real auth the store must start empty and keep nothing in localStorage.
const memory: Record<string, string> = {};

beforeEach(() => {
  for (const key of Object.keys(memory)) delete memory[key];
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in memory ? memory[k] : null),
    setItem: (k: string, v: string) => void (memory[k] = v),
    removeItem: (k: string) => void delete memory[k],
  });
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('store in real-auth mode', () => {
  it('starts with no demo records, even when a demo snapshot is saved in the browser', async () => {
    memory.coconnect_app_state_v1 = JSON.stringify({ users: [{ id: 'user-owner-1' }], estates: [{ id: 'est-1' }] });
    vi.stubEnv('VITE_AUTH_MODE', 'supabase');
    const { store } = await import('../store');
    const state = store.getState();
    expect(state.users).toEqual([]);
    expect(state.estates).toEqual([]);
    expect(state.jobs).toEqual([]);
    expect(state.nicSubmissions).toEqual([]);
    expect(state.currentUser).toBeNull();
  });

  it('does not write its state to localStorage', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'supabase');
    const { store } = await import('../store');
    store.logout();
    expect(memory.coconnect_app_state_v1).toBeUndefined();
  });

  it('demo mode still starts from the demo data', async () => {
    const { store } = await import('../store');
    expect(store.getState().users.length).toBeGreaterThan(0);
  });
});
