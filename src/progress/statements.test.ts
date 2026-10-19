import type { Statement } from '@xapi/xapi';
import { beforeEach, describe, expect, it } from 'vitest';
import { activityPath, course as realCourse, fridgeActivityPath, moduleActivityPath, type Course, type Module, type Screen, type ScreenOf } from '../content/index.ts';
import { fixtureCheck, fixtureCourse, fixtureFridge, fixtureMatch, fixtureModule, fixtureOrder, fixtureScene, fixtureTakeaway } from '../course/frame/fixture.ts';
import type { ScreenEvent, Score } from '../screens/types.ts';
import { LAUNCH_ACTIVITY_ID, REGISTRATION, sparkLaunch } from '../xapi/fixtures.ts';
import type { Launch } from '../xapi/launch.ts';
import { createMemoryTracker } from '../xapi/tracker.ts';
import { courseScore, EMPTY_PROGRESS } from './progress.ts';
import { connectStatements } from './statements.ts';
import { createProgressStore } from './store.ts';

// A course played through a fresh store connected to a memory tracker. The events are built from
// the screens the way the screens build them (src/screens/*/index.tsx). Most tests play an inline
// course of four modules with a screen of every kind; the last plays the real course, whatever
// its modules hold, and builds what it expects from what it reads.

/** A Check press on a choose: `answered` when scored, else `interacted` per pick, as ChooseScreen sends them. */
function choose({ slug, options, scored }: ScreenOf<'choose'>, picked: number[]): ScreenEvent[] {
  const answer = { picked };
  if (!scored) return picked.map((i) => ({ type: 'interacted', slug, response: options[i].label, answer }));
  const right = options.every((o, i) => o.right === picked.includes(i));
  return [{ type: 'answered', slug, right, score: { raw: right ? 1 : 0, max: 1 }, response: picked.map((i) => options[i].label).join('; '), answer }];
}

/** A Check press on a match with each row's target, as MatchScreen sends it. */
function match({ slug, rows, targets, scored }: ScreenOf<'match'>, picks: string[]): ScreenEvent[] {
  const answer = { picks };
  const said = rows.map((row, i) => `${row.text}: ${targets.find((t) => t.id === picks[i])?.label}`);
  if (!scored) return said.map((response) => ({ type: 'interacted', slug, response, answer }));
  const right = rows.filter((row, i) => picks[i] === row.key).length;
  return [{ type: 'answered', slug, right: right === rows.length, score: { raw: right, max: rows.length }, response: said.join('; '), answer }];
}

/** A Check press on an order with its cards in their right order, as OrderScreen sends it. */
function orderRight({ slug, cards }: ScreenOf<'order'>): ScreenEvent {
  const response = cards.map((c) => c.label).join('; ');
  return { type: 'answered', slug, right: true, score: { raw: cards.length, max: cards.length }, response, answer: { order: cards.map((c) => c.id) } };
}

/** Brief chip picks (question, chip), each reported as BriefScreen reports it. */
function brief({ slug, rounds }: ScreenOf<'brief'>, picks: [number, number][]): ScreenEvent[] {
  const questions = rounds.flatMap((r) => r.questions);
  return picks.map(([q, c]) => ({ type: 'interacted', slug, response: `D${q + 1}: ${questions[q].chips[c].label}`, answer: {} }));
}

/** No response and no activity name sent carries an emphasis marker. */
function expectPlainText(sent: readonly Statement[]) {
  for (const s of sent) {
    expect(s.result?.response ?? '').not.toContain('*');
    expect(s.object.objectType === 'Activity' && s.object.definition?.name?.['en-US']).not.toContain('*');
  }
}

const fridgeEnded = (name: string, score: Score): ScreenEvent => ({ type: 'fridge-ended', slug: name, score });
const takeaway: ScreenEvent = { type: 'takeaway-reached' };

// ---------------------------------------------------------------------------------------------
// The inline course.

const check = (slug: string) => fixtureCheck(slug);
const scene = fixtureScene();
const chips = (text: string) => [
  { label: `${text} yes`, decision: 'Yes.', recommended: true },
  { label: `${text} no`, decision: 'No.' },
];

