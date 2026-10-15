import { describe, expect, it } from 'vitest';
import { course as realCourse, type Module, type Screen } from '../content/index.ts';
import { fixtureCourse, fixtureTakeaway } from '../course/frame/fixture.ts';
import { scoredItem } from '../course/frame/progress.ts';
import type { ScreenEvent } from '../screens/types.ts';
import {
  courseComplete,
  courseScore,
  EMPTY_PROGRESS,
  homeNext,
  moduleAnswers,
  moduleRecord,
  modulesDone,
  moduleStatus,
  parseProgress,
  scaledScore,
  step,
  takeCause,
  type ProgressCause,
  type ProgressCourse,
  type ProgressDoc,
} from './progress.ts';

const options = [
  { label: 'Wrong', right: false, feedback: 'No.' },
  { label: 'Right', right: true, feedback: 'Yes.' },
];
const check = (slug: string): Screen => ({ type: 'choose', slug, scored: true, mode: 'single', heading: slug, options });
const scene: Screen = { type: 'scene', heading: 'Scene', blocks: [{ type: 'paragraph', text: 'Text.' }] };
const course = fixtureCourse({ '00': [scene, check('check-1'), check('check-2'), fixtureTakeaway()] });
const [m00, m01] = course.modules;

const answered = (slug: string, right: boolean, raw = right ? 1 : 0, max = 1): ScreenEvent => ({
  type: 'answered',
  slug,
  right,
  score: { raw, max },
  response: right ? 'Right' : 'Wrong',
  answer: { picked: [right ? 1 : 0] },
});
const takeaway: ScreenEvent = { type: 'takeaway-reached' };

/** The cause of an event from the screen of `module` that reports it (the takeaway for takeaway-reached). */
function from(module: Module, event: ScreenEvent): ProgressCause {
  const screen = module.screens.find((s) => (event.type === 'takeaway-reached' ? s.type === 'takeaway' : 'slug' in s && s.slug === event.slug));
  if (!screen) throw new Error(`no screen for ${JSON.stringify(event)}`);
  return { type: 'event', event, module, screen };
}
const visit = (module: Module, screen: number): ProgressCause => ({ type: 'visit', module, screen });
const play = (causes: ProgressCause[], doc: ProgressDoc = EMPTY_PROGRESS) => causes.reduce(takeCause, doc);

/** Every scored screen of these modules answered with full marks, then (unless told not to) each takeaway reached. */
function playAll(of: ProgressCourse, doc: ProgressDoc = EMPTY_PROGRESS, { complete = true } = {}): ProgressDoc {
  const causes = of.modules.flatMap((module) => [
    ...module.screens.flatMap((screen): ProgressCause[] => {
      const item = scoredItem(screen);
      return item ? [{ type: 'event', module, screen, event: answered(item.slug, true, item.max, item.max) }] : [];
    }),
    ...(complete ? [from(module, takeaway)] : []),
  ]);
  return play(causes, doc);
}

describe('takeCause', () => {
  it('reaches the screen visited, keeps the furthest when the learner goes Back, and clamps to the module', () => {
    const doc = play([visit(m00, 1), visit(m00, 3)]);
    expect(moduleRecord(doc, '00')).toEqual({ answers: {}, reached: 3, completed: false });
    expect(takeCause(doc, visit(m00, 2))).toBe(doc);
    expect(moduleRecord(play([visit(m00, 99)]), '00').reached).toBe(4);
  });

  it('counts the latest answer: wrong then right counts the right one', () => {
    const doc = play([from(m00, answered('check-1', false)), from(m00, answered('check-1', true))]);
    expect(moduleAnswers(doc, '00')['check-1']).toEqual({ answer: { picked: [1] }, score: { raw: 1, max: 1 }, right: true });
    expect(courseScore(course, doc).raw).toBe(1);
  });

  it('reaches the screen an event came from, and keeps every answer through JSON', () => {
    const doc = play([from(m00, answered('check-2', true))]);
    expect(moduleRecord(doc, '00').reached).toBe(3);
    expect(JSON.parse(JSON.stringify(doc))).toEqual(doc);
  });

  it('completes the module at its takeaway, once: reaching it again changes nothing', () => {
    const doc = play([visit(m00, 4), from(m00, takeaway)]);
    expect(moduleRecord(doc, '00').completed).toBe(true);
    expect(takeCause(doc, from(m00, takeaway))).toBe(doc);
  });
});

