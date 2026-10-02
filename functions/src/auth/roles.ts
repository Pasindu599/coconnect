// Mirrors CONTRACTS.md C1 (src/types/category.ts) and .claude/docs/categories.md.
// Duplicated here deliberately: Functions never import frontend/S2-owned
// config, so the two lists are kept in sync by hand. See specs/auth.md.
export type CategoryId = 'coconut' | 'construction';
export type CategoryRoleId = 'owner' | 'broker' | 'client' | 'contractor' | 'subcontractor' | 'worker';

const CATEGORY_ROLES: Record<CategoryId, readonly CategoryRoleId[]> = {
  coconut: ['owner', 'broker', 'worker'],
  construction: ['client', 'contractor', 'subcontractor', 'worker'],
};

export function isKnownCategory(category: string): category is CategoryId {
  return category === 'coconut' || category === 'construction';
}

export function isValidCategoryRole(category: string, role: string): boolean {
  if (role === 'admin') return false;
  if (!isKnownCategory(category)) return false;
  return (CATEGORY_ROLES[category] as readonly string[]).includes(role);
}
