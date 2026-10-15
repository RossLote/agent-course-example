// The Tracker (D20): the one interface the course talks to the record store through. With a
// launch it is @xapi/xapi on fetch at version 1.0.2; without one it is an in-memory store whose
// statements the preview drawer lists (D18).
import XAPI, { type Statement } from '@xapi/xapi';
import { fetchAdapter, RecordStoreError } from './adapter.ts';
import { courseActivityId, type Launch } from './launch.ts';
import { createQueue } from './queue.ts';
import { isStateDocument, localStateKey, readLocalState, STATE_ID, writeLocalState, type StateDocument, type StateRead } from './state.ts';

/** The statements the in-memory store has received, oldest first, and a way to hear of more. */
export interface StatementLog {
  /** The statements so far; a new array after each one, so it can be a React snapshot. */
  list(): readonly Statement[];
  /** Calls `listener` after each statement; returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
}

export interface Tracker {
  /** The launch it sends to, or null in preview. */
  readonly launch: Launch | null;
  /** The in-memory store's statements in preview; null with a launch. */
  readonly log: StatementLog | null;
  /** Queues a statement and returns at once; a failure is retried once, then logged, never thrown. */
  send(statement: Statement): void;
  /** What a State read found (state.ts, StateRead). Never rejects. */
  getState(): Promise<StateRead>;
  /** Writes the State document (queued with the statements, with a launch) and its localStorage copy. Returns at once. */
  setState(doc: StateDocument): void;
  /** Writes the localStorage copy alone. */
  setLocalState(doc: StateDocument): void;
  /** The localStorage copy for this course and registration, or null. */
  getLocalState(): StateDocument | null;
  /**
   * Sends what is still queued at once, as the page is hidden or closed: the statements as one
   * POST and the latest State document as its PUT, with `keepalive` so they outlive the page.
   * They leave the queue, so nothing is sent twice; a failure is ignored. Nothing in preview.
   */
  flush(): void;
  /** Settles when every queued request has been sent or dropped (for tests). */
  idle(): Promise<void>;
}

/** The course's tracker: the record store with a launch, the in-memory store without. */
export function createTracker(course: { id: string }, launch: Launch | null): Tracker {
  return launch ? createLrsTracker(course, launch) : createMemoryTracker(course);
}

/** Flushes `tracker` whenever the page is hidden or closed (pagehide, or visibilitychange to hidden); returns the unsubscribe. */
export function flushWhenHidden(tracker: Tracker): () => void {
  const flush = () => tracker.flush();
  const hidden = () => {
    if (document.visibilityState === 'hidden') tracker.flush();
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', hidden);
  return () => {
    window.removeEventListener('pagehide', flush);
    document.removeEventListener('visibilitychange', hidden);
  };
}

const NO_STATE: StateRead = { status: 'none' };
const UNKNOWN_STATE: StateRead = { status: 'unknown' };

/** A queued request: a statement, or a State write, which takes the latest document on its first try. */
type Request = { type: 'statement'; statement: Statement } | { type: 'state'; doc: StateDocument | null };

/**
 * The tracker for a launch: statements and State to the launch's record store, in order. A State
 * write is queued only when none is waiting already, and sends the latest document when its turn
 * comes, so a burst of changes is one write.
 */
export function createLrsTracker(course: { id: string }, launch: Launch, { retryDelayMs = 1000 } = {}): Tracker {
  const config = { endpoint: launch.endpoint, auth: launch.auth, version: '1.0.2' } as const;
  const xapi = new XAPI({ ...config, adapter: fetchAdapter() });
  const keepalive = new XAPI({ ...config, adapter: fetchAdapter({ keepalive: true }) });
  const localKey = localStateKey(course, launch);
  const where = {
    agent: launch.actor,
    activityId: courseActivityId(course, launch),
    stateId: STATE_ID,
    ...(launch.registration && { registration: launch.registration }),
  };
  // The latest document no queued write has taken yet; null when there is none.
  let unsent: StateDocument | null = null;
  const queue = createQueue<Request>(
    (request) => {
      if (request.type === 'statement') return xapi.sendStatement({ statement: request.statement });
      // The latest document is taken on the first try; a retry sends the same one.
      if (request.doc === null) {
        request.doc = unsent;
        unsent = null;
      }
      return request.doc ? xapi.setState({ ...where, state: request.doc }) : Promise.resolve();
    },
    (request) => (request.type === 'state' ? 'the State write' : `the ${request.statement.verb.display?.['en-US'] ?? request.statement.verb.id} statement`),
    retryDelayMs,
  );
  const ignore = () => {};
  return {
    launch,
    log: null,
    send(statement) {
      queue.add({ type: 'statement', statement });
    },
    async getState() {
      try {
        const { data } = await xapi.getState(where);
        return isStateDocument(data) ? { status: 'found', doc: data } : NO_STATE;
      } catch (error) {
        return error instanceof RecordStoreError && error.status === 404 ? NO_STATE : UNKNOWN_STATE;
      }
    },
    setState(doc) {
      writeLocalState(localKey, doc);
      const queued = unsent !== null;
      unsent = doc;
      if (!queued) queue.add({ type: 'state', doc: null });
    },
    setLocalState: (doc) => writeLocalState(localKey, doc),
    getLocalState: () => readLocalState(localKey),
    flush() {
      const requests = queue.take();
      const statements = requests.flatMap((r) => (r.type === 'statement' ? [r.statement] : []));
      // A waiting write that has not taken its document yet sends the latest, which is `unsent`.
      const writes = requests.flatMap((r) => (r.type === 'state' ? [r.doc ?? unsent] : []));
      const state = writes.at(-1) ?? null;
      unsent = null;
      if (statements.length > 0) keepalive.sendStatements({ statements }).catch(ignore);
      if (state) keepalive.setState({ ...where, state }).catch(ignore);
    },
    idle: () => queue.idle(),
  };
}

/** The tracker for preview: statements kept in memory for the drawer, State in memory and localStorage. */
export function createMemoryTracker(course: { id: string }): Tracker {
  let statements: readonly Statement[] = [];
  let state: StateDocument | null = null;
  const listeners = new Set<() => void>();
  const localKey = localStateKey(course, null);
  return {
    launch: null,
    log: {
      list: () => statements,
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    send(statement) {
      statements = [...statements, jsonCopy(statement)];
      for (const listener of listeners) listener();
    },
    getState: () => Promise.resolve(state ? { status: 'found', doc: jsonCopy(state) } : NO_STATE),
    setState(doc) {
      state = jsonCopy(doc);
      writeLocalState(localKey, doc);
    },
    setLocalState: (doc) => writeLocalState(localKey, doc),
    getLocalState: () => readLocalState(localKey),
    flush() {},
    idle: () => Promise.resolve(),
  };
}

/** What a record store would get: the value through JSON and back. */
function jsonCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
