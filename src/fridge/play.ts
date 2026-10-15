// A fridge play as data (PLAN.md §6, "A fridge play"): what is on the shelves, which items were
// wrong the first time they were dropped, what the learner holds, the points and the time left,
// and what just happened. Every change goes through `fridgeReducer`, a pure function of the
// fridge file, so the component, the tests and the one-shot's timer and points share one set of
// rules.
import type { Fridge } from '../content/index.ts';
import { isRecord } from '../screens/saved.ts';
import type { Json, SavedAnswer, Score } from '../screens/types.ts';

/** What just happened, for the words (./words.ts) and the status line's icon. */
export type FridgeOutcome =
  | { kind: 'picked'; item: string; shelf: string }
  | { kind: 'moved'; item: string; shelf: string }
  | { kind: 'put-back'; item: string }
  | { kind: 'placed'; item: string; shelf: string }
  | { kind: 'returned'; item: string; shelf: string }
  | { kind: 'no-timer' }
  /** Time ran out, with the item that was held then, which went back to the tray. */
  | { kind: 'time-up'; item?: string }
  | { kind: 'reset' };

export interface FridgePlay {
  /** Item id to shelf id: right drops only, since a right drop stays and a wrong one returns. */
  placements: Readonly<Record<string, string>>;
  /** The items whose first drop was wrong. */
  wrongFirst: readonly string[];
  /** Points so far on a points fridge: the file's right and wrong drops added up, never below zero. */
  points: number;
  /**
   * Seconds left; null when the file has no timer or the learner switched it off (which holds
   * through a reset), 0 once time is up.
   */
  timeLeft: number | null;
  /** Whether the countdown has begun: the learner's first pick up or drag. */
  started: boolean;
  /** The item picked up for the keyboard or a click, and the shelf the cursor is on (an index). */
  held: { item: string; cursor: number } | null;
  /** What the last action did; null on a fresh or a saved play. */
  last: FridgeOutcome | null;
  /** Counts every action, so the live region can tell two identical announcements apart. */
  turn: number;
}

export type FridgeAction =
  /** Pick an item up; the cursor starts on the first shelf. Picking the held item again puts it back. */
  | { type: 'pick'; item: string }
  /** Move the cursor up (-1) or down (1) a shelf, stopping at the first and the last. */
  | { type: 'move'; by: -1 | 1 }
  /** Drop the held item on the shelf under the cursor. */
  | { type: 'place' }
  /** Drop an item on a shelf: a pointer drag, or a click on a shelf while holding. */
  | { type: 'drop'; item: string; shelf: string }
  /** Put the held item back in the tray. */
  | { type: 'put-back' }
  /** Start the countdown without picking up (a drag begins). */
  | { type: 'start' }
  /** One second passes. Counts down only once the play has started. */
  | { type: 'tick' }
  /** Switch the timer off, before or during a play. */
  | { type: 'no-timer' }
  /** Empty the shelves and start a new play, its timer off if the learner switched it off. */
  | { type: 'reset' };

/** The seconds a fridge's timer starts from, or null when its file has none. */
const timerSeconds = (fridge: Fridge): number | null => (fridge.timer === 'none' ? null : fridge.timer.seconds);

/** A play with every item in the tray, no points, and the timer waiting for a first pick up. */
export function newPlay(fridge: Fridge): FridgePlay {
  return { placements: {}, wrongFirst: [], points: 0, timeLeft: timerSeconds(fridge), started: false, held: null, last: null, turn: 0 };
}

/** Whether every item is on its shelf. */
export function allPlaced(fridge: Fridge, play: FridgePlay): boolean {
  return fridge.items.every((item) => play.placements[item.id] !== undefined);
}

/** Whether the timer ran out. */
export const timedOut = (play: FridgePlay): boolean => play.timeLeft === 0;

/** Whether the play has ended: every item is on its shelf, or time is up. */
export function isFinished(fridge: Fridge, play: FridgePlay): boolean {
  return allPlaced(fridge, play) || timedOut(play);
}

/** The items still in the tray, in the file's order. */
export function trayItems(fridge: Fridge, play: FridgePlay): Fridge['items'] {
  return fridge.items.filter((item) => play.placements[item.id] === undefined);
}

/** The items placed right the first time they were dropped. */
export function rightFirstTime(fridge: Fridge, play: FridgePlay): number {
  return fridge.items.filter((item) => play.placements[item.id] !== undefined && !play.wrongFirst.includes(item.id)).length;
}

/**
 * The play's score. Right first time is out of the item count; points mode (the one-shot) is the
 * running points out of what every item earns when it is dropped right.
 */
export function scoreOf(fridge: Fridge, play: FridgePlay): Score {
  if (fridge.score.mode === 'points') return { raw: play.points, max: fridge.score.right * fridge.items.length };
  return { raw: rightFirstTime(fridge, play), max: fridge.items.length };
}

/** The points after a drop: the file's right or wrong amount added, never below zero; none outside points mode. */
function pointsAfter(fridge: Fridge, play: FridgePlay, right: boolean): number {
  if (fridge.score.mode !== 'points') return play.points;
  return Math.max(0, play.points + (right ? fridge.score.right : fridge.score.wrong));
}

