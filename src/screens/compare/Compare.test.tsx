import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { course, type ScreenOf } from '../../content/index.ts';
import { fixtureModule, fixtureTakeaway, NO_PROGRESS } from '../../course/frame/fixture.ts';
import { NO_ANSWERS } from '../../course/frame/progress.ts';
import type { ModuleAnswers } from '../types.ts';
import { CompareScreen } from './index.tsx';

// An inline compare screen of the course's two fridges (content/fridge/), with a table of six rows.
const row = (aspect: string, left = `${aspect}: left.`, right = `${aspect}: right.`, wall = 'a wall') => ({ aspect, left, right, wall });
const compare: ScreenOf<'compare'> = {
  type: 'compare',
  heading: 'The two fridges',
  left: 'one-shot',
  right: 'accepted',
  table: {
    heading: 'What is different, and which wall made the difference',
    rows: [
      row('Shelves and items', 'Five shelves including "the door", fourteen items.', "Four shelves, eight items, the ones in the client's guide.", '01 the record (D2)'),
      row('The rules'),
      row('A wrong drop'),
      row('The score'),
      row('Time'),
      row('Keyboard and screen reader'),
    ],
  },
};
const compareModule = fixtureModule('03', [compare, fixtureTakeaway()]);

function renderCompare(items: ModuleAnswers = NO_ANSWERS) {
  const onEvent = vi.fn();
  const view = render(<CompareScreen screen={compare} module={compareModule} course={course} progress={{ ...NO_PROGRESS, items }} onEvent={onEvent} />);
  const [left, right] = screen.getAllByRole('region').filter((region) => region.classList.contains('fridge'));
  return { ...view, onEvent, left, right };
}

function drop(fridge: HTMLElement, item: string, shelf: string) {
  fireEvent.click(within(fridge.querySelector<HTMLElement>('.fridge-tray')!).getByRole('button', { name: item }));
  fireEvent.click(fridge.querySelector<HTMLElement>(`[data-drop-target="${shelf}"]`)!);
}

describe('CompareScreen', () => {
  it('renders both fridges side by side, each as its own file says', () => {
    const { left, right } = renderCompare();
    expect(within(left).getByRole('heading', { level: 2 }).textContent).toBe(course.fridges['one-shot'].title);
    expect(within(right).getByRole('heading', { level: 2 }).textContent).toBe(course.fridges.accepted.title);
    expect(left.querySelectorAll('[data-drop-target]')).toHaveLength(5);
    expect(right.querySelectorAll('[data-drop-target]')).toHaveLength(4);
    expect(left.getAttribute('data-feedback')).toBe('flash');
    expect(right.getAttribute('data-feedback')).toBe('reason');
    expect(within(left).getByRole('timer').textContent).toBe('0:15');
    expect(left.querySelectorAll('.fridge-board-rows li')).toHaveLength(3);
    expect(right.querySelector('.fridge-board')).toBeNull();
    expect(within(right).queryByRole('timer')).toBeNull();
  });

  it('shows the table of differences, 6 rows with headers, after the fridges', () => {
    const { container } = renderCompare();
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Aspect',
      course.fridges['one-shot'].title,
      course.fridges.accepted.title,
      'Wall',
    ]);
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(6);
    expect(within(rows[0]).getByRole('rowheader').textContent).toBe('Shelves and items');
    expect(within(rows[0]).getAllByRole('cell').map((c) => c.textContent)).toEqual([
      'Five shelves including "the door", fourteen items.',
      "Four shelves, eight items, the ones in the client's guide.",
      '01 the record (D2)',
    ]);
    expect(screen.getByRole('heading', { name: 'What is different, and which wall made the difference' })).toBeTruthy();
    const fridges = container.querySelectorAll('.fridge');
    expect(fridges[1].compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders each fridge's title in the table's header as copy", () => {
    const oneShot = { ...course.fridges['one-shot'], title: 'Module 00: **one-shot**' };
    render(<CompareScreen screen={compare} module={compareModule} course={{ ...course, fridges: { ...course.fridges, 'one-shot': oneShot } }} progress={NO_PROGRESS} onEvent={vi.fn()} />);
    const header = within(screen.getByRole('table')).getAllByRole('columnheader')[1];
    expect(header.innerHTML).toBe('Module 00: <strong>one-shot</strong>');
  });

  it('keeps the two fridges apart: each sends its own fridge-ended', () => {
    const { left, right, onEvent } = renderCompare();
    for (const item of course.fridges.accepted.items) drop(right, item.name, item.shelf);
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'fridge-ended', slug: 'accepted', score: { raw: 8, max: 8 } }));
    expect(left.querySelectorAll('.fridge-tray button')).toHaveLength(14);

    const shelfNames = Object.fromEntries(course.fridges['one-shot'].shelves.map((s) => [s.id, s.id]));
    drop(left, 'Cheese', shelfNames.bottom);
    for (const item of course.fridges['one-shot'].items) drop(left, item.name, item.shelf);
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenLastCalledWith(expect.objectContaining({ slug: 'one-shot', score: { raw: 1400, max: 1400 } }));
    expect(new Set([...document.querySelectorAll('[id]')].map((e) => e.id)).size).toBe(document.querySelectorAll('[id]').length);
  });

  it('shows each fridge’s saved play from the progress', () => {
    const items = course.fridges.accepted.items;
    const { left, right } = renderCompare({
      accepted: { answer: { placements: Object.fromEntries(items.map((i) => [i.id, i.shelf])), wrongFirst: ['raw-chicken'], points: 0, timeLeft: null } },
    });
    expect(right.querySelectorAll('.fridge-tray button')).toHaveLength(0);
    expect(within(right).getByText('7 out of 8 right first time')).toBeTruthy();
    expect(left.querySelectorAll('.fridge-tray button')).toHaveLength(14);
  });
});
