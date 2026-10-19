import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { course } from '../content/index.ts';
import { ACTOR_JSON, htmlResponse, jsonResponse, LAUNCH_ACTIVITY_ID, REGISTRATION, sparkLaunch } from './fixtures.ts';
import { localStateKey } from './state.ts';
import { initialized, moduleCompleted } from './statements.ts';
import { createLrsTracker, createMemoryTracker, createTracker, flushWhenHidden } from './tracker.ts';

const COURSE_ID = 'https://rosslote.github.io/agent-course/';
const launch = sparkLaunch();
/** The modules a module statement names: only a slug and a title, not the course's modules. */
const m00 = { slug: '00', title: 'Module 00' };
const m01 = { slug: '01', title: 'Module 01' };

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

const ok = (body: unknown = ['an-id']) => jsonResponse(body);

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

    tracker.send(moduleCompleted(course, launch, m00));
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
    const second = moduleCompleted(course, launch, m00);

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
    const second = moduleCompleted(course, launch, m00);

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

    await expect(tracker.getState()).resolves.toEqual({ status: 'found', doc: { modules: ['00'] } });

    const url = new URL(requests()[0].url);
    expect(url.origin + url.pathname).toBe('https://lrs.example.com/xapi/activities/state');
    expect(url.searchParams.get('activityId')).toBe(LAUNCH_ACTIVITY_ID);
    expect(url.searchParams.get('agent')).toBe(ACTOR_JSON);
    expect(url.searchParams.get('registration')).toBe(REGISTRATION);
    expect(url.searchParams.get('stateId')).toBe('progress');
    expect(requests()[0].headers.Authorization).toBe('tincan t r');
    // Never answered from the HTTP cache, so a newer State written from another device is read.
    expect(fetchMock.mock.calls[0][1]?.cache).toBe('no-store');
  });

  it("keys State by course.yaml's id when the launch has no activity_id", async () => {
    fetchMock.mockImplementation(async () => ok({}));
    await createLrsTracker(course, sparkLaunch({ activity_id: null })).getState();
    expect(new URL(requests()[0].url).searchParams.get('activityId')).toBe(COURSE_ID);
  });

  it.each([
    ['answered with HTML (the dev server answers unknown paths with index.html)', htmlResponse],
    ['answered with a JSON string', () => ok('progress')],
    ['answered with a JSON array', () => ok([1, 2])],
    ['answered 404', () => failure(404)],
  ])('counts a State read %s as no State', async (_, response) => {
    fetchMock.mockImplementation(async () => response());
    await expect(createLrsTracker(course, launch).getState()).resolves.toEqual({ status: 'none' });
  });

  it.each([
    ['fails to connect (or is refused by CORS)', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['is answered 401', async () => failure(401)],
    ['is answered 403', async () => failure(403)],
    ['is answered 500', async () => failure(500)],
    ['is answered 503', async () => failure(503)],
  ])('counts a State read that %s as unknown, not as no State', async (_, response) => {
    fetchMock.mockImplementation(response);
    await expect(createLrsTracker(course, launch).getState()).resolves.toEqual({ status: 'unknown' });
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

  it('writes the localStorage copy alone with setLocalState', async () => {
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    tracker.setLocalState({ modules: ['01'] });
    await tracker.idle();
    expect(tracker.getLocalState()).toEqual({ modules: ['01'] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keys the localStorage copy of a launch without a registration by the learner, so two learners never share one', () => {
    const noRegistration = (actor: object) => localStateKey(course, sparkLaunch({ registration: null, actor: JSON.stringify(actor) }));
    const account = (name: string) => ({ objectType: 'Agent', account: { homePage: 'https://lms.example.com', name } });
    expect(noRegistration(account('learner-1'))).toBe(`agent-course:${COURSE_ID}:launch:account:https://lms.example.com:learner-1`);
    expect(noRegistration(account('learner-2'))).not.toBe(noRegistration(account('learner-1')));
    expect(noRegistration({ mbox: 'mailto:a@example.com' })).toBe(`agent-course:${COURSE_ID}:launch:mailto:a@example.com`);
    expect(noRegistration({ mbox_sha1sum: 'abc123' })).toBe(`agent-course:${COURSE_ID}:launch:mbox_sha1sum:abc123`);
    expect(noRegistration({ openid: 'https://id.example.com/a' })).toBe(`agent-course:${COURSE_ID}:launch:openid:https://id.example.com/a`);
    expect(noRegistration({ name: 'No identifier' })).toBe(`agent-course:${COURSE_ID}:launch:{"name":"No identifier"}`);
    expect(localStateKey(course, launch)).toBe(`agent-course:${COURSE_ID}:${REGISTRATION}`);
    expect(localStateKey(course, null)).toBe(`agent-course:${COURSE_ID}:preview`);
  });

  it('sends a burst of State changes as one write of the latest, after the statements before it', async () => {
    fetchMock.mockImplementation(async (_url, init) => (init?.method === 'PUT' ? new Response(null, { status: 204 }) : ok()));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });

    tracker.send(initialized(course, launch));
    tracker.setState({ step: 1 });
    tracker.setState({ step: 2 });
    tracker.setState({ step: 3 });
    expect(tracker.getLocalState()).toEqual({ step: 3 });
    await tracker.idle();

    expect(requests().map((r) => [r.method, r.body.step])).toEqual([
      ['POST', undefined],
      ['PUT', 3],
    ]);
  });
});

describe('the record store tracker as the page is hidden or closed', () => {
  /** The fetch calls made with keepalive, as method, url and parsed body. */
  const kept = () =>
    fetchMock.mock.calls.filter(([, init]) => init?.keepalive).map(([url, init]) => ({ method: init?.method, url: String(url), body: JSON.parse(String(init?.body)), headers: init?.headers }));

  it('sends what is still queued with keepalive: the statements as one POST, the latest State as its PUT, and never again', async () => {
    let release: (response: Response) => void = () => {};
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => (release = resolve))).mockImplementation(async () => ok());
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    const first = initialized(course, launch);
    const second = moduleCompleted(course, launch, m00);
    const third = moduleCompleted(course, launch, m01);
    tracker.send(first);
    tracker.send(second);
    tracker.setState({ step: 1 });
    tracker.send(third);
    tracker.setState({ step: 2 });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    tracker.flush();
    // The first statement is in flight, so it stays with the queue.
    expect(kept()).toEqual([
      { method: 'POST', url: 'https://lrs.example.com/xapi/statements', body: [second, third], headers: expect.objectContaining({ 'X-Experience-API-Version': '1.0.2', Authorization: 'tincan t r', 'Content-Type': 'application/json' }) },
      { method: 'PUT', url: expect.stringContaining('https://lrs.example.com/xapi/activities/state?'), body: { step: 2 }, headers: expect.objectContaining({ 'X-Experience-API-Version': '1.0.2', Authorization: 'tincan t r' }) },
    ]);
    const put = new URL(kept()[1].url);
    expect(put.searchParams.get('registration')).toBe(REGISTRATION);
    expect(put.searchParams.get('stateId')).toBe('progress');

    release(ok());
    await tracker.idle();
    expect(requests().map((r) => r.body)).toEqual([first, [second, third], { step: 2 }]);
  });

  it('flushes a send waiting for its retry, and ignores a flush that fails', async () => {
    fetchMock.mockResolvedValueOnce(failure()).mockRejectedValue(new TypeError('Failed to fetch'));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 60_000 });
    const statement = initialized(course, launch);
    tracker.send(statement);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    // The failure is taken in, and the send waits a minute for its retry.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(() => tracker.flush()).not.toThrow();
    expect(kept().map((r) => r.body)).toEqual([[statement]]);
    tracker.flush();
    expect(kept()).toHaveLength(1);
  });

  it('flushes on pagehide and when the page turns hidden, not when it turns visible', () => {
    const tracker = createMemoryTracker(course);
    const flush = vi.spyOn(tracker, 'flush');
    const stop = flushWhenHidden(tracker);
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    try {
      window.dispatchEvent(new Event('pagehide'));
      expect(flush).toHaveBeenCalledTimes(1);
      visibility.mockReturnValue('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      expect(flush).toHaveBeenCalledTimes(1);
      visibility.mockReturnValue('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      expect(flush).toHaveBeenCalledTimes(2);
    } finally {
      stop();
    }
    window.dispatchEvent(new Event('pagehide'));
    expect(flush).toHaveBeenCalledTimes(2);
  });
});

