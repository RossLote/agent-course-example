import { useEffect, useId, useRef, useState } from 'react';
import { fillTemplate } from '../../content/copy.ts';
import type { ScreenOf } from '../../content/index.ts';
import { ChatLog, Chip, Message } from '../chat/Conversation.tsx';
import { Copy } from '../scene/Copy.tsx';
import { fittingList, indexBelow, savedField } from '../saved.ts';
import type { SavedAnswer, ScreenProps } from '../types.ts';
import { FADE_MS, SEND_HINT, SEND_LABEL, sentLine, THINKING, THINKING_MS } from './labels.ts';
import './Brief.css';

type Round = ScreenOf<'brief'>['rounds'][number];
type Question = Round['questions'][number];

/**
 * What a brief saves: the picked chip's position for every question across the rounds (null
 * while unanswered), and whether "Your defaults" was pressed.
 */
type BriefAnswer = { picked: (number | null)[]; defaults: boolean };

/**
 * The brief as it stands: its answer, and how many rounds are sent (rounds are sent in order, so
 * the first `sent` of them). Sending is not saved; a resumed brief works it out from the picks.
 */
type BriefState = BriefAnswer & { sent: number };

/**
 * Where the agent's turn is between rounds: showing (a round or the closing), a sent round
 * fading out, or thinking before its next turn.
 */
type Phase = 'showing' | 'leaving' | 'thinking';

const ROUNDS = ['one', 'two', 'three', 'four', 'five'];

/** The position, across the rounds, of each round's first question. */
function roundStarts(rounds: readonly Round[]): number[] {
  return rounds.map((_, r) => rounds.slice(0, r).reduce((n, round) => n + round.questions.length, 0));
}

/** A round's picks, out of the picks across the rounds. */
function roundPicks(picked: readonly (number | null)[], rounds: readonly Round[], r: number): (number | null)[] {
  const start = roundStarts(rounds)[r];
  return picked.slice(start, start + rounds[r].questions.length);
}

/**
 * The state a saved answer holds, or undefined when there is none or it does not fit the screen
 * (saved.ts): a chip of its question or null for every question, nothing picked past the first
 * round with an unanswered question, and "Your defaults" pressed only once every question is
 * answered. A round counts as sent when every question in it (and every round before it) is
 * answered, so a resumed brief opens on the first round with an unanswered question, or closed.
 */
function savedState(saved: SavedAnswer | undefined, rounds: readonly Round[]): BriefState | undefined {
  const questions = rounds.flatMap((round) => round.questions);
  const isPick = (chip: unknown, q: number): chip is number | null => chip === null || indexBelow(chip, questions[q].chips.length);
  const picked = fittingList(savedField(saved, 'picked'), isPick, questions.length);
  const defaults = savedField(saved, 'defaults');
  if (picked === undefined || typeof defaults !== 'boolean') return undefined;
  const answered = (r: number) => roundPicks(picked, rounds, r).every((p) => p !== null);
  const untouched = (r: number) => roundPicks(picked, rounds, r).every((p) => p === null);
  const unanswered = rounds.findIndex((_, r) => !answered(r));
  const sent = unanswered === -1 ? rounds.length : unanswered;
  const fits = (!defaults || sent === rounds.length) && rounds.every((_, r) => r <= sent || untouched(r));
  return fits ? { picked, defaults, sent } : undefined;
}

/** The position of a question's recommended chip (the schema makes sure there is exactly one). */
function recommended(question: Question): number {
  return Math.max(
    question.chips.findIndex((c) => c.recommended),
    0,
  );
}

/** Whether the learner asks for less motion: then a sent round goes without fading. */
function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Focus on a turn that has just arrived, with its top in view: it arrives where the sent round
 * was, so the page scrolls only when that top is above the window or low in it.
 */
function focusArrived(turn: HTMLElement) {
  turn.focus({ preventScroll: true });
  const { top } = turn.getBoundingClientRect();
  if (top < 0 || top > window.innerHeight / 2) turn.scrollIntoView({ block: 'start' });
}

/**
 * The fake brief (module 01; PLAN.md §6 "The brief, one round at a time"): the learner's fixed
 * opening, then the agent's rounds of ranked questions one at a time, each answered by picking a
 * chip (the recommended one dashed). A pick writes its chip's decision into the record panel as
 * Dn, numbered across the rounds, and reports `interacted`; another pick replaces the line and
 * reports again. Send answers is off until every question in the round is answered; sending
 * fades the round out, puts the learner's one line in its place ("My answers to 1 to 5."), and
 * the agent thinks for a moment before its next round arrives in the same place, focus on its
 * message. "Your defaults" on the last round picks the recommended chip of every question left,
 * reports one `interacted` per decision it fills, and sends with the learner's one-line reply;
 * it goes once every question in the round is answered, leaving Send answers the way on.
 * After the last round the agent thinks, then its closing message and the comparison card
 * arrive. On screen at any time: the opening, the latest learner line and the agent's turn.
 * Sending reports nothing.
 *
 * The saved answer is `{picked, defaults}`. Sending is not saved: the screen opens on the first
 * round with an unanswered question, with its picks, or closed with the latest learner line once
 * every question is answered, with no Thinking (unanswered when the saved answer does not fit).
 */
