import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { course } from '../content/index.ts';
import { Fridge } from './Fridge.tsx';

const accepted = course.fridges.accepted;
const oneShot = course.fridges['one-shot'];
const RAW_REASON = "Raw meat and fish go on the bottom shelf so they can't drip onto other food.";

function renderFridge(fridge = accepted, name = 'accepted', saved?: Parameters<typeof Fridge>[0]['saved']) {
  const onEvent = vi.fn();
  const view = render(<Fridge fridge={fridge} name={name} saved={saved} onEvent={onEvent} />);
  const root = view.container.querySelector('section')!;
  return {
    ...view,
    onEvent,
    status: () => root.querySelector('.fridge-status')!.textContent,
    live: () => root.querySelector('[aria-live="polite"]')!.textContent!.trim(),
    item: (name: string) => within(root.querySelector('.fridge-tray')!).getByRole('button', { name }),
    trayNames: () => [...root.querySelectorAll('.fridge-tray button')].map((b) => b.textContent),
    shelf: (name: string) => within(root).getByRole('button', { name: new RegExp(`^${name}`) }),
    onShelf: (name: string) => [...within(root).getByRole('button', { name: new RegExp(`^${name}`) }).querySelectorAll('.fridge-placed')].map((p) => p.textContent),
  };
}

/** Click an item, then a shelf: the click route. */
function drop(f: ReturnType<typeof renderFridge>, item: string, shelf: string) {
  fireEvent.click(f.item(item));
  fireEvent.click(f.shelf(shelf));
}

const RIGHT: [string, string][] = [
  ['Cheese', 'Top shelf'],
  ['Yoghurt', 'Top shelf'],
  ['Cooked chicken', 'Middle shelf'],
  ['Leftover lasagne (sealed)', 'Middle shelf'],
  ['Raw chicken', 'Bottom shelf'],
  ['Raw salmon', 'Bottom shelf'],
  ['Lettuce', 'Salad drawer'],
  ['Tomatoes', 'Salad drawer'],
];

