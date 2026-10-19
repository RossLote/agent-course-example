import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ScreenOf } from '../../content/index.ts';
import { fixtureCourse, NO_PROGRESS } from '../../course/frame/fixture.ts';
import { TakeawayScreen } from './index.tsx';

const takeaway = (extra: Partial<ScreenOf<'takeaway'>> = {}): ScreenOf<'takeaway'> => ({
  type: 'takeaway',
  eyebrow: 'Takeaway',
  text: '**The lead.** The rest of the card.',
  caption: 'The caption.',
  ...extra,
});

const course = fixtureCourse();

function renderTakeaway(slug: string, shown = takeaway(), onEvent = vi.fn()) {
  const module = course.modules.find((m) => m.slug === slug)!;
  const { container } = render(<TakeawayScreen screen={shown} module={module} course={course} progress={NO_PROGRESS} onEvent={onEvent} />);
  const walls = Object.fromEntries([...container.querySelectorAll('[data-wall]')].map((g) => [g.getAttribute('data-wall'), g.getAttribute('data-state')]));
  const ring = container.querySelector('svg')?.getAttribute('data-ring');
  return { walls, ring, onEvent };
}

describe('TakeawayScreen', () => {
  it('shows the card as the page’s h1, the eyebrow and the caption', () => {
    renderTakeaway('00');
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.innerHTML)).toEqual(['<strong>The lead.</strong> The rest of the card.']);
    expect(screen.getByText('Takeaway')).toBeTruthy();
    expect(screen.getByText('The caption.')).toBeTruthy();
  });

  it('renders the eyebrow as copy', () => {
    renderTakeaway('00', takeaway({ eyebrow: '*The* takeaway' }));
    expect(screen.getByText('takeaway', { exact: false, selector: '.eyebrow' }).innerHTML).toBe('<em>The</em> takeaway');
  });

  it('reports the takeaway reached when it is shown', () => {
    const { onEvent } = renderTakeaway('00');
    expect(onEvent).toHaveBeenCalledWith({ type: 'takeaway-reached' });
  });

  it('draws the open box on 00', () => {
    expect(renderTakeaway('00')).toMatchObject({ walls: { record: 'dashed', gate: 'dashed', agents: 'dashed', evidence: 'dashed' }, ring: 'false' });
  });

  it("draws the module's wall and every earlier one solid, the rest dashed", () => {
    expect(renderTakeaway('01')).toMatchObject({ walls: { record: 'solid', gate: 'dashed', agents: 'dashed', evidence: 'dashed' }, ring: 'false' });
  });

  it('draws both walls gained on a module that adds two', () => {
    expect(renderTakeaway('02')).toMatchObject({ walls: { record: 'solid', gate: 'solid', agents: 'solid', evidence: 'dashed' }, ring: 'false' });
  });

  it('draws the whole box once every wall is added, still without the ring', () => {
    expect(renderTakeaway('03')).toMatchObject({ walls: { record: 'solid', gate: 'solid', agents: 'solid', evidence: 'solid' }, ring: 'false' });
  });

  it('adds the ring round the whole box on the module that adds it, then the end copy', () => {
    const shown = takeaway({ end: [{ type: 'paragraph', text: 'This course was built *the way* it describes.' }] });
    expect(renderTakeaway('04', shown)).toMatchObject({ walls: { record: 'solid', gate: 'solid', agents: 'solid', evidence: 'solid' }, ring: 'true' });
    expect(screen.getByText(/This course was built/).innerHTML).toBe('This course was built <em>the way</em> it describes.');
  });
});
