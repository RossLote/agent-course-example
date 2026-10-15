import { describe, expect, it } from 'vitest';
import { formatRoute, navigate, parseRoute, type Route } from './route.ts';

describe('routes', () => {
  const routes: Route[] = [
    { page: 'scenario' },
    { page: 'home' },
    { page: 'module', slug: '00', screen: 1 },
    { page: 'module', slug: '07', screen: 12 },
  ];

  it.each(routes)('formats and parses %o back to itself', (route) => {
    expect(parseRoute(formatRoute(route))).toEqual(route);
  });

  it('formats each route as its hash', () => {
    expect(routes.map(formatRoute)).toEqual(['#/', '#/home', '#/modules/00/1', '#/modules/07/12']);
  });

  it('reads the empty hash, and the hash with or without its # or a trailing slash', () => {
    expect(parseRoute('')).toEqual({ page: 'scenario' });
    expect(parseRoute('#')).toEqual({ page: 'scenario' });
    expect(parseRoute('#/')).toEqual({ page: 'scenario' });
    expect(parseRoute('/home/')).toEqual({ page: 'home' });
    expect(parseRoute('#/modules/04/3/')).toEqual({ page: 'module', slug: '04', screen: 3 });
  });

  it('opens a module at its first screen when the screen is left off', () => {
    expect(parseRoute('#/modules/02')).toEqual({ page: 'module', slug: '02', screen: 1 });
  });

  it('names no route for anything else', () => {
    for (const hash of ['#/elsewhere', '#/modules', '#/modules/4/1', '#/modules/04/0', '#/modules/04/01', '#/modules/04/x', '#/home/1']) {
      expect(parseRoute(hash), hash).toBeNull();
    }
  });

  it('navigates by the hash alone, leaving the launch query string as it was', () => {
    const search = '?endpoint=https%3A%2F%2Flrs.example%2F&auth=tincan%20t%20r&registration=r1';
    window.history.replaceState(null, '', `/${search}`);

    navigate({ page: 'module', slug: '03', screen: 2 });
    expect(window.location.hash).toBe('#/modules/03/2');
    expect(window.location.search).toBe(search);

    navigate({ page: 'home' });
    expect(window.location.hash).toBe('#/home');
    expect(window.location.search).toBe(search);
  });
});
