// The learner's progress (D22; PLAN.md §6 "Progress and score", "Module completion", "Resume";
// §6a "The score"): one plain JSON document, the pure functions that take a cause into it (a
// screen's event, or a visit to a module's screen), the changes in xAPI terms each cause makes,
// and the views the home page reads. The store (store.ts) holds the document and persists it.
import { z } from 'zod';
import type { Module, Screen } from '../content/index.ts';
import { moduleProgress, NO_ANSWERS, recordEvent } from '../course/frame/progress.ts';
import type { ModuleAnswers, ScreenEvent, Score } from '../screens/types.ts';

/** One module's progress. */
export interface ModuleRecord {
  /** Every slug's latest answer and score, as the frame keeps them (src/course/frame/progress.ts). */
  answers: ModuleAnswers;
  /**
   * The furthest screen reached, counting from 1 (0: none), so "Continue module 0n" opens where
   * the learner got to even after going Back to reread an earlier screen.
   */
  reached: number;
  /** Whether the module's takeaway has been reached. */
  completed: boolean;
}

/**
 * The progress document, written to State and localStorage as it is. A module with nothing
 * reached is left out. `version` changes only when the shape does.
 */
export type ProgressDoc = {
  readonly version: 1;
  readonly modules: Readonly<Record<string, ModuleRecord>>;
};

/** The progress of a learner who has done nothing yet. */
export const EMPTY_PROGRESS: ProgressDoc = { version: 1, modules: {} };

const EMPTY_RECORD: ModuleRecord = { answers: NO_ANSWERS, reached: 0, completed: false };

const scoreSchema = z.object({ raw: z.number(), max: z.number() });
const docSchema = z.object({
  version: z.literal(1),
  modules: z.record(
    z.string(),
    z.object({
      answers: z.record(z.string(), z.object({ answer: z.json().optional(), score: scoreSchema.optional(), right: z.boolean().optional() })),
      reached: z.number().int().min(0),
      completed: z.boolean(),
    }),
  ),
});

