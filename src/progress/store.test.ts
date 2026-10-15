import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { course } from '../content/index.ts';
import { sparkLaunch } from '../xapi/fixtures.ts';
import { localStateKey, readLocalState } from '../xapi/state.ts';
import { createLrsTracker, createMemoryTracker } from '../xapi/tracker.ts';
import { EMPTY_PROGRESS, moduleRecord, moduleStatus, type ProgressCause, type ProgressDoc } from './progress.ts';
import { createProgressStore, type ProgressUpdate } from './store.ts';

const launch = sparkLaunch();
const [m00, m01] = course.modules;
const visit = (screen: number, module = m00): ProgressCause => ({ type: 'visit', module, screen });
const takeaway = (module = m00): ProgressCause => ({
  type: 'event',
  event: { type: 'takeaway-reached' },
  module,
  screen: module.screens[module.screens.length - 1],
});

/** A document with module 00 done, or module 01 reached, to tell the sources apart. */
const DONE_00: ProgressDoc = { version: 1, modules: { '00': { answers: {}, reached: 7, completed: true } } };
const AT_01: ProgressDoc = { version: 1, modules: { '01': { answers: {}, reached: 2, completed: false } } };

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

/** The record store answers a State GET with `state` (a Response, or a promise of one) and anything else with 204. */
function recordStore(state: () => Response | Promise<Response>) {
  fetchMock.mockImplementation(async (_url, init) => (init?.method === undefined || init.method === 'GET' ? state() : new Response(null, { status: 204 })));
}
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
const html = () => new Response('<!doctype html><html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
const puts = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT').map(([, init]) => JSON.parse(String(init?.body)));

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the progress store in preview', () => {
  it('starts empty, and writes every change to localStorage under "preview"', () => {
    const store = createProgressStore(course, createMemoryTracker(course));
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS);
    store.take(visit(2));
    expect(readLocalState(localStateKey(course, null))).toEqual(store.getSnapshot());
    expect(moduleRecord(store.getSnapshot(), '00').reached).toBe(2);
  });

  it('resumes from localStorage at once, as a reload does', () => {
    createProgressStore(course, createMemoryTracker(course)).take(takeaway());
    const reloaded = createProgressStore(course, createMemoryTracker(course));
    expect(moduleStatus(reloaded.getSnapshot(), '00')).toBe('done');
  });

  it('ignores a corrupt or foreign localStorage copy', () => {
    localStorage.setItem(localStateKey(course, null), JSON.stringify({ modules: ['00'] }));
    expect(createProgressStore(course, createMemoryTracker(course)).getSnapshot()).toBe(EMPTY_PROGRESS);
    localStorage.setItem(localStateKey(course, null), '{not json');
    expect(createProgressStore(course, createMemoryTracker(course)).getSnapshot()).toBe(EMPTY_PROGRESS);
  });

  it('writes nothing when a cause changes nothing', () => {
    const tracker = createMemoryTracker(course);
    const store = createProgressStore(course, tracker);
    store.take(visit(3));
    const setState = vi.spyOn(tracker, 'setState');
    store.take(visit(1));
    expect(setState).not.toHaveBeenCalled();
  });

  it('tells React of each change, and the statements of every cause with what it changed', () => {
    const store = createProgressStore(course, createMemoryTracker(course));
    const view = vi.fn();
    const updates: ProgressUpdate[] = [];
    store.subscribe(view);
    const stop = store.onChange((update) => updates.push(update));

    store.take(visit(7));
    store.take(takeaway());
    store.take(takeaway());
    expect(view).toHaveBeenCalledTimes(2);
    expect(updates.map((u) => u.effects)).toEqual([[], [{ type: 'module-completed', module: m00 }], []]);
    expect(updates[1].before).toBe(updates[0].after);
    expect(updates[2].after).toBe(updates[2].before);
    expect(updates[1].cause).toEqual(takeaway());

    stop();
    store.take(visit(1, m01));
    expect(updates).toHaveLength(3);
  });
});

describe('the progress store with a launch', () => {
  it('lets State win over the local copy when it has a progress document', async () => {
    localStorage.setItem(localStateKey(course, launch), JSON.stringify(AT_01));
    recordStore(() => json(DONE_00));
    const store = createProgressStore(course, createLrsTracker(course, launch));
    expect(store.getSnapshot()).toEqual(AT_01);
    await store.loaded;
    expect(store.getSnapshot()).toEqual(DONE_00);
    expect(puts()).toEqual([]);
  });

  it.each([
    ['answers with HTML, as the dev server does', html],
    ['answers 404', () => new Response('', { status: 404 })],
    ['answers with a document that is not progress', () => json({ modules: ['00'] })],
    ['fails to connect', () => Promise.reject(new TypeError('Failed to fetch'))],
  ])("keeps the registration's local copy when State %s", async (_, state) => {
    localStorage.setItem(localStateKey(course, launch), JSON.stringify(AT_01));
    recordStore(state);
    const store = createProgressStore(course, createLrsTracker(course, launch));
    await store.loaded;
    expect(store.getSnapshot()).toEqual(AT_01);
  });

  it('starts empty with neither, and never loads preview\'s progress', async () => {
    localStorage.setItem(localStateKey(course, null), JSON.stringify(DONE_00));
    recordStore(html);
    const store = createProgressStore(course, createLrsTracker(course, launch));
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS);
    await store.loaded;
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS);
    expect(moduleStatus(createProgressStore(course, createMemoryTracker(course)).getSnapshot(), '00')).toBe('done');
  });

  it('takes what the learner did while State was read in on top of State, and writes it only once State is read', async () => {
    let answer: (response: Response) => void = () => {};
    recordStore(() => new Promise((resolve) => (answer = resolve)));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    const store = createProgressStore(course, tracker);
    store.take(visit(3, m01));
    expect(moduleStatus(store.getSnapshot(), '01')).toBe('in-progress');
    await tracker.idle();
    expect(puts()).toEqual([]);

    answer(json(DONE_00));
    await store.loaded;
    await tracker.idle();
    const merged = store.getSnapshot();
    expect(moduleStatus(merged, '00')).toBe('done');
    expect(moduleRecord(merged, '01').reached).toBe(3);
    expect(puts()).toEqual([merged]);
    expect(readLocalState(localStateKey(course, launch))).toEqual(merged);
  });

  it('stops waiting for State after the timeout, keeps the local copy, and writes from then on', async () => {
    localStorage.setItem(localStateKey(course, launch), JSON.stringify(AT_01));
    recordStore(() => new Promise<Response>(() => {}));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    const store = createProgressStore(course, tracker, { stateTimeoutMs: 5 });
    await store.loaded;
    expect(store.getSnapshot()).toEqual(AT_01);

    store.take(takeaway());
    await tracker.idle();
    expect(puts()).toEqual([store.getSnapshot()]);
    expect(readLocalState(localStateKey(course, launch))).toEqual(store.getSnapshot());
    expect(readLocalState(localStateKey(course, null))).toBeNull();
  });
});
