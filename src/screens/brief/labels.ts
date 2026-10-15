// The brief's fixed words and timings (PLAN.md §6, "The brief, one round at a time"). The
// schema has no field for them, so they are fixed here, named, as src/course/home/labels.ts
// does, for a later round to move into the content.

/** The button that sends the round's answers: the learner's Enter. */
export const SEND_LABEL = 'Send answers';

/** Beside Send answers, saying what turns it on. */
export const SEND_HINT = 'Answer every question, then send.';

/**
 * The learner's line once a round is sent, numbering its questions across the rounds; a round of
 * one question reads "My answer to 6." rather than "My answers to 6 to 6.".
 */
export const sentLine = (first: number, last: number) => (first === last ? `My answer to ${first}.` : `My answers to ${first} to ${last}.`);

/** The agent's turn while it thinks over the answers. */
export const THINKING = 'Thinking…';

/** How long a sent round takes to fade out (none under prefers-reduced-motion). */
export const FADE_MS = 400;

/** How long the agent thinks before its next turn arrives. */
export const THINKING_MS = 1500;
