import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
      answer: { placements: Object.fromEntries(accepted.items.map((i) => [i.id, i.shelf])), wrongFirst: ['raw-chicken'] },
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
    expect(f.container.querySelectorAll('[data-shelf]')).toHaveLength(5);
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