export function BriefScreen({ screen, saved, onEvent }: ScreenProps<'brief'>) {
  const { rounds, panel } = screen;
  const questions = rounds.flatMap((round) => round.questions);
  const starts = roundStarts(rounds);
  const [state, setState] = useState<BriefState>(() => savedState(saved, rounds) ?? { picked: questions.map(() => null), defaults: false, sent: 0 });
  const [phase, setPhase] = useState<Phase>('showing');
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  // Set when Thinking gives way to the agent's next turn, so focus goes on to it once it renders.
  const arrived = useRef(false);
  const panelId = useId();
  const sendHintId = useId();
  const defaultsHintId = useId();
  const id = useId();

  const { picked, defaults, sent } = state;
  const last = rounds.length - 1;
  const closed = sent === rounds.length;
  // The round on screen: the one being answered, or the one fading out after it was sent.
  const current = phase === 'leaving' ? sent - 1 : sent;
  const ready = current <= last && roundPicks(picked, rounds, current).every((p) => p !== null);
  const filled = picked.filter((p) => p !== null).length;
  // The rounds whose questions have been on screen, for the record's waiting lines.
  const reached = phase === 'showing' ? Math.min(sent + 1, rounds.length) : sent;

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    if (!arrived.current) return;
    arrived.current = false;
    const turn = root.current?.querySelector<HTMLElement>(closed ? '[data-message="closing"]' : `[data-message="round-${sent}"]`);
    if (turn) focusArrived(turn);
  });

  /** The learner's line once `n` rounds are sent: the defaults reply, or the questions answered. */
  const learnerLine = (n: number) => {
    if (n === 0) return undefined;
    if (n === rounds.length && defaults) return screen.defaults.reply;
    return sentLine(starts[n - 1] + 1, starts[n - 1] + rounds[n - 1].questions.length);
  };
  const line = learnerLine(current);

  const later = (run: () => void, ms: number) => {
    timers.current.push(window.setTimeout(run, ms));
  };

  const report = (q: number, next: BriefState) => {
    const chip = questions[q].chips[next.picked[q] ?? 0];
    const answer: BriefAnswer = { picked: next.picked, defaults: next.defaults };
    onEvent({ type: 'interacted', slug: screen.slug, response: `D${q + 1}: ${chip.label}`, answer });
  };

  const pick = (q: number, c: number) => {
    if (phase !== 'showing' || picked[q] === c) return;
    const next = { ...state, picked: picked.map((p, i) => (i === q ? c : p)) };
    setState(next);
    report(q, next);
  };

  /** Sends the round on screen: it fades out (not under reduced motion), then the agent thinks. */
  const send = (next: BriefState) => {
    setState(next);
    const think = () => {
      setPhase('thinking');
      later(() => {
        arrived.current = true;
        setPhase('showing');
      }, THINKING_MS);
    };
    if (reducedMotion()) think();
    else {
      setPhase('leaving');
      later(think, FADE_MS);
    }
  };

  const sendAnswers = () => {
    if (phase === 'showing' && ready) send({ ...state, sent: sent + 1 });
  };

  const takeDefaults = () => {
    if (phase !== 'showing') return;
    const left = questions.flatMap((_, q) => (q >= starts[last] && picked[q] === null ? [q] : []));
    const next = { picked: picked.map((p, q) => (left.includes(q) ? recommended(questions[q]) : p)), defaults: true, sent: rounds.length };
    for (const q of left) report(q, next);
    send(next);
  };

  const note = fillTemplate(panel.note, { filled, total: questions.length });

  const roundTurn = (r: number) => {
    const round = rounds[r];
    return (
      <Message key={`round-${r}`} who="agent" wide anchor={`round-${r}`}>
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
                  (text, k) =>
                    text !== undefined && (
                      <span key={k} className="muted small">
                        {' '}
                        <Copy text={text} />
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
        <div className="brief-send">
          <button type="button" className="btn btn-primary" aria-disabled={!ready || undefined} aria-describedby={sendHintId} onClick={sendAnswers}>
            {SEND_LABEL}
          </button>
          {r === last && !ready && (
            <button type="button" className="btn btn-ghost" aria-describedby={screen.defaults.hint === undefined ? undefined : defaultsHintId} onClick={takeDefaults}>
              <Copy text={screen.defaults.label} />
            </button>
          )}
          <span className="muted small">
            <span id={sendHintId}>{SEND_HINT}</span>
            {r === last && !ready && screen.defaults.hint !== undefined && (
              <>
                {' '}
                <span id={defaultsHintId}>
                  <Copy text={screen.defaults.hint} />
                </span>
              </>
            )}
          </span>
        </div>
      </Message>
    );
  };

  return (
    <div ref={root} className="brief">
      <div className="scene-card brief-chat" data-phase={phase}>
        <ChatLog label="The conversation">
          <Message who="learner">
            <p>
              <Copy text={screen.opening} />
            </p>
          </Message>
          {line !== undefined && (
            <Message key={`line-${current}`} who="learner">
              <p>{line}</p>
            </Message>
          )}
          {phase === 'thinking' ? (
            <Message key="thinking" who="agent">
              <p className="brief-thinking">
                <span className="brief-spinner" aria-hidden="true" />
                {THINKING}
              </p>
            </Message>
          ) : current <= last ? (
            roundTurn(current)
          ) : (
            <Message key="closing" who="agent" anchor="closing">
              <p>
                <Copy text={screen.closing} />
              </p>
            </Message>
          )}
        </ChatLog>
        {/* In the page from the start, so a screen reader is listening before Thinking comes. */}
        <p className="sr-only" role="status">
          {phase === 'thinking' ? THINKING : ''}
        </p>
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
              const waiting = round < reached ? `waiting for question ${q + 1}` : `round ${ROUNDS[round] ?? round + 1}`;
              return (
                <li key={q} className="brief-decision" data-filled={chip !== undefined || undefined}>
                  <span className="brief-decision-id">D{q + 1}</span>
                  <span className="brief-decision-text">{chip ? <Copy text={chip.decision} /> : waiting}</span>
                </li>
              );
            })}
          </ol>
        </section>
        {closed && phase === 'showing' && screen.comparison !== undefined && (
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
