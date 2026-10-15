// Launch fixtures for the xAPI layer's tests and the launch e2e spec: an invented learner and
// record store in the shape SparkLMS launches with (an account Agent, "tincan <token>
// <registration>" auth), and the answers a record store gives.
import { parseLaunch, type Launch } from './launch.ts';

export const ACTOR_JSON = '{"objectType":"Agent","name":"A Learner","account":{"homePage":"https://lms.example.com","name":"learner-1"}}';
export const REGISTRATION = '7d1f2c3a-1b2c-4d5e-8f90-123456789abc';
export const LAUNCH_ACTIVITY_ID = 'http://evolve/abc';

/** A launch query string; an override of null leaves that parameter out. */
export function sparkSearch(overrides: Record<string, string | null> = {}): string {
  const params: Record<string, string | null> = {
    endpoint: 'https://lrs.example.com/xapi/',
    auth: 'tincan t r',
    actor: ACTOR_JSON,
    registration: REGISTRATION,
    activity_id: LAUNCH_ACTIVITY_ID,
    'keydown-message': 'keydown',
    'close-message': 'close',
    ...overrides,
  };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== null) search.set(key, value);
  return `?${search}`;
}

/** The launch `sparkSearch` gives. */
export function sparkLaunch(overrides: Record<string, string | null> = {}): Launch {
  const launch = parseLaunch(sparkSearch(overrides));
  if (!launch) throw new Error('the fixture is not a launch');
  return launch;
}

/** A record store's answer with a JSON body. */
export function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

/** An HTML page where State was asked for: what the dev server answers an unknown path with. */
export function htmlResponse(): Response {
  return new Response('<!doctype html><html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
}
