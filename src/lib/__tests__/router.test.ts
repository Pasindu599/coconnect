import { describe, expect, it } from 'vitest';
import { buildHash, parseHash, routeCategory, type Route } from '../router';

describe('parseHash', () => {
  it('treats an empty or root hash as home', () => {
    expect(parseHash('')).toEqual({ page: 'home' });
    expect(parseHash('#')).toEqual({ page: 'home' });
    expect(parseHash('#/')).toEqual({ page: 'home' });
  });

  it('parses a category landing and its pages', () => {
    expect(parseHash('#/coconut')).toEqual({ page: 'category', category: 'coconut' });
    expect(parseHash('#/construction/login')).toEqual({ page: 'login', category: 'construction' });
    expect(parseHash('#/construction/dashboard')).toEqual({ page: 'dashboard', category: 'construction' });
    expect(parseHash('#/coconut/map')).toEqual({ page: 'map', category: 'coconut' });
    expect(parseHash('#/coconut/profile')).toEqual({ page: 'profile', category: 'coconut' });
    expect(parseHash('#/coconut/workspace')).toEqual({ page: 'workspace', category: 'coconut' });
  });

  it('is case-insensitive and ignores trailing slashes and queries', () => {
    expect(parseHash('#/Construction/Dashboard/')).toEqual({ page: 'dashboard', category: 'construction' });
    expect(parseHash('#/coconut/login?x=1')).toEqual({ page: 'login', category: 'coconut' });
  });

  it('opens the staff area for #/admin and the old admin_login', () => {
    expect(parseHash('#/admin')).toEqual({ page: 'admin' });
    expect(parseHash('#/admin_login')).toEqual({ page: 'admin' });
  });

  it('sends an unknown category or page somewhere safe', () => {
    expect(parseHash('#/mining')).toEqual({ page: 'home' });
    expect(parseHash('#/mining/dashboard')).toEqual({ page: 'home' });
    expect(parseHash('#/coconut/nonsense')).toEqual({ page: 'category', category: 'coconut' });
  });

  it('maps the pre-category #/login link to the fallback category', () => {
    expect(parseHash('#/login')).toEqual({ page: 'login', category: 'coconut' });
    expect(parseHash('#/login', 'construction')).toEqual({ page: 'login', category: 'construction' });
  });
});

describe('buildHash', () => {
  const routes: Route[] = [
    { page: 'home' },
    { page: 'admin' },
    { page: 'category', category: 'coconut' },
    { page: 'login', category: 'construction' },
    { page: 'dashboard', category: 'construction' },
    { page: 'map', category: 'coconut' },
    { page: 'profile', category: 'coconut' },
    { page: 'workspace', category: 'construction' },
  ];

  it.each(routes)('round-trips %j', route => {
    expect(parseHash(buildHash(route))).toEqual(route);
  });

  it('builds readable hashes', () => {
    expect(buildHash({ page: 'home' })).toBe('#/');
    expect(buildHash({ page: 'category', category: 'coconut' })).toBe('#/coconut');
    expect(buildHash({ page: 'dashboard', category: 'construction' })).toBe('#/construction/dashboard');
  });
});

describe('routeCategory', () => {
  it('is null for home and admin', () => {
    expect(routeCategory({ page: 'home' })).toBeNull();
    expect(routeCategory({ page: 'admin' })).toBeNull();
    expect(routeCategory({ page: 'login', category: 'construction' })).toBe('construction');
  });
});
