import { describe, expect, it } from 'vitest';
import type { Screen } from '../../content/index.ts';
import type { ModuleAnswers, ScreenEvent } from '../../screens/types.ts';
import { fixtureCheck, fixtureScene } from './fixture.ts';
import { answerKey, awaitsAnswer, firstAwaiting, moduleProgress, NO_ANSWERS, recordEvent, scoredItem, shownScreen } from './progress.ts';

const check = (slug: string) => fixtureCheck(slug);
const tick: Screen = { ...fixtureCheck('tick', 'Tick'), scored: false, mode: 'multi' };
const targets = [
  { id: 'x', label: 'X' },
  { id: 'y', label: 'Y' },
];
const rows = [
  { text: 'One', key: 'x', feedback: 'X.' },
  { text: 'Two', key: 'y', feedback: 'Y.' },
];
const match: Screen = { type: 'match', slug: 'walls', scored: true, heading: 'Match', targets, rows };
const sorting: Screen = { type: 'match', slug: 'sorting', scored: false, heading: 'Sort', targets, rows };
const order: Screen = {
  type: 'order',
  slug: 'loop',
  heading: 'Order',
  cards: ['a', 'b', 'c'].map((id) => ({ id, label: id, feedback: id })),
  start: ['c', 'b', 'a'],
};
const fridge: Screen = { type: 'fridge', heading: 'Fridge', fridge: 'one-shot' };
const scene = fixtureScene('Scene');
const takeaway: Screen = { type: 'takeaway', text: 'Card.', caption: 'Caption.' };

describe('scoredItem', () => {
  it('gives a scored choose 1, a scored match its rows, an order its cards, and anything else nothing', () => {
    expect(scoredItem(check('c1'))).toEqual({ slug: 'c1', max: 1 });
    expect(scoredItem(match)).toEqual({ slug: 'walls', max: 2 });
    expect(scoredItem(order)).toEqual({ slug: 'loop', max: 3 });
    for (const s of [tick, sorting, fridge, scene, takeaway]) expect(scoredItem(s)).toBeNull();
  });
});

describe('answerKey', () => {
  it("is a screen's slug, a fridge screen's fridge, and nothing for a screen that reports nothing", () => {
    expect(answerKey(tick)).toBe('tick');
    expect(answerKey(fridge)).toBe('one-shot');
    expect(answerKey(scene)).toBeUndefined();
    expect(answerKey(takeaway)).toBeUndefined();
  });
});

describe('moduleProgress', () => {
  const module = { screens: [scene, check('c1'), tick, check('c2'), order, match, fridge, takeaway] };

  it('scores nothing out of the content’s points before anything is answered', () => {
    expect(moduleProgress(module, NO_ANSWERS)).toEqual({ items: {}, score: { raw: 0, max: 7 } });
  });

  it('adds the latest score of each scored screen, and leaves out the unscored and the fridges', () => {
    const answers: ModuleAnswers = {
      c1: { answer: 0, score: { raw: 1, max: 1 }, right: true },
      tick: { answer: [0, 1] },
      loop: { answer: ['a', 'b', 'c'], score: { raw: 3, max: 3 }, right: true },
      'one-shot': { score: { raw: 6, max: 8 } },
    };
    expect(moduleProgress(module, answers)).toEqual({ items: answers, score: { raw: 4, max: 7 } });
  });

  it('counts a stored raw no higher than its screen is worth now, and a negative one as 0', () => {
    const answers: ModuleAnswers = {
      c1: { score: { raw: 5, max: 5 } },
      c2: { score: { raw: -2, max: 1 } },
      loop: { score: { raw: 6, max: 6 } },
      walls: { score: { raw: 2, max: 2 } },
    };
    expect(moduleProgress(module, answers).score).toEqual({ raw: 6, max: 7 });
  });
});

