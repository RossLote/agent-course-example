import { useId, useState } from 'react';
import type { ScreenOf } from '../../content/index.ts';
import { CheckButton } from '../parts/CheckButton.tsx';
import { Mark, ToneIcon } from '../parts/Tone.tsx';
import { fittingList, indexBelow, savedField } from '../saved.ts';
import { Blocks } from '../scene/Blocks.tsx';
import { Copy } from '../scene/Copy.tsx';
import type { SavedAnswer, ScreenProps } from '../types.ts';
import { BoxPanel } from './BoxPanel.tsx';
import { isRightVerdict, summaryLabel, verdictOf, VERDICTS } from './labels.ts';
import './Choose.css';

type Choose = ScreenOf<'choose'>;
type Option = Choose['options'][number];

/** What a choose saves: the picked options' positions, in order. */
type ChooseAnswer = { picked: number[] };

/**
 * The picks a saved answer holds, or undefined when there is none or it does not fit the screen
 * (saved.ts): every pick an option, none twice, one for a single choice and at least one for a
 * multi, as a Check press leaves them.
 */
function savedPicks(saved: SavedAnswer | undefined, screen: Choose): number[] | undefined {
  const picked = fittingList(savedField(saved, 'picked'), (i): i is number => indexBelow(i, screen.options.length));
  if (picked === undefined || new Set(picked).size !== picked.length) return undefined;
  return (screen.mode === 'single' ? picked.length === 1 : picked.length > 0) ? picked : undefined;
}

/** Right when the picks are exactly the right options. */
function isRight(options: readonly Option[], picked: readonly number[]): boolean {
  return options.every((o, i) => o.right === picked.includes(i));
}

/** A single choice's live region words once checked: right or wrong, and the pick's feedback. */
function SingleResult({ chosen }: { chosen: Option | undefined }) {
  if (chosen === undefined) return null;
  return (
    <>
      {chosen.right ? 'Right.' : 'Wrong.'} <Copy text={chosen.feedback} />
    </>
  );
}

/** Right or wrong, for a single choice's marked pick and the summary's band. */
const toneOf = (right: boolean): 'right' | 'wrong' => (right ? 'right' : 'wrong');

/**
 * Pick and be told why (PLAN.md §6a, "Screen types"): a prompt and options, ticked (multi) or
 * one picked (single), then Check marks them with their feedback, and Try again clears them. A
 * multi choice judges what the learner did with every option (PLAN.md §6, "The multi choose's
 * verdicts"): a pill beside each label says whether ticking or leaving it was right, and a
 * summary under the list counts them. A single one marks the pick right or wrong and dims the
 * rest. A picked option's reveal blocks show once checked, as do the after blocks; the box panel
 * draws the walls the ticked options name as they are ticked.
 *
 * A scored choose (a check) reports `answered` on every Check press; an unscored one reports
 * `interacted` on Check, once per picked option, each carrying the whole pick. The saved answer
 * is `{picked}`, and the screen renders from it checked (unanswered when it does not fit).
 */
export function ChooseScreen({ screen, progress, saved, onEvent }: ScreenProps<'choose'>) {
  const { options } = screen;
  const single = screen.mode === 'single';
  const [initial] = useState(() => savedPicks(saved, screen));
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
  // Once checked, a multi choice has a verdict on every option.
  const verdicts = checked && !single ? options.map((o, i) => verdictOf(o.right, picked.includes(i))) : undefined;
  const summary = verdicts && { tone: toneOf(verdicts.every(isRightVerdict)), words: summaryLabel(verdicts) };
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
            const verdict = verdicts?.[i];
            const pill = verdict && VERDICTS[verdict];
            // Once checked, a multi choice gives every option a verdict; a single one marks its pick
            // and dims the rest.
            const marked = checked && (!single || on);
            const state = verdict ?? (checked ? (on ? toneOf(option.right) : 'dim') : on ? 'on' : undefined);
            const feedbackId = `${name}-${i}`;
            const verdictId = `${name}-${i}-verdict`;
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
                    aria-describedby={verdict !== undefined ? `${verdictId} ${feedbackId}` : marked ? feedbackId : undefined}
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
                  <span className="choice-text">
                    <span className="choice-label">
                      <Copy text={option.label} />
                    </span>
                    {/* Out of the option's name, read with its description instead. */}
                    {pill && (
                      <span id={verdictId} className="choice-verdict" data-tone={pill.tone} aria-hidden="true">
                        <ToneIcon tone={pill.tone} size={16} />
                        {pill.label}
                      </span>
                    )}
                  </span>
                </label>
                {marked && (
                  <p id={feedbackId} className="choice-feedback">
                    {verdict === undefined && <Mark right={option.right} />}
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
      {/* The live region is in the page from the start, so it is heard once per Check; a multi
          choice's summary shows as well. */}
      <p className={summary ? 'choice-summary' : 'sr-only'} data-tone={summary?.tone} role="status">
        {summary ? (
          <>
            <ToneIcon tone={summary.tone} size={16} />
            {summary.words}
          </>
        ) : (
          checked && <SingleResult chosen={options[picked[0]]} />
        )}
      </p>
      <div className="choice-actions">
        <CheckButton
          checked={checked}
          waiting={picked.length === 0}
          hint={single ? 'Choose an answer first.' : 'Tick at least one first.'}
          label={screen.checkLabel}
          tryAgainLabel={screen.tryAgainLabel}
          onCheck={check}
          onTryAgain={tryAgain}
        />
      </div>
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
