import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { course } from '../content/index.ts';
import { Fridge } from './Fridge.tsx';
import { playTone, sleepTones, wakeTones } from './tones.ts';

// jsdom has no Web Audio: the tones are counted here, and made in ./tones.test.ts.
vi.mock('./tones.ts', () => ({ playTone: vi.fn(), sleepTones: vi.fn(), wakeTones: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

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
    expect(resets()).toEqual([f.container.querySelector('.fridge-head .fridge-reset')]);
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
const tones = () => vi.mocked(playTone).mock.calls.map(([tone]) => tone);
/** The Reset that takes the tray's place when time is up. */
const timeUpReset = () => within(document.querySelector<HTMLElement>('.fridge-timeup')!).getByRole('button', { name: 'Reset' });
/** Every button named Reset: one at a time, the header's or, when time is up, the message's. */
const resets = () => screen.getAllByRole('button', { name: 'Reset' });

describe('Fridge, the one-shot extras', () => {
  afterEach(() => vi.useRealTimers());

  it('shows 0:15, waits for a first pick up, then counts down each second', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    expect(clock()).toBe('0:15');
    pass(5);
    expect(clock()).toBe('0:15');
    fireEvent.click(f.item('Cheese'));
    pass(3);
    expect(clock()).toBe('0:12');
    pass(6);
    expect(clock()).toBe('0:06');
    expect(f.container.querySelector('section')!.hasAttribute('data-warning')).toBe(false);
  });

  it('warns from 0:05: a red, pulsing timer with a speaker, a red outline, and a short beep each second', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    const timer = () => screen.getByRole('timer');
    fireEvent.click(f.item('Cheese'));
    pass(9);
    expect(clock()).toBe('0:06');
    expect(f.container.querySelector('section')!.hasAttribute('data-warning')).toBe(false);
    expect(timer().querySelector('svg')).toBeNull();
    expect(tones()).toEqual([]);
    pass(1);
    expect(clock()).toBe('0:05');
    expect(timer().hasAttribute('data-pulse')).toBe(true);
    expect(timer().querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    expect(f.container.querySelector('section')!.hasAttribute('data-warning')).toBe(true);
    expect(tones()).toEqual(['beep']);
    pass(4);
    expect(clock()).toBe('0:01');
    expect(tones()).toEqual(['beep', 'beep', 'beep', 'beep', 'beep']);
  });

  it('plays six tones in a play that runs out, five short and one long, woken by every gesture of the play', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    expect(wakeTones).not.toHaveBeenCalled();
    fireEvent.click(f.item('Cheese'));
    expect(wakeTones).toHaveBeenCalledTimes(1);
    fireEvent.click(f.item('Cheese'));
    fireEvent.click(f.item('Butter'));
    expect(wakeTones).toHaveBeenCalledTimes(3);
    // Keys that act are gestures too; ticks are not.
    fireEvent.keyDown(f.item('Butter'), { key: 'ArrowDown' });
    pass(5);
    expect(wakeTones).toHaveBeenCalledTimes(4);
    pass(10);
    expect(tones()).toEqual(['beep', 'beep', 'beep', 'beep', 'beep', 'end']);
    pass(30);
    expect(tones()).toHaveLength(6);
    // At zero the timer and the outline stay red (the fridge still warns), but it stops pulsing.
    expect(screen.getByRole('timer').hasAttribute('data-pulse')).toBe(false);
    expect(f.container.querySelector('section')!.hasAttribute('data-warning')).toBe(true);
  });

  it('wakes the tones on a running play’s gestures only, again on a new play’s first, and plays none when every item is placed in time', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    for (const [item, shelf] of ONE_SHOT_RIGHT) drop(f, item, shelf);
    // Each pick and each drop but the last, which ends the play.
    const woken = vi.mocked(wakeTones).mock.calls.length;
    expect(woken).toBe(ONE_SHOT_RIGHT.length * 2 - 1);
    pass(30);
    expect(tones()).toEqual([]);
    expect(f.container.querySelector('section')!.hasAttribute('data-warning')).toBe(false);
    // A gesture once the play is over wakes nothing, nor does the Reset.
    fireEvent.click(f.shelf('The door'));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(wakeTones).toHaveBeenCalledTimes(woken);
    fireEvent.click(f.item('Cheese'));
    expect(wakeTones).toHaveBeenCalledTimes(woken + 1);
  });

  it('never wakes the tones from a fridge with no timer', () => {
    const f = renderFridge();
    const cheese = f.item('Cheese');
    cheese.setPointerCapture = vi.fn();
    fireEvent.pointerDown(cheese, { pointerId: 1, isPrimary: true, button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerUp(cheese, { pointerId: 1, clientX: 0, clientY: 0 });
    for (const [item, shelf] of RIGHT) drop(f, item, shelf);
    expect(wakeTones).not.toHaveBeenCalled();
  });

  it('lets the tones sleep after a timed play’s last tone, when it runs out or every item is placed, and when the fridge goes', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    fireEvent.click(f.item('Cheese'));
    pass(14);
    expect(sleepTones).not.toHaveBeenCalled();
    pass(1);
    expect(sleepTones).toHaveBeenCalledTimes(1);
    // After the end tone, so that tone still sounds.
    expect(vi.mocked(playTone).mock.invocationCallOrder.at(-1)).toBeLessThan(vi.mocked(sleepTones).mock.invocationCallOrder[0]);
    fireEvent.click(timeUpReset());
    expect(sleepTones).toHaveBeenCalledTimes(2);
    for (const [item, shelf] of ONE_SHOT_RIGHT) drop(f, item, shelf);
    expect(sleepTones).toHaveBeenCalledTimes(3);
    f.unmount();
    expect(sleepTones).toHaveBeenCalledTimes(4);
  });

  it('lets the tones sleep on a Reset mid-play, and wakes them on the new play’s first gesture', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    fireEvent.click(f.item('Cheese'));
    pass(12);
    expect(tones()).toEqual(['beep', 'beep', 'beep']);
    const woken = vi.mocked(wakeTones).mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(sleepTones).toHaveBeenCalledTimes(1);
    expect(wakeTones).toHaveBeenCalledTimes(woken);
    pass(5);
    expect(tones()).toHaveLength(3);
    fireEvent.click(f.item('Cheese'));
    expect(wakeTones).toHaveBeenCalledTimes(woken + 1);
  });

  it('never puts the tones to sleep from a fridge with no timer', () => {
    const f = renderFridge();
    for (const [item, shelf] of RIGHT) drop(f, item, shelf);
    f.unmount();
    expect(sleepTones).not.toHaveBeenCalled();
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
    expect(clock()).toBe('0:15');
    fireEvent.pointerMove(cheese, { pointerId: 1, clientX: 40, clientY: 40 });
    pass(2);
    expect(clock()).toBe('0:13');
  });

  it('wakes the tones on a touch drag’s press and its let go, not on the move that starts the play', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    const cheese = f.item('Cheese');
    cheese.setPointerCapture = vi.fn();
    cheese.hasPointerCapture = () => false;
    document.elementFromPoint = () => null;
    fireEvent.pointerDown(cheese, { pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 0, clientY: 0 });
    expect(wakeTones).toHaveBeenCalledTimes(1);
    fireEvent.pointerMove(cheese, { pointerId: 1, pointerType: 'touch', clientX: 40, clientY: 40 });
    expect(wakeTones).toHaveBeenCalledTimes(1);
    // Let go over no shelf: nothing is dropped, but the let go is a gesture that wakes them.
    fireEvent.pointerUp(cheese, { pointerId: 1, pointerType: 'touch', clientX: 40, clientY: 40 });
    expect(wakeTones).toHaveBeenCalledTimes(2);
    pass(2);
    expect(clock()).toBe('0:13');
  });

  it('ends at zero with the file’s message and Reset in the tray’s place, and sends one fridge-ended with the points', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    drop(f, 'Raw chicken', 'Lower middle');
    pass(14);
    expect(clock()).toBe('0:01');
    expect(f.onEvent).not.toHaveBeenCalled();
    pass(1);
    expect(clock()).toBe('0:00');
    expect(screen.getByText("Time's up!").tagName).toBe('STRONG');
    expect(f.container.querySelector('.fridge-timeup p')!.textContent).toBe("Time's up! Better luck next time.");
    expect(resets()).toEqual([timeUpReset()]);
    expect(f.container.querySelector('.fridge-head .fridge-reset')).toBeNull();
    expect(f.status()).toBe("Time's up! Better luck next time.");
    expect(f.live()).toBe("Time's up! Better luck next time.");
    expect(f.container.querySelector('.fridge-score')).toBeNull();

    expect(f.container.querySelector('.fridge-tray')).toBeNull();
    expect(f.trayNames()).toEqual([]);
    expect(f.onShelf('Lower middle')).toEqual(['Raw chicken']);
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

  it('has no No timer control: the one-shot’s timer cannot be switched off', () => {
    renderFridge(oneShot, 'one-shot');
    expect(screen.queryByRole('button', { name: /timer/i })).toBeNull();
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
    expect(screen.queryByText(/^score /)).toBeNull();
    expect(f.container.querySelector('section')!.hasAttribute('data-warning')).toBe(false);
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
    pass(5);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(f.trayNames()).toHaveLength(14);
    expect(score()).toBe('score 0');
    expect(clock()).toBe('0:15');
    pass(10);
    expect(clock()).toBe('0:15');
    expect(f.status()).toBe('Every item is back in the tray.');
    fireEvent.click(f.item('Cheese'));
    pass(1);
    expect(clock()).toBe('0:14');
  });

  it('resets after time is up from the Reset in the tray’s place, brings the tray back with focus on it, and reports the next end again', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    fireEvent.click(f.item('Cheese'));
    pass(15);
    expect(f.onEvent).toHaveBeenCalledTimes(1);
    timeUpReset().focus();
    fireEvent.click(timeUpReset());
    expect(screen.queryByText("Time's up!")).toBeNull();
    expect(f.trayNames()).toHaveLength(14);
    expect(document.activeElement).toBe(f.item('Cheese'));
    expect(resets()).toHaveLength(1);
    expect(f.container.querySelector('.fridge-head .fridge-reset')).toBe(resets()[0]);
    expect(clock()).toBe('0:15');
    expect(f.container.querySelector('section')!.hasAttribute('data-warning')).toBe(false);
    fireEvent.click(f.item('Cheese'));
    expect(f.item('Cheese').getAttribute('aria-pressed')).toBe('true');
    pass(15);
    expect(f.onEvent).toHaveBeenCalledTimes(2);
    expect(tones()).toHaveLength(12);
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

  it('renders a saved play that ran out of time with its message and Reset in the tray’s place', () => {
    const f = renderFridge(oneShot, 'one-shot', { placements: { cheese: 'top' }, wrongFirst: [], points: 100, timeLeft: 0 });
    expect(screen.getByText("Time's up!")).toBeTruthy();
    expect(f.container.querySelector('.fridge-score')).toBeNull();
    expect(f.container.querySelector('.fridge-tray')).toBeNull();
    expect(resets()).toEqual([timeUpReset()]);
    expect(clock()).toBe('0:00');
  });

  it('still accepts a saved play without points or a timer, working the points out from its drops', () => {
    renderFridge(oneShot, 'one-shot', { placements: { cheese: 'top', milk: 'door' }, wrongFirst: ['cheese'] });
    expect(score()).toBe('score 150');
    expect(clock()).toBe('0:15');
  });
});

/** One-shot plays saved before the file was edited: none of them fits it now. */
const ALL_RIGHT = Object.fromEntries(oneShot.items.map((i) => [i.id, i.shelf]));

describe('Fridge, a saved play that no longer fits its file', () => {
  it.each([
    ['an item now on another shelf', { ...ALL_RIGHT, cheese: 'bottom' }, []],
    ['an item the file no longer has', { ...ALL_RIGHT, pickles: 'door' }, []],
    ['a shelf the file no longer has', { ...ALL_RIGHT, cheese: 'freezer' }, []],
    ['a wrong-first item the file no longer has', ALL_RIGHT, ['pickles']],
  ])('starts a fresh play for %s, not its points and time', (_, placements, wrongFirst) => {
    const f = renderFridge(oneShot, 'one-shot', { placements, wrongFirst, points: 1400, timeLeft: 5 });
    expect(f.trayNames()).toHaveLength(14);
    expect(score()).toBe('score 0');
    expect(clock()).toBe('0:15');
    expect(f.container.querySelector('.fridge-score')).toBeNull();
  });

  it('starts a fresh play for a finished one saved with its timer switched off (round one’s No timer)', () => {
    const f = renderFridge(oneShot, 'one-shot', { placements: ALL_RIGHT, wrongFirst: [], points: 1400, timeLeft: null });
    expect(f.trayNames()).toHaveLength(14);
    expect(score()).toBe('score 0');
    expect(clock()).toBe('0:15');
    expect(f.container.querySelector('.fridge-score')).toBeNull();
    expect(f.onEvent).not.toHaveBeenCalled();
  });
});

/** Drags an item by pointer onto the shelf with this id: jsdom has no layout, so the shelf is put under the pointer. */
function pointerDrag(f: ReturnType<typeof renderFridge>, name: string, shelf: string, { up = true } = {}) {
  const item = f.item(name);
  item.setPointerCapture = vi.fn();
  item.hasPointerCapture = () => true;
  item.releasePointerCapture = vi.fn();
  const target = f.container.querySelector(`[data-drop-target="${shelf}"]`);
  document.elementFromPoint = () => target;
  fireEvent.pointerDown(item, { pointerId: 1, isPrimary: true, button: 0, clientX: 0, clientY: 0 });
  fireEvent.pointerMove(item, { pointerId: 1, clientX: 40, clientY: 40 });
  if (up) fireEvent.pointerUp(item, { pointerId: 1, clientX: 40, clientY: 40 });
  return item;
}

describe('Fridge, focus when time runs out', () => {
  afterEach(() => vi.useRealTimers());

  it('puts the held item back when time is up, says so with the message, and moves focus to the Reset in the tray’s place', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    f.item('Cheese').focus();
    fireEvent.keyDown(f.item('Cheese'), { key: 'Enter' });
    pass(15);
    expect(f.trayNames()).toEqual([]);
    expect(f.status()).toBe("Time's up! Better luck next time. Cheese put back in the tray.");
    expect(f.live()).toBe("Time's up! Better luck next time. Cheese put back in the tray.");
    expect(resets()).toEqual([timeUpReset()]);
    expect(document.activeElement).toBe(timeUpReset());
  });

  it('leaves focus alone at time up when it is outside the fridge', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    fireEvent.click(f.item('Cheese'));
    expect(document.activeElement).toBe(document.body);
    pass(15);
    expect(document.activeElement).toBe(document.body);
  });
});

