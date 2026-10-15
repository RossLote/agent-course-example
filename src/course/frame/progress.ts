// A module's answers and score, worked out from the events its screens send (PLAN.md §6a, "The
// score"). The frame and the progress store (.9) both use these, so the score is counted once.
import type { Screen } from '../../content/index.ts';
import type { AnswerRecord, ModuleAnswers, ModuleProgress, ScreenEvent } from '../../screens/types.ts';

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

/** The module's progress: its records, and its score out of what its scored screens are worth. */
export function moduleProgress(module: { screens: readonly Screen[] }, answers: ModuleAnswers): ModuleProgress {
  let raw = 0;
  let max = 0;
  for (const screen of module.screens) {
    const scored = scoredItem(screen);
    if (scored === null) continue;
    max += scored.max;
    raw += answers[scored.slug]?.score?.raw ?? 0;
  }
  return { items: answers, score: { raw, max } };
}

/**
 * The records once an event is taken in: the latest answer and score per slug win. `answered`
 * replaces the slug's record; `interacted` replaces its answer; `fridge-ended` its score (and
 * its answer when it carries one); `takeaway-reached` changes nothing here (.9 records it).
 */
export function recordEvent(answers: ModuleAnswers, event: ScreenEvent): ModuleAnswers {
  const update = (slug: string, record: AnswerRecord): ModuleAnswers => ({ ...answers, [slug]: record });
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
