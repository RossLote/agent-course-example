import { useId, useState } from 'react';
import type { ScreenOf } from '../../content/index.ts';
import { CheckButton } from '../parts/CheckButton.tsx';
import { Mark, ToneIcon } from '../parts/Tone.tsx';
import { indexBelow, savedField } from '../saved.ts';
import { Blocks } from '../scene/Blocks.tsx';
import { Copy } from '../scene/Copy.tsx';
import type { SavedAnswer, ScreenProps } from '../types.ts';
import { BoxPanel } from './BoxPanel.tsx';
import './Choose.css';

type Option = ScreenOf<'choose'>['options'][number];

/** What a choose saves: the picked options' positions, in order. */
type ChooseAnswer = { picked: number[] };

/**
 * The picks a saved answer holds, or undefined when there is none. Any saved answer renders the
 * screen checked; positions that are not options are dropped.
 */
function savedPicks(saved: SavedAnswer | undefined, count: number): number[] | undefined {
  if (saved === undefined) return undefined;
  const picked = savedField(saved, 'picked');
  if (!Array.isArray(picked)) return [];
  return picked.filter((i): i is number => indexBelow(i, count));
}

/** Right when the picks are exactly the right options. */
function isRight(options: readonly Option[], picked: readonly number[]): boolean {
  return options.every((o, i) => o.right === picked.includes(i));
}

/** The live region's words once checked. */
function Result({ options, picked, single }: { options: readonly Option[]; picked: readonly number[]; single: boolean }) {
  if (single) {
    const chosen = options[picked[0]];
    if (chosen === undefined) return null;
    return (
      <>
        {chosen.right ? 'Right.' : 'Wrong.'} <Copy text={chosen.feedback} />
      </>
    );
  }
  const right = options.filter((o) => o.right).length;
  const rightTicked = options.filter((o, i) => o.right && picked.includes(i)).length;
  return (
    <>
      Checked. You ticked {rightTicked} of the {right} right options and {picked.length - rightTicked} of the {options.length - right} wrong
      ones. Each option now says why.
    </>
  );
}

/**
 * Pick and be told why (PLAN.md §6a, "Screen types"): a prompt and options, ticked (multi) or
 * one picked (single), then Check marks them right or wrong with their feedback, and Try again
 * clears them. A multi choice marks every option by its own rightness; a single one marks the
 * pick and dims the rest. A picked option's reveal blocks show once checked, as do the after
 * blocks; the box panel draws the walls the ticked options name as they are ticked.
 *
 * A scored choose (a check) reports `answered` on every Check press; an unscored one reports
 * `interacted` on Check, once per picked option, each carrying the whole pick. The saved answer
 * is `{picked}`, and the screen renders from it checked.
 */
export function ChooseScreen({ screen, progress, saved, onEvent }: ScreenProps<'choose'>) {
  const { options } = screen;
  const single = screen.mode === 'single';
  const [initial] = useState(() => savedPicks(saved, options.length));
  const [picked, setPicked] = useState<readonly number[]>(initial ?? []);
  const [checked, setChecked] = useState(initial !== undefined);
  const name = useId();

  const toggle = (i: number) => {
    if (single) setPicked([i]);
    else setPicked(picked.includes(i) ? picked.filter((p) => p !== i) : [...picked, i].sort((a, b) => a - b));
  };

  const check = () => {
    const answer: ChooseAnswer = { picked: [...picked] };
    if (screen.scored) {
      const right = isRight(options, picked);
      const response = picked.map((i) => options[i].label).join('; ');
      onEvent({ type: 'answered', slug: screen.slug, right, score: { raw: right ? 1 : 0, max: 1 }, response, answer });
    } else {
      for (const i of picked) onEvent({ type: 'interacted', slug: screen.slug, response: options[i].label, answer });
    }
    setChecked(true);
  };

  const tryAgain = () => {
    setPicked([]);
    setChecked(false);
  };

  const walls = new Set(picked.flatMap((i) => options[i].wall ?? []));
  const reveals = checked ? picked.flatMap((i) => options[i].reveal ?? []) : [];

  const choices = (
    <div className="scene-card choose-card">
      <fieldset className="choice-set">
        <legend className={screen.prompt === undefined ? 'sr-only' : 'choice-prompt'}>
          <Copy text={screen.prompt ?? screen.heading} />
        </legend>
        <ul className="choice-list">
          {options.map((option, i) => {
            const on = picked.includes(i);
            // Once checked, a multi choice marks every option; a single one marks its pick.
            const marked = checked && (!single || on);
            const state = marked ? (option.right ? 'right' : 'wrong') : checked ? 'dim' : on ? 'on' : undefined;
            const feedbackId = `${name}-${i}`;
            return (
              <li key={i} className="choice" data-state={state}>
                <label className="choice-row">
                  <input
                    className="choice-input"
                    type={single ? 'radio' : 'checkbox'}
                    name={name}
                    checked={on}
                    disabled={checked}
                    onChange={() => toggle(i)}
                    aria-describedby={marked ? feedbackId : undefined}
                  />
                  <span className={single ? 'choice-box choice-box-radio' : 'choice-box'} aria-hidden="true">
                    {on &&
                      (single ? (
                        <svg viewBox="0 0 24 24" width="12" height="12">
                          <circle cx="12" cy="12" r="7" fill="currentColor" />
                        </svg>
                      ) : (
                        <ToneIcon tone="right" />
                      ))}
                  </span>
                  <span className="choice-label">
                    <Copy text={option.label} />
                  </span>
                </label>
                {marked && (
                  <p id={feedbackId} className="choice-feedback">
                    <Mark right={option.right} />
                    <span>
                      <Copy text={option.feedback} />
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
          waiting={picked.length === 0}
          hint={single ? 'Choose an answer first.' : 'Tick at least one first.'}
          label={screen.checkLabel}
          onCheck={check}
          onTryAgain={tryAgain}
        />
      </div>
      <p className="sr-only" role="status">
        {checked && <Result options={options} picked={picked} single={single} />}
      </p>
    </div>
  );

  return (
    <div className="choose">
      {screen.body && <Blocks blocks={screen.body} progress={progress} />}
      {screen.box ? (
        <div className="choose-with-box">
          {choices}
          <BoxPanel box={screen.box} up={walls} />
        </div>
      ) : (
        choices
      )}
      {reveals.length > 0 && (
        <div className="choose-reveal">
          <Blocks blocks={reveals} progress={progress} />
        </div>
      )}
      {checked && screen.after && <Blocks blocks={screen.after} progress={progress} />}
    </div>
  );
}