describe('Fridge, repeated and overlapping moves', () => {
  afterEach(() => vi.useRealTimers());

  it('flashes and shows a second wrong drag of the same item again', () => {
    const f = renderFridge(oneShot, 'one-shot');
    const words = () => f.container.querySelector('.fridge-status .fridge-words');
    const liveRaw = () => f.container.querySelector('[aria-live="polite"]')!.textContent;
    pointerDrag(f, 'Cheese', 'bottom');
    expect(f.status()).toBe('Cheese returned to the tray.');
    const first = { flash: f.item('Cheese').getAttribute('data-returned'), words: words(), live: liveRaw() };
    expect(first.flash).not.toBeNull();
    pointerDrag(f, 'Cheese', 'door');
    expect(f.status()).toBe('Cheese returned to the tray.');
    expect(f.item('Cheese').getAttribute('data-returned')).not.toBeNull();
    expect(f.item('Cheese').getAttribute('data-returned')).not.toBe(first.flash);
    expect(words()).not.toBe(first.words);
    expect(liveRaw()).not.toBe(first.live);
  });

  it('cancels a drag when time runs out mid-drag: the ghost goes, the capture is let go, and nothing drops', () => {
    vi.useFakeTimers();
    const f = renderFridge(oneShot, 'one-shot');
    const cheese = pointerDrag(f, 'Cheese', 'top', { up: false });
    expect(f.container.querySelector('.drag-ghost')).not.toBeNull();
    pass(15);
    expect(screen.getByText("Time's up!")).toBeTruthy();
    expect(f.container.querySelector('.drag-ghost')).toBeNull();
    expect(cheese.releasePointerCapture).toHaveBeenCalledWith(1);
    fireEvent.pointerMove(cheese, { pointerId: 1, clientX: 60, clientY: 60 });
    fireEvent.pointerUp(cheese, { pointerId: 1, clientX: 60, clientY: 60 });
    expect(f.container.querySelector('.drag-ghost')).toBeNull();
    expect(f.onShelf('Top shelf')).toEqual([]);
  });

  it('cancels a drag when Reset is pressed mid-drag: nothing drops into the new play', () => {
    const f = renderFridge();
    const cheese = pointerDrag(f, 'Cheese', 'top', { up: false });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(f.container.querySelector('.drag-ghost')).toBeNull();
    fireEvent.pointerUp(cheese, { pointerId: 1, clientX: 40, clientY: 40 });
    expect(f.onShelf('Top shelf')).toEqual([]);
    expect(f.trayNames()).toContain('Cheese');
    expect(f.status()).toBe('Every item is back in the tray.');
  });

  it('keeps a click or keyboard pick up when another item is dragged onto a shelf', () => {
    const f = renderFridge();
    fireEvent.click(f.item('Yoghurt'));
    pointerDrag(f, 'Cheese', 'top');
    expect(f.onShelf('Top shelf')).toEqual(['Cheese']);
    expect(f.item('Yoghurt').getAttribute('aria-pressed')).toBe('true');
    pointerDrag(f, 'Lettuce', 'top');
    expect(f.trayNames()).toContain('Lettuce');
    expect(f.item('Yoghurt').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(f.shelf('Top shelf'));
    expect(f.onShelf('Top shelf')).toEqual(['Cheese', 'Yoghurt']);
  });

  it('swallows only the click that ends a drag, not a later one with no pointer down', async () => {
    const f = renderFridge();
    pointerDrag(f, 'Cheese', 'bottom');
    fireEvent.click(f.item('Cheese'));
    expect(f.item('Cheese').getAttribute('aria-pressed')).toBe('false');

    pointerDrag(f, 'Cheese', 'top');
    expect(f.onShelf('Top shelf')).toEqual(['Cheese']);
    await act(() => new Promise((resolve) => setTimeout(resolve)));
    fireEvent.click(f.item('Yoghurt'));
    expect(f.item('Yoghurt').getAttribute('aria-pressed')).toBe('true');
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
