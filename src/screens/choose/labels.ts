// A multi choose's fixed words once checked (PLAN.md §6, "The multi choose's verdicts"): what the
// learner did with each option, and the summary under the list. The schema has no field for them,
// so they are fixed here, named, for a later round to move into the content.

/** What the learner did with one option: ticked or left, rightly or not. */
export type Verdict = 'right-tick' | 'right-leave' | 'wrong-tick' | 'missed';

/** The verdict an option's tick earns: ticking a right option and leaving a wrong one are right. */
export function verdictOf(right: boolean, ticked: boolean): Verdict {
  if (ticked) return right ? 'right-tick' : 'wrong-tick';
  return right ? 'missed' : 'right-leave';
}

/** Whether a verdict is a right choice. */
export const isRightVerdict = (verdict: Verdict) => verdict === 'right-tick' || verdict === 'right-leave';

/** The pill beside an option's label. */
export const VERDICT_LABELS: Readonly<Record<Verdict, string>> = {
  'right-tick': 'Right to tick',
  'right-leave': 'Right to leave it',
  'wrong-tick': "Shouldn't be ticked",
  missed: 'Missed: should be ticked',
};

/**
 * The summary under the list: "5 of 5 right." when every choice is right, else how many are
 * right and what went wrong, "3 of 5 right: one tick shouldn't be there, and one missed."
 */
export function summaryLabel(verdicts: readonly Verdict[]): string {
  const total = verdicts.length;
  const right = verdicts.filter(isRightVerdict).length;
  if (right === total) return `${total} of ${total} right.`;
  const wrongTicks = verdicts.filter((v) => v === 'wrong-tick').length;
  const missed = verdicts.filter((v) => v === 'missed').length;
  const parts: string[] = [];
  if (wrongTicks > 0) parts.push(wrongTicks === 1 ? "one tick shouldn't be there" : `${wrongTicks} ticks shouldn't be there`);
  if (missed > 0) parts.push(missed === 1 ? 'one missed' : `${missed} missed`);
  return `${right} of ${total} right: ${parts.join(', and ')}.`;
}
