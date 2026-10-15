import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { course } from '../content/index.ts';
import { ACTOR_JSON, LAUNCH_ACTIVITY_ID, REGISTRATION, sparkLaunch } from './fixtures.ts';
import { localStateKey } from './state.ts';
import { initialized, moduleCompleted } from './statements.ts';
import { createLrsTracker, createMemoryTracker, createTracker } from './tracker.ts';

const COURSE_ID = 'https://rosslote.github.io/agent-course/';
const launch = sparkLaunch();

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
let warn: ReturnType<typeof vi.fn<typeof console.warn>>;

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);
  warn = vi.fn<typeof console.warn>();
  vi.spyOn(console, 'warn').mockImplementation(warn);
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function ok(body: unknown = ['an-id']) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function failure(status = 500) {
  return new Response('the record store failed', { status });
}

/** The fetch calls so far as url, method, headers and parsed body. */
function requests() {
  return fetchMock.mock.calls.map(([url, init]) => ({
    url: String(url),
    method: init?.method,
    headers: (init?.headers ?? {}) as Record<string, string>,
    body: typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body,
  }));
}

describe('the record store tracker', () => {
  it('sends a statement to the statements URL with version 1.0.2, the auth and the actor exactly as given', async () => {
    fetchMock.mockImplementation(async () => ok());
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    const statement = initialized(course, launch);

    tracker.send(statement);
    await tracker.idle();

    const [request] = requests();
    expect(requests()).toHaveLength(1);
    expect(request.url).toBe('https://lrs.example.com/xapi/statements');
    expect(request.method).toBe('POST');
    expect(request.headers['X-Experience-API-Version']).toBe('1.0.2');
    expect(request.headers.Authorization).toBe('tincan t r');
    expect(JSON.stringify(request.body.actor)).toBe(ACTOR_JSON);
    expect(request.body.context.registration).toBe(REGISTRATION);
    expect(request.body.object.id).toBe(LAUNCH_ACTIVITY_ID);
    expect(request.body.context.contextActivities.grouping).toEqual([{ objectType: 'Activity', id: COURSE_ID }]);
    expect(request.body).toEqual(statement);
  });

  it("sends a module statement with course.yaml's id as parent and the launch's activity_id as grouping", async () => {
    fetchMock.mockImplementation(async () => ok());
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });

    tracker.send(moduleCompleted(course, launch, course.modules[0]));
    await tracker.idle();

    const [{ body }] = requests();
    expect(body.object.id).toBe(`${COURSE_ID}modules/00`);
    expect(body.context.registration).toBe(REGISTRATION);
    expect(body.context.contextActivities).toEqual({
      parent: [{ objectType: 'Activity', id: COURSE_ID }],
      grouping: [{ objectType: 'Activity', id: LAUNCH_ACTIVITY_ID }],
    });
  });

  it('retries a failed send once and goes on in order, without a warning when the retry works', async () => {
    fetchMock.mockResolvedValueOnce(failure()).mockImplementation(async () => ok());
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    const first = initialized(course, launch);
    const second = moduleCompleted(course, launch, course.modules[0]);

    tracker.send(first);
    tracker.send(second);
    await tracker.idle();

    expect(requests().map((r) => r.body.id)).toEqual([first.id, first.id, second.id]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('logs and drops a send that fails twice, and the caller never sees an error', async () => {
    fetchMock.mockResolvedValueOnce(failure()).mockRejectedValueOnce(new TypeError('Failed to fetch')).mockImplementation(async () => ok());
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    const first = initialized(course, launch);
    const second = moduleCompleted(course, launch, course.modules[0]);

    expect(() => tracker.send(first)).not.toThrow();
    tracker.send(second);
    await expect(tracker.idle()).resolves.toBeUndefined();

    expect(requests().map((r) => r.body.id)).toEqual([first.id, first.id, second.id]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('initialized statement failed twice');
  });

  it('send returns before the request is made, so the learner never waits on it', () => {
    fetchMock.mockReturnValue(new Promise<Response>(() => {}));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    tracker.send(initialized(course, launch));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reads State under the launch activity_id, the agent and the registration', async () => {
    fetchMock.mockImplementation(async () => ok({ modules: ['00'] }));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });

    await expect(tracker.getState()).resolves.toEqual({ modules: ['00'] });

    const url = new URL(requests()[0].url);
    expect(url.origin + url.pathname).toBe('https://lrs.example.com/xapi/activities/state');
    expect(url.searchParams.get('activityId')).toBe(LAUNCH_ACTIVITY_ID);
    expect(url.searchParams.get('agent')).toBe(ACTOR_JSON);
    expect(url.searchParams.get('registration')).toBe(REGISTRATION);
    expect(url.searchParams.get('stateId')).toBe('progress');
    expect(requests()[0].headers.Authorization).toBe('tincan t r');
  });

  it("keys State by course.yaml's id when the launch has no activity_id", async () => {
    fetchMock.mockImplementation(async () => ok({}));
    await createLrsTracker(course, sparkLaunch({ activity_id: null })).getState();
    expect(new URL(requests()[0].url).searchParams.get('activityId')).toBe(COURSE_ID);
  });

  it.each([
    ['answered with HTML (the dev server answers unknown paths with index.html)', () => new Response('<!doctype html><html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } })],
    ['answered with a JSON string', () => ok('progress')],
    ['answered with a JSON array', () => ok([1, 2])],
    ['answered 404', () => failure(404)],
  ])('counts a State read %s as no State', async (_, response) => {
    fetchMock.mockImplementation(async () => response());
    await expect(createLrsTracker(course, launch).getState()).resolves.toBeNull();
  });

  it('counts a State read that fails to connect as no State', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(createLrsTracker(course, launch).getState()).resolves.toBeNull();
  });

  it("writes State with a PUT and keeps a copy in localStorage under the registration, never preview's", async () => {
    fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
    localStorage.setItem(localStateKey(course, null), JSON.stringify({ from: 'preview' }));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    expect(tracker.getLocalState()).toBeNull();

    tracker.setState({ modules: ['00'] });
    expect(tracker.getLocalState()).toEqual({ modules: ['00'] });
    await tracker.idle();

    const [request] = requests();
    expect(request.method).toBe('PUT');
    expect(new URL(request.url).searchParams.get('registration')).toBe(REGISTRATION);
    expect(request.body).toEqual({ modules: ['00'] });
    expect(localStorage.getItem(`agent-course:${COURSE_ID}:${REGISTRATION}`)).toBe('{"modules":["00"]}');
  });
});

describe('the in-memory tracker (preview)', () => {
  it('is what createTracker gives without a launch, and keeps every statement in order for the drawer', () => {
    const tracker = createTracker(course, null);
    expect(tracker.launch).toBeNull();
    const listener = vi.fn();
    tracker.log?.subscribe(listener);
    const first = initialized(course, null);
    const second = moduleCompleted(course, null, course.modules[0]);

    tracker.send(first);
    tracker.send(second);

    expect(tracker.log?.list()).toEqual([first, second]);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('has no log with a launch', () => {
    expect(createTracker(course, launch).log).toBeNull();
  });

  it('round-trips State through memory and through localStorage under "preview"', async () => {
    const tracker = createMemoryTracker(course);
    await expect(tracker.getState()).resolves.toBeNull();
    expect(tracker.getLocalState()).toBeNull();

    tracker.setState({ modules: ['00'], answers: { '00': { 'check-1': { answer: 1 } } } });

    await expect(tracker.getState()).resolves.toEqual({ modules: ['00'], answers: { '00': { 'check-1': { answer: 1 } } } });
    expect(tracker.getLocalState()).toEqual({ modules: ['00'], answers: { '00': { 'check-1': { answer: 1 } } } });
    expect(localStorage.getItem(`agent-course:${COURSE_ID}:preview`)).not.toBeNull();
    // A later page load: memory is empty again, localStorage still holds the copy.
    const reloaded = createMemoryTracker(course);
    await expect(reloaded.getState()).resolves.toBeNull();
    expect(reloaded.getLocalState()).toEqual({ modules: ['00'], answers: { '00': { 'check-1': { answer: 1 } } } });
  });

  it('counts a localStorage copy that is not a JSON object as none', () => {
    localStorage.setItem(localStateKey(course, null), '<html>');
    expect(createMemoryTracker(course).getLocalState()).toBeNull();
  });
});
