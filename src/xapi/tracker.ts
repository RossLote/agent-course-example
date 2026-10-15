// The Tracker (D20): the one interface the course talks to the record store through. With a
// launch it is @xapi/xapi on the fetch adapter at version 1.0.2; without one it is an
// in-memory store whose statements the preview drawer lists (D18).
import XAPI, { type Statement } from '@xapi/xapi';
import { courseActivityId, type Launch } from './launch.ts';
import { createQueue } from './queue.ts';
import { isStateDocument, localStateKey, readLocalState, STATE_ID, writeLocalState, type StateDocument } from './state.ts';

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
  /** The State document, or null when there is none, the read fails, or the answer is not a JSON object. Never rejects. */
  getState(): Promise<StateDocument | null>;
  /** Writes the State document (queued with the statements, with a launch) and its localStorage copy. Returns at once. */
  setState(doc: StateDocument): void;
  /** The localStorage copy for this course and registration, or null. */
  getLocalState(): StateDocument | null;
  /** Settles when every queued request has been sent or dropped (for tests). */
  idle(): Promise<void>;
}

/** The course's tracker: the record store with a launch, the in-memory store without. */
export function createTracker(course: { id: string }, launch: Launch | null): Tracker {
  return launch ? createLrsTracker(course, launch) : createMemoryTracker(course);
}

/** The tracker for a launch: statements and State to the launch's record store, in order. */
export function createLrsTracker(course: { id: string }, launch: Launch, { retryDelayMs = 1000 } = {}): Tracker {
  const xapi = new XAPI({ endpoint: launch.endpoint, auth: launch.auth, version: '1.0.2', adapter: 'fetch' });
  const queue = createQueue(retryDelayMs);
  const localKey = localStateKey(course, launch);
  const where = {
    agent: launch.actor,
    activityId: courseActivityId(course, launch),
    stateId: STATE_ID,
    ...(launch.registration && { registration: launch.registration }),
  };
  return {
    launch,
    log: null,
    send(statement) {
      queue.add(`the ${statement.verb.display?.['en-US'] ?? statement.verb.id} statement`, () => xapi.sendStatement({ statement }));
    },
    async getState() {
      try {
        const { data } = await xapi.getState(where);
        return isStateDocument(data) ? data : null;
      } catch {
        return null;
      }
    },
    setState(doc) {
      writeLocalState(localKey, doc);
      queue.add('the State write', () => xapi.setState({ ...where, state: doc }));
    },
    getLocalState: () => readLocalState(localKey),
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
    getState: () => Promise.resolve(state && jsonCopy(state)),
    setState(doc) {
      state = jsonCopy(doc);
      writeLocalState(localKey, doc);
    },
    getLocalState: () => readLocalState(localKey),
    idle: () => Promise.resolve(),
  };
}

/** What a record store would get: the value through JSON and back. */
function jsonCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
