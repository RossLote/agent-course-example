import type { ReactNode } from 'react';

interface AnnounceProps {
  /** What the last move did, in words; empty before anything has happened. */
  words: string;
  /** Counts the moves, so a repeated sentence is still a change. */
  turn: number;
  /** The status line's class. */
  className: string;
  /** The status line's `data-tone`, when it has one. */
  tone?: string;
  /** What the status line shows: the words, unless it adds to them (the fridge's icon). */
  children?: ReactNode;
}

/**
 * What the last move did, said twice: on a status line for the eye, and in a polite live region
 * for a screen reader, in the same words. The fridge and the order screen say each move with it.
 */
export function Announce({ words, turn, className, tone, children = words }: AnnounceProps) {
  return (
    <>
      <p className={className} data-tone={tone}>
        {children}
      </p>
      <div className="sr-only" aria-live="polite">
        {/* A space that comes and goes (a no-break space, which nothing trims) makes a repeated
            sentence a change a reader announces. */}
        {words}
        {words !== '' && turn % 2 === 1 ? '\u00a0' : ''}
      </div>
    </>
  );
}