const tick: ScreenOf<'choose'> = {
  type: 'choose',
  slug: 'what-went-wrong',
  scored: false,
  mode: 'multi',
  heading: 'Tick everything that went wrong.',
  options: ['One', 'Two', 'Three', 'Four', 'Five'].map((label, i) => ({ label, right: i < 3, feedback: 'Why.' })),
};
const fridgeScreen: ScreenOf<'fridge'> = { type: 'fridge', heading: 'Try it', fridge: 'one-shot' };
const fridgeBrief: ScreenOf<'brief'> = {
  type: 'brief',
  slug: 'fridge-brief',
  heading: 'The brief',
  opening: 'A fridge.',
  rounds: [
    { message: 'Two questions.', questions: ['First?', 'Second?'].map((text) => ({ text, chips: chips(text) })) },
    { message: 'One more.', questions: [{ text: 'Third?', chips: chips('Third?') }] },
  ],
  defaults: { label: 'Your defaults', reply: 'Your defaults.' },
  closing: 'Done.',
  panel: { heading: 'The record', note: '{filled} of {total}' },
};
const verdict: ScreenOf<'choose'> = {
  type: 'choose',
  slug: 'verdict',
  scored: false,
  mode: 'single',
  heading: 'Your verdict?',
  options: [
    { label: 'Confirmed.', right: true, feedback: 'Yes.' },
    { label: 'Refuted.', right: false, feedback: 'No.' },
  ],
};
const compare: ScreenOf<'compare'> = {
  type: 'compare',
  heading: 'The two fridges',
  left: 'one-shot',
  right: 'accepted',
  table: { rows: [{ aspect: 'A', left: 'L', right: 'R', wall: 'W' }] },
};
/** A scored match of three rows, one of them in emphasis. */
const walls: ScreenOf<'match'> = {
  type: 'match',
  slug: 'name-the-wall',
  scored: true,
  heading: 'Name the wall',
  targets: [
    { id: 'record', label: 'the record' },
    { id: 'gate', label: 'the gate' },
    { id: 'arrow', label: 'the arrow' },
  ],
  rows: [
    { text: 'A counter nobody asked for.', key: 'record', feedback: 'The record.' },
    { text: 'It changed another file too.', key: 'gate', feedback: 'The gate.' },
    { text: 'The hint shows after two wrong drops *of the same item*, which nobody specified.', key: 'arrow', feedback: 'The arrow.' },
  ],
};
const WALLS_RIGHT = ['record', 'gate', 'arrow'];

/** Four modules: 00 as round one's (tick everything, a fridge, two checks), 01 a brief, 02 a verdict, a match and the compare, 03 an order and a scored match. */
const [m00, m01, m02, m03] = [
  fixtureModule('00', [scene, tick, fridgeScreen, check('check-1'), check('check-2'), fixtureTakeaway()]),
  fixtureModule('01', [scene, fridgeBrief, check('check-1'), check('check-2'), fixtureTakeaway()]),
  fixtureModule('02', [scene, verdict, fixtureMatch, check('check-1'), check('check-2'), compare, fixtureTakeaway()]),
  fixtureModule('03', [scene, fixtureOrder, walls, fixtureTakeaway()]),
];
const course: Course = {
  ...fixtureCourse(),
  modules: [m00, m01, m02, m03],
  fridges: { 'one-shot': fixtureFridge('The one-shot'), accepted: fixtureFridge('What you accepted') },
};
const COURSE_ID = course.id;

/** A learner with a fresh store and a memory tracker, connected; `at` plays events on a module's screen. */
function learner(of: Course = course, launch: Launch | null = null) {
  const tracker = createMemoryTracker(of);
  const store = createProgressStore(of, tracker);
  const stop = connectStatements(store, tracker, of, launch);
  const at = (module: Module, screen: Screen, events: ScreenEvent[]) => {
    store.take({ type: 'visit', module, screen: module.screens.indexOf(screen) + 1 });
    for (const event of events) store.take({ type: 'event', event, module, screen });
  };
  const sent = () => tracker.log?.list() ?? [];
  return { store, at, sent, stop };
}

type Learner = ReturnType<typeof learner>;

const last = (module: Module) => module.screens[module.screens.length - 1];
const checksOf = (module: Module) => module.screens.filter((s): s is ScreenOf<'choose'> => s.type === 'choose' && s.scored);

/** Module 00 as round one's bar plays it: tick all five, the one-shot's timer runs out after two drops, check 1 wrong then right, check 2 right, the takeaway twice (StrictMode). */
function play00({ at }: Learner) {
  const [check1, check2] = checksOf(m00);
  at(m00, tick, choose(tick, [0, 1, 2, 3, 4]));
  at(m00, fridgeScreen, [fridgeEnded('one-shot', { raw: 50, max: 1400 })]);
  at(m00, check1, [...choose(check1, [0]), ...choose(check1, [1])]);
  at(m00, check2, choose(check2, [1]));
  at(m00, last(m00), [takeaway, takeaway]);
}

