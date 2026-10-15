// The progress store (D22, PLAN.md §6 "Resume"): holds the learner's document, takes in the
// frame's events and App's visits, persists every change through the tracker, and tells two
// kinds of listener about it. React subscribes with `subscribe`/`getSnapshot`; the statements
// listen with `onChange`, which hands over each cause with the document before and after and
// what it changed in xAPI terms (progress.ts, ProgressEffect). The store sends nothing itself.
//
// Loading never blocks the learner: the document starts as this registration's localStorage
// copy (or empty) and the course renders at once. With a launch, State is read meanwhile; when
// it answers with a progress document, State wins, and whatever the learner did while it was
// being read is taken in again on top of it. A State read that fails, or does not answer within
// `stateTimeoutMs`, leaves the local copy. Writes wait for that read, so State is never
// overwritten before it has been read.
import type { Tracker } from '../xapi/tracker.ts';
import { EMPTY_PROGRESS, parseProgress, step, takeCause, type ProgressCause, type ProgressCourse, type ProgressDoc, type ProgressEffect } from './progress.ts';

/** One cause taken in: the document before and after (the same object when nothing changed), and what changed. */
export interface ProgressUpdate {
  before: ProgressDoc;
  after: ProgressDoc;
  cause: ProgressCause;
  effects: readonly ProgressEffect[];
}

export interface ProgressStore {
  /** The current document; a new object after each change, so it is a React snapshot. */
  getSnapshot(): ProgressDoc;
  /** Calls `listener` after each change, a loaded State included; returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
  /**
   * Calls `listener` with every cause the store takes in, changed or not (so every `answered`
   * reaches the statements), never for a load; returns the unsubscribe.
   */
  onChange(listener: (update: ProgressUpdate) => void): () => void;
  /** Takes in a screen's event or a visit. */
  take(cause: ProgressCause): void;
  /** Settles once the document is loaded: at once in preview, after the State read with a launch. */
  readonly loaded: Promise<void>;
}

/** How long the State read is waited for before the local copy stands. */
export const STATE_TIMEOUT_MS = 4000;

/** The store for a course and a tracker: preview's localStorage, or a launch's State and its own localStorage. */
export function createProgressStore(course: ProgressCourse, tracker: Tracker, { stateTimeoutMs = STATE_TIMEOUT_MS } = {}): ProgressStore {
  let doc = parseProgress(tracker.getLocalState()) ?? EMPTY_PROGRESS;
  // The causes taken while State is being read (null once it has been), and whether they changed anything.
  let pending: ProgressCause[] | null = tracker.launch ? [] : null;
  let unsaved = false;
  const views = new Set<() => void>();
  const changes = new Set<(update: ProgressUpdate) => void>();

  function show(next: ProgressDoc) {
    if (next === doc) return;
    doc = next;
    for (const listener of views) listener();
  }

  function readState(): Promise<ProgressDoc | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), stateTimeoutMs);
      void tracker.getState().then((state) => {
        clearTimeout(timer);
        resolve(parseProgress(state));
      });
    });
  }

  const loaded = !tracker.launch
    ? Promise.resolve()
    : readState().then((state) => {
        const taken = pending ?? [];
        pending = null;
        if (state) show(taken.reduce(takeCause, state));
        if (unsaved) tracker.setState(doc);
      });

  return {
    getSnapshot: () => doc,
    subscribe(listener) {
      views.add(listener);
      return () => views.delete(listener);
    },
    onChange(listener) {
      changes.add(listener);
      return () => changes.delete(listener);
    },
    take(cause) {
      const before = doc;
      const { doc: after, effects } = step(course, before, cause);
      if (pending) {
        pending.push(cause);
        unsaved ||= after !== before;
      } else if (after !== before) {
        tracker.setState(after);
      }
      show(after);
      const update: ProgressUpdate = { before, after, cause, effects };
      for (const listener of changes) listener(update);
    },
    loaded,
  };
}
