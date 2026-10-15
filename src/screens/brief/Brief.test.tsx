import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { course, type ScreenOf } from '../../content/index.ts';
import { NO_ANSWERS } from '../../course/frame/progress.ts';
import type { SavedAnswer } from '../types.ts';
import { BriefScreen } from './index.tsx';

// Module 01's brief, as authored.
const module01 = course.modules.find((m) => m.slug === '01')!;
const brief = module01.screens.find((s): s is ScreenOf<'brief'> => s.type === 'brief')!;
const [round1, round2] = brief.rounds;

function renderBrief(saved?: SavedAnswer) {
  const onEvent = vi.fn();
  render(<BriefScreen screen={brief} module={module01} course={course} saved={saved} progress={{ items: NO_ANSWERS, score: { raw: 0, max: 0 } }} onEvent={onEvent} />);
  return onEvent;
}

/** The question groups showing, by their numbered text. */
const questions = () => screen.queryAllByRole('group');
/** The record's lines, "Dn text". */
const decisions = () =>
  within(screen.getByRole('region', { name: 'The record' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);
/** The record's note, "n of 8 decisions. …". */
const note = () => screen.getByText(/of 8 decisions\./).textContent;
const chipsOf = (group: HTMLElement) => within(group).getAllByRole('button');
const pressDefaults = () => fireEvent.click(screen.getByRole('button', { name: 'Your defaults' }));
const pickFirstOfRoundOne = () => questions().forEach((group) => fireEvent.click(chipsOf(group)[0]));

describe('BriefScreen, the fridge brief (module 01)', () => {
  it("shows the learner's opening, the agent's first round and five questions of three chips each, the recommended one marked", () => {
    renderBrief();
    const conversation = within(screen.getByRole('list', { name: 'The conversation' })).getAllByRole('listitem');
    expect(conversation.map((li) => li.getAttribute('data-who'))).toEqual(['learner', 'agent']);
    expect(conversation[0].textContent).toContain(brief.opening);
    expect(conversation[1].textContent).toContain(round1.message);

    expect(questions().map((g) => g.getAttribute('aria-labelledby') && document.getElementById(g.getAttribute('aria-labelledby')!)?.textContent)).toEqual(
      round1.questions.map((q, i) => `${i + 1}. ${q.text}`),
    );
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

  it('shows an empty record of eight, round two waiting, and no defaults button yet', () => {
    renderBrief();
    expect(note()).toBe('0 of 8 decisions. The builder reads these, not your memory of the conversation.');
    expect(decisions()).toEqual(['D1waiting for question 1', 'D2waiting for question 2', 'D3waiting for question 3', 'D4waiting for question 4', 'D5waiting for question 5', 'D6round two', 'D7round two', 'D8round two']);
    expect(screen.queryByRole('button', { name: 'Your defaults' })).toBeNull();
  });

  it('fills a decision on each pick, sends interacted per pick, and opens round two once all five are answered', () => {
    const onEvent = renderBrief();
    pickFirstOfRoundOne();
    expect(onEvent).toHaveBeenCalledTimes(5);
    expect(onEvent.mock.calls.map(([e]) => [e.type, e.slug, e.response])).toEqual(round1.questions.map((q, i) => ['interacted', 'fridge-brief', `D${i + 1}: ${q.chips[0].label}`]));
    expect(onEvent.mock.calls[4][0].answer).toEqual({ picked: [0, 0, 0, 0, 0, null, null, null], defaults: false });

    expect(note()).toMatch(/^5 of 8 decisions\./);
    expect(decisions().slice(0, 5)).toEqual(round1.questions.map((q, i) => `D${i + 1}${q.chips[0].decision}`));
    expect(decisions().slice(5)).toEqual(['D6waiting for question 6', 'D7waiting for question 7', 'D8waiting for question 8']);

    // Round two: the playback, questions 6 to 8, and the defaults button with its hint.
    expect(screen.getByText(round2.message)).toBeTruthy();
    expect(questions()).toHaveLength(8);
    const defaults = screen.getByRole('button', { name: 'Your defaults' });
    expect(document.getElementById(defaults.getAttribute('aria-describedby')!)?.textContent).toBe('One line is a complete reply.');
    expect(screen.queryByText(brief.closing)).toBeNull();
  });

  it('keeps round two closed until every round-one question is answered', () => {
    renderBrief();
    questions()
      .slice(0, 4)
      .forEach((group) => fireEvent.click(chipsOf(group)[1]));
    expect(questions()).toHaveLength(5);
    expect(note()).toMatch(/^4 of 8 decisions\./);
  });

  it('"Your defaults" fills D6-D8 with the recommended chips, sends 3 interacted, and closes the brief', () => {
    const onEvent = renderBrief();
    pickFirstOfRoundOne();
    onEvent.mockClear();
    pressDefaults();

    expect(onEvent).toHaveBeenCalledTimes(3);
    const all = { picked: [0, 0, 0, 0, 0, 0, 0, 0], defaults: true };
    expect(onEvent.mock.calls.map(([e]) => e)).toEqual(round2.questions.map((q, i) => ({ type: 'interacted', slug: 'fridge-brief', response: `D${i + 6}: ${q.chips[0].label}`, answer: all })));

    expect(note()).toMatch(/^8 of 8 decisions\./);
    expect(decisions().slice(5)).toEqual(round2.questions.map((q, i) => `D${i + 6}${q.chips[0].decision}`));
    expect(decisions()[5]).toBe('D6No timer. No leaderboard.');

    const conversation = within(screen.getByRole('list', { name: 'The conversation' })).getAllByRole('listitem');
    expect(conversation.slice(-2).map((li) => [li.getAttribute('data-who'), li.querySelector('.chat-bubble')?.textContent])).toEqual([
      ['learner', 'Your defaults.'],
      ['agent', brief.closing],
    ]);
    expect(document.activeElement).toBe(conversation.at(-1));
    expect(screen.getByText(brief.comparison!)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Your defaults' })).toBeNull();
  });

  it('fills only the round-two questions left when some were picked first', () => {
    const onEvent = renderBrief();
    pickFirstOfRoundOne();
    fireEvent.click(chipsOf(questions()[6])[1]);
    onEvent.mockClear();
    pressDefaults();
    expect(onEvent.mock.calls.map(([e]) => e.response)).toEqual([`D6: ${round2.questions[0].chips[0].label}`, `D8: ${round2.questions[2].chips[0].label}`]);
    expect(onEvent.mock.calls[1][0].answer).toEqual({ picked: [0, 0, 0, 0, 0, 0, 1, 0], defaults: true });
    expect(decisions()[6]).toBe(`D7${round2.questions[1].chips[1].decision}`);
  });

  it('closes without the defaults when round two is answered chip by chip', () => {
    renderBrief();
    pickFirstOfRoundOne();
    questions()
      .slice(5)
      .forEach((group) => fireEvent.click(chipsOf(group)[1]));
    expect(note()).toMatch(/^8 of 8 decisions\./);
    expect(screen.getByText(brief.closing)).toBeTruthy();
    expect(screen.queryByText('Your defaults.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Your defaults' })).toBeNull();
  });

  it('replaces the line and sends again on a re-pick; the same chip again sends nothing', () => {
    const onEvent = renderBrief();
    pickFirstOfRoundOne();
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

  it('renders a saved answer as it was left: the record filled, the defaults reply, the closing and the comparison', () => {
    const onEvent = renderBrief({ picked: [0, 1, 0, 2, 0, 0, 0, 0], defaults: true });
    expect(note()).toMatch(/^8 of 8 decisions\./);
    expect(decisions()[1]).toBe(`D2${round1.questions[1].chips[1].decision}`);
    expect(decisions()[3]).toBe(`D4${round1.questions[3].chips[2].decision}`);
    expect(chipsOf(questions()[1]).map((c) => c.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    expect(screen.getByText('Your defaults.')).toBeTruthy();
    expect(screen.getByText(brief.closing)).toBeTruthy();
    expect(screen.getByText(brief.comparison!)).toBeTruthy();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('renders a part-saved answer part-filled, dropping picks that are not chips', () => {
    renderBrief({ picked: [0, 9, 1], defaults: false });
    expect(note()).toMatch(/^2 of 8 decisions\./);
    expect(decisions()[1]).toBe('D2waiting for question 2');
    expect(questions()).toHaveLength(5);
  });
});
