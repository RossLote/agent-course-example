// The learner's progress document (D22, PLAN.md §6 "Resume"): one State document under the
// course activity, the agent and the registration, and a copy in localStorage keyed by the
// course id and the registration, so a preview run never leaks into a launched learner's.
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
 * The localStorage key for a course and a launch: `agent-course:<course id>:<registration>`,
 * with "preview" when there is no launch and "launch" for a launch without a registration, so a
 * launched learner never reads or overwrites preview's copy.
 */
export function localStateKey(course: { id: string }, launch: Launch | null): string {
  return `agent-course:${course.id}:${launch === null ? 'preview' : (launch.registration ?? 'launch')}`;
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
