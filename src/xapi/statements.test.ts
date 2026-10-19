import { describe, expect, it } from 'vitest';
import { course, type ScreenOf } from '../content/index.ts';
import { fixtureCheck, fixtureModule, fixtureMatch, fixtureOrder, fixtureScene, fixtureTakeaway } from '../course/frame/fixture.ts';
import { ACTOR_JSON, LAUNCH_ACTIVITY_ID, REGISTRATION, sparkLaunch } from './fixtures.ts';
import {
  answered,
  courseCompleted,
  fridgeCompleted,
  initialized,
  interacted,
  moduleCompleted,
  previewActor,
  resultScore,
  screenStatement,
} from './statements.ts';
import { ACTIVITY_TYPES, VERBS } from './vocabulary.ts';

// The builders run on course.yaml, so the ids are the D24 ids, and on an inline module 00 with
// a scene, a chat, a check, an order, a match and a takeaway.
const COURSE_ID = 'https://rosslote.github.io/agent-course/';
const launch = sparkLaunch();

const check1 = fixtureCheck('check-1', 'The first check');
const chat: ScreenOf<'chat'> = { type: 'chat', slug: 'just-ask', heading: 'Just ask', opening: 'Build it.', messages: ['Done!'] };
const scene = fixtureScene();
const module00 = fixtureModule('00', [scene, chat, check1, fixtureOrder, fixtureMatch, fixtureTakeaway()]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('every statement', () => {
  it('has a fresh UUID, a timestamp, the launch actor exactly as given and the registration', () => {
    const a = initialized(course, launch);
    const b = initialized(course, launch);
    expect(a.id).toMatch(UUID);
    expect(b.id).not.toBe(a.id);
    expect(Number.isNaN(Date.parse(a.timestamp ?? ''))).toBe(false);
    expect(JSON.stringify(a.actor)).toBe(ACTOR_JSON);
    expect(a.context?.registration).toBe(REGISTRATION);
  });

  it('in preview has the preview actor and no registration', () => {
    const statement = moduleCompleted(course, null, module00);
    expect(statement.actor).toEqual(previewActor(course));
    expect(statement.context && 'registration' in statement.context).toBe(false);
  });
});

describe('course-level statements', () => {
  it("initialized: the launch's activity_id as object, course.yaml's id as grouping", () => {
    const statement = initialized(course, launch);
    expect(statement.verb).toEqual(VERBS.initialized);
    expect(statement.verb.id).toBe('http://adlnet.gov/expapi/verbs/initialized');
    expect(statement.object).toEqual({
      objectType: 'Activity',
      id: LAUNCH_ACTIVITY_ID,
      definition: { type: ACTIVITY_TYPES.course, name: { 'en-US': course.title } },
    });
    expect(statement.context?.contextActivities).toEqual({ grouping: [{ objectType: 'Activity', id: COURSE_ID }] });
  });

  it("initialized in preview: course.yaml's id as object, no grouping, no result", () => {
    const statement = initialized(course, null);
    expect(statement.object).toMatchObject({ id: COURSE_ID });
    expect(statement.context).toBeUndefined();
    expect(statement.result).toBeUndefined();
  });

  it("no grouping when the launch's activity_id is course.yaml's id", () => {
    const statement = initialized(course, sparkLaunch({ activity_id: COURSE_ID }));
    expect(statement.object).toMatchObject({ id: COURSE_ID });
    expect(statement.context).toEqual({ registration: REGISTRATION });
  });

  it("completed on the course: completion and the score out of the course's points, scaled", () => {
    const statement = courseCompleted(course, launch, { raw: 15, max: 20 });
    expect(statement.verb.id).toBe('http://adlnet.gov/expapi/verbs/completed');
    expect(statement.object).toMatchObject({ id: LAUNCH_ACTIVITY_ID });
    expect(statement.result).toEqual({ completion: true, score: { raw: 15, min: 0, max: 20, scaled: 0.75 } });
  });
});

describe('module, check, interaction and fridge statements', () => {
  const parentAndGrouping = {
    parent: [{ objectType: 'Activity', id: COURSE_ID }],
    grouping: [{ objectType: 'Activity', id: LAUNCH_ACTIVITY_ID }],
  };

  it("completed on a module: its D24 id and title, course.yaml's id as parent, the launch's as grouping", () => {
    const statement = moduleCompleted(course, launch, module00);
    expect(statement.verb).toEqual(VERBS.completed);
    expect(statement.object).toEqual({
      objectType: 'Activity',
      id: `${COURSE_ID}modules/00`,
      definition: { type: ACTIVITY_TYPES.module, name: { 'en-US': module00.title } },
    });
    expect(statement.context).toEqual({ registration: REGISTRATION, contextActivities: parentAndGrouping });
  });

  it("in preview has course.yaml's id as parent and no grouping", () => {
    expect(moduleCompleted(course, null, module00).context).toEqual({
      contextActivities: { parent: [{ objectType: 'Activity', id: COURSE_ID }] },
    });
  });

  it('answered on a check: response, success, 1 of 1', () => {
    const statement = answered(course, launch, module00, check1, {
      type: 'answered',
      slug: 'check-1',
      right: false,
      score: { raw: 0, max: 1 },
      response: 'An option',
      answer: 0,
    });
    expect(statement.verb).toEqual(VERBS.answered);
    expect(statement.object).toEqual({
      objectType: 'Activity',
      id: `${COURSE_ID}modules/00/checks/1`,
      definition: { type: ACTIVITY_TYPES.interaction, name: { 'en-US': check1.heading }, interactionType: 'choice' },
    });
    expect(statement.result).toEqual({ response: 'An option', success: false, score: { raw: 0, min: 0, max: 1, scaled: 0 } });
    expect(statement.context?.contextActivities).toEqual(parentAndGrouping);
  });

  it('answered on an order and a match: n of its cards and n of its rows, as sequencing and matching', () => {
    const ordered = answered(course, launch, module00, fixtureOrder, {
      type: 'answered',
      slug: 'x',
      right: true,
      score: { raw: 8, max: 8 },
      response: 'a, b',
      answer: [],
    });
    expect(ordered.object).toMatchObject({ definition: { interactionType: 'sequencing' } });
    expect(ordered.result?.score).toEqual({ raw: 8, min: 0, max: 8, scaled: 1 });
    const matched = answered(course, launch, module00, fixtureMatch, {
      type: 'answered',
      slug: 'x',
      right: false,
      score: { raw: 3, max: 6 },
      response: 'a: b',
      answer: [],
    });
    expect(matched.object).toMatchObject({ definition: { interactionType: 'matching' } });
    expect(matched.result).toEqual({ response: 'a: b', success: false, score: { raw: 3, min: 0, max: 6, scaled: 0.5 } });
  });

  it('interacted on an unscored interaction: its interactions id and the response only', () => {
    const statement = interacted(course, launch, module00, chat, { type: 'interacted', slug: 'just-ask', response: 'A reply', answer: 0 });
    expect(statement.verb).toEqual(VERBS.interacted);
    expect(statement.object).toMatchObject({ id: `${COURSE_ID}modules/00/interactions/just-ask` });
    expect(statement.result).toEqual({ response: 'A reply' });
    expect(statement.context?.contextActivities).toEqual(parentAndGrouping);
  });

  it("completed on a fridge play: the fridge's id and title, its score, completion", () => {
    const statement = fridgeCompleted(course, launch, 'accepted', { raw: 7, max: 8 });
    expect(statement.object).toEqual({
      objectType: 'Activity',
      id: `${COURSE_ID}fridge/accepted`,
      definition: { type: ACTIVITY_TYPES.simulation, name: { 'en-US': course.fridges.accepted.title } },
    });
    expect(statement.result).toEqual({ completion: true, score: { raw: 7, min: 0, max: 8, scaled: 0.875 } });
    expect(statement.context?.contextActivities).toEqual(parentAndGrouping);
  });

  it('a screen with no activity of its own sends nothing', () => {
    expect(() => interacted(course, launch, module00, scene, { type: 'interacted', slug: 'x', response: 'x', answer: 0 })).toThrow();
  });
});

describe('screenStatement', () => {
  it('builds the statement for each of the three events that send one', () => {
    expect(screenStatement(course, null, module00, check1, { type: 'answered', slug: 'check-1', right: true, score: { raw: 1, max: 1 }, response: 'r', answer: 1 }).verb).toEqual(VERBS.answered);
    expect(screenStatement(course, null, module00, chat, { type: 'interacted', slug: 'just-ask', response: 'r', answer: 1 }).verb).toEqual(VERBS.interacted);
    const fridge = screenStatement(course, null, module00, check1, { type: 'fridge-ended', slug: 'one-shot', score: { raw: 300, max: 1400 } });
    expect(fridge.object).toMatchObject({ id: `${COURSE_ID}fridge/one-shot` });
  });
});

describe('resultScore', () => {
  it('stretches min and max to hold a points score outside 0 to max, and keeps scaled within -1 to 1', () => {
    expect(resultScore({ raw: -150, max: 100 })).toEqual({ raw: -150, min: -150, max: 100, scaled: -1 });
    expect(resultScore({ raw: 0, max: 0 })).toEqual({ raw: 0, min: 0, max: 0, scaled: 0 });
  });
});

describe('plain text', () => {
  it('in every response and every activity name', () => {
    const screen: ScreenOf<'choose'> = { type: 'choose', slug: 'check-1', scored: true, mode: 'single', heading: 'A **bold** heading', options: [] };
    const event = { type: 'answered', slug: 'check-1', right: true, score: { raw: 1, max: 1 }, response: 'two drops *of the same item*', answer: 1 } as const;
    const said = answered(course, null, module00, screen, event);
    expect(said.result?.response).toBe('two drops of the same item');
    expect(said.object).toMatchObject({ definition: { name: { 'en-US': 'A bold heading' } } });
    const picked = interacted(course, null, module00, chat, { type: 'interacted', slug: 'just-ask', response: '**Yes**', answer: 0 });
    expect(picked.result).toEqual({ response: 'Yes' });
    expect(moduleCompleted(course, null, { slug: '00', title: '*The* request' }).object).toMatchObject({ definition: { name: { 'en-US': 'The request' } } });
    const fridges = { ...course.fridges, 'one-shot': { ...course.fridges['one-shot'], title: '**Build** me a fridge' } };
    expect(fridgeCompleted({ ...course, fridges }, null, 'one-shot', { raw: 0, max: 1 }).object).toMatchObject({
      definition: { name: { 'en-US': 'Build me a fridge' } },
    });
  });
});
