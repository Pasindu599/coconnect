// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { UnifiedLogin } from '../auth/UnifiedLogin';
import { CategoryProvider } from '../../config/CategoryContext';
import { store } from '../../lib/store';
import type { CategoryId, CategoryRoleId } from '../../types/category';

afterEach(() => {
  cleanup();
  store.logout();
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

  it('signs in with a code and records the category and role', () => {
    const { onLoginSuccess } = setup('construction', 'contractor');
    submit(); // send code
    submit(); // verify (the demo code is prefilled)
    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    const user = store.getState().currentUser!;
    expect(user.id).toBe('user-contractor-1');
    expect(user.active_category).toBe('construction');
    expect(user.active_role).toBe('supervisor');
  });

  it('registers a new number with the chosen role', () => {
    const { onLoginSuccess } = setup('construction', 'subcontractor');
    fireEvent.change(phone(), { target: { value: '+94 70 555 0101' } });
    submit();
    submit();
    expect(onLoginSuccess).toHaveBeenCalled();
    expect(store.getState().currentUser!.memberships).toEqual([{ category: 'construction', role: 'subcontractor' }]);
  });

  it('rejects a bad phone number before sending a code', () => {
    const { onLoginSuccess } = setup('coconut');
    fireEvent.change(phone(), { target: { value: '12' } });
    submit();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  it('rejects a wrong code and stays signed out', () => {
    const { onLoginSuccess } = setup('coconut');
    submit();
    fireEvent.change(document.querySelector('input[maxlength="6"]')!, { target: { value: '000000' } });
    submit();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(onLoginSuccess).not.toHaveBeenCalled();
    expect(store.getState().currentUser).toBeNull();
  });
});