describe('shownScreen', () => {
  const module = { screens: [scene, check('c1'), tick, check('c2'), takeaway] };
  const answered = { c1: { score: { raw: 1, max: 1 } } };

  it('shows the screen asked for, one past the last the last, and never one past the first scored screen unanswered', () => {
    expect(firstAwaiting(module, NO_ANSWERS)).toBe(1);
    expect(shownScreen(module, NO_ANSWERS, 1)).toBe(1);
    expect(shownScreen(module, NO_ANSWERS, 2)).toBe(2);
    expect(shownScreen(module, NO_ANSWERS, 5)).toBe(2);
    expect(shownScreen(module, answered, 5)).toBe(4);
    expect(shownScreen(module, answered, 3)).toBe(3);
    const all = { ...answered, c2: { score: { raw: 0, max: 1 } } };
    expect(firstAwaiting(module, all)).toBe(-1);
    expect(shownScreen(module, all, 99)).toBe(5);
  });
});

describe('awaitsAnswer', () => {
  it('holds a scored screen until it has a score, and never an unscored one', () => {
    expect(awaitsAnswer(check('c1'), NO_ANSWERS)).toBe(true);
    expect(awaitsAnswer(check('c1'), { c1: { answer: 1, score: { raw: 0, max: 1 }, right: false } })).toBe(false);
    expect(awaitsAnswer(order, { loop: { answer: ['a'] } })).toBe(true);
    expect(awaitsAnswer(tick, NO_ANSWERS)).toBe(false);
    expect(awaitsAnswer(scene, NO_ANSWERS)).toBe(false);
  });
});

describe('recordEvent', () => {
  const play = (events: ScreenEvent[]) => events.reduce(recordEvent, NO_ANSWERS);

  it('keeps the latest answered per slug, wrong then right', () => {
    const answers = play([
      { type: 'answered', slug: 'c1', right: false, score: { raw: 0, max: 1 }, response: 'Wrong', answer: 1 },
      { type: 'answered', slug: 'c1', right: true, score: { raw: 1, max: 1 }, response: 'Right', answer: 0 },
    ]);
    expect(answers).toEqual({ c1: { answer: 0, score: { raw: 1, max: 1 }, right: true } });
  });

  it('keeps the latest pick of an interaction, and a fridge play’s score with its answer when it has one', () => {
    const answers = play([
      { type: 'interacted', slug: 'tick', response: 'A', answer: [0] },
      { type: 'interacted', slug: 'tick', response: 'B', answer: [0, 1] },
      { type: 'fridge-ended', slug: 'one-shot', score: { raw: 3, max: 8 }, answer: { cheese: 'top' } },
      { type: 'fridge-ended', slug: 'one-shot', score: { raw: 5, max: 8 } },
    ]);
    expect(answers).toEqual({ tick: { answer: [0, 1] }, 'one-shot': { answer: { cheese: 'top' }, score: { raw: 5, max: 8 } } });
  });

  it('changes nothing on takeaway reached', () => {
    const before: ModuleAnswers = { tick: { answer: [0] } };
    expect(recordEvent(before, { type: 'takeaway-reached' })).toBe(before);
  });

  it('gives back the same records when an event carries the answer they already hold', () => {
    const answer = [0, 1];
    const before = play([{ type: 'interacted', slug: 'tick', response: 'A', answer }]);
    expect(recordEvent(before, { type: 'interacted', slug: 'tick', response: 'B', answer })).toBe(before);
    expect(recordEvent(before, { type: 'interacted', slug: 'tick', response: 'B', answer: [0, 1] })).not.toBe(before);
  });

  it('gives records that survive JSON as they are', () => {
    const answers = play([
      { type: 'answered', slug: 'walls', right: false, score: { raw: 1, max: 2 }, response: 'One: X; Two: X', answer: { One: 'x', Two: 'x' } },
      { type: 'interacted', slug: 'tick', response: 'A', answer: [0] },
      { type: 'fridge-ended', slug: 'one-shot', score: { raw: 8, max: 8 } },
    ]);
    expect(JSON.parse(JSON.stringify(answers))).toEqual(answers);
  });
});
