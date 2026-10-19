import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { course } from '../../content/index.ts';
import { NO_PROGRESS, realScreen } from '../../course/frame/fixture.ts';
import type { SavedAnswer } from '../types.ts';
import { BriefScreen } from './index.tsx';
import { FADE_MS, THINKING_MS } from './labels.ts';

// Module 01's brief, as authored.
const { module: module01, screen: brief } = realScreen('01', 'brief');
const [round1, round2] = brief.rounds;

function renderBrief(saved?: SavedAnswer) {
  const onEvent = vi.fn();
  render(<BriefScreen screen={brief} module={module01} course={course} saved={saved} progress={NO_PROGRESS} onEvent={onEvent} />);
  return onEvent;
}

/** The question groups showing. */
const questions = () => screen.queryAllByRole('group');
/** The numbered text of the questions showing. */
const questionTexts = () => questions().map((g) => document.getElementById(g.getAttribute('aria-labelledby')!)?.textContent);
/** The record's lines, "Dn text". */
const decisions = () =>
  within(screen.getByRole('region', { name: 'The record' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);
/** The record's note, "n of 8 decisions. …". */
const note = () => screen.getByText(/of 8 decisions\./).textContent;
/** The conversation's messages, as [who, bubble text]. */
const conversation = () =>
  within(screen.getByRole('list', { name: 'The conversation' }))
    .getAllByRole('listitem')
    .map((li) => [li.getAttribute('data-who'), li.querySelector('.chat-bubble')?.textContent]);
const chipsOf = (group: HTMLElement) => within(group).getAllByRole('button');
const sendButton = () => screen.queryByRole('button', { name: 'Send answers' });
const defaultsButton = () => screen.queryByRole('button', { name: 'Your defaults' });
/** The polite status that announces Thinking. */
const status = () => screen.getByRole('status');
const pickFirstOfEach = () => questions().forEach((group) => fireEvent.click(chipsOf(group)[0]));
/** Lets the fade and the Thinking pause run out. */
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const sendAndWait = () => {
  fireEvent.click(sendButton()!);
  wait(FADE_MS);
  wait(THINKING_MS);
};
const toRoundTwo = () => {
  pickFirstOfEach();
  sendAndWait();
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('BriefScreen, the fridge brief (module 01)', () => {
  it('has the intro that says to send the answers', () => {
    expect(brief.intro).toBe(
      'Same agent as module 00. This time it asks before it builds. Each question comes with its recommended answer (dashed); pick it or pick differently, then send your answers. Every answer becomes a decision on the right.',
    );
  });

  it("shows the learner's opening and round one alone: five questions of three chips each, the recommended one marked", () => {
    renderBrief();
    expect(conversation()).toEqual([
      ['learner', brief.opening],
      ['agent', expect.stringContaining(round1.message)],
    ]);
    expect(questionTexts()).toEqual(round1.questions.map((q, i) => `${i + 1}. ${q.text}`));
    for (const group of questions()) {
      const chips = chipsOf(group);
      expect(chips).toHaveLength(3);
      expect(chips.map((c) => c.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false']);
      // The first is the recommended one, dashed and named so.
      expect(chips.map((c) => c.hasAttribute('data-recommended'))).toEqual([true, false, false]);
      expect(chips[0].textContent).toMatch(/ \(recommended\)$/);
    }
    expect(screen.getByRole('button', { name: 'Kitchen staff on induction, tablet or laptop, about five minutes (recommended)' })).toBeTruthy();
  });

  it('starts Send answers off, with its hint, and no defaults button on round one', () => {
    renderBrief();
    const send = sendButton()!;
    expect(send.getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById(send.getAttribute('aria-describedby')!)?.textContent).toBe('Answer every question, then send.');
    expect(defaultsButton()).toBeNull();
  });

  it('shows an empty record of eight, round two waiting', () => {
    renderBrief();
    expect(note()).toBe('0 of 8 decisions. The builder reads these, not your memory of the conversation.');
    expect(decisions()).toEqual(['D1waiting for question 1', 'D2waiting for question 2', 'D3waiting for question 3', 'D4waiting for question 4', 'D5waiting for question 5', 'D6round two', 'D7round two', 'D8round two']);
  });

  it('fills a decision on each pick, sends interacted per pick, and turns Send answers on once all five are answered', () => {
    const onEvent = renderBrief();
    questions()
      .slice(0, 4)
      .forEach((group) => fireEvent.click(chipsOf(group)[0]));
    expect(sendButton()!.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(chipsOf(questions()[4])[0]);
    expect(sendButton()!.hasAttribute('aria-disabled')).toBe(false);

    expect(onEvent).toHaveBeenCalledTimes(5);
    expect(onEvent.mock.calls.map(([e]) => [e.type, e.slug, e.response])).toEqual(round1.questions.map((q, i) => ['interacted', 'fridge-brief', `D${i + 1}: ${q.chips[0].label}`]));
    expect(onEvent.mock.calls[4][0].answer).toEqual({ picked: [0, 0, 0, 0, 0, null, null, null], defaults: false });
    expect(note()).toMatch(/^5 of 8 decisions\./);
    expect(decisions().slice(0, 5)).toEqual(round1.questions.map((q, i) => `D${i + 1}${q.chips[0].decision}`));

    // Round two waits for Send answers.
    expect(questions()).toHaveLength(5);
    expect(screen.queryByText(round2.message)).toBeNull();
  });

  it('does nothing when Send answers is pressed while off', () => {
    const onEvent = renderBrief();
    fireEvent.click(chipsOf(questions()[0])[0]);
    onEvent.mockClear();
    fireEvent.click(sendButton()!);
    wait(FADE_MS + THINKING_MS);
    expect(questions()).toHaveLength(5);
    expect(screen.queryByText('Thinking…')).toBeNull();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('Send answers fades round one, puts "My answers to 1 to 5." in its place, thinks, then brings round two with focus on its message, and reports nothing', () => {
    const onEvent = renderBrief();
    pickFirstOfEach();
    onEvent.mockClear();
    const chat = document.querySelector('.brief-chat')!;

    fireEvent.click(sendButton()!);
    // Fading: round one still there for the fade, nothing new yet.
    expect(chat.getAttribute('data-phase')).toBe('leaving');
    expect(questions()).toHaveLength(5);
    expect(status().textContent).toBe('');

    wait(FADE_MS);
    expect(chat.getAttribute('data-phase')).toBe('thinking');
    expect(questions()).toHaveLength(0);
    expect(conversation()).toEqual([
      ['learner', brief.opening],
      ['learner', 'My answers to 1 to 5.'],
      ['agent', 'Thinking…'],
    ]);
    expect(status().textContent).toBe('Thinking…');
    expect(decisions().slice(5)).toEqual(['D6round two', 'D7round two', 'D8round two']);

    wait(THINKING_MS - 1);
    expect(screen.queryByText(round2.message)).toBeNull();
    wait(1);
    expect(conversation()).toEqual([
      ['learner', brief.opening],
      ['learner', 'My answers to 1 to 5.'],
      ['agent', expect.stringContaining(round2.message)],
    ]);
    expect(status().textContent).toBe('');
    expect(questionTexts()).toEqual(round2.questions.map((q, i) => `${i + 6}. ${q.text}`));
    const message = screen.getByText(round2.message).closest('li');
    expect(message?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(message);
    expect(decisions().slice(5)).toEqual(['D6waiting for question 6', 'D7waiting for question 7', 'D8waiting for question 8']);

    // Round two: Send answers off again, and Your defaults beside it with its hint.
    expect(sendButton()!.getAttribute('aria-disabled')).toBe('true');
    const defaults = defaultsButton()!;
    expect(document.getElementById(defaults.getAttribute('aria-describedby')!)?.textContent).toBe('One line is a complete reply.');
    expect(screen.queryByText(brief.closing)).toBeNull();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('ignores chips and Send answers while a round fades', () => {
    const onEvent = renderBrief();
    pickFirstOfEach();
    onEvent.mockClear();
    fireEvent.click(sendButton()!);
    fireEvent.click(chipsOf(questions()[0])[1]);
    fireEvent.click(sendButton()!);
    expect(onEvent).not.toHaveBeenCalled();
    wait(FADE_MS);
    wait(THINKING_MS);
    expect(questionTexts()).toEqual(round2.questions.map((q, i) => `${i + 6}. ${q.text}`));
  });

  it('under reduced motion nothing fades: Thinking comes straight away', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' }));
    renderBrief();
    pickFirstOfEach();
    fireEvent.click(sendButton()!);
    expect(document.querySelector('.brief-chat')!.getAttribute('data-phase')).toBe('thinking');
    expect(questions()).toHaveLength(0);
    expect(status().textContent).toBe('Thinking…');
    wait(THINKING_MS);
    expect(screen.getByText(round2.message)).toBeTruthy();
  });

  /** The learner's line in the conversation, "My answers to 1 to 5." while the agent thinks. */
  const learnerLine = (text: string) => screen.getByText(text).closest('li');

  it('moves focus from Send answers to the learner’s line while the agent thinks, never to the page, then to the next round’s message', () => {
    renderBrief();
    pickFirstOfEach();
    sendButton()!.focus();
    fireEvent.click(sendButton()!);
    // Fading: focus stays on Send answers while the round is still there.
    expect(document.activeElement).toBe(sendButton());
    wait(FADE_MS);
    const line = learnerLine('My answers to 1 to 5.');
    expect(line?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(line);
    wait(THINKING_MS);
    expect(document.activeElement).toBe(screen.getByText(round2.message).closest('li'));
  });

  it('does the same under reduced motion, from Your defaults to the closing', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' }));
    renderBrief();
    toRoundTwo();
    defaultsButton()!.focus();
    fireEvent.click(defaultsButton()!);
    expect(document.activeElement).toBe(learnerLine('Your defaults.'));
    wait(THINKING_MS);
    expect(document.activeElement).toBe(screen.getByText(brief.closing).closest('li'));
  });

  it('leaves focus where the learner moved it while the agent thinks', () => {
    renderBrief();
    pickFirstOfEach();
    const elsewhere = document.body.appendChild(document.createElement('button'));
    sendButton()!.focus();
    fireEvent.click(sendButton()!);
    wait(FADE_MS);
    expect(document.activeElement).toBe(learnerLine('My answers to 1 to 5.'));
    elsewhere.focus();
    wait(THINKING_MS);
    expect(screen.getByText(round2.message)).toBeTruthy();
    expect(document.activeElement).toBe(elsewhere);
    elsewhere.remove();
  });

  it('leaves focus where the learner moved it while the round fades', () => {
    renderBrief();
    pickFirstOfEach();
    const elsewhere = document.body.appendChild(document.createElement('button'));
    sendButton()!.focus();
    fireEvent.click(sendButton()!);
    elsewhere.focus();
    wait(FADE_MS);
    expect(document.activeElement).toBe(elsewhere);
    wait(THINKING_MS);
    expect(document.activeElement).toBe(elsewhere);
    elsewhere.remove();
  });

  it('"Your defaults" fills D6-D8 with the recommended chips, sends 3 interacted, replies "Your defaults.", thinks, and closes the brief', () => {
    const onEvent = renderBrief();
    toRoundTwo();
    onEvent.mockClear();
    fireEvent.click(defaultsButton()!);

    expect(onEvent).toHaveBeenCalledTimes(3);
    const all = { picked: [0, 0, 0, 0, 0, 0, 0, 0], defaults: true };
    expect(onEvent.mock.calls.map(([e]) => e)).toEqual(round2.questions.map((q, i) => ({ type: 'interacted', slug: 'fridge-brief', response: `D${i + 6}: ${q.chips[0].label}`, answer: all })));
    expect(note()).toMatch(/^8 of 8 decisions\./);
    expect(decisions().slice(5)).toEqual(round2.questions.map((q, i) => `D${i + 6}${q.chips[0].decision}`));

    wait(FADE_MS);
    expect(conversation()).toEqual([
      ['learner', brief.opening],
      ['learner', 'Your defaults.'],
      ['agent', 'Thinking…'],
    ]);
    expect(screen.queryByText(brief.comparison!)).toBeNull();

    wait(THINKING_MS);
    expect(conversation()).toEqual([
      ['learner', brief.opening],
      ['learner', 'Your defaults.'],
      ['agent', brief.closing],
    ]);
    expect(document.activeElement).toBe(screen.getByText(brief.closing).closest('li'));
    expect(screen.getByText(brief.comparison!)).toBeTruthy();
    expect(questions()).toHaveLength(0);
    expect(sendButton()).toBeNull();
    expect(defaultsButton()).toBeNull();
    expect(onEvent).toHaveBeenCalledTimes(3);
  });

  it('fills only the round-two questions left when some were picked first', () => {
    const onEvent = renderBrief();
    toRoundTwo();
    fireEvent.click(chipsOf(questions()[1])[1]);
    onEvent.mockClear();
    fireEvent.click(defaultsButton()!);
    expect(onEvent.mock.calls.map(([e]) => e.response)).toEqual([`D6: ${round2.questions[0].chips[0].label}`, `D8: ${round2.questions[2].chips[0].label}`]);
    expect(onEvent.mock.calls[1][0].answer).toEqual({ picked: [0, 0, 0, 0, 0, 0, 1, 0], defaults: true });
    expect(decisions()[6]).toBe(`D7${round2.questions[1].chips[1].decision}`);
  });

  it('Send answers on round two replies "My answers to 6 to 8.", thinks, and closes the brief with 8 of 8', () => {
    const onEvent = renderBrief();
    toRoundTwo();
    questions().forEach((group) => fireEvent.click(chipsOf(group)[1]));
    onEvent.mockClear();
    sendAndWait();
    expect(onEvent).not.toHaveBeenCalled();
    expect(conversation()).toEqual([
      ['learner', brief.opening],
      ['learner', 'My answers to 6 to 8.'],
      ['agent', brief.closing],
    ]);
    expect(note()).toMatch(/^8 of 8 decisions\./);
    expect(screen.getByText(brief.comparison!)).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByText(brief.closing).closest('li'));
    expect(screen.queryByText('Your defaults.')).toBeNull();
  });

  it('replaces the line and sends again on a re-pick; the same chip again sends nothing', () => {
    const onEvent = renderBrief();
    pickFirstOfEach();
    onEvent.mockClear();
    const third = questions()[2];
    fireEvent.click(chipsOf(third)[0]);
    expect(onEvent).not.toHaveBeenCalled();

    fireEvent.click(chipsOf(third)[2]);
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenLastCalledWith({
      type: 'interacted',
      slug: 'fridge-brief',
      response: `D3: ${round1.questions[2].chips[2].label}`,
      answer: { picked: [0, 0, 2, 0, 0, null, null, null], defaults: false },
    });
    expect(chipsOf(third).map((c) => c.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true']);
    expect(decisions()[2]).toBe('D3No feedback during; all results shown at the end. It is a test.');
    expect(note()).toMatch(/^5 of 8 decisions\./);
  });

  it('reports the picks and the defaults, not the rounds sent, in a round-two pick', () => {
    const onEvent = renderBrief();
    toRoundTwo();
    onEvent.mockClear();
    fireEvent.click(chipsOf(questions()[0])[1]);
    expect(onEvent.mock.calls[0][0].answer).toEqual({ picked: [0, 0, 0, 0, 0, 1, null, null], defaults: false });
  });

  it('hides Your defaults once every round-two question is answered, leaving Send answers', () => {
    renderBrief();
    toRoundTwo();
    questions()
      .slice(0, 2)
      .forEach((group) => fireEvent.click(chipsOf(group)[0]));
    expect(defaultsButton()).toBeTruthy();
    fireEvent.click(chipsOf(questions()[2])[0]);
    expect(defaultsButton()).toBeNull();
    expect(screen.queryByText('One line is a complete reply.')).toBeNull();
    expect(sendButton()!.hasAttribute('aria-disabled')).toBe(false);
  });

  it('stays on a round answered in full until it is sent', () => {
    renderBrief();
    pickFirstOfEach();
    wait(FADE_MS + THINKING_MS);
    expect(questions()).toHaveLength(5);
    sendAndWait();
    questions().forEach((group) => fireEvent.click(chipsOf(group)[0]));
    wait(FADE_MS + THINKING_MS);
    expect(questions()).toHaveLength(3);
    expect(screen.queryByText(brief.closing)).toBeNull();
  });

  it('resumes on the first round with an unanswered question, with its picks, and no Thinking', () => {
    // Round two part-answered: round two, its picks.
    renderBrief({ picked: [0, 1, 0, 2, 0, 1, null, null], defaults: false });
    expect(conversation()).toEqual([
      ['learner', brief.opening],
      ['learner', 'My answers to 1 to 5.'],
      ['agent', expect.stringContaining(round2.message)],
    ]);
    expect(questionTexts()).toEqual(round2.questions.map((q, i) => `${i + 6}. ${q.text}`));
    expect(chipsOf(questions()[0]).map((c) => c.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
    expect(decisions()[3]).toBe(`D4${round1.questions[3].chips[2].decision}`);
    expect(note()).toMatch(/^6 of 8 decisions\./);
    expect(screen.queryByText('Thinking…')).toBeNull();
    expect(defaultsButton()).toBeTruthy();
    cleanup();

    // Round one answered: round two, unanswered.
    renderBrief({ picked: [0, 0, 0, 0, 0, null, null, null], defaults: false });
    expect(questionTexts()).toEqual(round2.questions.map((q, i) => `${i + 6}. ${q.text}`));
    expect(conversation()[1]).toEqual(['learner', 'My answers to 1 to 5.']);
    cleanup();

    // Round one part-answered: round one, part-filled.
    renderBrief({ picked: [0, null, 1, null, null, null, null, null], defaults: false });
    expect(note()).toMatch(/^2 of 8 decisions\./);
    expect(decisions()[1]).toBe('D2waiting for question 2');
    expect(questions()).toHaveLength(5);
    expect(chipsOf(questions()[2]).map((c) => c.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    expect(sendButton()!.getAttribute('aria-disabled')).toBe('true');
    expect(conversation()).toHaveLength(2);
  });

  it('opens closed once every question is answered: the latest learner line, the closing and the comparison, no Send answers', () => {
    const onEvent = renderBrief({ picked: [0, 1, 0, 2, 0, 0, 0, 0], defaults: true });
    expect(conversation()).toEqual([
      ['learner', brief.opening],
      ['learner', 'Your defaults.'],
      ['agent', brief.closing],
    ]);
    expect(screen.getByText(brief.comparison!)).toBeTruthy();
    expect(sendButton()).toBeNull();
    expect(defaultsButton()).toBeNull();
    expect(screen.queryByText('Thinking…')).toBeNull();
    expect(note()).toMatch(/^8 of 8 decisions\./);
    expect(onEvent).not.toHaveBeenCalled();
    cleanup();

    renderBrief({ picked: [0, 1, 0, 2, 0, 1, 1, 1], defaults: false });
    expect(conversation()).toEqual([
      ['learner', brief.opening],
      ['learner', 'My answers to 6 to 8.'],
      ['agent', brief.closing],
    ]);
    expect(screen.getByText(brief.comparison!)).toBeTruthy();
    expect(sendButton()).toBeNull();
  });

  it('renders unanswered from a saved answer that does not fit', () => {
    const misfits: SavedAnswer[] = [
      'placeholder',
      { picked: [0, 9, 1], defaults: false },
      { picked: [0, 0, 0, 0, 0, 0, 0, 0, 0], defaults: false },
      { picked: [0, 9, 1, null, null, null, null, null], defaults: false },
      { picked: [0, 0, 0, 0, 0, null, null, null] },
      { picked: [0, 0, 0, 0, 0, null, null, null], defaults: true },
      { picked: [0, 0, 0, 0, 0, 0, null, 0], defaults: true },
      // A pick past the first round with an unanswered question.
      { picked: [0, 0, 0, 0, null, 0, null, null], defaults: false },
    ];
    for (const saved of misfits) {
      const onEvent = renderBrief(saved);
      expect(note(), JSON.stringify(saved)).toMatch(/^0 of 8 decisions\./);
      expect(questions()).toHaveLength(5);
      expect(conversation()).toHaveLength(2);
      expect(onEvent).not.toHaveBeenCalled();
      cleanup();
    }
  });
});
