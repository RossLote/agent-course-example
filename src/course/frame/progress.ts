// A module's answers and score, worked out from the events its screens send (PLAN.md §6a, "The
// score"). The frame and the progress store (src/progress/) both use these, so the score is
// counted once.
import type { Module, Screen } from '../../content/index.ts';
import type { AnswerRecord, ModuleAnswers, ModuleProgress, ScreenEvent } from '../../screens/types.ts';

/** Where an event came from: what the frame adds to a screen's event. */
export interface EventSource {
  module: Module;
  screen: Screen;
}

/** A module nothing has been answered in yet. */
export const NO_ANSWERS: ModuleAnswers = {};

/**
 * The slug a screen's answers are kept under, or undefined for a screen that reports none
 * (scene, takeaway, compare). A fridge screen's is its fridge's name, as `fridge-ended` says.
 */
export function answerKey(screen: Screen): string | undefined {
  if (screen.type === 'fridge') return screen.fridge;
  return 'slug' in screen ? screen.slug : undefined;
}

/**
 * A scored screen's slug and the points it is worth, from the content: a scored choose 1, a
 * scored match its row count, an order its card count. Null for a screen that is not scored.
 */
export function scoredItem(screen: Screen): { slug: string; max: number } | null {
  switch (screen.type) {
    case 'choose':
      return screen.scored ? { slug: screen.slug, max: 1 } : null;
    case 'match':
      return screen.scored ? { slug: screen.slug, max: screen.rows.length } : null;
    case 'order':
      return { slug: screen.slug, max: screen.cards.length };
    default:
      return null;
  }
}

/** Whether a screen still needs answering before Next goes on: scored, and no score yet. */
export function awaitsAnswer(screen: Screen, answers: ModuleAnswers): boolean {
  const scored = scoredItem(screen);
  return scored !== null && answers[scored.slug]?.score === undefined;
}

/** The index of the module's first screen still awaiting an answer (awaitsAnswer), or -1 when none is. */
export function firstAwaiting(module: { screens: readonly Screen[] }, answers: ModuleAnswers): number {
  return module.screens.findIndex((screen) => awaitsAnswer(screen, answers));
}

/**
 * The screen (counting from 1) a route to `requested` shows: one of the module's screens (one
 * past the last shows the last), and never past the first scored screen still awaiting an
 * answer, so no route reaches the takeaway over an unanswered check.
 */
export function shownScreen(module: { screens: readonly Screen[] }, answers: ModuleAnswers, requested: number): number {
  const screen = Math.min(Math.max(requested, 1), module.screens.length);
  const awaiting = firstAwaiting(module, answers);
  return awaiting === -1 ? screen : Math.min(screen, awaiting + 1);
}

/**
 * The module's progress: its records, and its score out of what its scored screens are worth.
 * Each stored raw counts between 0 and what its screen is worth now, so a score saved before
 * the content changed never counts for more than the screen gives.
 */
export function moduleProgress(module: { screens: readonly Screen[] }, answers: ModuleAnswers): ModuleProgress {
  let raw = 0;
  let max = 0;
  for (const screen of module.screens) {
    const scored = scoredItem(screen);
    if (scored === null) continue;
    max += scored.max;
    const stored = answers[scored.slug]?.score?.raw ?? 0;
    raw += Number.isFinite(stored) ? Math.min(Math.max(stored, 0), scored.max) : 0;
  }
  return { items: answers, score: { raw, max } };
}

/** Whether a record says what another does: the same answer object, score and rightness. */
function sameRecord(a: AnswerRecord | undefined, b: AnswerRecord): boolean {
  return a !== undefined && a.answer === b.answer && a.right === b.right && a.score?.raw === b.score?.raw && a.score?.max === b.score?.max;
}

/**
 * The records once an event is taken in: the latest answer and score per slug win. `answered`
 * replaces the slug's record; `interacted` replaces its answer; `fridge-ended` its score (and
 * its answer when it carries one); `takeaway-reached` changes nothing here (the progress store
 * records it as the module's completion). The same records come back when nothing changes, as
 * for the second of an unscored screen's `interacted` events that carry one answer.
 */
export function recordEvent(answers: ModuleAnswers, event: ScreenEvent): ModuleAnswers {
  const update = (slug: string, record: AnswerRecord): ModuleAnswers => (sameRecord(answers[slug], record) ? answers : { ...answers, [slug]: record });
  switch (event.type) {
    case 'answered':
      return update(event.slug, { answer: event.answer, score: event.score, right: event.right });
    case 'interacted':
      return update(event.slug, { ...answers[event.slug], answer: event.answer });
    case 'fridge-ended':
      return update(event.slug, {
        ...answers[event.slug],
        score: event.score,
        ...(event.answer !== undefined && { answer: event.answer }),
      });
    case 'takeaway-reached':
      return answers;
  }
}
