import { useId, useRef, useState } from 'react';
import { fillTemplate } from '../../content/copy.ts';
import type { ScreenOf } from '../../content/index.ts';
import { ChatLog, Chip, Message } from '../chat/Conversation.tsx';
import { useFocusAfterRender } from '../parts/useFocusAfterRender.ts';
import { Copy } from '../scene/Copy.tsx';
import { indexBelow, savedField } from '../saved.ts';
import type { SavedAnswer, ScreenProps } from '../types.ts';
import './Brief.css';

type Question = ScreenOf<'brief'>['rounds'][number]['questions'][number];

/**
 * What a brief saves: the picked chip's position for every question across the rounds (null
 * while unanswered), and whether "Your defaults" was pressed.
 */
type BriefAnswer = { picked: (number | null)[]; defaults: boolean };

const ROUNDS = ['one', 'two', 'three', 'four', 'five'];

/** The state a saved answer holds; picks that are not chips of their question are dropped. */
function savedState(saved: SavedAnswer | undefined, questions: readonly Question[]): BriefAnswer {
  const picks = savedField(saved, 'picked');
  const list = Array.isArray(picks) ? picks : [];
  return {
    picked: questions.map((q, i) => {
      const chip = list[i];
      return indexBelow(chip, q.chips.length) ? chip : null;
    }),
    defaults: savedField(saved, 'defaults') === true,
  };
}

/** The position of a question's recommended chip (the schema makes sure there is exactly one). */
function recommended(question: Question): number {
  return Math.max(
    question.chips.findIndex((c) => c.recommended),
    0,
  );
}

/**
 * The fake brief (module 01; PLAN.md §6a "Screen types"): the learner's fixed opening, then the
 * agent's rounds of ranked questions, each answered by picking a chip (the recommended one
 * dashed). A pick writes its chip's decision into the record panel as Dn, numbered across the
 * rounds, and reports `interacted`; another pick replaces the line and reports again. Once a
 * round is answered the next appears, opening with its playback message. "Your defaults" on the
 * last round picks the recommended chip of every question left, shows the learner's one-line
 * reply, and reports one `interacted` per decision it fills. With every decision filled, the
 * agent's closing message and the comparison card appear.
 *
 * The saved answer is `{picked, defaults}`, and the screen renders from it as it was left.
 */
export function BriefScreen({ screen, saved, onEvent }: ScreenProps<'brief'>) {
  const { rounds, panel } = screen;
  const questions = rounds.flatMap((round) => round.questions);
  const [state, setState] = useState(() => savedState(saved, questions));
  const root = useRef<HTMLDivElement>(null);
  // Pressing "Your defaults" removes it; focus goes on to the agent's closing message.
  const focusNext = useFocusAfterRender(root);
  const panelId = useId();
  const hintId = useId();
  const id = useId();

  const { picked } = state;
  // The first question of each round, by its position across the rounds.
  const starts = rounds.map((_, r) => rounds.slice(0, r).reduce((n, round) => n + round.questions.length, 0));
  const answered = (r: number) => picked.slice(starts[r], starts[r] + rounds[r].questions.length).every((p) => p !== null);
  // A round shows once every round before it is answered.
  let shown = 1;
  while (shown < rounds.length && answered(shown - 1)) shown += 1;
  const last = rounds.length - 1;
  const filled = picked.filter((p) => p !== null).length;
  const closed = filled === questions.length;

  const report = (q: number, next: BriefAnswer) => {
    const chip = questions[q].chips[next.picked[q] ?? 0];
    onEvent({ type: 'interacted', slug: screen.slug, response: `D${q + 1}: ${chip.label}`, answer: next });
  };

  const pick = (q: number, c: number) => {
    if (picked[q] === c) return;
    const next = { ...state, picked: picked.map((p, i) => (i === q ? c : p)) };
    setState(next);
    report(q, next);
  };

  const takeDefaults = () => {
    const left = questions.flatMap((_, q) => (q >= starts[last] && picked[q] === null ? [q] : []));
    const next = { picked: picked.map((p, q) => (left.includes(q) ? recommended(questions[q]) : p)), defaults: true };
    setState(next);
    for (const q of left) report(q, next);
    focusNext('.chat-msg[tabindex="-1"]');
  };

  const note = fillTemplate(panel.note, { filled, total: questions.length });

  return (
    <div ref={root} className="brief">
      <div className="scene-card brief-chat">
        <ChatLog label="The conversation">
          <Message who="learner">
            <p>
              <Copy text={screen.opening} />
            </p>
          </Message>
          {rounds.slice(0, shown).map((round, r) => (
            <Message key={r} who="agent" wide>
              <p>
                <Copy text={round.message} />
              </p>
              {round.questions.map((question, i) => {
                const q = starts[r] + i;
                const labelId = `${id}-q${q}`;
                return (
                  <div key={i} className="brief-question" role="group" aria-labelledby={labelId}>
                    <p>
                      <strong id={labelId}>
                        {q + 1}. <Copy text={question.text} />
                      </strong>
                      {[question.decides, question.recommendation].map(
                        (line, k) =>
                          line !== undefined && (
                            <span key={k} className="muted small">
                              {' '}
                              <Copy text={line} />
                            </span>
                          ),
                      )}
                    </p>
                    <div className="chips">
                      {question.chips.map((chip, c) => (
                        <Chip key={c} pressed={picked[q] === c} recommended={chip.recommended} onPick={() => pick(q, c)}>
                          <Copy text={chip.label} />
                        </Chip>
                      ))}
                    </div>
                  </div>
                );
              })}
              {r === last && !state.defaults && !answered(last) && (
                <div className="brief-defaults">
                  <button type="button" className="btn btn-primary" aria-describedby={screen.defaults.hint === undefined ? undefined : hintId} onClick={takeDefaults}>
                    <Copy text={screen.defaults.label} />
                  </button>
                  {screen.defaults.hint !== undefined && (
                    <span id={hintId} className="muted small">
                      <Copy text={screen.defaults.hint} />
                    </span>
                  )}
                </div>
              )}
            </Message>
          ))}
          {state.defaults && (
            <Message who="learner">
              <p>
                <Copy text={screen.defaults.reply} />
              </p>
            </Message>
          )}
          {closed && (
            <Message who="agent" tabIndex={-1}>
              <p>
                <Copy text={screen.closing} />
              </p>
            </Message>
          )}
        </ChatLog>
      </div>
      <div className="brief-side">
        <section className="scene-card brief-panel" aria-labelledby={panelId}>
          <h2 id={panelId} className="eyebrow brief-panel-heading">
            <Copy text={panel.heading} />
          </h2>
          <p className="muted small" aria-live="polite" aria-atomic="true">
            <Copy text={note} />
          </p>
          <ol className="brief-decisions">
            {questions.map((question, q) => {
              const c = picked[q];
              const chip = c === null ? undefined : question.chips[c];
              const round = starts.findLastIndex((s) => s <= q);
              const waiting = round < shown ? `waiting for question ${q + 1}` : `round ${ROUNDS[round] ?? round + 1}`;
              return (
                <li key={q} className="brief-decision" data-filled={chip !== undefined || undefined}>
                  <span className="brief-decision-id">D{q + 1}</span>
                  <span className="brief-decision-text">{chip ? <Copy text={chip.decision} /> : waiting}</span>
                </li>
              );
            })}
          </ol>
        </section>
        {closed && screen.comparison !== undefined && (
          <div className="brief-comparison">
            <p>
              <Copy text={screen.comparison} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
