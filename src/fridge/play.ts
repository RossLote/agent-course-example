// A fridge play as data (PLAN.md §6, "A fridge play"): what is on the shelves, which items were
// wrong the first time they were dropped, what the learner holds, and what just happened. Every
// change goes through `fridgeReducer`, a pure function of the fridge file, so the component, the
// tests and the extras that come later (the one-shot's timer and points) share one set of rules.
import type { Fridge } from '../content/index.ts';
import type { Json, SavedAnswer, Score } from '../screens/types.ts';

/** What just happened, for the words (./words.ts) and the status line's icon. */
export type FridgeOutcome =
  | { kind: 'picked'; item: string; shelf: string }
  | { kind: 'moved'; item: string; shelf: string }
  | { kind: 'put-back'; item: string }
  | { kind: 'placed'; item: string; shelf: string }
  | { kind: 'returned'; item: string; shelf: string }
  | { kind: 'reset' };

export interface FridgePlay {
  /** Item id to shelf id: right drops only, since a right drop stays and a wrong one returns. */
  placements: Readonly<Record<string, string>>;
  /** The items whose first drop was wrong. */
  wrongFirst: readonly string[];
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
  /** Empty the shelves and start a new play. */
  | { type: 'reset' };

/** A play with every item in the tray. */
export function newPlay(): FridgePlay {
  return { placements: {}, wrongFirst: [], held: null, last: null, turn: 0 };
}

/** Whether the play has ended: every item is on its shelf. */
export function isFinished(fridge: Fridge, play: FridgePlay): boolean {
  return fridge.items.every((item) => play.placements[item.id] !== undefined);
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
 * The play's score. Right first time is out of the item count. Points mode (the one-shot) is
 * scored right first time as well until its points arrive with the one-shot's extras.
 */
export function scoreOf(fridge: Fridge, play: FridgePlay): Score {
  return { raw: rightFirstTime(fridge, play), max: fridge.items.length };
}

/** The next play after an action. A finished play takes nothing but a reset. */
export function fridgeReducer(fridge: Fridge, play: FridgePlay, action: FridgeAction): FridgePlay {
  const turn = play.turn + 1;
  if (action.type === 'reset') return { ...newPlay(), last: { kind: 'reset' }, turn };
  if (isFinished(fridge, play)) return play;

  switch (action.type) {
    case 'pick': {
      if (play.placements[action.item] !== undefined || !fridge.items.some((item) => item.id === action.item)) return play;
      if (play.held?.item === action.item) return { ...play, held: null, last: { kind: 'put-back', item: action.item }, turn };
      return { ...play, held: { item: action.item, cursor: 0 }, last: { kind: 'picked', item: action.item, shelf: fridge.shelves[0].id }, turn };
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
      const item = fridge.items.find((candidate) => candidate.id === action.item);
      if (item === undefined || play.placements[item.id] !== undefined || !fridge.shelves.some((shelf) => shelf.id === action.shelf)) return play;
      if (item.shelf === action.shelf) {
        return { ...play, placements: { ...play.placements, [item.id]: action.shelf }, held: null, last: { kind: 'placed', item: item.id, shelf: action.shelf }, turn };
      }
      const wrongFirst = play.wrongFirst.includes(item.id) ? play.wrongFirst : [...play.wrongFirst, item.id];
      return { ...play, wrongFirst, held: null, last: { kind: 'returned', item: item.id, shelf: action.shelf }, turn };
    }
    case 'put-back':
      if (play.held === null) return play;
      return { ...play, held: null, last: { kind: 'put-back', item: play.held.item }, turn };
  }
}

/** The play as the answer the fridge-ended event carries and a saved play renders from. */
export function savedPlay(play: FridgePlay): SavedAnswer {
  return { placements: { ...play.placements }, wrongFirst: [...play.wrongFirst] };
}

const isRecord = (value: Json | undefined): value is { readonly [key: string]: Json } =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A play from a saved answer: its placements and the items wrong first time, keeping only what
 * this fridge file still has (an item on its own shelf), so an edited file never breaks it.
 * Anything else is a fresh play.
 */
export function playFromSaved(fridge: Fridge, saved: SavedAnswer | undefined): FridgePlay {
  if (!isRecord(saved)) return newPlay();
  const { placements: placed, wrongFirst: wrong } = saved;
  if (!isRecord(placed) || !Array.isArray(wrong)) return newPlay();
  const wrongIds: readonly Json[] = wrong;
  const placements: Record<string, string> = {};
  for (const item of fridge.items) {
    if (placed[item.id] === item.shelf) placements[item.id] = item.shelf;
  }
  const wrongFirst = fridge.items.filter((item) => wrongIds.includes(item.id)).map((item) => item.id);
  return { ...newPlay(), placements, wrongFirst };
}
