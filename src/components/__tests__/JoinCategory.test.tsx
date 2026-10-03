// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { JoinCategory } from '../auth/JoinCategory';
import { CategoryProvider } from '../../config/CategoryContext';
import { store } from '../../lib/store';
import { snapshotStore } from '../../test/storeSnapshot';

let restore: () => void;
beforeEach(() => {
  restore = snapshotStore();
});
afterEach(() => {
  cleanup();
  store.logout();
  restore();
});

describe('JoinCategory', () => {
  it('lets a signed-in user add a role in another category', () => {
    store.verifyOtp('+94771234567', '123456', 'owner'); // the seeded coconut owner
    render(
      <CategoryProvider categoryId="construction">
        <JoinCategory currentLang="en" />
      </CategoryProvider>
    );
    expect(screen.getByRole('heading').textContent).toBe('Join Construction');

    fireEvent.click(screen.getByTestId('join-role-contractor'));
    const user = store.getState().currentUser!;
    expect(user.memberships).toEqual(
      expect.arrayContaining([
        { category: 'coconut', role: 'owner' },
        { category: 'construction', role: 'contractor' },
      ])
    );
    expect(user.active_category).toBe('construction');
  });

  it('offers every role the category defines, and none from another category', () => {
    store.verifyOtp('+94771234567', '123456', 'owner');
    render(
      <CategoryProvider categoryId="coconut">
        <JoinCategory currentLang="en" />
      </CategoryProvider>
    );
    expect(screen.getByTestId('join-role-owner')).toBeTruthy();
    expect(screen.getByTestId('join-role-broker')).toBeTruthy();
    expect(screen.queryByTestId('join-role-contractor')).toBeNull();
  });
});