describe('the in-memory tracker (preview)', () => {
  it('is what createTracker gives without a launch, and keeps every statement in order for the drawer', () => {
    const tracker = createTracker(course, null);
    expect(tracker.launch).toBeNull();
    const listener = vi.fn();
    tracker.log?.subscribe(listener);
    const first = initialized(course, null);
    const second = moduleCompleted(course, null, m00);

    tracker.send(first);
    tracker.send(second);

    expect(tracker.log?.list()).toEqual([first, second]);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends nothing on a flush', () => {
    const tracker = createMemoryTracker(course);
    tracker.send(initialized(course, null));
    tracker.flush();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(tracker.log?.list()).toHaveLength(1);
  });

  it('has no log with a launch', () => {
    expect(createTracker(course, launch).log).toBeNull();
  });

  it('round-trips State through memory and through localStorage under "preview"', async () => {
    const tracker = createMemoryTracker(course);
    await expect(tracker.getState()).resolves.toEqual({ status: 'none' });
    expect(tracker.getLocalState()).toBeNull();

    tracker.setState({ modules: ['00'], answers: { '00': { 'check-1': { answer: 1 } } } });

    await expect(tracker.getState()).resolves.toEqual({ status: 'found', doc: { modules: ['00'], answers: { '00': { 'check-1': { answer: 1 } } } } });
    expect(tracker.getLocalState()).toEqual({ modules: ['00'], answers: { '00': { 'check-1': { answer: 1 } } } });
    expect(localStorage.getItem(`agent-course:${COURSE_ID}:preview`)).not.toBeNull();
    // A later page load: memory is empty again, localStorage still holds the copy.
    const reloaded = createMemoryTracker(course);
    await expect(reloaded.getState()).resolves.toEqual({ status: 'none' });
    expect(reloaded.getLocalState()).toEqual({ modules: ['00'], answers: { '00': { 'check-1': { answer: 1 } } } });
  });

  it('counts a localStorage copy that is not a JSON object as none', () => {
    localStorage.setItem(localStateKey(course, null), '<html>');
    expect(createMemoryTracker(course).getLocalState()).toBeNull();
  });
});