describe('Fridge, the accepted file', () => {
  it('shows its shelves in file order and every item in the tray', () => {
    const f = renderFridge();
    expect(within(f.container.querySelector('ul.fridge-cabinet')!).getAllByRole('button').map((b) => b.querySelector('.fridge-shelf-name')!.textContent)).toEqual([
      'Top shelf · ready to eat',
      'Middle shelf · cooked food and leftovers, covered',
      'Bottom shelf · raw meat and fish',
      'Salad drawer · fruit and veg',
    ]);
    expect(f.trayNames()).toEqual(accepted.items.map((i) => i.name));
    expect(screen.getByText('0 of 8 placed')).toBeTruthy();
  });

  it('places lettuce in the salad drawer by keyboard: Enter, three arrow-downs, Enter', () => {
    const f = renderFridge();
    const lettuce = f.item('Lettuce');
    lettuce.focus();
    fireEvent.keyDown(lettuce, { key: 'Enter' });
    expect(f.status()).toBe('Lettuce picked up. Top shelf, ready to eat.');
    expect(lettuce.getAttribute('aria-pressed')).toBe('true');
    for (let i = 0; i < 3; i++) fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(f.status()).toBe('Lettuce. Salad drawer, fruit and veg.');
    expect(f.shelf('Salad drawer').hasAttribute('data-cursor')).toBe(true);
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(f.status()).toBe('Lettuce placed in the salad drawer. Correct.');
    expect(f.live()).toBe('Lettuce placed in the salad drawer. Correct.');
    expect(f.onShelf('Salad drawer')).toEqual(['Lettuce']);
    expect(f.trayNames()).not.toContain('Lettuce');
    expect(document.activeElement?.textContent).toBe('Tomatoes');
  });

  it('stops the cursor at the last shelf and the first', () => {
    const f = renderFridge();
    fireEvent.keyDown(f.item('Cheese'), { key: 'Enter' });
    fireEvent.keyDown(f.item('Cheese'), { key: 'ArrowUp' });
    expect(f.status()).toBe('Cheese. Top shelf, ready to eat.');
    for (let i = 0; i < 6; i++) fireEvent.keyDown(f.item('Cheese'), { key: 'ArrowDown' });
    expect(f.status()).toBe('Cheese. Salad drawer, fruit and veg.');
  });

  it('returns raw chicken dropped on the top shelf by keyboard, with its reason', () => {
    const f = renderFridge();
    const chicken = f.item('Raw chicken');
    chicken.focus();
    fireEvent.keyDown(chicken, { key: 'Enter' });
    fireEvent.keyDown(chicken, { key: 'Enter' });
    expect(f.status()).toBe(`Raw chicken returned to the tray. ${RAW_REASON}`);
    expect(f.live()).toBe(`Raw chicken returned to the tray. ${RAW_REASON}`);
    expect(f.container.querySelector('.fridge-status')!.getAttribute('data-tone')).toBe('wrong');
    expect(f.onShelf('Top shelf')).toEqual([]);
    expect(f.trayNames()).toContain('Raw chicken');
    expect(document.activeElement).toBe(f.item('Raw chicken'));
    expect(f.item('Raw chicken').getAttribute('aria-pressed')).toBe('false');
  });

  it('puts the held item back with Escape', () => {
    const f = renderFridge();
    fireEvent.keyDown(f.item('Yoghurt'), { key: ' ' });
    fireEvent.keyDown(f.item('Yoghurt'), { key: 'ArrowDown' });
    fireEvent.keyDown(f.item('Yoghurt'), { key: 'Escape' });
    expect(f.status()).toBe('Yoghurt put back in the tray.');
    expect(f.item('Yoghurt').getAttribute('aria-pressed')).toBe('false');
    expect(f.shelf('Top shelf')).toHaveProperty('disabled', true);
  });

  it('scores right first time: one wrong first gives 7 out of 8, that item listed with its reason, one fridge-ended', () => {
    const f = renderFridge();
    drop(f, 'Raw chicken', 'Top shelf');
    expect(f.trayNames()).toContain('Raw chicken');
    for (const [item, shelf] of RIGHT) drop(f, item, shelf);

    expect(f.trayNames()).toEqual([]);
    const card = f.container.querySelector('.fridge-score')!;
    expect(card.querySelector('.fridge-score-line')!.textContent).toBe('7 out of 8 right first time');
    expect([...card.querySelectorAll('li')].map((li) => li.textContent)).toEqual([`Raw chicken: ${RAW_REASON}`]);
    expect(document.activeElement).toBe(card);
    expect(f.onEvent).toHaveBeenCalledTimes(1);
    expect(f.onEvent).toHaveBeenCalledWith({
      type: 'fridge-ended',
      slug: 'accepted',
      score: { raw: 7, max: 8 },
      answer: { placements: Object.fromEntries(accepted.items.map((i) => [i.id, i.shelf])), wrongFirst: ['raw-chicken'], points: 0, timeLeft: null },
    });
  });

  it('says every item was right first time when none was wrong', () => {
    const f = renderFridge();
    for (const [item, shelf] of RIGHT) drop(f, item, shelf);
    const card = f.container.querySelector('.fridge-score')!;
    expect(card.querySelector('.fridge-score-line')!.textContent).toBe('8 out of 8 right first time');
    expect(card.textContent).toContain('Every item on the right shelf first time.');
    expect(f.onEvent).toHaveBeenCalledWith(expect.objectContaining({ score: { raw: 8, max: 8 } }));
  });

  it('starts a new play with Try again: the shelves empty, and the next end is reported again', () => {
    const f = renderFridge();
    for (const [item, shelf] of RIGHT) drop(f, item, shelf);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(f.trayNames()).toEqual(accepted.items.map((i) => i.name));
    for (const shelf of accepted.shelves) expect(f.onShelf(shelf.name)).toEqual([]);
    expect(f.container.querySelector('.fridge-score')).toBeNull();
    expect(f.status()).toBe('Every item is back in the tray.');
    expect(f.onEvent).toHaveBeenCalledTimes(1);

    drop(f, 'Cheese', 'Bottom shelf');
    for (const [item, shelf] of RIGHT) drop(f, item, shelf);
    expect(f.onEvent).toHaveBeenCalledTimes(2);
    expect(f.onEvent).toHaveBeenLastCalledWith(expect.objectContaining({ score: { raw: 7, max: 8 } }));
  });

  it('sends nothing when it is left mid-play', () => {
    const f = renderFridge();
    drop(f, 'Cheese', 'Top shelf');
    drop(f, 'Raw chicken', 'Top shelf');
    f.unmount();
    expect(f.onEvent).not.toHaveBeenCalled();
  });

  it('renders a saved play finished, with its score card, and Try again', () => {
    const saved = { placements: Object.fromEntries(accepted.items.map((i) => [i.id, i.shelf])), wrongFirst: ['raw-chicken'] };
    const f = renderFridge(accepted, 'accepted', saved);
    expect(f.trayNames()).toEqual([]);
    expect(f.onShelf('Bottom shelf')).toEqual(['Raw chicken', 'Raw salmon']);
    expect(f.container.querySelector('.fridge-score-line')!.textContent).toBe('7 out of 8 right first time');
    expect(f.container.querySelector('.fridge-wrong')!.textContent).toBe(`Raw chicken: ${RAW_REASON}`);
    expect(f.onEvent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(f.trayNames()).toHaveLength(8);
  });
});

describe('Fridge, the one-shot file as a plain fridge', () => {
  it('renders its 5 shelves and 14 items', () => {
    const f = renderFridge(oneShot, 'one-shot');
    expect(f.container.querySelectorAll('[data-drop-target]')).toHaveLength(5);
    expect(f.trayNames()).toHaveLength(14);
    expect(screen.getByRole('button', { name: 'Reset' })).toBeTruthy();
  });

  it('keeps a right drop and returns a wrong one, saying only that it returned', () => {
    const f = renderFridge(oneShot, 'one-shot');
    drop(f, 'Raw chicken', 'Lower middle');
    expect(f.onShelf('Lower middle')).toEqual(['Raw chicken']);
    drop(f, 'Cheese', 'Bottom shelf');
    expect(f.status()).toBe('Cheese returned to the tray.');
    expect(f.trayNames()).toContain('Cheese');
  });

  it('names "The door" with one "the"', () => {
    const f = renderFridge(oneShot, 'one-shot');
    drop(f, 'Milk', 'The door');
    expect(f.status()).toBe('Milk placed in the door. Correct.');
  });
});

const ONE_SHOT_RIGHT: [string, string][] = oneShot.items.map((item) => [item.name, oneShot.shelves.find((shelf) => shelf.id === item.shelf)!.name]);

/** Lets `seconds` pass, a second at a time as the timer sees them. */
const pass = (seconds: number) => act(() => void vi.advanceTimersByTime(seconds * 1000));
const clock = () => screen.getByRole('timer').textContent;
const score = () => screen.getByText(/^score \d+$/).textContent;

describe('Fridge, the one-shot extras', () => {
  afterEach(() => vi.useRealTimers());

  it('shows 1:00, waits for a first pick up, then counts down each second', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    expect(clock()).toBe('1:00');
    pass(5);
    expect(clock()).toBe('1:00');
    fireEvent.click(f.item('Cheese'));
    pass(3);
    expect(clock()).toBe('0:57');
    pass(50);
    expect(clock()).toBe('0:07');
    expect(screen.getByRole('timer').hasAttribute('data-low')).toBe(true);
  });

  it('starts the timer when a drag begins as well as when something is picked up', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    const cheese = f.item('Cheese');
    cheese.setPointerCapture = vi.fn();
    // jsdom has no layout, so no element is ever under the pointer.
    document.elementFromPoint = () => null;
    fireEvent.pointerDown(cheese, { pointerId: 1, isPrimary: true, button: 0, clientX: 0, clientY: 0 });
    pass(2);
    expect(clock()).toBe('1:00');
    fireEvent.pointerMove(cheese, { pointerId: 1, clientX: 40, clientY: 40 });
    pass(2);
    expect(clock()).toBe('0:58');
  });

  it('ends at zero with the file’s message, locks the tray, and sends one fridge-ended with the points', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    drop(f, 'Raw chicken', 'Lower middle');
    pass(59);
    expect(clock()).toBe('0:01');
    expect(f.onEvent).not.toHaveBeenCalled();
    pass(1);
    expect(clock()).toBe('0:00');
    expect(screen.getByText("Time's up!").tagName).toBe('STRONG');
    expect(f.status()).toBe("Time's up! Better luck next time.");
    expect(f.live()).toBe("Time's up! Better luck next time.");
    expect(f.container.querySelector('.fridge-score')).toBeNull();

    for (const item of f.container.querySelectorAll<HTMLButtonElement>('.fridge-tray button')) expect(item.disabled).toBe(true);
    fireEvent.click(f.item('Cheese'));
    fireEvent.keyDown(f.item('Cheese'), { key: 'Enter' });
    expect(f.item('Cheese').getAttribute('aria-pressed')).toBe('false');
    expect(f.trayNames()).toContain('Cheese');
    expect(f.onShelf('Top shelf')).toEqual([]);
    expect(f.shelf('Top shelf')).toHaveProperty('disabled', true);

    pass(30);
    expect(f.onEvent).toHaveBeenCalledTimes(1);
    expect(f.onEvent).toHaveBeenCalledWith({
      type: 'fridge-ended',
      slug: 'one-shot',
      score: { raw: 100, max: 1400 },
      answer: { placements: { 'raw-chicken': 'lower-middle' }, wrongFirst: [], points: 100, timeLeft: 0 },
    });
  });

  it('stops the countdown with No timer, before or during a play, and then ends only when every item is placed', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    const noTimer = screen.getByRole('button', { name: 'No timer' });
    fireEvent.click(f.item('Cheese'));
    pass(10);
    expect(clock()).toBe('0:50');
    fireEvent.click(noTimer);
    expect(screen.queryByRole('timer')).toBeNull();
    expect(f.status()).toBe('Timer off.');
    expect(noTimer).toHaveProperty('disabled', true);
    pass(300);
    expect(screen.queryByText("Time's up!")).toBeNull();
    expect(f.onEvent).not.toHaveBeenCalled();

    fireEvent.click(f.shelf('Top shelf'));
    for (const [item, shelf] of ONE_SHOT_RIGHT.slice(1)) drop(f, item, shelf);
    expect(f.onEvent).toHaveBeenCalledTimes(1);
    expect(f.onEvent).toHaveBeenCalledWith(expect.objectContaining({ score: { raw: 1400, max: 1400 }, answer: expect.objectContaining({ timeLeft: null }) }));
  });

  it('can switch the timer off before the first pick up, and Tab reaches the control', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    const noTimer = screen.getByRole('button', { name: 'No timer' });
    expect(noTimer.tabIndex).toBe(0);
    fireEvent.click(noTimer);
    drop(f, 'Cheese', 'Top shelf');
    pass(120);
    expect(screen.queryByText("Time's up!")).toBeNull();
    expect(f.onShelf('Top shelf')).toEqual(['Cheese']);
  });

  it('flashes a wrong drop and returns it, saying only that it returned, while raw chicken stays on the lower middle', () => {
    const f = renderFridge(oneShot, 'one-shot');
    drop(f, 'Raw chicken', 'Lower middle');
    expect(f.status()).toBe('Raw chicken placed on the lower middle. Correct.');
    expect(f.onShelf('Lower middle')).toEqual(['Raw chicken']);

    drop(f, 'Cheese', 'Bottom shelf');
    expect(f.status()).toBe('Cheese returned to the tray.');
    expect(f.live()).toBe('Cheese returned to the tray.');
    expect(f.item('Cheese').hasAttribute('data-returned')).toBe(true);
    expect(f.trayNames()).toContain('Cheese');
    expect(f.onShelf('Bottom shelf')).toEqual([]);
    expect(document.activeElement).toBe(f.item('Cheese'));
    fireEvent.click(f.item('Butter'));
    expect(f.item('Cheese').hasAttribute('data-returned')).toBe(false);
  });

  it('adds 100 for a right drop and takes 50 for a wrong one, never below zero', () => {
    const f = renderFridge(oneShot, 'one-shot');
    expect(score()).toBe('score 0');
    drop(f, 'Cheese', 'Bottom shelf');
    expect(score()).toBe('score 0');
    drop(f, 'Cheese', 'Top shelf');
    expect(score()).toBe('score 100');
    drop(f, 'Milk', 'Top shelf');
    expect(score()).toBe('score 50');
    drop(f, 'Milk', 'The door');
    expect(score()).toBe('score 150');
    drop(f, 'Eggs', 'Top shelf');
    drop(f, 'Eggs', 'Top shelf');
    drop(f, 'Eggs', 'Top shelf');
    expect(score()).toBe('score 0');
  });

  it('shows the leaderboard’s three rows in order, the learner’s with their points', () => {
    const f = renderFridge(oneShot, 'one-shot');
    const rows = () => [...f.container.querySelectorAll('.fridge-board-rows li')].map((li) => li.textContent);
    expect(rows()).toEqual(['Sam · 1,400', 'Priya · 1,250', 'You · 0']);
    drop(f, 'Cheese', 'Top shelf');
    expect(rows()).toEqual(['Sam · 1,400', 'Priya · 1,250', 'You · 100']);
    expect(screen.getByRole('heading', { name: 'Leaderboard' })).toBeTruthy();
  });

  it('has no leaderboard, points or timer on the accepted fridge', () => {
    const f = renderFridge();
    expect(f.container.querySelector('.fridge-board')).toBeNull();
    expect(screen.queryByRole('timer')).toBeNull();
    expect(screen.queryByRole('button', { name: 'No timer' })).toBeNull();
    expect(screen.queryByText(/^score /)).toBeNull();
  });

  it('shows the confetti banner with the final points on placing all 14, and stops the timer', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    drop(f, 'Cheese', 'Bottom shelf');
    for (const [item, shelf] of ONE_SHOT_RIGHT) drop(f, item, shelf);
    const banner = f.container.querySelector('.fridge-score')!;
    expect(banner.getAttribute('data-confetti')).toBe('true');
    expect(banner.querySelector('.fridge-score-line')!.textContent).toBe('You did it! Final score 1400.');
    expect(banner.querySelectorAll('.fridge-confetto').length).toBeGreaterThan(0);
    expect(banner.querySelector('.fridge-confetti')!.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(banner);
    expect(f.onEvent).toHaveBeenCalledTimes(1);
    expect(f.onEvent).toHaveBeenCalledWith(expect.objectContaining({ slug: 'one-shot', score: { raw: 1400, max: 1400 } }));
    pass(120);
    expect(screen.queryByText("Time's up!")).toBeNull();
    expect(f.onEvent).toHaveBeenCalledTimes(1);
  });

  it('has no confetti on the accepted fridge’s score card', () => {
    const f = renderFridge();
    for (const [item, shelf] of RIGHT) drop(f, item, shelf);
    expect(f.container.querySelector('.fridge-confetti')).toBeNull();
    expect(f.container.querySelector('.fridge-score')!.hasAttribute('data-confetti')).toBe(false);
  });

  it('resets the tray, the points and the timer, which waits for a new first pick up', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    drop(f, 'Cheese', 'Top shelf');
    pass(20);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(f.trayNames()).toHaveLength(14);
    expect(score()).toBe('score 0');
    expect(clock()).toBe('1:00');
    pass(10);
    expect(clock()).toBe('1:00');
    expect(f.status()).toBe('Every item is back in the tray.');
    fireEvent.click(f.item('Cheese'));
    pass(1);
    expect(clock()).toBe('0:59');
  });

  it('resets after time is up, unlocks the tray and reports the next end again', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    fireEvent.click(f.item('Cheese'));
    pass(60);
    expect(f.onEvent).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.queryByText("Time's up!")).toBeNull();
    fireEvent.click(f.item('Cheese'));
    expect(f.item('Cheese').getAttribute('aria-pressed')).toBe('true');
    pass(60);
    expect(f.onEvent).toHaveBeenCalledTimes(2);
  });

  it('stops the timer and sends nothing when it is left mid-play', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    fireEvent.click(f.item('Cheese'));
    pass(10);
    f.unmount();
    pass(120);
    expect(f.onEvent).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('renders a saved finished one-shot with its banner, points and the time it ended with', () => {
    const saved = { placements: Object.fromEntries(oneShot.items.map((i) => [i.id, i.shelf])), wrongFirst: ['cheese'], points: 1350, timeLeft: 12 };
    const f = renderFridge(oneShot, 'one-shot', saved);
    expect(f.container.querySelector('.fridge-score-line')!.textContent).toBe('You did it! Final score 1350.');
    expect(score()).toBe('score 1350');
    expect(clock()).toBe('0:12');
    expect(f.trayNames()).toEqual([]);
    expect(f.container.querySelector('.fridge-board-rows li[data-learner]')!.textContent).toBe('You · 1,350');
    expect(f.onEvent).not.toHaveBeenCalled();
  });

  it('renders a saved play that ran out of time with its message and a locked tray, and one with the timer off', () => {
    const timedOut = renderFridge(oneShot, 'one-shot', { placements: { cheese: 'top' }, wrongFirst: [], points: 100, timeLeft: 0 });
    expect(screen.getByText("Time's up!")).toBeTruthy();
    expect(timedOut.container.querySelector('.fridge-score')).toBeNull();
    expect(timedOut.item('Yoghurt')).toHaveProperty('disabled', true);
    timedOut.unmount();

    renderFridge(oneShot, 'one-shot', { placements: Object.fromEntries(oneShot.items.map((i) => [i.id, i.shelf])), wrongFirst: [], points: 1400, timeLeft: null });
    expect(screen.queryByRole('timer')).toBeNull();
    expect(screen.getByRole('button', { name: 'No timer' })).toHaveProperty('disabled', true);
  });

  it('still accepts a saved play without points or a timer, working the points out from its drops', () => {
    const f = renderFridge(oneShot, 'one-shot', { placements: { cheese: 'top', milk: 'door' }, wrongFirst: ['cheese'] });
    expect(score()).toBe('score 150');
    expect(f.item('Yoghurt')).toHaveProperty('disabled', false);
    expect(clock()).toBe('1:00');
  });
});

describe('two fridges on one page', () => {
  it('keeps their keys and their words to themselves', () => {
    render(
      <>
        <Fridge fridge={oneShot} name="one-shot" />
        <Fridge fridge={accepted} name="accepted" />
      </>,
    );
    const [left, right] = screen.getAllByRole('region');
    const leftLettuce = within(left).getByRole('button', { name: 'Lettuce' });
    fireEvent.keyDown(leftLettuce, { key: 'Enter' });
    fireEvent.keyDown(leftLettuce, { key: 'ArrowDown' });
    expect(left.querySelector('.fridge-status')!.textContent).toBe('Lettuce. Upper middle.');
    expect(right.querySelector('.fridge-status')!.textContent).toBe('');
    expect(right.querySelector('[data-cursor]')).toBeNull();
    expect(new Set([...document.querySelectorAll('[id]')].map((e) => e.id)).size).toBe(document.querySelectorAll('[id]').length);
  });
});
