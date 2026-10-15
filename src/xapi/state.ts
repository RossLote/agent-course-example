// The learner's progress document (D22, PLAN.md §6 "Resume"): one State document under the
// course activity, the agent and the registration, and a copy in localStorage keyed by the
// course id and the registration (else the learner), so a preview run never leaks into a
// launched learner's, nor one learner's into another's.
import type { Agent } from '@xapi/xapi';
import { isRecord } from '../screens/saved.ts';
import type { Launch } from './launch.ts';

/** A State document: a JSON object. The progress store (.9) decides what is in it. */
export type StateDocument = { readonly [key: string]: unknown };

/** The State API's stateId for the progress document. */
export const STATE_ID = 'progress';

/** Whether a State read answered with a State document (not HTML, not a string, not an array). */
export function isStateDocument(value: unknown): value is StateDocument {
  return isRecord(value);
}

/**
 * What a State read found: a State document; none (a 404, or an answer that is not a State
 * document, such as the dev server's index.html); or unknown (the read failed: a network or
 * CORS error, 401, 403, 5xx, or no answer in time), when State may hold progress not yet read.
 */
export type StateRead = { status: 'found'; doc: StateDocument } | { status: 'none' } | { status: 'unknown' };

/**
 * The localStorage key for a course and a launch: `agent-course:<course id>:<registration>`;
 * `…:preview` when there is no launch; `…:launch:<learner>` for a launch without a registration,
 * so a launched learner never reads or overwrites preview's copy or another learner's.
 */
export function localStateKey(course: { id: string }, launch: Launch | null): string {
  const scope = launch === null ? 'preview' : (launch.registration ?? `launch:${actorKey(launch.actor)}`);
  return `agent-course:${course.id}:${scope}`;
}

/** A stable string for the learner: its account, mbox, mbox_sha1sum or openid, else the actor's JSON as given. */
function actorKey(actor: Agent): string {
  if (actor.account) return `account:${actor.account.homePage}:${actor.account.name}`;
  if (actor.mbox) return actor.mbox;
  if (actor.mbox_sha1sum) return `mbox_sha1sum:${actor.mbox_sha1sum}`;
  if (actor.openid) return `openid:${actor.openid}`;
  return JSON.stringify(actor);
}

/** The document stored under `key`, or null when there is none, it is not one, or storage is unavailable. */
export function readLocalState(key: string): StateDocument | null {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return null;
    const doc: unknown = JSON.parse(stored);
    return isStateDocument(doc) ? doc : null;
  } catch {
    return null;
  }
}

/** Stores the document under `key`; a full or unavailable storage is logged and otherwise ignored. */
export function writeLocalState(key: string, doc: StateDocument): void {
  try {
    localStorage.setItem(key, JSON.stringify(doc));
  } catch (error) {
    console.warn('xAPI: progress could not be saved in this browser.', error);
  }
}