/** Both checks of a module right, then its takeaway. */
function checksAndTakeaway({ at }: Learner, m: Module) {
  for (const s of checksOf(m)) at(m, s, choose(s, [1]));
  at(m, last(m), [takeaway, takeaway]);
}

/** Every module after 00, every scored item right. */
function playTheRest(l: Learner) {
  const { at } = l;
  at(m01, fridgeBrief, brief(fridgeBrief, [0, 1, 2].map((q) => [q, 0])));
  checksAndTakeaway(l, m01);

  at(m02, verdict, [...choose(verdict, [1]), ...choose(verdict, [0])]);
  at(m02, fixtureMatch, match(fixtureMatch, fixtureMatch.rows.map((r) => r.key)));
  at(m02, compare, [fridgeEnded('accepted', { raw: 7, max: 8 })]);
  checksAndTakeaway(l, m02);

  at(m03, fixtureOrder, [orderRight(fixtureOrder)]);
  at(m03, walls, match(walls, WALLS_RIGHT));
  at(m03, last(m03), [takeaway, takeaway]);
}

const objectId = (s: Statement) => (s.object.objectType === 'Activity' ? s.object.id : '');

/** A statement in short: verb, object path under the course id ("course" for the course), and its result. */
function short(s: Statement): string {
  const path = objectId(s).replace(COURSE_ID, '') || 'course';
  const r = s.result;
  const parts = [s.verb.display?.['en-US'], path];
  if (r?.response !== undefined) parts.push(JSON.stringify(r.response));
  if (r?.success !== undefined) parts.push(r.success ? 'right' : 'wrong');
  if (r?.score) parts.push(`${r.score.raw}/${r.score.max} scaled ${Number(r.score.scaled?.toFixed(4))}`);
  if (r?.completion) parts.push('completion');
  return parts.join(' ');
}

beforeEach(() => localStorage.clear());

