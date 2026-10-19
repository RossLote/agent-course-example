import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureCheck, fixtureCourse, fixtureScene, fixtureTakeaway } from '../course/frame/fixture.ts';
import { scoredItem } from '../course/frame/progress.ts';
import { htmlResponse as html, jsonResponse as json, sparkLaunch } from '../xapi/fixtures.ts';
import { localStateKey, readLocalState } from '../xapi/state.ts';
import { createLrsTracker, createMemoryTracker } from '../xapi/tracker.ts';
import { EMPTY_PROGRESS, moduleRecord, moduleStatus, parseProgress, takeCause, type ProgressCause, type ProgressDoc, type ProgressEffect } from './progress.ts';
import { createProgressStore, STATE_TIMEOUT_MS, type ProgressUpdate } from './store.ts';

const launch = sparkLaunch();
const check = fixtureCheck;
const scene = fixtureScene;
/** An inline course whose module 00 has seven screens, two of them checks (two points in all), and module 01 five. */
const course = fixtureCourse({
  '00': [scene('One'), scene('Two'), scene('Three'), scene('Four'), check('check-1'), check('check-2'), fixtureTakeaway()],
  '01': [scene('One'), scene('Two'), scene('Three'), scene('Four'), fixtureTakeaway()],
});
const [m00, m01] = course.modules;
const last = course.modules[course.modules.length - 1];
const visit = (screen: number, module = m00): ProgressCause => ({ type: 'visit', module, screen });
const takeaway = (module = m00): ProgressCause => ({
  type: 'event',
  event: { type: 'takeaway-reached' },
  module,
  screen: module.screens[module.screens.length - 1],
});
/** Every scored screen of a module answered with full marks, so its takeaway completes it. */
const answers = (module = m00): ProgressCause[] =>
  module.screens.flatMap((screen): ProgressCause[] => {
    const item = scoredItem(screen);
    const score = item && { raw: item.max, max: item.max };
    return item && score ? [{ type: 'event', event: { type: 'answered', slug: item.slug, right: true, score, response: 'Right', answer: {} }, module, screen }] : [];
  });
/** The document these modules played to their takeaways make, or answered only. */
const played = (modules: typeof course.modules, { complete = true } = {}, doc: ProgressDoc = EMPTY_PROGRESS): ProgressDoc =>
  modules.flatMap((m) => [...answers(m), ...(complete ? [takeaway(m)] : [])]).reduce(takeCause, doc);
const saved = (doc: ProgressDoc, savedAt: string): ProgressDoc => ({ ...doc, savedAt });

const EARLIER = '2026-10-15T09:00:00.000Z';
const LATER = '2026-10-15T10:00:00.000Z';

/** A document with module 00 done, or module 01 reached, to tell the sources apart. */
const DONE_00: ProgressDoc = { version: 2, modules: { '00': { answers: {}, reached: 7, completed: true } } };
const AT_01: ProgressDoc = { version: 2, modules: { '01': { answers: {}, reached: 2, completed: false } } };
/** DONE_00 as round two saved it: version 1, against the modules round three replaced under the same slugs. */
const ROUND_TWO = { ...DONE_00, version: 1, savedAt: LATER };

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

