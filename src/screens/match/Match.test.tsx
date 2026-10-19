import { describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ScreenOf } from '../../content/index.ts';
import { fixtureCourse, fixtureMatch, fixtureModule, fixtureTakeaway, NO_PROGRESS } from '../../course/frame/fixture.ts';
import type { SavedAnswer } from '../types.ts';
import { MatchScreen } from './index.tsx';

/** A scored match of six rows, with a body above them and a row in emphasis. */
const walls: ScreenOf<'match'> = {
  type: 'match',
  slug: 'name-the-wall',
  scored: true,
  heading: 'Name the wall',
  body: [{ type: 'paragraph', heading: 'The loop you ordered', text: 'brief › epic › build › reviews › you judge › retro' }],
  targets: [
    { id: 'record', label: 'the record' },
    { id: 'done', label: 'done' },
    { id: 'gate', label: 'the gate' },
    { id: 'agents', label: 'other agents' },
    { id: 'evidence', label: 'evidence' },
    { id: 'arrow', label: 'the arrow' },
  ],
  rows: [
    { text: 'The builder added a counter nobody asked for.', key: 'record', feedback: 'The record.' },
    { text: 'The builder says it is done, and you cannot say whether it is.', key: 'done', feedback: 'Done.' },
    { text: 'It changed the score screen too.', key: 'gate', feedback: 'The gate. Its files were not limited.' },
    { text: 'The new code is a copy of the old with one word changed.', key: 'agents', feedback: 'Other agents.' },
    { text: 'A forty-file change is waiting.', key: 'evidence', feedback: 'Evidence.' },
    { text: 'The hint shows after two wrong drops *of the same item*, which nobody specified.', key: 'arrow', feedback: 'The arrow.' },
  ],
  checkLabel: 'Check my answers',
};

const course = fixtureCourse();
const MATCHES: Record<string, ScreenOf<'match'>> = { 'who-catches-it': fixtureMatch, 'name-the-wall': walls };

// Inline matches: who catches it (unscored, four rows) and name the wall (scored, six rows).
function renderMatch(match: string, saved?: SavedAnswer) {
  const shown = MATCHES[match];
  const module = fixtureModule('01', [shown, fixtureTakeaway()]);
  const onEvent = vi.fn();
  const { container } = render(
    <MatchScreen screen={shown} module={module} course={course} saved={saved} progress={NO_PROGRESS} onEvent={onEvent} />,
  );
  return { shown, onEvent, container };
}

type Row = ScreenOf<'match'>['rows'][number];

/** The radio for `target` in the row whose text is `row`. */
const chip = (row: Row, target: string | RegExp) => within(screen.getByRole('group', { name: row.text.replaceAll('*', '') })).getByRole('radio', { name: target });
/** Picks `targets[i]`'s label on row i, by the label's id. */
function pickAll(shown: ScreenOf<'match'>, ids: readonly string[]) {
  shown.rows.forEach((row, i) => fireEvent.click(chip(row, shown.targets.find((t) => t.id === ids[i])!.label)));
}
const press = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
/** Each row's state: right, wrong or none. */
const states = (container: HTMLElement) => [...container.querySelectorAll('.match-row')].map((li) => li.getAttribute('data-state') ?? 'none');
const keys = (shown: ScreenOf<'match'>) => shown.rows.map((r) => r.key);

