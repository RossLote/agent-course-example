import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App.tsx';
import { plainText } from './content/copy.ts';
import { course, type Course, type Screen, type ScreenOf } from './content/index.ts';
import { fixtureCourse, fixtureTakeaway } from './course/frame/fixture.ts';
import { scoredItem } from './course/frame/progress.ts';
import type { ProgressDoc } from './progress/progress.ts';
import { createProgressStore } from './progress/store.ts';
import { jsonResponse, sparkLaunch } from './xapi/fixtures.ts';
import { localStateKey } from './xapi/state.ts';
import { createLrsTracker, createMemoryTracker } from './xapi/tracker.ts';

/** A store for this page load: preview's, reading what an earlier load left in localStorage. */
const freshStore = (of: Course = course) => createProgressStore(of, createMemoryTracker(of));

const banner = () => screen.getByRole('banner');
const cards = (of: Course = course) => within(screen.getByRole('region', { name: of.home.modulesHeading })).getAllByRole('link');
const statuses = (of: Course = course) => cards(of).map((card) => card.querySelector('.module-card-status')?.textContent);
const primary = () => screen.getByRole('link', { name: /^(Start|Continue|Review)/ });

/** Clicks Next and waits for the screen it goes to (counting from 1), or the home page. */
async function next(to: number | 'home', of: number, home = course.home.heading) {
  fireEvent.click(screen.getByRole('button', { name: /^Next: / }));
  if (to === 'home') await screen.findByRole('heading', { level: 1, name: home });
  else await screen.findByText(`Screen ${to} of ${of}`);
}

/** Answers a scored screen right, as a learner would: the right option, each row's key, or the order as it stands. */
function answerRight(shown: Screen) {
  const check = (label: string | undefined) => fireEvent.click(screen.getByRole('button', { name: plainText(label ?? 'Check my answer') }));
  if (shown.type === 'choose') {
    for (const o of shown.options) if (o.right) fireEvent.click(screen.getByRole(shown.mode === 'single' ? 'radio' : 'checkbox', { name: plainText(o.label) }));
  } else if (shown.type === 'match') {
    for (const row of shown.rows) {
      const right = shown.targets.find((t) => t.id === row.key)!.label;
      fireEvent.click(within(screen.getByRole('group', { name: plainText(row.text) })).getByRole('radio', { name: plainText(right) }));
    }
  }
  if (shown.type === 'choose' || shown.type === 'match' || shown.type === 'order') check(shown.checkLabel);
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

// App is rendered with the course content/ holds, and each test builds what it expects from what
// that course says (its module count, screens and points), never from a module's copy; the tests
// that answer particular options render an inline course. The pages' own tests use inline fixtures.
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
    // A screen past the first that Next can leave (not scored) for one with a heading of its own.
    const hasHeading = (s: Screen | undefined) => s !== undefined && 'heading' in s;
    const leavable = (screens: Screen[], i: number) => scoredItem(screens[i]) === null && hasHeading(screens[i]) && hasHeading(screens[i + 1]);
    const module = course.modules.find((m) => m.screens.some((_, i) => i > 0 && leavable(m.screens, i))) ?? course.modules[0];
    const at = Math.max(module.screens.findIndex((_, i) => i > 0 && leavable(module.screens, i)), 0) + 1;
    const [shown, then] = [module.screens[at - 1], module.screens[at]];
    window.history.replaceState(null, '', `/?registration=r1#/modules/${module.slug}/${at}`);
    render(<App store={freshStore()} />);
    expect(within(banner()).getByText(`Module ${module.slug} · ${module.title}`)).toBeTruthy();
    expect(within(banner()).getByText(`Screen ${at} of ${module.screens.length}`)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('heading' in shown ? plainText(shown.heading) : '');

    fireEvent.click(screen.getByRole('button', { name: /^Next: / }));
    const heading = await screen.findByRole('heading', { level: 1, name: 'heading' in then ? plainText(then.heading) : '' });
    expect(window.location.search).toBe('?registration=r1');
    expect(window.location.hash).toBe(`#/modules/${module.slug}/${at + 1}`);
    expect(document.activeElement).toBe(heading);
  });

  it('shows the home page for a module the course does not have', () => {
    window.history.replaceState(null, '', '/#/modules/99/1');
    render(<App store={freshStore()} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(course.home.heading);
  });
});

