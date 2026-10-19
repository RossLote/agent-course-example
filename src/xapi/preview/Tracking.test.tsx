import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { course } from '../../content/index.ts';
import { TopBar } from '../../course/TopBar.tsx';
import { Tracking } from '../../course/tracking.tsx';
import { sparkLaunch } from '../fixtures.ts';
import { courseCompleted, moduleCompleted } from '../statements.ts';
import { createLrsTracker, createMemoryTracker } from '../tracker.ts';

// The page in these tests has no launch, so the course's own tracker (src/xapi/index.ts) is the
// in-memory one and has sent `initialized` on import.
describe('Tracking in preview', () => {
  it("shows the PREVIEW badge and a drawer listing initialized on course.yaml's id", () => {
    render(<TopBar title={course.title} />);
    const bar = screen.getByRole('banner');
    expect(within(bar).getByText('PREVIEW')).toBeTruthy();
    const toggle = within(bar).getByRole('button', { name: 'Statements (1)' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);

    const drawer = screen.getByRole('dialog', { name: 'Statements sent (1)' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe(drawer.id);
    expect(document.activeElement).toBe(within(drawer).getByRole('heading', { level: 2 }));
    const items = within(drawer).getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(items[0].dataset.verb).toBe('initialized');
    expect(items[0].dataset.object).toBe(course.id);
    expect(items[0].textContent).toContain(`initialized ${course.title}`);
  });

  it('closes on Escape and on Close, giving focus back to the button', () => {
    render(<Tracking />);
    const toggle = screen.getByRole('button', { name: /^Statements/ });

    fireEvent.click(toggle);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(toggle);

    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });

  it('lists statements newest first with verb, object and result, and counts new ones as they arrive', () => {
    const tracker = createMemoryTracker(course);
    render(<Tracking tracker={tracker} />);
    fireEvent.click(screen.getByRole('button', { name: 'Statements (0)' }));

    act(() => {
      tracker.send(moduleCompleted(course, null, course.modules[0]));
      tracker.send(courseCompleted(course, null, { raw: 28, max: 28 }));
    });

    expect(screen.getByRole('button', { name: 'Statements (2)' })).toBeTruthy();
    const items = within(screen.getByRole('dialog')).getAllByRole('listitem');
    expect(items.map((item) => [item.dataset.verb, item.dataset.object])).toEqual([
      ['completed', course.id],
      ['completed', `${course.id}modules/00`],
    ]);
    const result = within(items[0]);
    expect(result.getByText('Completion').nextElementSibling?.textContent).toBe('true');
    expect(result.getByText('Score').nextElementSibling?.textContent).toBe('28 of 28 (min 0, scaled 1)');
  });
});

describe('Tracking with a launch', () => {
  it('shows neither the badge nor the drawer', () => {
    const { container } = render(<Tracking tracker={createLrsTracker(course, sparkLaunch())} />);
    expect(container.innerHTML).toBe('');
    expect(screen.queryByText('PREVIEW')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Statements/ })).toBeNull();
  });
});
