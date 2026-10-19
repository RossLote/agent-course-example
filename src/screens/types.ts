// The contract every screen is built to (PLAN.md §6a, "The frame" and "The event callback").
// The frame (src/course/frame/) gives a screen its content, its saved answer when one exists,
// a read-only view of the module's progress, and one callback for everything the screen
// reports. No screen keeps progress or sends a statement itself.
import type { Course, Module, ScreenOf, ScreenType } from '../content/index.ts';

/** A value that survives JSON.stringify and JSON.parse unchanged: what an answer must be. */
export type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };

/**
 * A screen's own record of what the learner did, in the screen's own shape (the picked option
 * indexes, the order of card ids, the target picked per row, the chips, a fridge play's
 * placements), enough for the screen to render itself answered. The frame keeps the latest per
 * slug and hands it back; the progress store (.9) persists exactly this, so it must be Json.
 */
export type SavedAnswer = Json;

/** Points scored out of the points there were. */
export interface Score {
  raw: number;
  max: number;
}

/**
 * Everything a screen reports, through the one callback the frame gives it.
 * - `answered`: a Check press on a scored screen (one per press: wrong then right is two).
 *   `score` is 1 of 1 for a check, n of the card count for an order, n of the row count for a
 *   scored match.
 * - `interacted`: one option pick on an unscored screen (a chat reply, a brief chip, an
 *   unscored choose or match).
 * - `fridge-ended`: a fridge play ended; `slug` is the fridge's name ("one-shot").
 * - `takeaway-reached`: the module's takeaway is showing, which completes the module.
 *
 * `response` is the pick in words, as the statement carries it, and each screen sends its own
 * shape: a choose, the option's label (a scored one's pick, or each pick of an unscored one); a
 * match, "<row>: <target>" for a row (an unscored one sends one per row, a scored one every row
 * joined by "; "); a brief, "D<n>: <chip label>"; a chat, the reply's label; an order, the cards'
 * labels in the order left, joined by "; ". The labels are copy, markers and all; the xAPI layer
 * (src/xapi/statements.ts) strips the `**` and `*` before it sends them.
 */
export type ScreenEvent =
  | { type: 'answered'; slug: string; right: boolean; score: Score; response: string; answer: SavedAnswer }
  | { type: 'interacted'; slug: string; response: string; answer: SavedAnswer }
  | { type: 'fridge-ended'; slug: string; score: Score; answer?: SavedAnswer }
  | { type: 'takeaway-reached' };

/** The latest of everything one slug reported. */
export interface AnswerRecord {
  /** The latest answer, from any event that carried one. */
  answer?: SavedAnswer;
  /** The latest score, from `answered` or `fridge-ended`. A scored screen with one is answered. */
  score?: Score;
  /** Whether the latest `answered` was right. */
  right?: boolean;
}

/** A module's records by slug (a fridge's by its name); plain data, so it persists as it is. */
export type ModuleAnswers = Readonly<Record<string, AnswerRecord>>;

/** What a screen may read of its module's progress. */
export interface ModuleProgress {
  /** Every slug's latest answer and score. */
  items: ModuleAnswers;
  /**
   * The module's score: the latest score of each scored screen, an unanswered one counting 0,
   * out of the points the content gives them (src/course/frame/progress.ts).
   */
  score: Score;
}

/** What the frame gives the screen of type T. */
export interface ScreenProps<T extends ScreenType> {
  /** The screen's content. */
  screen: ScreenOf<T>;
  /** The module it is in, with all its screens. */
  module: Module;
  /** The course: the box's labels, every module, the fridges by name. */
  course: Course;
  /** This screen's latest answer, when it has one: render answered, with the feedback shown. */
  saved?: SavedAnswer;
  /** The module's progress, read-only. */
  progress: ModuleProgress;
  /** Reports an event; the frame records it and passes it on. */
  onEvent: (event: ScreenEvent) => void;
}
