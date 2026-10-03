import { beforeEach, describe, expect, it, vi } from 'vitest';

type Store = typeof import('../store').store;
type Api = typeof import('../authApi');

let store: Store;
let api: Api;

beforeEach(async () => {
  const memory: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in memory ? memory[k] : null),
    setItem: (k: string, v: string) => void (memory[k] = v),
    removeItem: (k: string) => void delete memory[k],
  });
  vi.resetModules();
  store = (await import('../store')).store;
  api = await import('../authApi');
});

describe('mock auth API (the default)', () => {
  it('is the demo sign-in unless VITE_AUTH_MODE is "firebase"', () => {
    expect(api.authApi).toBe(api.mockAuthApi);
    expect(api.authApi.isMock).toBe(true);
  });

  it('sends a code and returns it for the screen to show', async () => {
    expect((await api.mockAuthApi.sendOtp('+94 77 123 4567')).demoCode).toBe('123456');
  });

  it('rejects a too-short phone number with the invalid-phone code', async () => {
    await expect(api.mockAuthApi.sendOtp('12')).rejects.toMatchObject({ code: 'invalid-phone' });
  });

  it('signs in and records the membership', async () => {
    await api.mockAuthApi.confirmOtp('+94 77 200 0001', '123456', { category: 'construction', role: 'client' });
    expect(store.getState().currentUser?.id).toBe('user-client-1');
  });

  it('reports a wrong code as invalid-code', async () => {
    await expect(
      api.mockAuthApi.confirmOtp('+94 77 200 0001', '999999', { category: 'construction', role: 'client' })
    ).rejects.toMatchObject({ code: 'invalid-code' });
    expect(store.getState().currentUser).toBeNull();
  });

  it('reports the staff phone number as staff-account', async () => {
    await expect(
      api.mockAuthApi.confirmOtp('+94 77 000 1122', '123456', { category: 'coconut', role: 'owner' })
    ).rejects.toMatchObject({ code: 'staff-account' });
  });

  it('reports bad staff credentials as not-staff, and accepts the right ones', async () => {
    await expect(api.mockAuthApi.signInStaff('niluka.fernando@coconnect.gov.lk', '0000')).rejects.toMatchObject({ code: 'not-staff' });
    await expect(api.mockAuthApi.signInStaff('niluka.fernando@coconnect.gov.lk', '9999')).resolves.toBeUndefined();
    expect(store.getState().currentUser?.active_role).toBe('admin');
  });
});

describe('real auth API', () => {
  it('is wired to the Firebase functions and is not the demo', () => {
    expect(api.firebaseAuthApi.isMock).toBe(false);
    expect(api.RECAPTCHA_CONTAINER_ID).toBe('recaptcha-container');
  });
});
