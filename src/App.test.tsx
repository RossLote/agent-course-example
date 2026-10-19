import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App.tsx';
import { course } from './content/index.ts';
import type { ProgressDoc } from './progress/progress.ts';
import { createProgressStore } from './progress/store.ts';
import { jsonResponse, sparkLaunch } from './xapi/fixtures.ts';
import { localStateKey } from './xapi/state.ts';
import { createLrsTracker, createMemoryTracker } from './xapi/tracker.ts';

/** A store for this page load: preview's, reading what an earlier load left in localStorage. */
const freshStore = () => createProgressStore(course, createMemoryTracker(course));

const banner = () => screen.getByRole('banner');
const cards = () => within(screen.getByRole('region', { name: course.home.modulesHeading })).getAllByRole('link');
const statuses = () => cards().map((card) => card.querySelector('.module-card-status')?.textContent);
const primary = () => screen.getByRole('link', { name: /^(Start|Continue|Review)/ });

/** Clicks Next and waits for the screen it goes to (counting from 1), or the home page. */
async function next(to: number | 'home', of: number) {
  fireEvent.click(screen.getByRole('button', { name: /^Next: / }));
  if (to === 'home') await screen.findByRole('heading', { level: 1, name: course.home.heading });
  else await screen.findByText(`Screen ${to} of ${of}`);
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

// course.yaml is the course's final copy, so App is rendered with it; the pages' own tests use
// inline fixtures.
describe('App', () => {
  it('opens on the scenario', () => {
    render(<App store={freshStore()} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(course.scenario.heading);
  });

  it('goes to the home page on "Take the job", keeping the query string, and moves focus to its heading', async () => {
    window.history.replaceState(null, '', '/?registration=r1');
    render(<App store={freshStore()} />);
    fireEvent.click(screen.getByRole('link', { name: course.scenario.button }));

    const heading = await screen.findByRole('heading', { level: 1, name: course.home.heading });
    expect(window.location.search).toBe('?registration=r1');
    expect(document.activeElement).toBe(heading);
    expect(cards()).toHaveLength(course.modules.length);
  });

  it("opens a module screen from its route in the frame, and moves focus to the next screen's heading on Next", async () => {
    const module = course.modules[1];
    const [, second, third] = module.screens;
    window.history.replaceState(null, '', '/?registration=r1#/modules/01/2');
    render(<App store={freshStore()} />);
    expect(within(banner()).getByText(`Module 01 · ${module.title}`)).toBeTruthy();
    expect(within(banner()).getByText(`Screen 2 of ${module.screens.length}`)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('heading' in second ? second.heading : '');

    fireEvent.click(screen.getByRole('button', { name: /^Next: / }));
    const heading = await screen.findByRole('heading', { level: 1, name: 'heading' in third ? third.heading : '' });
    expect(window.location.search).toBe('?registration=r1');
    expect(window.location.hash).toBe('#/modules/01/3');
    expect(document.activeElement).toBe(heading);
  });

  it('shows the home page for a module the course does not have', () => {
    window.history.replaceState(null, '', '/#/modules/99/1');
    render(<App store={freshStore()} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(course.home.heading);
  });
});

describe('App with progress', () => {
  it('shows every module "Not started", the meta line and "Start module 00" before anything is reached', () => {
    window.history.replaceState(null, '', '/#/home');
    render(<App store={freshStore()} />);
    expect(statuses()).toEqual(Array(8).fill('Not started'));
    expect(within(banner()).getByText(course.home.meta)).toBeTruthy();
    expect(primary().textContent).toBe(course.home.start);
    expect(primary().getAttribute('href')).toBe('#/modules/00/1');
  });

  it('shows a module reached as "In progress", and continues the first module not done', async () => {
    window.history.replaceState(null, '', '/#/modules/02/1');
    render(<App store={freshStore()} />);
    await next(2, course.modules[2].screens.length);
    window.location.hash = '#/home';
    await screen.findByRole('heading', { level: 1, name: course.home.heading });
    expect(statuses()).toEqual(['Not started', 'Not started', 'In progress', ...Array(5).fill('Not started')]);
    expect(within(banner()).getByText(course.home.meta)).toBeTruthy();
    expect(primary().textContent).toBe('Continue module 00');
    expect(primary().getAttribute('href')).toBe('#/modules/00/1');
  });

  it('continues module 00 at the furthest screen reached', async () => {
    window.history.replaceState(null, '', '/#/modules/00/3');
    render(<App store={freshStore()} />);
    window.location.hash = '#/modules/00/2';
    await screen.findByText(`Screen 2 of ${course.modules[0].screens.length}`);
    window.location.hash = '#/home';
    await screen.findByRole('heading', { level: 1, name: course.home.heading });
    expect(primary().textContent).toBe('Continue module 00');
    expect(primary().getAttribute('href')).toBe('#/modules/00/3');
  });

  it('marks module 00 "Done" and the bar "1 of 8 done" once played to its takeaway, counting the right answer after a wrong one, and keeps it after a reload', async () => {
    const count = course.modules[0].screens.length;
    window.history.replaceState(null, '', '/#/modules/00/1');
    const first = render(<App store={freshStore()} />);
    for (let n = 2; n <= 5; n++) await next(n, count);

    fireEvent.click(screen.getByRole('radio', { name: 'It misread your message.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    fireEvent.click(screen.getByRole('radio', { name: 'It filled a gap in your ask with a guess.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    await next(6, count);
    fireEvent.click(screen.getByRole('radio', { name: /Something, but not a sign-off/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    await next(7, count);
    await next('home', count);

    const home = () => {
      expect(statuses()).toEqual(['Done', ...Array(7).fill('Not started')]);
      expect(within(banner()).getByText('1 of 8 done')).toBeTruthy();
      expect(primary().textContent).toBe('Continue module 01');
      expect(primary().getAttribute('href')).toBe('#/modules/01/1');
    };
    home();
    const saved = JSON.parse(localStorage.getItem(localStateKey(course, null)) ?? 'null') as ProgressDoc;
    expect(saved.modules['00'].answers['check-1'].right).toBe(true);

    // A reload: a new store from what this one left in localStorage.
    first.unmount();
    render(<App store={freshStore()} />);
    home();
    window.location.hash = '#/modules/00/5';
    await screen.findByText(`Screen 5 of ${count}`);
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'It filled a gap in your ask with a guess.' }).checked).toBe(true);
    expect(screen.getByText('Yes. Gaps get filled, confidently.')).toBeTruthy();
  });

  it("gives module 04's verdict its saved answer and feedback after a reload", () => {
    window.history.replaceState(null, '', '/#/modules/04/4');
    const first = render(<App store={freshStore()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Confirmed, citing A.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my verdict' }));
    first.unmount();

    render(<App store={freshStore()} />);
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Confirmed, citing A.' }).checked).toBe(true);
    expect(document.querySelector('.choice-feedback')?.textContent).toMatch(/^Yes\. Line 41 returns .* You cited the line\.$/);
    expect(screen.getByText('The fix')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try another verdict' })).toBeTruthy();
  });

  it('reads "8 of 8 done", every card "Done" and "Review from module 00" once all eight are done', () => {
    const done: ProgressDoc = {
      version: 1,
      modules: Object.fromEntries(course.modules.map((m) => [m.slug, { answers: {}, reached: m.screens.length, completed: true }])),
    };
    localStorage.setItem(localStateKey(course, null), JSON.stringify(done));
    window.history.replaceState(null, '', '/#/home');
    render(<App store={freshStore()} />);
    expect(statuses()).toEqual(Array(8).fill('Done'));
    expect(within(banner()).getByText('8 of 8 done')).toBeTruthy();
    expect(primary().textContent).toBe('Review from module 00');
    expect(primary().getAttribute('href')).toBe('#/modules/00/1');
  });
});

describe('App and a route past an unanswered check', () => {
  it("shows module 00's first check for a route to its takeaway, keeps the query string, and neither reaches nor completes past it", async () => {
    window.history.replaceState(null, '', '/?registration=r1#/modules/00/7');
    const store = freshStore();
    render(<App store={store} />);
    expect(within(banner()).getByText(`Screen 5 of ${course.modules[0].screens.length}`)).toBeTruthy();
    await waitFor(() => expect(window.location.hash).toBe('#/modules/00/5'));
    expect(window.location.search).toBe('?registration=r1');
    expect(store.getSnapshot().modules['00']).toEqual({ answers: {}, reached: 5, completed: false });
  });
});

describe('App with a launch', () => {
  it('shows a saved answer that arrives with State after the screen has mounted', async () => {
    let answer: (response: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((_url, init) => (init?.method === 'GET' ? new Promise((resolve) => (answer = resolve)) : Promise.resolve(new Response(null, { status: 204 })))),
    );
    const state: ProgressDoc = {
      version: 1,
      modules: { '00': { answers: { 'check-1': { answer: { picked: [1] }, score: { raw: 1, max: 1 }, right: true } }, reached: 5, completed: false } },
    };
    const store = createProgressStore(course, createLrsTracker(course, sparkLaunch()));
    window.history.replaceState(null, '', '/#/modules/00/5');
    render(<App store={store} />);
    const radio = () => screen.getByRole<HTMLInputElement>('radio', { name: 'It filled a gap in your ask with a guess.' });
    expect(radio().checked).toBe(false);

    answer(jsonResponse(state));
    await act(() => store.loaded);
    expect(radio().checked).toBe(true);
    expect(screen.getByText('Yes. Gaps get filled, confidently.')).toBeTruthy();
  });
});
