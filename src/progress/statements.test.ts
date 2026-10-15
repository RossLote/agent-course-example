import type { Statement } from '@xapi/xapi';
import { beforeEach, describe, expect, it } from 'vitest';
import { course, type Module, type Screen, type ScreenOf } from '../content/index.ts';
import type { ScreenEvent, Score } from '../screens/types.ts';
import { LAUNCH_ACTIVITY_ID, REGISTRATION, sparkLaunch } from '../xapi/fixtures.ts';
import type { Launch } from '../xapi/launch.ts';
import { createMemoryTracker } from '../xapi/tracker.ts';
import { connectStatements } from './statements.ts';
import { createProgressStore } from './store.ts';

// The real course, played through a fresh store connected to a memory tracker. The events are
// built from the content the way the screens build them (src/screens/*/index.tsx).
const COURSE_ID = course.id;
function mod(slug: string): Module {
  const module = course.modules.find((m) => m.slug === slug);
  if (!module) throw new Error(`no module ${slug}`);
  return module;
}

function screenOf<T extends Screen['type']>(module: Module, type: T, slug?: string): ScreenOf<T> {
  const screen = module.screens.find((s): s is ScreenOf<T> => s.type === type && (slug === undefined || ('slug' in s && s.slug === slug)));
  if (!screen) throw new Error(`module ${module.slug} has no ${type} ${slug ?? ''}`);
  return screen;
}

/** A Check press on a choose: `answered` when scored, else `interacted` per pick, as ChooseScreen sends them. */
function choose(module: Module, slug: string, picked: number[]): ScreenEvent[] {
  const { options, scored } = screenOf(module, 'choose', slug);
  const answer = { picked };
  if (!scored) return picked.map((i) => ({ type: 'interacted', slug, response: options[i].label, answer }));
  const right = options.every((o, i) => o.right === picked.includes(i));
  return [{ type: 'answered', slug, right, score: { raw: right ? 1 : 0, max: 1 }, response: picked.map((i) => options[i].label).join('; '), answer }];
}

/** A Check press on a match with each row's target, as MatchScreen sends it. */
function match(module: Module, slug: string, picks: string[]): ScreenEvent[] {
  const { rows, targets, scored } = screenOf(module, 'match', slug);
  const answer = { picks };
  const said = rows.map((row, i) => `${row.text}: ${targets.find((t) => t.id === picks[i])?.label}`);
  if (!scored) return said.map((response) => ({ type: 'interacted', slug, response, answer }));
  const right = rows.filter((row, i) => picks[i] === row.key).length;
  return [{ type: 'answered', slug, right: right === rows.length, score: { raw: right, max: rows.length }, response: said.join('; '), answer }];
}

/** A Check press on an order with its cards in their right order, as OrderScreen sends it. */
function orderRight(module: Module, slug: string): ScreenEvent {
  const { cards } = screenOf(module, 'order', slug);
  const response = cards.map((c) => c.label).join('; ');
  return { type: 'answered', slug, right: true, score: { raw: cards.length, max: cards.length }, response, answer: { order: cards.map((c) => c.id) } };
}

/** Brief chip picks (question, chip), each reported as BriefScreen reports it. */
function brief(module: Module, slug: string, picks: [number, number][]): ScreenEvent[] {
  const questions = screenOf(module, 'brief', slug).rounds.flatMap((r) => r.questions);
  return picks.map(([q, c]) => ({ type: 'interacted', slug, response: `D${q + 1}: ${questions[q].chips[c].label}`, answer: {} }));
}

const fridgeEnded = (name: string, score: Score): ScreenEvent => ({ type: 'fridge-ended', slug: name, score });
const takeaway: ScreenEvent = { type: 'takeaway-reached' };

/** Module 07's walls, every row named right. */
const WALLS_RIGHT = ['record', 'done', 'gate', 'agents', 'evidence', 'arrow'];

