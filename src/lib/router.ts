import { useMemo, useSyncExternalStore } from 'react';
import type { CategoryId } from '../types/category';
import { DEFAULT_CATEGORY, isCategoryId } from '../config/categories';

/**
 * Hash router. URLs:
 *   #/                          home (category picker)
 *   #/:category                 category landing (role cards)
 *   #/:category/login           sign in / register in that category
 *   #/:category/dashboard       role dashboard
 *   #/:category/map|profile|workspace
 *   #/admin                     staff sign-in / admin portal
 * The category is part of the URL so deep links, refresh and the back button all work.
 */

export type CategoryPage = 'category' | 'login' | 'dashboard' | 'map' | 'profile' | 'workspace';

export type Route =
  | { page: 'home' }
  | { page: 'admin' }
  | { page: CategoryPage; category: CategoryId };

const CATEGORY_PAGES: Record<string, CategoryPage> = {
  login: 'login',
  dashboard: 'dashboard',
  map: 'map',
  profile: 'profile',
  workspace: 'workspace',
};

export const HOME: Route = { page: 'home' };

/**
 * @param fallbackCategory used for the pre-category `#/login` link, which has no category in it.
 */
export const parseHash = (hash: string, fallbackCategory: CategoryId = DEFAULT_CATEGORY): Route => {
  const segments = hash
    .replace(/^#\/?/, '')
    .split(/[/?]/)
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const [first, second] = segments;
  if (!first) return HOME;
  if (first === 'admin' || first === 'admin_login') return { page: 'admin' };
  if (first === 'login') return { page: 'login', category: fallbackCategory };
  if (!isCategoryId(first)) return HOME;
  if (!second) return { page: 'category', category: first };
  const page = CATEGORY_PAGES[second];
  return page ? { page, category: first } : { page: 'category', category: first };
};

export const buildHash = (route: Route): string => {
  if (route.page === 'home') return '#/';
  if (route.page === 'admin') return '#/admin';
  return route.page === 'category' ? `#/${route.category}` : `#/${route.category}/${route.page}`;
};

/** The category a route belongs to, or null for home and admin. */
export const routeCategory = (route: Route): CategoryId | null => ('category' in route ? route.category : null);

export const navigate = (route: Route, options: { replace?: boolean } = {}): void => {
  const hash = buildHash(route);
  if (options.replace) {
    window.history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
};

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

/** The current route; re-renders on hash changes (including back/forward). */
export const useRoute = (): Route => {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  return useMemo(() => parseHash(hash, lastCategory() ?? DEFAULT_CATEGORY), [hash]);
};

// ---------------------------------------------------------------- remembered category

const LAST_CATEGORY_KEY = 'coconnect_last_category';

export const rememberCategory = (category: CategoryId): void => {
  try {
    localStorage.setItem(LAST_CATEGORY_KEY, category);
  } catch {
    // storage unavailable (private mode): the URL still carries the category
  }
};

export const lastCategory = (): CategoryId | null => {
  try {
    const stored = localStorage.getItem(LAST_CATEGORY_KEY);
    return isCategoryId(stored) ? stored : null;
  } catch {
    return null;
  }
};