describe('App with progress', () => {
  const total = course.modules.length;
  const [first] = course.modules;
  const lastModule = course.modules[total - 1];

  it('shows every module "Not started", the meta line and "Start module 00" before anything is reached', () => {
    window.history.replaceState(null, '', '/#/home');
    render(<App store={freshStore()} />);
    expect(statuses()).toEqual(Array(total).fill('Not started'));
    expect(within(banner()).getByText(course.home.meta)).toBeTruthy();
    expect(primary().textContent).toBe(course.home.start);
    expect(primary().getAttribute('href')).toBe(`#/modules/${first.slug}/1`);
  });

  it('shows a module reached as "In progress", and continues the first module not done', async () => {
    window.history.replaceState(null, '', `/#/modules/${lastModule.slug}/1`);
    render(<App store={freshStore()} />);
    await next(2, lastModule.screens.length);
    window.location.hash = '#/home';
    await screen.findByRole('heading', { level: 1, name: course.home.heading });
    expect(statuses()).toEqual(course.modules.map((m) => (m === lastModule ? 'In progress' : 'Not started')));
    expect(within(banner()).getByText(course.home.meta)).toBeTruthy();
    expect(primary().textContent).toBe(`Continue module ${first.slug}`);
    expect(primary().getAttribute('href')).toBe(`#/modules/${first.slug}/1`);
  });

  it('continues module 00 at the furthest screen reached', async () => {
    // As far as screen 3, short of the first scored screen, which no route passes unanswered.
    const awaiting = first.screens.findIndex((s) => scoredItem(s) !== null);
    const furthest = Math.min(3, awaiting === -1 ? first.screens.length : awaiting + 1);
    window.history.replaceState(null, '', `/#/modules/${first.slug}/${furthest}`);
    render(<App store={freshStore()} />);
    window.location.hash = `#/modules/${first.slug}/1`;
    await screen.findByText(`Screen 1 of ${first.screens.length}`);
    window.location.hash = '#/home';
    await screen.findByRole('heading', { level: 1, name: course.home.heading });
    expect(primary().textContent).toBe(`Continue module ${first.slug}`);
    expect(primary().getAttribute('href')).toBe(`#/modules/${first.slug}/${furthest}`);
  });

  it(`marks module 00 "Done" and the bar "1 of ${total} done" once played to its takeaway, every scored screen answered`, async () => {
    const count = first.screens.length;
    window.history.replaceState(null, '', `/#/modules/${first.slug}/1`);
    render(<App store={freshStore()} />);
    for (let n = 1; n <= count; n++) {
      if (scoredItem(first.screens[n - 1]) !== null) answerRight(first.screens[n - 1]);
      await next(n === count ? 'home' : n + 1, count);
    }
    expect(statuses()).toEqual(course.modules.map((m) => (m === first ? 'Done' : 'Not started')));
    expect(within(banner()).getByText(`1 of ${total} done`)).toBeTruthy();
    expect(primary().textContent).toBe(total > 1 ? `Continue module ${course.modules[1].slug}` : `Review from module ${first.slug}`);
  });

  it(`reads "${total} of ${total} done", every card "Done" and "Review from module 00" once all are done`, () => {
    const done: ProgressDoc = {
      version: 1,
      modules: Object.fromEntries(course.modules.map((m) => [m.slug, { answers: {}, reached: m.screens.length, completed: true }])),
    };
    localStorage.setItem(localStateKey(course, null), JSON.stringify(done));
    window.history.replaceState(null, '', '/#/home');
    render(<App store={freshStore()} />);
    expect(statuses()).toEqual(Array(total).fill('Done'));
    expect(within(banner()).getByText(`${total} of ${total} done`)).toBeTruthy();
    expect(primary().textContent).toBe(`Review from module ${first.slug}`);
    expect(primary().getAttribute('href')).toBe(`#/modules/${first.slug}/1`);
  });
});

// ---------------------------------------------------------------------------------------------
// An inline course, for the tests that answer particular options: module 00 is round one's
// shape (four screens, then two checks and the takeaway) and module 01 has a verdict.

const scene = (heading: string): Screen => ({ type: 'scene', heading, blocks: [{ type: 'paragraph', text: 'Text.' }] });
const check = (slug: string, heading: string): ScreenOf<'choose'> => ({
  type: 'choose',
  slug,
  scored: true,
  mode: 'single',
  heading,
  options: [
    { label: 'It misread your message.', right: false, feedback: 'Not usually.' },
    { label: 'It filled a gap in your ask with a guess.', right: true, feedback: 'Yes. Gaps get filled, confidently.' },
    { label: 'It was showing off.', right: false, feedback: 'Agents do not show off.' },
  ],
});
const verdict: ScreenOf<'choose'> = {
  type: 'choose',
  slug: 'verdict',
  scored: false,
  mode: 'single',
  heading: 'You are the skeptic',
  options: [
    {
      label: 'Confirmed, citing A.',
      right: true,
      feedback: 'Yes. Line 41 returns before anything happens. You cited the line.',
      reveal: [{ type: 'paragraph', heading: 'The fix', text: 'A drop replaces the message.' }],
    },
    { label: 'Refuted: there is a test for wrong drops (C).', right: false, feedback: 'Not a refutation.' },
  ],
  checkLabel: 'Check my verdict',
  tryAgainLabel: 'Try another verdict',
};
const inline = fixtureCourse({
  '00': [scene('One'), scene('Two'), scene('Three'), scene('Four'), check('check-1', 'The first check'), check('check-2', 'The second check'), fixtureTakeaway()],
  '01': [scene('One'), verdict, fixtureTakeaway()],
});
const inlineStore = () => freshStore(inline);
const inlineTotal = inline.modules.length;
const RIGHT = 'It filled a gap in your ask with a guess.';

