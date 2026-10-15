// The progress store (D22, PLAN.md §6 "Resume"): holds the learner's document, takes in the
// frame's events and App's visits, persists every change through the tracker, and tells two
// kinds of listener about it. React subscribes with `subscribe`/`getSnapshot`; the statements
// listen with `onChange`, which hands over each cause with the document before and after and
// what it changed in xAPI terms (progress.ts, ProgressEffect). The store sends nothing itself.
//
// Loading never blocks the learner: the document starts as this launch's localStorage copy (or
// empty) and the course renders at once. With a launch, State is read meanwhile. When the read
// answers (with a document or with none), the newer of State and the local copy wins (State on
// a tie), whatever the learner did meanwhile is taken in again on top of it, and the result is
// saved. A read that fails, or does not answer within `stateTimeoutMs`, leaves the course on the
// local copy, saved to localStorage alone: State is never written before a read has answered,
// so State not yet read is never overwritten, and the read is tried again before a State write,
// at most once every `stateRetryMs`. Until a read answers, what the learner's causes change in
// xAPI terms (completions, the course's score) is held back, then worked out against the
// document adopted, so a completion State already holds is not sent again and one made
// meanwhile is sent once; a screen's own statement goes out at once.
import type { StateRead } from '../xapi/state.ts';
import type { Tracker } from '../xapi/tracker.ts';
import { EMPTY_PROGRESS, isNewer, parseProgress, progressEffects, step, takeCause, type ProgressCause, type ProgressCourse, type ProgressDoc, type ProgressEffect } from './progress.ts';

/**
 * A cause taken in: the document before and after (the same object when nothing changed), and
 * what changed. `cause` is null for a load, which hands over what the causes taken while State
 * was read changed, worked out against the document adopted (`before`).
 */
export interface ProgressUpdate {
  before: ProgressDoc;
  after: ProgressDoc;
  cause: ProgressCause | null;
  effects: readonly ProgressEffect[];
}

export interface ProgressStore {
  /** The current document; a new object after each change, so it is a React snapshot. */
  getSnapshot(): ProgressDoc;
  /**
   * How many times a loaded document has been adopted (0 until State wins a load); the frame
   * keys its screens with it, so each reads its saved answer again from the adopted document.
   */
  getGeneration(): number;
  /** Calls `listener` after each change, a loaded State included; returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
  /**
   * Calls `listener` with every cause the store takes in, changed or not (so every `answered`
   * reaches the statements), and once for the load that follows causes taken while State was
   * read (with `cause` null); returns the unsubscribe.
   */
  onChange(listener: (update: ProgressUpdate) => void): () => void;
  /** Takes in a screen's event or a visit. */
  take(cause: ProgressCause): void;
  /** Settles once the first State read is over (answered, failed or timed out); at once in preview. */
  readonly loaded: Promise<void>;
}

/** How long a State read is waited for before it counts as failed. */
export const STATE_TIMEOUT_MS = 4000;

/** How long after a State read starts before another may, while none has answered. */
export const STATE_RETRY_MS = 30_000;

const UNKNOWN: StateRead = { status: 'unknown' };

/** The store for a course and a tracker: preview's localStorage, or a launch's State and its own localStorage. */
export function createProgressStore(
  course: ProgressCourse,
  tracker: Tracker,
  { stateTimeoutMs = STATE_TIMEOUT_MS, stateRetryMs = STATE_RETRY_MS } = {},
): ProgressStore {
  const local = parseProgress(tracker.getLocalState());
  let doc = local ?? EMPTY_PROGRESS;
  let generation = 0;
  // The causes taken while no State read has answered yet (null once one has, and in preview).
  let taken: ProgressCause[] | null = tracker.launch ? [] : null;
  // Whether one of them changed the document, so a State write waits for a read to answer.
  let unwritten = false;
  // When the last State read started, whether it is still out, and the retry waiting its turn.
  let lastRead = -Infinity;
  let reading = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  const views = new Set<() => void>();
  const changes = new Set<(update: ProgressUpdate) => void>();

  function show(next: ProgressDoc) {
    if (next === doc) return;
    doc = next;
    for (const listener of views) listener();
  }

  function tell(update: ProgressUpdate) {
    for (const listener of changes) listener(update);
  }

  function readState(): Promise<StateRead> {
    lastRead = Date.now();
    reading = true;
    return new Promise<StateRead>((resolve) => {
      const timer = setTimeout(() => resolve(UNKNOWN), stateTimeoutMs);
      void tracker.getState().then((read) => {
        clearTimeout(timer);
        resolve(read);
      });
    }).then((read) => {
      reading = false;
      return read;
    });
  }

  /** Reads State again once `stateRetryMs` has passed since the last read, unless a read is out or waiting. */
  function retryRead() {
    if (reading || retry !== undefined) return;
    retry = setTimeout(
      () => {
        retry = undefined;
        void readState().then(settle);
      },
      Math.max(0, lastRead + stateRetryMs - Date.now()),
    );
  }

  /** Takes in a State read: an answer loads (PLAN.md §6 "Resume"); a failure is tried again while a write waits. */
  function settle(read: StateRead) {
    if (taken === null) return;
    if (read.status === 'unknown') {
      if (unwritten) retryRead();
      return;
    }
    const state = read.status === 'found' ? parseProgress(read.doc) : null;
    const stateWins = state !== null && (local === null || !isNewer(local, state));
    // When the local copy wins, the document as it stands is the result: it is the local copy
    // with every cause taken in already.
    const adopted = stateWins ? state : (local ?? EMPTY_PROGRESS);
    const next = stateWins ? stamped(state, taken.reduce(takeCause, state)) : doc;
    const effects = progressEffects(course, adopted, next);
    const held = taken.length > 0;
    taken = null;
    unwritten = false;
    if (stateWins ? next !== state : local !== null || next !== adopted) tracker.setState(next);
    else tracker.setLocalState(next);
    if (stateWins) generation += 1;
    show(next);
    if (held) tell({ before: adopted, after: next, cause: null, effects });
  }

  const loaded = !tracker.launch ? Promise.resolve() : readState().then(settle);

  return {
    getSnapshot: () => doc,
    getGeneration: () => generation,
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
      const result = step(course, before, cause);
      const after = stamped(before, result.doc);
      if (taken) {
        taken.push(cause);
        if (after !== before) {
          tracker.setLocalState(after);
          unwritten = true;
          retryRead();
        }
      } else if (after !== before) {
        tracker.setState(after);
      }
      show(after);
      tell({ before, after, cause, effects: taken ? [] : result.effects });
    },
    loaded,
  };
}

/** `next` with `savedAt` set to now when it is not `doc`; `doc` itself when nothing changed. */
function stamped(doc: ProgressDoc, next: ProgressDoc): ProgressDoc {
  return next === doc ? doc : { ...next, savedAt: new Date().toISOString() };
}
