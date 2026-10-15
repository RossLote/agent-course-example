import { useId, useState } from 'react';
import type { ScreenOf } from '../../content/index.ts';
import { Mark } from '../choose/Mark.tsx';
import { Blocks } from '../scene/Blocks.tsx';
import { Copy } from '../scene/Copy.tsx';
import type { SavedAnswer, ScreenProps } from '../types.ts';
import { CheckButton } from './CheckButton.tsx';
import '../choose/Choose.css';
import './Match.css';

type Match = ScreenOf<'match'>;

/** What a match saves: each row's picked target id, or null where a row has none. */
type MatchAnswer = { picks: (string | null)[] };

/**
 * The picks a saved answer holds, one per row, or undefined when there is none. Any saved answer
 * renders the screen checked; a pick that is not one of the targets counts as none.
 */
function savedPicks(saved: SavedAnswer | undefined, match: Match): (string | null)[] | undefined {
  if (saved === undefined) return undefined;
  const picks = saved !== null && typeof saved === 'object' && 'picks' in saved ? saved.picks : undefined;
  const list = Array.isArray(picks) ? picks : [];
  return match.rows.map((_, i) => {
    const pick = list[i];
    return typeof pick === 'string' && match.targets.some((t) => t.id === pick) ? pick : null;
  });
}

/**
 * Match each row to a target (PLAN.md §6a, "Screen types"): every row carries the shared targets
 * as chips, one pick per row (a radio group named by the row), and Check, once every row has a
 * pick, marks each row right or wrong with its feedback and the right target marked. Try again
 * clears the picks.
 *
 * A scored match reports `answered` on every Check press, a point per row right; an unscored one
 * reports `interacted` on Check, once per row with that row's pick, each carrying the whole
 * answer. The saved answer is `{picks}`, and the screen renders from it checked.
 */
export function MatchScreen({ screen, progress, saved, onEvent }: ScreenProps<'match'>) {
  const { rows, targets } = screen;
  const [initial] = useState(() => savedPicks(saved, screen));
  const [picks, setPicks] = useState<readonly (string | null)[]>(initial ?? rows.map(() => null));
  const [checked, setChecked] = useState(initial !== undefined);
  const name = useId();

  const label = (id: string | null) => targets.find((t) => t.id === id)?.label ?? 'no pick';
  const answered = picks.filter((p) => p !== null).length;
  const right = rows.filter((row, i) => picks[i] === row.key).length;

  const pick = (row: number, target: string) => setPicks(picks.map((p, i) => (i === row ? target : p)));

  const check = () => {
    const answer: MatchAnswer = { picks: [...picks] };
    const said = rows.map((row, i) => `${row.text}: ${label(picks[i])}`);
    if (screen.scored) {
      onEvent({ type: 'answered', slug: screen.slug, right: right === rows.length, score: { raw: right, max: rows.length }, response: said.join('; '), answer });
    } else {
      for (const response of said) onEvent({ type: 'interacted', slug: screen.slug, response, answer });
    }
    setChecked(true);
  };

  const tryAgain = () => {
    setPicks(rows.map(() => null));
    setChecked(false);
  };

  return (
    <div className="choose">
      {screen.body && <Blocks blocks={screen.body} progress={progress} />}
      <div className="scene-card choose-card">
        <fieldset className="choice-set">
          <legend className={screen.prompt === undefined ? 'sr-only' : 'choice-prompt'}>
            <Copy text={screen.prompt ?? screen.heading} />
          </legend>
          <ul className="match-rows">
            {rows.map((row, i) => {
              const pickedRight = picks[i] === row.key;
              const feedbackId = `${name}-${i}`;
              return (
                <li key={i} className="match-row" data-state={checked ? (pickedRight ? 'right' : 'wrong') : undefined}>
                  <fieldset className="choice-set">
                    <legend className="match-row-text">
                      <Copy text={row.text} />
                    </legend>
                    <div className="match-chips">
                      {targets.map((target) => {
                        const on = picks[i] === target.id;
                        // Once checked, the right target is marked whether it was picked or not, and a wrong pick is marked wrong.
                        const state = checked ? (target.id === row.key ? 'right' : on ? 'wrong' : 'dim') : on ? 'on' : undefined;
                        return (
                          <label key={target.id} className="match-chip" data-state={state}>
                            <input
                              className="choice-input"
                              type="radio"
                              name={`${name}-${i}`}
                              checked={on}
                              disabled={checked}
                              onChange={() => pick(i, target.id)}
                              aria-describedby={checked ? feedbackId : undefined}
                            />
                            {/* The mark is drawn; its word is said after the target's name. */}
                            {(state === 'right' || state === 'wrong') && (
                              <span className="match-chip-mark" aria-hidden="true">
                                <Mark right={state === 'right'} />
                              </span>
                            )}
                            <span>
                              <Copy text={target.label} />
                              {state === 'right' && <span className="sr-only">, the right answer</span>}
                              {state === 'wrong' && <span className="sr-only">, wrong</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                  {checked && (
                    <p id={feedbackId} className="match-feedback">
                      <Mark right={pickedRight} />
                      <span>
                        <Copy text={row.feedback} />
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </fieldset>
        <div className="choice-actions">
          <CheckButton
            checked={checked}
            waiting={answered < rows.length}
            hint="Pick an answer on every row first."
            label={screen.checkLabel}
            onCheck={check}
            onTryAgain={tryAgain}
          />
          {!checked && (
            <span className="check-count muted small">
              {answered} of {rows.length} answered
            </span>
          )}
          <p className="check-result" role="status">
            {checked && `${right} out of ${rows.length} right`}
          </p>
        </div>
      </div>
    </div>
  );
}
