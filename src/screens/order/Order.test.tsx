import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { course } from '../../content/index.ts';
import { NO_PROGRESS, realScreen } from '../../course/frame/fixture.ts';
import type { SavedAnswer } from '../types.ts';
import { OrderScreen } from './index.tsx';

// Module 07's order the loop, as authored.
const { module, screen: shown } = realScreen('07', 'order', 'order-the-loop');
const correct = shown.cards.map((c) => c.id);
const label = (id: string) => shown.cards.find((c) => c.id === id)!.label;

function renderOrder(saved?: SavedAnswer) {
  const onEvent = vi.fn();
  const { container } = render(
    <OrderScreen screen={shown} module={module} course={course} saved={saved} progress={NO_PROGRESS} onEvent={onEvent} />,
  );
  return { onEvent, container };
}

/** The card ids in the order the list shows them. */
const order = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('[data-card]')].map((b) => b.dataset.card);
/** Each card's state: right, wrong, on or none. */
const states = (container: HTMLElement) => [...container.querySelectorAll('.order-card')].map((c) => c.getAttribute('data-state') ?? 'none');
const cardButton = (container: HTMLElement, id: string) => container.querySelector<HTMLButtonElement>(`[data-card="${id}"]`)!;
const key = (target: HTMLElement, key: string) => fireEvent.keyDown(target, { key });
const status = (container: HTMLElement) => container.querySelector('.order-status')!.textContent;
const live = (container: HTMLElement) => container.querySelector('[aria-live="polite"]')!.textContent!.trim();
const result = () => screen.getByRole('status').textContent;