/** The next play after an action. A finished play takes nothing but a reset. */
export function fridgeReducer(fridge: Fridge, play: FridgePlay, action: FridgeAction): FridgePlay {
  const turn = play.turn + 1;
  if (action.type === 'reset') {
    const fresh = newPlay(fridge);
    return { ...fresh, timeLeft: play.timeLeft === null ? null : fresh.timeLeft, last: { kind: 'reset' }, turn };
  }
  if (isFinished(fridge, play)) return play;

  switch (action.type) {
    case 'start':
      return play.started || play.timeLeft === null ? play : { ...play, started: true };
    case 'tick': {
      if (!play.started || play.timeLeft === null) return play;
      const timeLeft = play.timeLeft - 1;
      if (timeLeft > 0) return { ...play, timeLeft };
      return { ...play, timeLeft: 0, held: null, last: play.held === null ? { kind: 'time-up' } : { kind: 'time-up', item: play.held.item }, turn };
    }
    case 'no-timer':
      return play.timeLeft === null ? play : { ...play, timeLeft: null, last: { kind: 'no-timer' }, turn };
    case 'pick': {
      if (play.placements[action.item] !== undefined || !fridge.items.some((item) => item.id === action.item)) return play;
      if (play.held?.item === action.item) return { ...play, held: null, last: { kind: 'put-back', item: action.item }, turn };
      return { ...play, started: true, held: { item: action.item, cursor: 0 }, last: { kind: 'picked', item: action.item, shelf: fridge.shelves[0].id }, turn };
    }
    case 'move': {
      if (play.held === null) return play;
      const cursor = Math.min(Math.max(play.held.cursor + action.by, 0), fridge.shelves.length - 1);
      return { ...play, held: { ...play.held, cursor }, last: { kind: 'moved', item: play.held.item, shelf: fridge.shelves[cursor].id }, turn };
    }
    case 'place':
      if (play.held === null) return play;
      return fridgeReducer(fridge, play, { type: 'drop', item: play.held.item, shelf: fridge.shelves[play.held.cursor].id });
    case 'drop': {
      // A drop lets go of the held item only when it is the one dropped: a drag of another
      // item leaves a keyboard or click pick up where it was.
      const item = fridge.items.find((candidate) => candidate.id === action.item);
      if (item === undefined || play.placements[item.id] !== undefined || !fridge.shelves.some((shelf) => shelf.id === action.shelf)) return play;
      const held = play.held?.item === item.id ? null : play.held;
      if (item.shelf === action.shelf) {
        return { ...play, placements: { ...play.placements, [item.id]: action.shelf }, points: pointsAfter(fridge, play, true), held, last: { kind: 'placed', item: item.id, shelf: action.shelf }, turn };
      }
      const wrongFirst = play.wrongFirst.includes(item.id) ? play.wrongFirst : [...play.wrongFirst, item.id];
      return { ...play, wrongFirst, points: pointsAfter(fridge, play, false), held, last: { kind: 'returned', item: item.id, shelf: action.shelf }, turn };
    }
    case 'put-back':
      if (play.held === null) return play;
      return { ...play, held: null, last: { kind: 'put-back', item: play.held.item }, turn };
  }
}

/**
 * The play as the answer the fridge-ended event carries and a saved play renders from: its
 * placements and the items wrong first time, and the points and the seconds left (null when the
 * timer was off, 0 when time ran out) so a finished one-shot comes back as it ended.
 */
export function savedPlay(play: FridgePlay): SavedAnswer {
  return { placements: { ...play.placements }, wrongFirst: [...play.wrongFirst], points: play.points, timeLeft: play.timeLeft };
}

/**
 * A play from a saved answer: its placements and the items wrong first time. A saved play that
 * no longer fits this fridge file (an item or a shelf it has not got, or an item on a shelf that
 * is not its own, when the play recorded it as right) is no saved play: its points and its time
 * were for drops this file would not keep, so the learner starts a fresh one. The points and the
 * time left are read when they are there (an answer from before they existed has neither: its
 * points are worked out from the drops, its timer is untouched). Anything else is a fresh play.
 */
export function playFromSaved(fridge: Fridge, saved: SavedAnswer | undefined): FridgePlay {
  const fresh = newPlay(fridge);
  if (!isRecord(saved)) return fresh;
  const { placements: placed, wrongFirst: wrong, points, timeLeft } = saved;
  if (!isRecord(placed) || !Array.isArray(wrong)) return fresh;
  const wrongIds: readonly Json[] = wrong;
  const fits =
    Object.entries(placed).every(([id, shelf]) => fridge.items.some((item) => item.id === id && item.shelf === shelf)) &&
    wrongIds.every((id) => fridge.items.some((item) => item.id === id));
  if (!fits) return fresh;
  const placements: Record<string, string> = {};
  for (const item of fridge.items) {
    if (placed[item.id] !== undefined) placements[item.id] = item.shelf;
  }
  const wrongFirst = fridge.items.filter((item) => wrongIds.includes(item.id)).map((item) => item.id);
  const drops = { ...fresh, placements, wrongFirst };
  const worked = fridge.score.mode === 'points'
    ? Math.max(0, fridge.score.right * Object.keys(placements).length + fridge.score.wrong * wrongFirst.length)
    : 0;
  const seconds = timerSeconds(fridge);
  const left = seconds === null || timeLeft === null ? null : typeof timeLeft === 'number' ? Math.min(Math.max(Math.floor(timeLeft), 0), seconds) : seconds;
  return { ...drops, points: typeof points === 'number' && points >= 0 ? points : worked, timeLeft: left, started: isFinished(fridge, { ...drops, timeLeft: left }) };
}