describe('statements from the progress store', () => {
  it('module 00 as the bar plays it: interacted on Check, answered per press, the fridge, completed on the module once', () => {
    const l = learner();
    play00(l);
    expect(l.sent().map(short)).toEqual([
      ...tick.options.map((o) => `interacted modules/00/interactions/what-went-wrong ${JSON.stringify(o.label)}`),
      'completed fridge/one-shot 50/1400 scaled 0.0357 completion',
      'answered modules/00/checks/1 "Wrong" wrong 0/1 scaled 0',
      'answered modules/00/checks/1 "Right" right 1/1 scaled 1',
      'answered modules/00/checks/2 "Right" right 1/1 scaled 1',
      'completed modules/00',
    ]);
  });

  it('completes the course once, with completion and 17 of 17, when the last module completes', () => {
    const l = learner();
    play00(l);
    playTheRest(l);
    const onCourse = l.sent().filter((s) => objectId(s) === COURSE_ID);
    expect(onCourse).toHaveLength(1);
    expect(onCourse[0].verb.id).toBe('http://adlnet.gov/expapi/verbs/completed');
    expect(onCourse[0].result).toEqual({ completion: true, score: { raw: 17, min: 0, max: 17, scaled: 1 } });
    expect(l.sent().map(short).slice(-2)).toEqual(['completed modules/03', 'completed course 17/17 scaled 1 completion']);
    expect(l.sent().map(short).filter((s) => /^completed modules\/\d\d$/.test(s))).toHaveLength(4);
    const count = (verb: string) => l.sent().filter((s) => s.verb.display?.['en-US'] === verb).length;
    expect([count('interacted'), count('answered'), count('completed')]).toEqual([14, 9, 7]);
  });

  it('sends completed on the course again with the new score when a scored item changes afterwards, and not otherwise', () => {
    const l = learner();
    play00(l);
    playTheRest(l);
    const before = l.sent().length;
    const twoWrong = ['gate', 'record', ...WALLS_RIGHT.slice(2)];
    l.at(m03, walls, match(walls, twoWrong));
    l.at(m00, last(m00), [takeaway]);
    l.at(m03, walls, match(walls, twoWrong));
    expect(l.sent().slice(before).map(short)).toEqual([
      expect.stringMatching(/^answered modules\/03\/interactions\/name-the-wall ".*" wrong 1\/3 scaled 0.3333$/),
      'completed course 15/17 scaled 0.8824 completion',
      expect.stringMatching(/^answered modules\/03\/interactions\/name-the-wall ".*" wrong 1\/3 scaled 0.3333$/),
    ]);
  });

  it('with a launch: parent and grouping on the module, check, interaction and fridge statements; the launch id as the course object', () => {
    const launch = sparkLaunch();
    expect(launch.activityId).not.toBe(COURSE_ID);
    const l = learner(course, launch);
    play00(l);
    playTheRest(l);
    const sent = l.sent();
    for (const s of sent) {
      expect(s.context?.registration).toBe(REGISTRATION);
      expect(s.actor).toEqual(launch.actor);
    }
    const courseLevel = sent.filter((s) => objectId(s) === LAUNCH_ACTIVITY_ID);
    const children = sent.filter((s) => objectId(s).startsWith(COURSE_ID));
    expect(courseLevel).toHaveLength(1);
    expect(courseLevel.length + children.length).toBe(sent.length);
    expect(courseLevel[0].context?.contextActivities).toEqual({ grouping: [{ objectType: 'Activity', id: COURSE_ID }] });
    expect(new Set(children.map((s) => s.verb.display?.['en-US']))).toEqual(new Set(['completed', 'answered', 'interacted']));
    for (const s of children) {
      expect(s.context?.contextActivities).toEqual({
        parent: [{ objectType: 'Activity', id: COURSE_ID }],
        grouping: [{ objectType: 'Activity', id: LAUNCH_ACTIVITY_ID }],
      });
    }
  });

  it('sends responses and names as plain text, with no emphasis markers', () => {
    const l = learner();
    play00(l);
    playTheRest(l);
    const said = l.sent().find((s) => short(s).startsWith('answered modules/03/interactions/name-the-wall'));
    expect(said?.result?.response).toContain('after two wrong drops of the same item, which');
    expectPlainText(l.sent());
  });

  it('sends nothing for a visit, and nothing once disconnected', () => {
    const l = learner();
    l.store.take({ type: 'visit', module: m00, screen: 3 });
    expect(l.sent()).toEqual([]);
    l.stop();
    play00(l);
    expect(l.sent()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------
// The real course, whatever its modules hold.

/** The events a learner sends on a screen getting everything right: the right picks, each row's key, the cards in order, each brief question's first chip, the first reply, each fridge played, the takeaway twice. */
function rightEvents(screen: Screen): ScreenEvent[] {
  switch (screen.type) {
    case 'choose':
      return choose(screen, screen.options.flatMap((o, i) => (o.right ? [i] : [])));
    case 'match':
      return match(screen, screen.rows.map((r) => r.key));
    case 'order':
      return [orderRight(screen)];
    case 'brief':
      return brief(screen, screen.rounds.flatMap((r) => r.questions).map((_, q) => [q, 0]));
    case 'chat':
      return screen.replies ? [{ type: 'interacted', slug: screen.slug, response: screen.replies.options[0].label, answer: { reply: 0 } }] : [];
    case 'fridge':
      return [fridgeEnded(screen.fridge, { raw: 1, max: 1 })];
    case 'compare':
      return [fridgeEnded(screen.left, { raw: 1, max: 1 }), fridgeEnded(screen.right, { raw: 1, max: 1 })];
    case 'takeaway':
      return [takeaway, takeaway];
    case 'scene':
      return [];
  }
}

/** What a screen's own event sends, as its verb and its object's path. */
function ownStatement(module: Module, screen: Screen, event: ScreenEvent): string[] {
  switch (event.type) {
    case 'answered':
    case 'interacted':
      return [`${event.type} ${activityPath(module, screen)}`];
    case 'fridge-ended':
      return [`completed ${fridgeActivityPath(event.slug)}`];
    case 'takeaway-reached':
      return [];
  }
}

describe('statements from the real course', () => {
  it('sends each screen its own statement, completed on each module once, then the course once at full marks out of its points, all in plain text', () => {
    const launch = sparkLaunch();
    const l = learner(realCourse, launch);
    const expected: string[] = [];
    for (const module of realCourse.modules) {
      for (const screen of module.screens) {
        const events = rightEvents(screen);
        l.at(module, screen, events);
        expected.push(...events.flatMap((event) => ownStatement(module, screen, event)));
      }
      expected.push(`completed ${moduleActivityPath(module)}`);
    }
    expected.push('completed course');

    const points = courseScore(realCourse, EMPTY_PROGRESS).max;
    const sent = l.sent();
    const path = (s: Statement) => (objectId(s) === launch.activityId ? 'course' : objectId(s).replace(realCourse.id, ''));
    expect(sent.map((s) => `${s.verb.display?.['en-US']} ${path(s)}`)).toEqual(expected);
    expect(points).toBeGreaterThan(0);
    expect(sent.at(-1)?.result).toEqual({ completion: true, score: { raw: points, min: 0, max: points, scaled: 1 } });
    expectPlainText(sent);
  });
});