describe('MatchScreen, who catches it (unscored)', () => {
  it('shows the four rows, each a group of the four targets, with Check waiting for every row', () => {
    const { shown, onEvent } = renderMatch('who-catches-it');
    expect(shown.rows).toHaveLength(4);
    for (const row of shown.rows) {
      expect(within(screen.getByRole('group', { name: row.text })).getAllByRole('radio')).toHaveLength(4);
    }
    const check = screen.getByRole('button', { name: 'Check my matches' });
    expect(screen.getByText('0 of 4 answered')).toBeTruthy();
    fireEvent.click(chip(shown.rows[0], 'Simplify'));
    expect(screen.getByText('1 of 4 answered')).toBeTruthy();
    expect(check.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(check);
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('marks all four rows right with their feedback, and sends one interacted per row on Check', () => {
    const { shown, onEvent, container } = renderMatch('who-catches-it');
    pickAll(shown, keys(shown));
    expect(onEvent).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Check my matches' }).getAttribute('aria-disabled')).toBeNull();
    press('Check my matches');

    expect(states(container)).toEqual(['right', 'right', 'right', 'right']);
    expect(screen.getByRole('status').textContent).toBe('4 out of 4 right');
    shown.rows.forEach((row) => {
      const picked = within(screen.getByRole('group', { name: row.text })).getByRole('radio', { checked: true });
      expect(picked.hasAttribute('disabled')).toBe(true);
      expect(picked.closest('.match-chip')?.getAttribute('data-state')).toBe('right');
      const feedback = document.getElementById(picked.getAttribute('aria-describedby')!)!;
      expect(feedback.textContent).toBe(row.feedback);
      expect(within(feedback).getByRole('img').getAttribute('aria-label')).toBe('Right');
    });

    const answer = { picks: keys(shown) };
    expect(onEvent.mock.calls.map(([e]) => e)).toEqual(
      shown.rows.map((row) => ({ type: 'interacted', slug: 'who-catches-it', response: `${row.text}: ${shown.targets.find((t) => t.id === row.key)!.label}`, answer })),
    );
  });

  it('marks a wrong row red with a cross, its pick wrong and its right target marked', () => {
    const { shown, container } = renderMatch('who-catches-it');
    pickAll(shown, ['review', 'review', 'adversarial', 'epic']);
    press('Check my matches');
    expect(states(container)).toEqual(['wrong', 'right', 'right', 'right']);
    expect(screen.getByRole('status').textContent).toBe('3 out of 4 right');
    const row = within(screen.getByRole('group', { name: shown.rows[0].text }));
    expect(row.getByRole('radio', { name: 'Review, wrong' }).closest('.match-chip')?.getAttribute('data-state')).toBe('wrong');
    expect(row.getByRole('radio', { name: 'Simplify, the right answer' }).closest('.match-chip')?.getAttribute('data-state')).toBe('right');
    const feedback = document.getElementById(row.getByRole('radio', { name: 'Review, wrong' }).getAttribute('aria-describedby')!)!;
    expect(within(feedback).getByRole('img').getAttribute('aria-label')).toBe('Wrong');
    expect(feedback.textContent).toBe(shown.rows[0].feedback);
  });
});

describe('MatchScreen, name the wall (scored)', () => {
  it('reports 6 out of 6 right as answered 6 of 6', () => {
    const { shown, onEvent } = renderMatch('name-the-wall');
    expect(shown.rows).toHaveLength(6);
    pickAll(shown, keys(shown));
    press('Check my answers');
    expect(screen.getByRole('status').textContent).toBe('6 out of 6 right');
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({
      type: 'answered',
      slug: 'name-the-wall',
      right: true,
      score: { raw: 6, max: 6 },
      response: shown.rows.map((row) => `${row.text}: ${shown.targets.find((t) => t.id === row.key)!.label}`).join('; '),
      answer: { picks: keys(shown) },
    });
  });

  it('reports one wrong row as 5 of 6, not right, and sends again after Try again', () => {
    const { shown, onEvent, container } = renderMatch('name-the-wall');
    const picks = [...keys(shown)];
    picks[2] = 'evidence';
    pickAll(shown, picks);
    press('Check my answers');
    expect(screen.getByRole('status').textContent).toBe('5 out of 6 right');
    expect(states(container)).toEqual(['right', 'right', 'wrong', 'right', 'right', 'right']);
    expect(onEvent).toHaveBeenLastCalledWith(expect.objectContaining({ right: false, score: { raw: 5, max: 6 }, answer: { picks } }));

    press('Try again');
    expect(states(container)).toEqual(['none', 'none', 'none', 'none', 'none', 'none']);
    expect(screen.getAllByRole('radio').some((r) => (r as HTMLInputElement).checked)).toBe(false);
    expect(screen.getByRole('status').textContent).toBe('');
    pickAll(shown, keys(shown));
    press('Check my answers');
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenLastCalledWith(expect.objectContaining({ right: true, score: { raw: 6, max: 6 } }));
  });

  it('shows the loop the learner ordered above the rows', () => {
    renderMatch('name-the-wall');
    expect(screen.getByText('The loop you ordered')).toBeTruthy();
  });
});

describe('MatchScreen, from a saved answer', () => {
  it('renders checked, with each row marked and its feedback', () => {
    const { shown, container, onEvent } = renderMatch('name-the-wall', { picks: ['record', 'done', 'evidence', 'agents', 'evidence', 'arrow'] });
    expect(states(container)).toEqual(['right', 'right', 'wrong', 'right', 'right', 'right']);
    expect(screen.getByRole('status').textContent).toBe('5 out of 6 right');
    expect(screen.getAllByRole('radio').every((r) => r.hasAttribute('disabled'))).toBe(true);
    expect(screen.getByText(shown.rows[2].feedback)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('renders unanswered from a saved answer that does not fit: the wrong shape, the wrong length, a pick that is not a target', () => {
    const misfits: SavedAnswer[] = [
      'placeholder',
      { picks: 'simplify' },
      { picks: ['simplify', 'review'] },
      { picks: ['simplify', 'review', 'adversarial', 'nonsense'] },
      { picks: ['simplify', 'review', 'adversarial', null] },
    ];
    for (const saved of misfits) {
      const { container, onEvent } = renderMatch('who-catches-it', saved);
      expect(states(container), JSON.stringify(saved)).toEqual(['none', 'none', 'none', 'none']);
      expect(screen.getAllByRole('radio').some((r) => (r as HTMLInputElement).checked)).toBe(false);
      expect(screen.getByText('0 of 4 answered')).toBeTruthy();
      expect(screen.getByRole('status').textContent).toBe('');
      expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
      expect(onEvent).not.toHaveBeenCalled();
      cleanup();
    }
  });
});
