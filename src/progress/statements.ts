// The statements the learner's progress sends (D19, PLAN.md §6 "Statements"): the store tells
// of every cause it takes in and what it changed, and this sends them to the tracker. A screen's
// own event sends its statement (answered, interacted, or completed on a fridge) every time, so
// a wrong-then-right check sends two; the effects send completed on a module, and completed on
// the course when the last module completes and again whenever its score changes after that.
// A module's completed comes from its effect, never from `takeaway-reached` itself: the takeaway
// reports each time it shows, and only the first completes the module.
import type { Statement } from '@xapi/xapi';
import type { Launch } from '../xapi/launch.ts';
import { courseCompleted, moduleCompleted, screenStatement, type StatementCourse } from '../xapi/statements.ts';
import type { Tracker } from '../xapi/tracker.ts';
import type { ProgressEffect } from './progress.ts';
import type { ProgressStore, ProgressUpdate } from './store.ts';

/** The statements one update sends, in order: the screen's own, then each effect's. */
export function updateStatements(course: StatementCourse, launch: Launch | null, { cause, effects }: ProgressUpdate): Statement[] {
  const own = cause.type === 'event' && cause.event.type !== 'takeaway-reached' ? [screenStatement(course, launch, cause.module, cause.screen, cause.event)] : [];
  return [...own, ...effects.map((effect) => effectStatement(course, launch, effect))];
}

function effectStatement(course: StatementCourse, launch: Launch | null, effect: ProgressEffect): Statement {
  switch (effect.type) {
    case 'module-completed':
      return moduleCompleted(course, launch, effect.module);
    case 'course-completed':
    case 'course-score-changed':
      return courseCompleted(course, launch, effect.score);
  }
}

/** Sends every update's statements from `store` to `tracker` from now on; returns the unsubscribe. */
export function connectStatements(store: ProgressStore, tracker: Tracker, course: StatementCourse, launch: Launch | null): () => void {
  return store.onChange((update) => {
    for (const statement of updateStatements(course, launch, update)) tracker.send(statement);
  });
}
