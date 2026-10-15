import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Screen } from '../../content/index.ts';
import { screenComponents } from '../../screens/index.ts';
import { fixtureCourse } from './fixture.ts';
import { NO_ANSWERS } from './progress.ts';
import { ScreenView } from './ScreenView.tsx';

const course = fixtureCourse();
const match = {
  targets: [
    { id: 'x', label: 'X' },
    { id: 'y', label: 'Y' },
  ],
  rows: [
    { text: 'One', key: 'x', feedback: 'X.' },
    { text: 'Two', key: 'y', feedback: 'Y.' },
    { text: 'Three', key: 'y', feedback: 'Y.' },
  ],
};

const placeholders: Screen[] = [
  { type: 'chat', slug: 'talk', heading: 'Chat', opening: 'Hello.', messages: ['Hi.'] },
  {
    type: 'brief',
    slug: 'brief',
    heading: 'Brief',
    opening: 'Hello.',
    rounds: [{ message: 'Questions.', questions: [{ text: 'Q?', chips: [{ label: 'A', decision: 'A.', recommended: true }, { label: 'B', decision: 'B.' }] }] }],
    defaults: { label: 'Your defaults', reply: 'Your defaults.' },
    closing: 'Done.',
    panel: { heading: 'The record', note: '{filled} of {total}' },
  },
  { type: 'match', slug: 'sorting', scored: false, heading: 'Sort', ...match },
  { type: 'compare', heading: 'Compare', left: 'one-shot', right: 'accepted', table: { rows: [{ aspect: 'A', left: 'L', right: 'R', wall: 'W' }] } },
];

const scored: { screen: Screen; max: number }[] = [
  { screen: { type: 'match', slug: 'walls', scored: true, heading: 'Walls', ...match }, max: 3 },
  {
    screen: {
      type: 'order',
      slug: 'loop',
      heading: 'Order',
      cards: ['a', 'b'].map((id) => ({ id, label: id, feedback: id })),
      start: ['b', 'a'],
    },
    max: 2,
  },
];

function renderScreen(shown: Screen, onEvent = vi.fn()) {
  render(<ScreenView screen={shown} module={course.modules[0]} course={course} progress={{ items: NO_ANSWERS, score: { raw: 0, max: 0 } }} onEvent={onEvent} />);
  return onEvent;
}

describe('the screen registry', () => {
  it('has a component for every screen type', () => {
    expect(Object.keys(screenComponents).sort()).toEqual(['brief', 'chat', 'choose', 'compare', 'fridge', 'match', 'order', 'scene', 'takeaway']);
  });

  it.each(placeholders.map((s) => [s.type, s] as const))('renders the %s placeholder, unscored, with nothing to answer', (type, shown) => {
    renderScreen(shown);
    expect(screen.getByText(`${type}: not built yet`)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it.each(scored.map((s) => [s.screen.type, s] as const))('renders the scored %s placeholder with a button that answers it right', (type, { screen: shown, max }) => {
    const onEvent = renderScreen(shown);
    expect(screen.getByText(`${type}: not built yet`)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Answer (placeholder)' }));
    expect(onEvent).toHaveBeenCalledWith({
      type: 'answered',
      slug: 'slug' in shown ? shown.slug : '',
      right: true,
      score: { raw: max, max },
      response: 'placeholder',
      answer: 'placeholder',
    });
  });
});