describe('App with progress, on an inline course', () => {
  it('marks module 00 "Done" and the bar "1 of n done" once played to its takeaway, counting the right answer after a wrong one, and keeps it after a reload', async () => {
    const count = inline.modules[0].screens.length;
    window.history.replaceState(null, '', '/#/modules/00/1');
    const first = render(<App course={inline} store={inlineStore()} />);
    for (let n = 2; n <= 5; n++) await next(n, count);

    fireEvent.click(screen.getByRole('radio', { name: 'It misread your message.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    fireEvent.click(screen.getByRole('radio', { name: RIGHT }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    await next(6, count);
    fireEvent.click(screen.getByRole('radio', { name: RIGHT }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    await next(7, count);
    await next('home', count, inline.home.heading);

    const home = () => {
      expect(statuses(inline)).toEqual(['Done', ...Array(inlineTotal - 1).fill('Not started')]);
      expect(within(banner()).getByText(`1 of ${inlineTotal} done`)).toBeTruthy();
      expect(primary().textContent).toBe('Continue module 01');
      expect(primary().getAttribute('href')).toBe('#/modules/01/1');
    };
    home();
    const saved = JSON.parse(localStorage.getItem(localStateKey(inline, null)) ?? 'null') as ProgressDoc;
    expect(saved.modules['00'].answers['check-1'].right).toBe(true);

    // A reload: a new store from what this one left in localStorage.
    first.unmount();
    render(<App course={inline} store={inlineStore()} />);
    home();
    window.location.hash = '#/modules/00/5';
    await screen.findByText(`Screen 5 of ${count}`);
    expect(screen.getByRole<HTMLInputElement>('radio', { name: RIGHT }).checked).toBe(true);
    expect(screen.getByText('Yes. Gaps get filled, confidently.')).toBeTruthy();
  });

  it("gives an interaction's choice its saved answer and feedback after a reload", () => {
    window.history.replaceState(null, '', '/#/modules/01/2');
    const first = render(<App course={inline} store={inlineStore()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Confirmed, citing A.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my verdict' }));
    first.unmount();

    render(<App course={inline} store={inlineStore()} />);
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Confirmed, citing A.' }).checked).toBe(true);
    expect(document.querySelector('.choice-feedback')?.textContent).toMatch(/^Yes\. Line 41 returns .* You cited the line\.$/);
    expect(screen.getByText('The fix')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try another verdict' })).toBeTruthy();
  });
});

describe('App and a route past an unanswered check', () => {
  it("shows module 00's first check for a route to its takeaway, keeps the query string, and neither reaches nor completes past it", async () => {
    window.history.replaceState(null, '', '/?registration=r1#/modules/00/7');
    const store = inlineStore();
    render(<App course={inline} store={store} />);
    expect(within(banner()).getByText(`Screen 5 of ${inline.modules[0].screens.length}`)).toBeTruthy();
    await waitFor(() => expect(window.location.hash).toBe('#/modules/00/5'));
    expect(window.location.search).toBe('?registration=r1');
    expect(store.getSnapshot().modules['00']).toEqual({ answers: {}, reached: 5, completed: false });
  });

  it('stops the real course at the first scored screen of module 00 for a route to its takeaway', async () => {
    const [first] = course.modules;
    const awaiting = first.screens.findIndex((s) => scoredItem(s) !== null) + 1;
    expect(awaiting).toBeGreaterThan(0);
    window.history.replaceState(null, '', `/#/modules/${first.slug}/${first.screens.length}`);
    const store = freshStore();
    render(<App store={store} />);
    await waitFor(() => expect(window.location.hash).toBe(`#/modules/${first.slug}/${awaiting}`));
    expect(store.getSnapshot().modules[first.slug]).toEqual({ answers: {}, reached: awaiting, completed: false });
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
    const store = createProgressStore(inline, createLrsTracker(inline, sparkLaunch()));
    window.history.replaceState(null, '', '/#/modules/00/5');
    render(<App course={inline} store={store} />);
    const radio = () => screen.getByRole<HTMLInputElement>('radio', { name: RIGHT });
    expect(radio().checked).toBe(false);

    answer(jsonResponse(state));
    await act(() => store.loaded);
    expect(radio().checked).toBe(true);
    expect(screen.getByText('Yes. Gaps get filled, confidently.')).toBeTruthy();
  });
});