/** The record store answers a State GET with `state` (a Response, or a promise of one) and anything else with 204. */
function recordStore(state: () => Response | Promise<Response>) {
  fetchMock.mockImplementation(async (_url, init) => (init?.method === undefined || init.method === 'GET' ? state() : new Response(null, { status: 204 })));
}
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
    const first = createProgressStore(course, createMemoryTracker(course));
    for (const cause of [...answers(), takeaway()]) first.take(cause);
    const reloaded = createProgressStore(course, createMemoryTracker(course));
    expect(moduleStatus(reloaded.getSnapshot(), '00')).toBe('done');
  });

  it('ignores a corrupt or foreign localStorage copy', () => {
    localStorage.setItem(localStateKey(course, null), JSON.stringify({ modules: ['00'] }));
    expect(createProgressStore(course, createMemoryTracker(course)).getSnapshot()).toBe(EMPTY_PROGRESS);
    localStorage.setItem(localStateKey(course, null), '{not json');
    expect(createProgressStore(course, createMemoryTracker(course)).getSnapshot()).toBe(EMPTY_PROGRESS);
  });

  it("starts empty from round two's localStorage copy (version 1)", () => {
    localStorage.setItem(localStateKey(course, null), JSON.stringify(ROUND_TWO));
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
    for (const cause of answers()) store.take(cause);
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

  it('stamps every change with when it was saved, and leaves a cause that changes nothing as it was', () => {
    vi.useFakeTimers({ now: new Date(LATER) });
    try {
      const store = createProgressStore(course, createMemoryTracker(course));
      store.take(visit(2));
      expect(store.getSnapshot().savedAt).toBe(LATER);
      expect(parseProgress(readLocalState(localStateKey(course, null)))?.savedAt).toBe(LATER);
      const doc = store.getSnapshot();
      vi.setSystemTime(new Date('2026-10-15T11:00:00.000Z'));
      store.take(visit(1));
      expect(store.getSnapshot()).toBe(doc);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not complete a module whose takeaway is reached with a scored screen unanswered', () => {
    const store = createProgressStore(course, createMemoryTracker(course));
    store.take(takeaway());
    expect(moduleStatus(store.getSnapshot(), '00')).toBe('in-progress');
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

  it("starts empty when State and the local copy are both round two's (version 1)", async () => {
    localStorage.setItem(localStateKey(course, launch), JSON.stringify(ROUND_TWO));
    recordStore(() => json(ROUND_TWO));
    const store = createProgressStore(course, createLrsTracker(course, launch));
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS);
    await store.loaded;
    expect(store.getSnapshot()).toBe(EMPTY_PROGRESS);
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

  it('stops waiting for State after the timeout, keeps the local copy, and writes only it, never preview\'s', async () => {
    localStorage.setItem(localStateKey(course, launch), JSON.stringify(AT_01));
    recordStore(() => new Promise<Response>(() => {}));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    const store = createProgressStore(course, tracker, { stateTimeoutMs: 5 });
    await store.loaded;
    expect(store.getSnapshot()).toEqual(AT_01);

    store.take(visit(4, m01));
    await tracker.idle();
    expect(puts()).toEqual([]);
    expect(readLocalState(localStateKey(course, launch))).toEqual(store.getSnapshot());
    expect(readLocalState(localStateKey(course, null))).toBeNull();
  });

  it('keeps a local copy saved after State, and writes it to State', async () => {
    localStorage.setItem(localStateKey(course, launch), JSON.stringify(saved(AT_01, LATER)));
    recordStore(() => json(saved(DONE_00, EARLIER)));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    const store = createProgressStore(course, tracker);
    await store.loaded;
    await tracker.idle();
    expect(store.getSnapshot()).toEqual(saved(AT_01, LATER));
    expect(puts()).toEqual([saved(AT_01, LATER)]);
    expect(store.getGeneration()).toBe(0);
  });

  it('lets State saved after the local copy win, keeps it in localStorage, and adopts it once (the generation)', async () => {
    localStorage.setItem(localStateKey(course, launch), JSON.stringify(saved(AT_01, EARLIER)));
    recordStore(() => json(saved(DONE_00, LATER)));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    const store = createProgressStore(course, tracker);
    const view = vi.fn();
    store.subscribe(view);
    expect(store.getGeneration()).toBe(0);
    await store.loaded;
    await tracker.idle();
    expect(store.getSnapshot()).toEqual(saved(DONE_00, LATER));
    expect(store.getGeneration()).toBe(1);
    expect(view).toHaveBeenCalledTimes(1);
    expect(puts()).toEqual([]);
    expect(readLocalState(localStateKey(course, launch))).toEqual(saved(DONE_00, LATER));
  });

  it('writes State when what the learner did while it was read changes it, even when it changed nothing locally', async () => {
    const reached = (n: number, savedAt: string): ProgressDoc => ({ version: 2, savedAt, modules: { '00': { answers: {}, reached: n, completed: false } } });
    localStorage.setItem(localStateKey(course, launch), JSON.stringify(reached(5, EARLIER)));
    let answer: (response: Response) => void = () => {};
    recordStore(() => new Promise((resolve) => (answer = resolve)));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    const store = createProgressStore(course, tracker);
    store.take(visit(5));
    expect(store.getSnapshot()).toEqual(reached(5, EARLIER));

    answer(json(reached(2, LATER)));
    await store.loaded;
    await tracker.idle();
    expect(moduleRecord(store.getSnapshot(), '00').reached).toBe(5);
    expect(puts()).toEqual([store.getSnapshot()]);
    expect(readLocalState(localStateKey(course, launch))).toEqual(store.getSnapshot());
  });
});

describe('what the progress store tells the statements while State is read', () => {
  /** A store whose State read answers `state` when `answer` is called; every update it tells is kept. */
  function loading(local: ProgressDoc | null) {
    if (local) localStorage.setItem(localStateKey(course, launch), JSON.stringify(local));
    let answer: (state: ProgressDoc) => void = () => {};
    recordStore(() => new Promise((resolve) => (answer = (state) => resolve(json(state)))));
    const store = createProgressStore(course, createLrsTracker(course, launch, { retryDelayMs: 0 }));
    const updates: ProgressUpdate[] = [];
    store.onChange((update) => updates.push(update));
    const effects = (): ProgressEffect[] => updates.flatMap((u) => u.effects);
    return { store, updates, effects, answer: (state: ProgressDoc) => answer(state) };
  }

  it("tells a screen's cause at once, and holds what it changed back until State is loaded", async () => {
    const l = loading(saved(played([m00], { complete: false }), LATER));
    const [check] = answers(m00);
    l.store.take(check);
    expect(l.updates).toEqual([expect.objectContaining({ cause: check, effects: [] })]);
    l.store.take(takeaway());
    expect(moduleStatus(l.store.getSnapshot(), '00')).toBe('done');
    expect(l.effects()).toEqual([]);

    l.answer(saved(EMPTY_PROGRESS, EARLIER));
    await l.store.loaded;
    expect(l.updates.at(-1)).toEqual(expect.objectContaining({ cause: null, effects: [{ type: 'module-completed', module: m00 }] }));
  });

  it('does not send a module completed again when State already holds it', async () => {
    const l = loading(played([m00], { complete: false }));
    l.store.take(takeaway());
    l.answer(played([m00]));
    await l.store.loaded;
    expect(moduleStatus(l.store.getSnapshot(), '00')).toBe('done');
    expect(l.effects()).toEqual([]);
  });

  it('sends the course completed when the module finished while State was read completes the course State holds the rest of', async () => {
    const l = loading(played([last], { complete: false }));
    l.store.take(takeaway(last));
    l.answer(played(course.modules.slice(0, -1), {}, played([last], { complete: false })));
    await l.store.loaded;
    expect(l.effects()).toEqual([
      { type: 'module-completed', module: last },
      { type: 'course-completed', score: { raw: 2, max: 2 } },
    ]);
  });
});

describe('the progress store when the State read does not answer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const key = localStateKey(course, launch);
  const local = () => parseProgress(readLocalState(key));

  it.each([
    ['answers 500', () => new Response('down', { status: 500 })],
    ['answers 401', () => new Response('', { status: 401 })],
    ['answers 403', () => new Response('', { status: 403 })],
    ['fails to connect', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['does not answer within the timeout', () => new Promise<Response>(() => {})],
  ])('when State %s, plays on from the local copy, writes localStorage only, and writes State once a later read answers', async (_, failed) => {
    localStorage.setItem(key, JSON.stringify(AT_01));
    let reads = 0;
    recordStore(() => (++reads === 1 ? failed() : json(DONE_00)));
    const tracker = createLrsTracker(course, launch, { retryDelayMs: 0 });
    const store = createProgressStore(course, tracker);
    await vi.advanceTimersByTimeAsync(STATE_TIMEOUT_MS);
    await store.loaded;
    expect(store.getSnapshot()).toEqual(AT_01);

    store.take(visit(3, m01));
    store.take(visit(4, m01));
    await tracker.idle();
    expect(puts()).toEqual([]);
    expect(moduleRecord(store.getSnapshot(), '01').reached).toBe(4);
    expect(local()).toEqual(store.getSnapshot());

    // The read is tried again before a State write, at most once every 30 s.
    await vi.advanceTimersByTimeAsync(30_000 - STATE_TIMEOUT_MS - 1);
    expect(reads).toBe(1);
    expect(puts()).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    await tracker.idle();
    expect(reads).toBe(2);

    // It answered: State (as new as the local copy) wins, what the learner did is taken in on top, and written.
    const merged = store.getSnapshot();
    expect(moduleStatus(merged, '00')).toBe('done');
    expect(moduleRecord(merged, '01').reached).toBe(4);
    expect(puts()).toEqual([merged]);
    expect(local()).toEqual(merged);
  });
});
