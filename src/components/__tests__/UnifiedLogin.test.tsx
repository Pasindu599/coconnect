// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UnifiedLogin } from '../auth/UnifiedLogin';
import { CategoryProvider } from '../../config/CategoryContext';
import { store } from '../../lib/store';
import { snapshotStore } from '../../test/storeSnapshot';
import { authApi } from '../../lib/authApi';
import { AuthError, type AuthErrorCode } from '../../lib/auth';
import { translations } from '../../lib/i18n';
import type { CategoryId, CategoryRoleId } from '../../types/category';

let restore: () => void;
beforeEach(() => {
  restore = snapshotStore();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  store.logout();
  restore();
});

const setup = (category: CategoryId, initialRoleId?: CategoryRoleId) => {
  const onLoginSuccess = vi.fn();
  render(
    <CategoryProvider categoryId={category}>
      <UnifiedLogin currentLang="en" initialRoleId={initialRoleId} onLoginSuccess={onLoginSuccess} onSwitchCategory={() => {}} />
    </CategoryProvider>
  );
  return { onLoginSuccess };
};

const submit = () => fireEvent.click(document.querySelector('button[type="submit"]')!);
/** Send the code and wait for the code step. */
const sendCode = async () => {
  submit();
  await waitFor(() => expect(document.querySelector('input[maxlength="6"]')).toBeTruthy());
};
const phone = () => document.querySelector<HTMLInputElement>('input[type="tel"]')!;

describe('UnifiedLogin', () => {
  it('offers the four construction roles', () => {
    setup('construction');
    for (const id of ['client', 'contractor', 'subcontractor', 'worker']) {
      expect(screen.getByTestId(`login-role-${id}`)).toBeTruthy();
    }
    expect(screen.getByTestId('login-category').textContent).toBe('Construction');
  });

  it('offers the three coconut roles and no construction ones', () => {
    setup('coconut');
    expect(screen.getByTestId('login-role-broker')).toBeTruthy();
    expect(screen.queryByTestId('login-role-contractor')).toBeNull();
  });

  it('preselects the role from the landing card and fills its demo number', () => {
    setup('construction', 'contractor');
    expect(screen.getByTestId('login-role-contractor').getAttribute('aria-pressed')).toBe('true');
    expect(phone().value).toBe('+94 77 200 0002');
  });

  it('falls back to the first role when the preselected one is not in this category', () => {
    setup('coconut', 'contractor');
    expect(screen.getByTestId('login-role-owner').getAttribute('aria-pressed')).toBe('true');
  });

  it('changes the demo number when another role is picked', () => {
    setup('construction');
    fireEvent.click(screen.getByTestId('login-role-worker'));
    expect(phone().value).toBe('+94 77 200 0004');
  });

  it('signs in with a code and records the category and role', async () => {
    const { onLoginSuccess } = setup('construction', 'contractor');
    await sendCode();
    submit(); // verify (the demo code is prefilled)
    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1));
    const user = store.getState().currentUser!;
    expect(user.id).toBe('user-contractor-1');
    expect(user.active_category).toBe('construction');
    expect(user.active_role).toBe('supervisor');
  });

  it('registers a new number with the chosen role', async () => {
    const { onLoginSuccess } = setup('construction', 'subcontractor');
    fireEvent.change(phone(), { target: { value: '+94 70 555 0101' } });
    await sendCode();
    submit();
    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalled());
    expect(store.getState().currentUser!.memberships).toEqual([{ category: 'construction', role: 'subcontractor' }]);
  });

  it('rejects a bad phone number before sending a code', () => {
    const { onLoginSuccess } = setup('coconut');
    fireEvent.change(phone(), { target: { value: '12' } });
    submit();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  it('rejects a wrong code and stays signed out', async () => {
    const { onLoginSuccess } = setup('coconut');
    await sendCode();
    fireEvent.change(document.querySelector('input[maxlength="6"]')!, { target: { value: '000000' } });
    submit();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(translations.en.auth_err_invalid_code);
    expect(onLoginSuccess).not.toHaveBeenCalled();
    expect(store.getState().currentUser).toBeNull();
  });

  it('does not let a staff phone number sign in here', async () => {
    const { onLoginSuccess } = setup('coconut');
    fireEvent.change(phone(), { target: { value: '+94 77 000 1122' } }); // the seeded admin's number
    await sendCode();
    submit();
    expect((await screen.findByRole('alert')).textContent).toBe(translations.en.auth_err_staff_account);
    expect(onLoginSuccess).not.toHaveBeenCalled();
    expect(store.getState().currentUser).toBeNull();
  });

  it('disables the button while a request is in flight', async () => {
    let release: () => void = () => {};
    vi.spyOn(authApi, 'sendOtp').mockReturnValue(new Promise(resolve => (release = () => resolve({ demoCode: '123456' }))));
    setup('coconut');
    submit();
    await waitFor(() => expect((document.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true));
    release();
    await waitFor(() => expect(document.querySelector('input[maxlength="6"]')).toBeTruthy());
  });

  describe.each(['en', 'si', 'ta'] as const)('every sign-in error is shown in %s', lang => {
    const codes: AuthErrorCode[] = ['invalid-phone', 'invalid-code', 'code-expired', 'too-many-requests', 'staff-account', 'network', 'unknown'];

    it.each(codes)('%s on sending the code', async code => {
      vi.spyOn(authApi, 'sendOtp').mockRejectedValue(new AuthError(code));
      const onLoginSuccess = vi.fn();
      render(
        <CategoryProvider categoryId="coconut">
          <UnifiedLogin currentLang={lang} onLoginSuccess={onLoginSuccess} />
        </CategoryProvider>
      );
      submit();
      const shown = (await screen.findByRole('alert')).textContent;
      const unknown = translations[lang].auth_err_unknown;
      // Each code has its own message; only "unknown" reads as the generic one
      if (code === 'unknown') expect(shown).toBe(unknown);
      else expect(shown).not.toBe(unknown);
      // ...and it is in the person's language, not English
      if (lang !== 'en') expect(translations.en.auth_err_unknown).not.toBe(unknown);
      expect(onLoginSuccess).not.toHaveBeenCalled();
    });
  });

  it('shows a generic message for an error that is not an AuthError', async () => {
    vi.spyOn(authApi, 'sendOtp').mockRejectedValue(new Error('boom'));
    setup('coconut');
    submit();
    expect((await screen.findByRole('alert')).textContent).toBe(translations.en.auth_err_unknown);
  });
});
