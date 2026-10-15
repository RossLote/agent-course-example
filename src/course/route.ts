// The course's routes, carried in the URL's hash so the LMS launch query string (D18, D23)
// survives every navigation: navigating only ever sets `location.hash`, never the search.
import { useMemo, useSyncExternalStore } from 'react';

/**
 * Where the learner is: the scenario (the empty hash), the home page, or a screen of a module.
 * A module's `screen` counts from 1, as "Screen n of m" does, so `#/modules/00/1` is module
 * 00's first screen.
 */
export type Route = { page: 'scenario' } | { page: 'home' } | { page: 'module'; slug: string; screen: number };

/** The route the course opens on, and the one an unknown hash falls back to. */
export const SCENARIO: Route = { page: 'scenario' };

/**
 * The route a hash names, or null when it names none. Takes the hash with or without its
 * `#`; `''`, `#` and `#/` are the scenario, `#/home` the home page, `#/modules/<nn>` and
 * `#/modules/<nn>/<n>` a module's screen (the first when the screen is left off).
 */
export function parseRoute(hash: string): Route | null {
  const path = hash.replace(/^#/, '').replace(/^\/+|\/+$/g, '');
  if (path === '') return { page: 'scenario' };
  if (path === 'home') return { page: 'home' };
  const module = /^modules\/(\d\d)(?:\/([1-9]\d*))?$/.exec(path);
  if (module) return { page: 'module', slug: module[1], screen: module[2] ? Number(module[2]) : 1 };
  return null;
}

/** The hash for a route, `#` included: what a link's href and `navigate` use. */
export function formatRoute(route: Route): string {
  switch (route.page) {
    case 'scenario':
      return '#/';
    case 'home':
      return '#/home';
    case 'module':
      return `#/modules/${route.slug}/${route.screen}`;
  }
}

/** Goes to a route by setting the hash alone, so the launch query string stays as it was. */
export function navigate(route: Route): void {
  window.location.hash = formatRoute(route);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** The current route, kept in step with the hash; an unknown hash is the scenario. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return useMemo(() => parseRoute(hash) ?? SCENARIO, [hash]);
}
