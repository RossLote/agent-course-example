import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App.tsx';
import { course } from './content/index.ts';

// course.yaml is the course's final copy, so App is rendered with it; the pages' own tests use
// inline fixtures.
describe('App', () => {
  it('opens on the scenario', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(course.scenario.heading);
  });

  it('goes to the home page on "Take the job", keeping the query string, and moves focus to its heading', async () => {
    window.history.replaceState(null, '', '/?registration=r1');
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: course.scenario.button }));

    const heading = await screen.findByRole('heading', { level: 1, name: course.home.heading });
    expect(window.location.search).toBe('?registration=r1');
    expect(document.activeElement).toBe(heading);
    expect(within(screen.getByRole('region', { name: course.home.modulesHeading })).getAllByRole('link')).toHaveLength(course.modules.length);
  });

  it("opens a module screen from its route in the frame, and moves focus to the next screen's heading on Next", async () => {
    const module = course.modules[1];
    const [, second, third] = module.screens;
    window.history.replaceState(null, '', '/?registration=r1#/modules/01/2');
    render(<App />);
    const bar = screen.getByRole('banner');
    expect(within(bar).getByText(`Module 01 · ${module.title}`)).toBeTruthy();
    expect(within(bar).getByText(`Screen 2 of ${module.screens.length}`)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('heading' in second ? second.heading : '');

    fireEvent.click(screen.getByRole('button', { name: /^Next: / }));
    const heading = await screen.findByRole('heading', { level: 1, name: 'heading' in third ? third.heading : '' });
    expect(window.location.search).toBe('?registration=r1');
    expect(window.location.hash).toBe('#/modules/01/3');
    expect(document.activeElement).toBe(heading);
  });

  it('shows the home page for a module the course does not have', () => {
    window.history.replaceState(null, '', '/#/modules/99/1');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(course.home.heading);
  });
});
