// The course's progress store, made when this module is first imported: one per page load,
// loading this launch's State or this browser's localStorage copy (store.ts). Import `progress`
// from here, and the views and types below.
import { course } from '../content/index.ts';
import { tracker } from '../xapi/index.ts';
import { createProgressStore } from './store.ts';

/** The progress store for this page's lifetime. */
export const progress = createProgressStore(course, tracker);

export {
  courseComplete,
  courseScore,
  EMPTY_PROGRESS,
  homeNext,
  moduleAnswers,
  moduleRecord,
  modulesDone,
  moduleStatus,
  parseProgress,
  progressEffects,
  scaledScore,
  step,
  takeCause,
  type HomeNext,
  type ModuleRecord,
  type ModuleStatus,
  type ProgressCause,
  type ProgressCourse,
  type ProgressDoc,
  type ProgressEffect,
} from './progress.ts';
export { createProgressStore, STATE_TIMEOUT_MS, type ProgressStore, type ProgressUpdate } from './store.ts';
export { useProgress, useVisit, type Progress } from './useProgress.ts';