/** A learner with a fresh store and a memory tracker, connected; `at` plays events on a module's screen. */
function learner(launch: Launch | null = null) {
  const tracker = createMemoryTracker(course);
  const store = createProgressStore(course, tracker);
  const stop = connectStatements(store, tracker, course, launch);
  const at = (module: Module, screen: Screen, events: ScreenEvent[]) => {
    store.take({ type: 'visit', module, screen: module.screens.indexOf(screen) + 1 });
    for (const event of events) store.take({ type: 'event', event, module, screen });
  };
  const sent = () => tracker.log?.list() ?? [];
  return { store, at, sent, stop };
}

type Learner = ReturnType<typeof learner>;

const fridgeScreen = (module: Module) => module.screens.find((s) => s.type === 'fridge' || s.type === 'compare') ?? module.screens[0];
const last = (module: Module) => module.screens[module.screens.length - 1];

/** Module 00 as the ACCEPTANCE BAR plays it: tick all five, the one-shot's timer runs out after two drops, check 1 wrong then right, check 2 right, the takeaway twice (StrictMode). */
function play00({ at }: Learner) {
  const m = mod('00');
  at(m, screenOf(m, 'choose', 'what-went-wrong'), choose(m, 'what-went-wrong', [0, 1, 2, 3, 4]));
  at(m, fridgeScreen(m), [fridgeEnded('one-shot', { raw: 50, max: 1400 })]);
  at(m, screenOf(m, 'choose', 'check-1'), [...choose(m, 'check-1', [0]), ...choose(m, 'check-1', [1])]);
  at(m, screenOf(m, 'choose', 'check-2'), choose(m, 'check-2', [1]));
  at(m, last(m), [takeaway, takeaway]);
}

/** Both checks of a module right, then its takeaway. */
function checksAndTakeaway({ at }: Learner, m: Module) {
  for (const slug of ['check-1', 'check-2']) at(m, screenOf(m, 'choose', slug), choose(m, slug, [1]));
  at(m, last(m), [takeaway, takeaway]);
}

