import { describe, expect, it } from 'vitest';
import { isValidCategoryRole } from '../roles.js';

describe('isValidCategoryRole', () => {
  it('accepts a role that belongs to its category', () => {
    expect(isValidCategoryRole('coconut', 'owner')).toBe(true);
    expect(isValidCategoryRole('coconut', 'broker')).toBe(true);
    expect(isValidCategoryRole('construction', 'contractor')).toBe(true);
    expect(isValidCategoryRole('construction', 'subcontractor')).toBe(true);
  });

  it('rejects a role from the wrong category', () => {
    expect(isValidCategoryRole('coconut', 'contractor')).toBe(false);
    expect(isValidCategoryRole('construction', 'broker')).toBe(false);
  });

  it('rejects admin for every category', () => {
    expect(isValidCategoryRole('coconut', 'admin')).toBe(false);
    expect(isValidCategoryRole('construction', 'admin')).toBe(false);
  });

  it('rejects an unknown category', () => {
    expect(isValidCategoryRole('fishing', 'owner')).toBe(false);
  });
});
