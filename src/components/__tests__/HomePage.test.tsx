// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { HomePage } from '../home/HomePage';

afterEach(cleanup);

const setup = (lang: 'en' | 'si' | 'ta' = 'en') => {
  const onSelectCategory = vi.fn();
  const onLanguageChange = vi.fn();
  render(<HomePage currentLang={lang} onSelectCategory={onSelectCategory} onLanguageChange={onLanguageChange} />);
  return { onSelectCategory, onLanguageChange };
};

describe('HomePage category picker', () => {
  it('offers Coconut and Construction', () => {
    setup();
    expect(screen.getByTestId('category-card-coconut')).toBeTruthy();
    expect(screen.getByTestId('category-card-construction')).toBeTruthy();
  });

  it('opens the chosen category', () => {
    const { onSelectCategory } = setup();
    fireEvent.click(screen.getByTestId('category-card-construction'));
    expect(onSelectCategory).toHaveBeenCalledWith('construction');
    fireEvent.click(screen.getByTestId('category-card-coconut'));
    expect(onSelectCategory).toHaveBeenLastCalledWith('coconut');
  });

  it('lists who each category is for', () => {
    setup();
    const construction = within(screen.getByTestId('category-card-construction'));
    for (const role of ['Client', 'Contractor', 'Tradesperson']) {
      expect(construction.getByText(role)).toBeTruthy();
    }
    const coconut = within(screen.getByTestId('category-card-coconut'));
    expect(coconut.getByText('Landowner')).toBeTruthy();
    expect(coconut.getByText('Agent')).toBeTruthy();
  });

  it('uses generic wording, not coconut wording', () => {
    setup();
    expect(screen.getByText('What do you need help with?')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).not.toMatch(/coconut/i);
  });

  it('switches language', () => {
    const { onLanguageChange } = setup();
    fireEvent.click(screen.getByText('සිංහල (SI)'));
    expect(onLanguageChange).toHaveBeenCalledWith('si');
  });

  it.each(['si', 'ta'] as const)('renders in %s', lang => {
    setup(lang);
    expect(screen.queryByText('What do you need help with?')).toBeNull();
    expect(screen.getByTestId('category-card-coconut')).toBeTruthy();
  });
});