/** Every module after 00 as the ACCEPTANCE BAR plays it, every scored item right. */
function play01to07(l: Learner) {
  const { at } = l;
  const m01 = mod('01');
  const firstRound: [number, number][] = [0, 1, 2, 3, 4].map((q) => [q, 0]);
  const defaults: [number, number][] = [5, 6, 7].map((q) => [q, 0]);
  at(m01, screenOf(m01, 'brief'), brief(m01, 'fridge-brief', [...firstRound, ...defaults]));
  checksAndTakeaway(l, m01);

  const m02 = mod('02');
  at(m02, screenOf(m02, 'choose', 'write-the-acceptance'), choose(m02, 'write-the-acceptance', [0, 2, 4]));
  at(m02, screenOf(m02, 'choose', 'epic-review'), choose(m02, 'epic-review', [1]));
  checksAndTakeaway(l, m02);

  const m03 = mod('03');
  at(m03, screenOf(m03, 'choose', 'build-the-box'), choose(m03, 'build-the-box', [0, 3, 5, 6]));
  checksAndTakeaway(l, m03);

  const m04 = mod('04');
  const verdict = screenOf(m04, 'choose', 'verdict');
  at(m04, verdict, [...choose(m04, 'verdict', [1]), ...choose(m04, 'verdict', [0])]);
  at(m04, screenOf(m04, 'match', 'who-catches-it'), match(m04, 'who-catches-it', ['simplify', 'review', 'adversarial', 'epic']));
  checksAndTakeaway(l, m04);

  const m05 = mod('05');
  at(m05, screenOf(m05, 'choose', 'merge-or-not'), choose(m05, 'merge-or-not', [1]));
  at(m05, fridgeScreen(m05), [fridgeEnded('accepted', { raw: 7, max: 8 })]);
  checksAndTakeaway(l, m05);

  const m06 = mod('06');
  at(m06, screenOf(m06, 'choose', 'what-would-you-change'), choose(m06, 'what-would-you-change', [1, 3, 4]));
  checksAndTakeaway(l, m06);

  const m07 = mod('07');
  at(m07, screenOf(m07, 'order'), [orderRight(m07, 'order-the-loop')]);
  at(m07, screenOf(m07, 'match'), match(m07, 'name-the-wall', WALLS_RIGHT));
  at(m07, last(m07), [takeaway, takeaway]);
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

const opt = (m: Module, slug: string, i: number) => screenOf(m, 'choose', slug).options[i].label;

beforeEach(() => localStorage.clear());

describe('statements from the progress store', () => {
  it('module 00 as the bar plays it: interacted on Check, answered per press, the fridge, completed on the module once', () => {
    const l = learner();
    play00(l);
    const m = mod('00');
    expect(l.sent().map(short)).toEqual([
      ...[0, 1, 2, 3, 4].map((i) => `interacted modules/00/interactions/what-went-wrong ${JSON.stringify(opt(m, 'what-went-wrong', i))}`),
      'completed fridge/one-shot 50/1400 scaled 0.0357 completion',
      `answered modules/00/checks/1 ${JSON.stringify(opt(m, 'check-1', 0))} wrong 0/1 scaled 0`,
      `answered modules/00/checks/1 ${JSON.stringify(opt(m, 'check-1', 1))} right 1/1 scaled 1`,
      `answered modules/00/checks/2 ${JSON.stringify(opt(m, 'check-2', 1))} right 1/1 scaled 1`,
      'completed modules/00',
    ]);
  });

  it('completes the course once, with completion and 28 of 28, when the last module completes', () => {
    const l = learner();
    play00(l);
    play01to07(l);
    const onCourse = l.sent().filter((s) => objectId(s) === COURSE_ID);
    expect(onCourse).toHaveLength(1);
    expect(onCourse[0].verb.id).toBe('http://adlnet.gov/expapi/verbs/completed');
    expect(onCourse[0].result).toEqual({ completion: true, score: { raw: 28, min: 0, max: 28, scaled: 1 } });
    expect(l.sent().map(short).slice(-2)).toEqual(['completed modules/07', 'completed course 28/28 scaled 1 completion']);
    expect(l.sent().map(short).filter((s) => /^completed modules\/0\d$/.test(s))).toHaveLength(8);
    const count = (verb: string) => l.sent().filter((s) => s.verb.display?.['en-US'] === verb).length;
    expect([count('interacted'), count('answered'), count('completed')]).toEqual([31, 17, 11]);
  });

  it('sends completed on the course again with the new score when a scored item changes afterwards, and not otherwise', () => {
    const l = learner();
    play00(l);
    play01to07(l);
    const before = l.sent().length;
    const m07 = mod('07');
    const walls = screenOf(m07, 'match');
    l.at(m07, walls, match(m07, 'name-the-wall', ['done', 'record', ...WALLS_RIGHT.slice(2)]));
    l.at(mod('00'), last(mod('00')), [takeaway]);
    l.at(m07, walls, match(m07, 'name-the-wall', ['done', 'record', ...WALLS_RIGHT.slice(2)]));
    expect(l.sent().slice(before).map(short)).toEqual([
      expect.stringMatching(/^answered modules\/07\/interactions\/name-the-wall ".*" wrong 4\/6 scaled 0.6667$/),
      'completed course 26/28 scaled 0.9286 completion',
      expect.stringMatching(/^answered modules\/07\/interactions\/name-the-wall ".*" wrong 4\/6 scaled 0.6667$/),
    ]);
  });

  it('with a launch: parent and grouping on the module, check, interaction and fridge statements; the launch id as the course object', () => {
    const launch = sparkLaunch();
    expect(launch.activityId).not.toBe(COURSE_ID);
    const l = learner(launch);
    play00(l);
    play01to07(l);
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
    play01to07(l);
    const walls = l.sent().find((s) => short(s).startsWith('answered modules/07/interactions/name-the-wall'));
    expect(walls?.result?.response).toContain('after two wrong drops of the same item, which');
    for (const s of l.sent()) {
      expect(s.result?.response ?? '').not.toContain('*');
      expect(s.object.objectType === 'Activity' && s.object.definition?.name?.['en-US']).not.toContain('*');
    }
  });

  it('sends nothing for a visit, and nothing once disconnected', () => {
    const l = learner();
    const m = mod('00');
    l.store.take({ type: 'visit', module: m, screen: 3 });
    expect(l.sent()).toEqual([]);
    l.stop();
    play00(l);
    expect(l.sent()).toEqual([]);
  });
});
