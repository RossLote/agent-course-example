// The course's one connection to the record store, made when this module is first imported:
// the launch read from the query string, the tracker for it, and `initialized` sent. Being a
// module, it runs once per page load, so React StrictMode's doubled effects never send twice.
// Import `tracker` and `launch` from here; build statements with the functions re-exported below.
import { course } from '../content/index.ts';
import { parseLaunch } from './launch.ts';
import { initialized } from './statements.ts';
import { createTracker } from './tracker.ts';

/** The launch in this page's query string, or null in preview. */
export const launch = parseLaunch(window.location.search);

/** The tracker for this page's lifetime. */
export const tracker = createTracker(course, launch);

tracker.send(initialized(course, launch));

export { courseActivityId, parseLaunch, type Launch } from './launch.ts';
export { isStateDocument, localStateKey, readLocalState, STATE_ID, writeLocalState, type StateDocument } from './state.ts';
export {
  ACTIVITY_TYPES,
  answered,
  courseCompleted,
  fridgeCompleted,
  initialized,
  interacted,
  moduleCompleted,
  previewActor,
  resultScore,
  screenStatement,
  VERBS,
  type StatementCourse,
} from './statements.ts';
export { createLrsTracker, createMemoryTracker, createTracker, type StatementLog, type Tracker } from './tracker.ts';
export { useStatements } from './useStatements.ts';
