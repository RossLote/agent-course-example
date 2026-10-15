// Every statement the course sends (D19, PLAN.md §6 "Statements"), built as full xAPI 1.0.2
// statements by pure functions: the progress store and the screens' wiring only call them.
// Ids come from src/content (D24); the actor and registration from the launch, verbatim.
import type { Activity, Agent, Context, InteractionActivity, Result, ResultScore, Statement } from '@xapi/xapi';
import { activityId, activityPath, fridgeActivityPath, moduleActivityPath, type Course, type Module, type Screen } from '../content/index.ts';
import { plainText } from '../content/copy.ts';
import type { ScreenEvent, Score } from '../screens/types.ts';
import { courseActivityId, type Launch } from './launch.ts';
import { ACTIVITY_TYPES, VERBS } from './vocabulary.ts';

/** What the builders read of the course. */
export type StatementCourse = Pick<Course, 'id' | 'title' | 'fridges'>;

type AnsweredEvent = Extract<ScreenEvent, { type: 'answered' }>;
type InteractedEvent = Extract<ScreenEvent, { type: 'interacted' }>;
/** The events that send a statement of their own: a takeaway's completes its module through progress. */
type StatementEvent = Exclude<ScreenEvent, { type: 'takeaway-reached' }>;

/** The actor of every statement in preview, where there is no launch to give one. */
export function previewActor(course: Pick<Course, 'id'>): Agent {
  return { objectType: 'Agent', name: 'Preview learner', account: { homePage: course.id, name: 'preview' } };
}

/** `initialized` on the course, sent once when the course loads. */
export function initialized(course: StatementCourse, launch: Launch | null): Statement {
  return courseStatement(course, launch, VERBS.initialized);
}

/**
 * `completed` on the course: completion true and the score out of 28 (`score.max`), scaled
 * points over max. Sent when the last module completes and again when the score changes.
 */
export function courseCompleted(course: StatementCourse, launch: Launch | null, score: Score): Statement {
  return courseStatement(course, launch, VERBS.completed, { completion: true, score: resultScore(score) });
}

/** `completed` on a module, sent when its takeaway is reached. */
export function moduleCompleted(course: StatementCourse, launch: Launch | null, module: Pick<Module, 'slug' | 'title'>): Statement {
  const object = activity(activityId(course, moduleActivityPath(module)), module.title, ACTIVITY_TYPES.module);
  return statement(course, launch, VERBS.completed, object, childContext(course, launch));
}

/**
 * `answered` on a check or a scored interaction, one per Check press: the response in words,
 * whether it was right, and the score (1 of 1 for a check, n of the cards or rows otherwise).
 */
export function answered(course: StatementCourse, launch: Launch | null, module: Module, screen: Screen, event: AnsweredEvent): Statement {
  const result: Result = { response: plainText(event.response), success: event.right, score: resultScore(event.score) };
  return statement(course, launch, VERBS.answered, screenActivity(course, module, screen), childContext(course, launch), result);
}

/** `interacted` on an unscored interaction, one per option picked: the option in words. */
export function interacted(course: StatementCourse, launch: Launch | null, module: Module, screen: Screen, event: InteractedEvent): Statement {
  return statement(course, launch, VERBS.interacted, screenActivity(course, module, screen), childContext(course, launch), { response: plainText(event.response) });
}

/** `completed` on a fridge, one per play when it ends, with the play's score. */
export function fridgeCompleted(course: StatementCourse, launch: Launch | null, fridge: string, score: Score): Statement {
  const object = activity(activityId(course, fridgeActivityPath(fridge)), course.fridges[fridge]?.title ?? fridge, ACTIVITY_TYPES.simulation);
  return statement(course, launch, VERBS.completed, object, childContext(course, launch), { completion: true, score: resultScore(score) });
}

/** The statement a screen's event sends: what the frame's callback calls. */
export function screenStatement(course: StatementCourse, launch: Launch | null, module: Module, screen: Screen, event: StatementEvent): Statement {
  switch (event.type) {
    case 'answered':
      return answered(course, launch, module, screen, event);
    case 'interacted':
      return interacted(course, launch, module, screen, event);
    case 'fridge-ended':
      return fridgeCompleted(course, launch, event.slug, event.score);
  }
}

/**
 * An xAPI score from points out of points: min 0, scaled raw over max. A points-mode fridge
 * can score below 0, so min and max stretch to hold raw and scaled stays within -1 to 1.
 */
export function resultScore({ raw, max }: Score): ResultScore {
  const scaled = max > 0 ? Math.min(1, Math.max(-1, raw / max)) : 0;
  return { scaled, raw, min: Math.min(0, raw), max: Math.max(max, raw) };
}

/** A course-level statement: the launch's activity_id as object, course.yaml's id as grouping when they differ. */
function courseStatement(course: StatementCourse, launch: Launch | null, verb: Statement['verb'], result?: Result): Statement {
  const id = courseActivityId(course, launch);
  const context: Context = id === course.id ? {} : { contextActivities: { grouping: [{ objectType: 'Activity', id: course.id }] } };
  return statement(course, launch, verb, activity(id, course.title, ACTIVITY_TYPES.course), context, result);
}

/** A module, check, interaction or fridge statement's context: course.yaml's id as parent, the launch's as grouping when it differs. */
function childContext(course: StatementCourse, launch: Launch | null): Context {
  const launched = courseActivityId(course, launch);
  return {
    contextActivities: {
      parent: [{ objectType: 'Activity', id: course.id }],
      ...(launched !== course.id && { grouping: [{ objectType: 'Activity', id: launched }] }),
    },
  };
}

function statement(course: StatementCourse, launch: Launch | null, verb: Statement['verb'], object: Activity, context: Context, result?: Result): Statement {
  const full: Context = { ...(launch?.registration && { registration: launch.registration }), ...context };
  return {
    id: uuid(),
    timestamp: new Date().toISOString(),
    actor: launch ? launch.actor : previewActor(course),
    verb,
    object,
    ...(result && { result }),
    ...(Object.keys(full).length > 0 && { context: full }),
  };
}

function activity(id: string, name: string, type: string): Activity {
  return { objectType: 'Activity', id, definition: { type, name: { 'en-US': plainText(name) } } };
}

/** A screen's own activity: its D24 id, its heading, and the interaction type its screen type is. */
function screenActivity(course: StatementCourse, module: Module, screen: Screen): InteractionActivity {
  const path = activityPath(module, screen);
  if (path === null || !('heading' in screen)) throw new Error(`a ${screen.type} screen sends no statement of its own`);
  return {
    objectType: 'Activity',
    id: activityId(course, path),
    definition: {
      type: ACTIVITY_TYPES.interaction,
      name: { 'en-US': plainText(screen.heading) },
      interactionType: screen.type === 'match' ? 'matching' : screen.type === 'order' ? 'sequencing' : 'choice',
    },
  };
}

/**
 * A version 4 UUID for a statement's id, from getRandomValues, which unlike randomUUID needs no
 * secure context (an LMS may serve the package over plain http).
 */
export function uuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