describe('OrderScreen, order the loop (module 07)', () => {
  it('lists the eight cards in the start order, retro fifth, each a button', () => {
    const { container } = renderOrder();
    expect(order(container)).toEqual(shown.start);
    expect(shown.start[4]).toBe('retro');
    const list = screen.getByRole('list', { name: 'Order the loop' });
    expect(within(list).getAllByRole('button').map((b) => b.textContent)).toEqual(shown.start.map((id, i) => `${i + 1}${label(id)}`));
  });

  it('moves retro to the end with the keyboard alone, saying each step', () => {
    const { container } = renderOrder();
    const retro = cardButton(container, 'retro');
    retro.focus();
    key(retro, 'Enter');
    expect(status(container)).toBe('Retro picked up, position 5 of 8');
    expect(live(container)).toBe('Retro picked up, position 5 of 8');
    expect(retro.getAttribute('aria-pressed')).toBe('true');
    key(retro, 'ArrowDown');
    expect(status(container)).toBe('Retro moved to position 6 of 8');
    key(document.activeElement as HTMLElement, 'ArrowDown');
    key(document.activeElement as HTMLElement, 'ArrowDown');
    expect(status(container)).toBe('Retro moved to position 8 of 8');
    expect(document.activeElement).toBe(cardButton(container, 'retro'));
    key(document.activeElement as HTMLElement, 'ArrowDown');
    expect(status(container)).toBe('Retro is already last, position 8 of 8');
    key(document.activeElement as HTMLElement, 'Enter');
    expect(status(container)).toBe('Retro dropped at position 8 of 8');
    expect(cardButton(container, 'retro').getAttribute('aria-pressed')).toBe('false');
    expect(order(container)).toEqual(correct);
  });

  it('reports 8 of 8 in the right place as one answered, 8 of 8', () => {
    const { container, onEvent } = renderOrder();
    const retro = cardButton(container, 'retro');
    retro.focus();
    key(retro, 'Enter');
    for (let i = 0; i < 3; i++) key(document.activeElement as HTMLElement, 'ArrowDown');
    key(document.activeElement as HTMLElement, 'Enter');
    fireEvent.click(screen.getByRole('button', { name: 'Check the order' }));

    expect(result()).toBe('8 of 8 in the right place');
    expect(states(container)).toEqual(Array(8).fill('right'));
    expect(container.querySelectorAll('.order-feedback')).toHaveLength(0);
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({
      type: 'answered',
      slug: 'order-the-loop',
      right: true,
      score: { raw: 8, max: 8 },
      response: correct.map(label).join('; '),
      answer: { order: correct },
    });
  });

  it('marks the cards out of place wrong, each with its feedback, and the rest right', () => {
    const { container, onEvent } = renderOrder();
    fireEvent.click(screen.getByRole('button', { name: 'Check the order' }));
    expect(result()).toBe('4 of 8 in the right place');
    expect(states(container)).toEqual(['right', 'right', 'right', 'right', 'wrong', 'wrong', 'wrong', 'wrong']);
    shown.start.forEach((id, i) => {
      const button = cardButton(container, id);
      expect(button.disabled).toBe(true);
      const out = i >= 4;
      expect(button.textContent).toContain(out ? ', out of place' : ', in the right place');
      if (out) expect(document.getElementById(button.getAttribute('aria-describedby')!)?.textContent).toBe(shown.cards.find((c) => c.id === id)!.feedback);
      else expect(button.hasAttribute('aria-describedby')).toBe(false);
    });
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'answered', right: false, score: { raw: 4, max: 8 }, answer: { order: shown.start } }));
  });

  it('lets the cards move again after Try again, from where they were left, and sends again on Check', () => {
    const { container, onEvent } = renderOrder();
    const check = screen.getByRole('button', { name: 'Check the order' });
    fireEvent.click(check);
    fireEvent.click(check);
    expect(check.textContent).toBe('Check the order');
    expect(states(container)).toEqual(Array(8).fill('none'));
    expect(order(container)).toEqual(shown.start);
    expect(cardButton(container, 'retro').disabled).toBe(false);
    fireEvent.click(check);
    expect(onEvent).toHaveBeenCalledTimes(2);
  });

  it('puts a card back where it was on Escape', () => {
    const { container } = renderOrder();
    const retro = cardButton(container, 'retro');
    retro.focus();
    key(retro, 'Enter');
    key(document.activeElement as HTMLElement, 'ArrowUp');
    key(document.activeElement as HTMLElement, 'ArrowUp');
    expect(order(container).indexOf('retro')).toBe(2);
    key(document.activeElement as HTMLElement, 'Escape');
    expect(status(container)).toBe('Retro put back at position 5 of 8');
    expect(order(container)).toEqual(shown.start);
    expect(document.activeElement).toBe(cardButton(container, 'retro'));
  });

  it('moves a card with two clicks: the card, then the card whose place it takes', () => {
    const { container } = renderOrder();
    fireEvent.click(cardButton(container, 'retro'));
    expect(status(container)).toBe('Retro picked up, position 5 of 8');
    fireEvent.click(cardButton(container, 'judge'));
    expect(status(container)).toBe('Retro dropped at position 8 of 8');
    expect(order(container)).toEqual(correct);
  });

  it('says a repeated sentence again by changing the live region', () => {
    const { container } = renderOrder();
    const retro = cardButton(container, 'retro');
    retro.focus();
    key(retro, 'Enter');
    for (let i = 0; i < 3; i++) key(document.activeElement as HTMLElement, 'ArrowDown');
    const region = container.querySelector('[aria-live="polite"]')!;
    key(document.activeElement as HTMLElement, 'ArrowDown');
    const first = region.textContent;
    key(document.activeElement as HTMLElement, 'ArrowDown');
    expect(region.textContent).not.toBe(first);
    expect(region.textContent!.trim()).toBe(first!.trim());
  });
});

describe('OrderScreen, from a saved answer', () => {
  it('renders checked in the saved order, with its marks and feedback', () => {
    const saved = ['brief', 'epic', 'build', 'epic-review', 'reviews', 'pull-request', 'judge', 'retro'];
    const { container, onEvent } = renderOrder({ order: saved });
    expect(order(container)).toEqual(saved);
    expect(result()).toBe('6 of 8 in the right place');
    expect(states(container)).toEqual(['right', 'right', 'wrong', 'wrong', 'right', 'right', 'right', 'right']);
    expect(screen.getByText(shown.cards[2].feedback)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('renders a saved answer that is not every card once checked in the start order', () => {
    const { container } = renderOrder({ order: ['retro'] });
    expect(order(container)).toEqual(shown.start);
    expect(result()).toBe('4 of 8 in the right place');
  });
});
