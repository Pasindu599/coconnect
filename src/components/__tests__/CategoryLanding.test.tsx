// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { CategoryLanding } from '../home/CategoryLanding';
import { CategoryProvider } from '../../config/CategoryContext';
import { store } from '../../lib/store';
import type { CategoryId } from '../../types/category';

afterEach(cleanup);

const setup = (category: CategoryId) => {
  const handlers = { onOpenLogin: vi.fn(), onExploreMap: vi.fn(), onLanguageChange: vi.fn(), onBack: vi.fn() };
  render(
    <CategoryProvider categoryId={category}>
      <CategoryLanding state={store.getState()} currentLang="en" {...handlers} />
    </CategoryProvider>
  );
  return handlers;
};

describe('CategoryLanding', () => {
  it('shows the four construction roles from the registry', () => {
    setup('construction');
    const cards = within(screen.getByTestId('role-cards')).getAllByTestId(/^role-card-/);
    expect(cards.map(c => c.dataset.testid)).toEqual([
      'role-card-client',
      'role-card-contractor',
      'role-card-subcontractor',
      'role-card-worker',
    ]);
  });

  it('shows the three coconut roles', () => {
    setup('coconut');
    expect(screen.getAllByTestId(/^role-card-/)).toHaveLength(3);
    expect(screen.getByTestId('role-card-broker')).toBeTruthy();
  });

  it('passes the chosen role to sign-in', () => {
    const { onOpenLogin } = setup('construction');
    fireEvent.click(within(screen.getByTestId('role-card-subcontractor')).getByRole('button'));
    expect(onOpenLogin).toHaveBeenCalledWith('subcontractor');
  });

  it('starts the main call to action as the first poster role', () => {
    const { onOpenLogin } = setup('construction');
    fireEvent.click(screen.getByText('Enter Role Portal / Log In'));
    expect(onOpenLogin).toHaveBeenCalledWith('client');
  });

  it('uses construction wording and keeps coconut wording out', () => {
    setup('construction');
    const text = document.body.textContent ?? '';
    expect(text).toContain('Construction');
    expect(text).toContain('Tailored Portals for Every Construction Participant');
    expect(text).not.toMatch(/coconut/i);
  });

  it('counts only this category in the stats', () => {
    setup('construction');
    // two seeded construction sites; the coconut estates are not counted
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('goes back to the category picker', () => {
    const { onBack } = setup('coconut');
    fireEvent.click(screen.getByText('All categories'));
    expect(onBack).toHaveBeenCalled();
  });
});
