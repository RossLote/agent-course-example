import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { course } from '../../content/index.ts';
import { NO_ANSWERS } from '../../course/frame/progress.ts';
import type { SavedAnswer } from '../types.ts';
import { FridgeScreen } from './index.tsx';

const progress = { items: NO_ANSWERS, score: { raw: 0, max: 0 } };

function renderScreen(fridge: string, saved?: SavedAnswer) {
  const module = course.modules.find((m) => m.screens.some((s) => s.type === 'fridge' && s.fridge === fridge)) ?? course.modules[0];
  const onEvent = vi.fn();
  const view = render(
    <FridgeScreen screen={{ type: 'fridge', heading: 'A fridge', fridge }} module={module} course={course} saved={saved} progress={progress} onEvent={onEvent} />,
  );
  return { ...view, onEvent };
}

describe('FridgeScreen', () => {
  it("plays the fridge its screen names: module 00's one-shot, 5 shelves and 14 items", () => {
    const { container } = renderScreen('one-shot');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Module 00: "Build me a fridge activity"');
    expect(container.querySelectorAll('[data-shelf]')).toHaveLength(5);
    expect(container.querySelectorAll('.fridge-tray button')).toHaveLength(14);
  });

  it('reports the end of a play as fridge-ended with the fridge’s name', () => {
    const { container, onEvent } = renderScreen('accepted');
    const tray = container.querySelector<HTMLElement>('.fridge-tray')!;
    for (const item of course.fridges.accepted.items) {
      fireEvent.click(within(tray).getByRole('button', { name: item.name }));
      fireEvent.click(container.querySelector<HTMLElement>(`[data-shelf="${item.shelf}"]`)!);
    }
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'fridge-ended', slug: 'accepted', score: { raw: 8, max: 8 } }));
  });

  it('renders a saved play finished, with its score card', () => {
    const items = course.fridges.accepted.items;
    const saved = { placements: Object.fromEntries(items.map((i) => [i.id, i.shelf])), wrongFirst: ['raw-chicken'] };
    const { container } = renderScreen('accepted', saved);
    expect(container.querySelectorAll('.fridge-tray button')).toHaveLength(0);
    expect(screen.getByText('7 out of 8 right first time')).toBeTruthy();
    expect(screen.getByText(/Raw chicken:/).closest('li')!.textContent).toContain("so they can't drip onto other food.");
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});