describe('the views', () => {
  it('reads a module not started, in progress once reached, and done at its takeaway', () => {
    expect(moduleStatus(EMPTY_PROGRESS, '00')).toBe('not-started');
    const reached = play([visit(m00, 1)]);
    expect(moduleStatus(reached, '00')).toBe('in-progress');
    expect(moduleStatus(reached, '01')).toBe('not-started');
    const done = play([from(m00, takeaway)], reached);
    expect(moduleStatus(done, '00')).toBe('done');
    expect(modulesDone(course, done)).toBe(1);
  });

  it("scores the module 2 of 2 once both checks are right, out of the content's points", () => {
    expect(courseScore(course, EMPTY_PROGRESS)).toEqual({ raw: 0, max: 2 });
    const doc = play([from(m00, answered('check-1', true)), from(m00, answered('check-2', false)), from(m00, answered('check-2', true))]);
    expect(courseScore(course, doc)).toEqual({ raw: 2, max: 2 });
  });

  it('completes the real course at 28 of 28, scaled 1, once all eight modules are done', () => {
    expect(courseScore(realCourse, EMPTY_PROGRESS)).toEqual({ raw: 0, max: 28 });
    const doc = playAll(realCourse);
    expect(modulesDone(realCourse, doc)).toBe(8);
    expect(courseComplete(realCourse, doc)).toBe(true);
    expect(courseScore(realCourse, doc)).toEqual({ raw: 28, max: 28 });
    expect(scaledScore(courseScore(realCourse, doc))).toBe(1);
  });

  it('is not complete with seven of eight done', () => {
    const seven = playAll({ modules: realCourse.modules.slice(0, 7) });
    expect(modulesDone(realCourse, seven)).toBe(7);
    expect(courseComplete(realCourse, seven)).toBe(false);
    expect(scaledScore({ raw: 0, max: 0 })).toBe(0);
  });
});

describe('homeNext', () => {
  it('starts before anything is reached', () => {
    expect(homeNext(course, EMPTY_PROGRESS)).toEqual({ action: 'start' });
  });

  it('continues the first module not done, at the screen reached', () => {
    expect(homeNext(course, play([visit(m00, 3)]))).toEqual({ action: 'continue', slug: '00', screen: 3 });
    expect(homeNext(course, play([visit(m01, 2)]))).toEqual({ action: 'continue', slug: '00', screen: 1 });
  });

  it('continues module 01 at its first screen once module 00 is done', () => {
    expect(homeNext(course, play([visit(m00, 4), from(m00, takeaway)]))).toEqual({ action: 'continue', slug: '01', screen: 1 });
  });

  it('reviews from the first module once every module is done', () => {
    expect(homeNext(course, playAll(course))).toEqual({ action: 'review' });
  });
});

describe('step: the changes surfaced for the statements', () => {
  it('surfaces nothing for a visit or an answer', () => {
    expect(step(course, EMPTY_PROGRESS, visit(m00, 1)).effects).toEqual([]);
    expect(step(course, EMPTY_PROGRESS, from(m00, answered('check-1', true))).effects).toEqual([]);
  });

  it('surfaces a module completed once, the first time its takeaway is reached', () => {
    const first = step(course, EMPTY_PROGRESS, from(m00, takeaway));
    expect(first.effects).toEqual([{ type: 'module-completed', module: m00 }]);
    expect(step(course, first.doc, from(m00, takeaway))).toEqual({ doc: first.doc, effects: [] });
  });

  it('surfaces the course completed with its score when the last module completes, after that module', () => {
    const allButLast = playAll({ modules: realCourse.modules.slice(0, 7) });
    const last = realCourse.modules[7];
    const answeredAll = playAll({ modules: [last] }, allButLast, { complete: false });
    const { doc, effects } = step(realCourse, answeredAll, from(last, takeaway));
    expect(effects).toEqual([
      { type: 'module-completed', module: last },
      { type: 'course-completed', score: { raw: 28, max: 28 } },
    ]);
    expect(courseComplete(realCourse, doc)).toBe(true);
  });

  it('surfaces the new score when a scored item changes after the course is complete, and nothing when it stays the same', () => {
    const done = playAll(realCourse);
    const m00real = realCourse.modules[0];
    const wrong = step(realCourse, done, from(m00real, answered('check-1', false)));
    expect(wrong.effects).toEqual([{ type: 'course-score-changed', score: { raw: 27, max: 28 } }]);
    const again = step(realCourse, wrong.doc, from(m00real, answered('check-1', false)));
    expect(again.effects).toEqual([]);
    expect(step(realCourse, again.doc, from(m00real, answered('check-1', true))).effects).toEqual([
      { type: 'course-score-changed', score: { raw: 28, max: 28 } },
    ]);
  });
});

describe('parseProgress', () => {
  it('takes a progress document back as it was written', () => {
    const doc = playAll(course);
    expect(parseProgress(JSON.parse(JSON.stringify(doc)))).toEqual(doc);
    expect(parseProgress(EMPTY_PROGRESS)).toEqual(EMPTY_PROGRESS);
  });

  it('ignores a corrupt or foreign document', () => {
    const record = { answers: {}, reached: 1, completed: false };
    for (const value of [
      null,
      'progress',
      [],
      {},
      { modules: {} },
      { version: 2, modules: {} },
      { version: 1, modules: [] },
      { version: 1, modules: { '00': { ...record, reached: -1 } } },
      { version: 1, modules: { '00': { ...record, reached: 1.5 } } },
      { version: 1, modules: { '00': { answers: {}, reached: 1 } } },
      { version: 1, modules: { '00': { ...record, answers: [] } } },
      { version: 1, modules: { '00': { ...record, answers: { c: { score: { raw: '1', max: 1 } } } } } },
      { version: 1, modules: { '00': { ...record, answers: { c: { right: 'yes' } } } } },
    ]) {
      expect(parseProgress(value), JSON.stringify(value)).toBeNull();
    }
  });
});