/** The progress document a stored value holds, or null when it is not one (corrupt, foreign, another version). */
export function parseProgress(value: unknown): ProgressDoc | null {
  const parsed = docSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** What the store takes in: a screen's event with where it came from, or a visit to a module's screen (from 1). */
export type ProgressCause = { type: 'event'; event: ScreenEvent; module: Module; screen: Screen } | { type: 'visit'; module: Module; screen: number };

/**
 * What a cause changed, in the terms the statements need (PLAN.md §6 "Statements"), in the
 * order they are to be sent: a module newly completed; the course newly completed (all its
 * modules are); the course's score changed after it was complete (completed is sent again).
 */
export type ProgressEffect =
  | { type: 'module-completed'; module: Module }
  | { type: 'course-completed'; score: Score }
  | { type: 'course-score-changed'; score: Score };

/** The course as the views need it: its modules with their screens. */
export interface ProgressCourse {
  readonly modules: readonly Module[];
}

/** A module's record, or the empty one. */
export function moduleRecord(doc: ProgressDoc, slug: string): ModuleRecord {
  return doc.modules[slug] ?? EMPTY_RECORD;
}

/** A module's answers, the same object until they change (so the frame's memos hold). */
export function moduleAnswers(doc: ProgressDoc, slug: string): ModuleAnswers {
  return moduleRecord(doc, slug).answers;
}

function withRecord(doc: ProgressDoc, slug: string, change: (record: ModuleRecord) => ModuleRecord): ProgressDoc {
  const before = moduleRecord(doc, slug);
  const after = change(before);
  return after === before ? doc : { ...doc, modules: { ...doc.modules, [slug]: after } };
}

/**
 * The document once a cause is taken in; the same object when nothing changed. An event
 * records its answer (the latest counts), reaches its screen, and on `takeaway-reached`
 * completes the module; a visit reaches its screen (clamped to the module's screens).
 */
export function takeCause(doc: ProgressDoc, cause: ProgressCause): ProgressDoc {
  const { module } = cause;
  if (cause.type === 'visit') {
    const reached = Math.min(Math.max(cause.screen, 1), module.screens.length);
    return withRecord(doc, module.slug, (record) => (reached > record.reached ? { ...record, reached } : record));
  }
  const { event, screen } = cause;
  return withRecord(doc, module.slug, (record) => {
    const answers = recordEvent(record.answers, event);
    const reached = Math.max(record.reached, module.screens.indexOf(screen) + 1);
    const completed = record.completed || event.type === 'takeaway-reached';
    if (answers === record.answers && reached === record.reached && completed === record.completed) return record;
    return { answers, reached, completed };
  });
}

/** Where a learner is with a module: nothing reached, reached but not complete, or complete. */
export type ModuleStatus = 'not-started' | 'in-progress' | 'done';

export function moduleStatus(doc: ProgressDoc, slug: string): ModuleStatus {
  const record = moduleRecord(doc, slug);
  if (record.completed) return 'done';
  return record.reached > 0 ? 'in-progress' : 'not-started';
}

/** How many of the course's modules are complete. */
export function modulesDone(course: ProgressCourse, doc: ProgressDoc): number {
  return course.modules.filter((m) => moduleRecord(doc, m.slug).completed).length;
}

/** Whether every module of the course is complete. */
export function courseComplete(course: ProgressCourse, doc: ProgressDoc): boolean {
  return course.modules.length > 0 && modulesDone(course, doc) === course.modules.length;
}

/** The course's score: every module's (the latest answer of each scored screen) out of what the content gives them, 28. */
export function courseScore(course: ProgressCourse, doc: ProgressDoc): Score {
  let raw = 0;
  let max = 0;
  for (const module of course.modules) {
    const { score } = moduleProgress(module, moduleAnswers(doc, module.slug));
    raw += score.raw;
    max += score.max;
  }
  return { raw, max };
}

/** What a cause changed between two documents, in the order the statements are sent. */
export function progressEffects(course: ProgressCourse, before: ProgressDoc, after: ProgressDoc): ProgressEffect[] {
  if (before === after) return [];
  const effects: ProgressEffect[] = course.modules
    .filter((m) => !moduleRecord(before, m.slug).completed && moduleRecord(after, m.slug).completed)
    .map((module) => ({ type: 'module-completed', module }));
  if (courseComplete(course, after)) {
    const score = courseScore(course, after);
    if (!courseComplete(course, before)) effects.push({ type: 'course-completed', score });
    else {
      const was = courseScore(course, before);
      if (was.raw !== score.raw || was.max !== score.max) effects.push({ type: 'course-score-changed', score });
    }
  }
  return effects;
}

/** A cause taken in: the next document, and what it changed. */
export function step(course: ProgressCourse, doc: ProgressDoc, cause: ProgressCause): { doc: ProgressDoc; effects: ProgressEffect[] } {
  const next = takeCause(doc, cause);
  return { doc: next, effects: progressEffects(course, doc, next) };
}

/**
 * Where the home page's primary button goes, and what it says: start the first module before
 * anything is reached; continue the first module not complete, at the screen reached in it (or
 * its first), while the course is under way; review from the first module once every module is
 * complete.
 */
export interface HomeNext {
  action: 'start' | 'continue' | 'review';
  slug: string;
  screen: number;
}

export function homeNext(course: ProgressCourse, doc: ProgressDoc): HomeNext {
  const first = course.modules[0];
  const open = course.modules.find((m) => !moduleRecord(doc, m.slug).completed);
  if (!open) return { action: 'review', slug: first.slug, screen: 1 };
  if (course.modules.every((m) => moduleStatus(doc, m.slug) === 'not-started')) return { action: 'start', slug: first.slug, screen: 1 };
  return { action: 'continue', slug: open.slug, screen: Math.max(moduleRecord(doc, open.slug).reached, 1) };
}
