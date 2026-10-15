import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { Screen } from '../../content/index.ts';
import { moduleAnswers } from '../../progress/progress.ts';
import { createProgressStore } from '../../progress/store.ts';
import { useProgress } from '../../progress/useProgress.ts';
import type { ModuleAnswers, ScreenProps } from '../../screens/types.ts';
import { createMemoryTracker } from '../../xapi/tracker.ts';
import { fixtureCourse } from './fixture.ts';
import { ModuleFrame, type ModuleFrameProps } from './ModuleFrame.tsx';
import { NO_ANSWERS } from './progress.ts';

// The chat is swapped for a probe that shows what the frame hands a screen and reports a pick.
vi.mock('../../screens/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../screens/index.ts')>();
  function ProbeScreen({ screen, saved, progress, onEvent }: ScreenProps<'chat'>) {
    return (
      <div>
        <p>saved: {JSON.stringify(saved) ?? 'none'}</p>
        <p>
          score: {progress.score.raw} of {progress.score.max}
        </p>
        <button type="button" onClick={() => onEvent({ type: 'interacted', slug: screen.slug, response: 'Option two', answer: [1] })}>
          Pick
        </button>
      </div>
    );
  }
  return { screenComponents: { ...actual.screenComponents, chat: ProbeScreen } };
});

const screens: Screen[] = [
  {
    type: 'scene',
    eyebrow: 'An eyebrow',
    heading: 'The *first* screen',
    intro: 'The intro line.',
    blocks: [{ type: 'paragraph', text: 'The body.' }],
    side: [{ type: 'paragraph', heading: 'Beside it', text: 'The side text.' }],
  },
  {
    type: 'choose',
    slug: 'check-one',
    scored: true,
    mode: 'single',
    heading: 'Check one',
    nav: 'check',
    options: [
      { label: 'Right', right: true, feedback: 'Yes.' },
      { label: 'Wrong', right: false, feedback: 'No.' },
    ],
  },
  {
    type: 'chat',
    slug: 'talk',
    heading: 'A chat',
    opening: 'Hello.',
    messages: ['Hi.'],
  },
  {
    type: 'order',
    slug: 'loop',
    heading: 'Order them',
    cards: [
      { id: 'a', label: 'A', feedback: 'A first.' },
      { id: 'b', label: 'B', feedback: 'B second.' },
      { id: 'c', label: 'C', feedback: 'C third.' },
    ],
    start: ['c', 'a', 'b'],
  },
  { type: 'scene', heading: 'Your score', blocks: [{ type: 'stats', items: [{ score: 'module', caption: 'your score' }] }] },
  { type: 'takeaway', text: '**The card.** Its line.', caption: 'The box caption.', nav: 'takeaway' },
];
const course = fixtureCourse({ '01': screens });
const module = course.modules[1];

function renderFrame(props: Partial<ModuleFrameProps> = {}) {
  return render(<ModuleFrame course={course} module={module} screen={1} answers={NO_ANSWERS} onEvent={() => {}} {...props} />);
}

const next = () => screen.getByRole('button', { name: /^Next/ });
const back = () => screen.getByRole('button', { name: 'Back' });

describe('ModuleFrame', () => {
  it('shows the first screen with the module, eight dots with the current one marked, and "Screen 1 of n"', () => {
    const { container } = renderFrame();
    const bar = screen.getByRole('banner');
    expect(within(bar).getByText('Module 01 · Module 01 title')).toBeTruthy();
    expect(within(bar).getByRole('img', { name: 'Module 2 of 8' })).toBeTruthy();
    const dots = [...container.querySelectorAll('.frame-dot')];
    expect(dots).toHaveLength(8);
    expect(dots.map((d) => d.hasAttribute('data-current'))).toEqual([false, true, false, false, false, false, false, false]);
    expect(within(bar).getByText('Screen 1 of 6')).toBeTruthy();
  });

  it('shows the eyebrow, the heading as the one h1, the intro, the body and the side', () => {
    renderFrame();
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.innerHTML)).toEqual(['The <em>first</em> screen']);
    expect(screen.getByText('An eyebrow')).toBeTruthy();
    expect(screen.getByText('The intro line.')).toBeTruthy();
    expect(screen.getByText('The body.')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Beside it' }).closest('.frame-side')).toBeTruthy();
    expect(screen.getByText('The side text.').closest('.scene-card')).toBeTruthy();
  });

  it('names the next screen on Next by its nav, else its heading, and moves to it', () => {
    const first = renderFrame();
    expect(next().textContent).toBe('Next: check');
    fireEvent.click(next());
    expect(window.location.hash).toBe('#/modules/01/2');

    first.unmount();
    renderFrame({ screen: 3 });
    expect(next().textContent).toBe('Next: Order them');
  });

  it('goes back a screen on Back, and home from the first screen', () => {
    const third = renderFrame({ screen: 3 });
    fireEvent.click(back());
    expect(window.location.hash).toBe('#/modules/01/2');

    third.unmount();
    renderFrame();
    fireEvent.click(back());
    expect(window.location.hash).toBe('#/home');
  });

  it('shows the takeaway with its card as the h1, and Next goes home', () => {
    window.location.hash = '#/modules/01/6';
    renderFrame({ screen: 6 });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('The card. Its line.');
    expect(screen.getByText('Screen 6 of 6')).toBeTruthy();
    expect(next().textContent).toBe('Next: home');
    fireEvent.click(next());
    expect(window.location.hash).toBe('#/home');
  });

  it('shows the last screen for a screen past the end', () => {
    renderFrame({ screen: 9 });
    expect(screen.getByText('Screen 6 of 6')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('The card. Its line.');
  });

  it('keeps Next off on a scored screen until it is answered, saying why', () => {
    window.location.hash = '#/modules/01/2';
    renderFrame({ screen: 2 });
    expect(next().getAttribute('aria-disabled')).toBe('true');
    expect(next().getAttribute('aria-describedby')).toBe(screen.getByText('Answer the question to go on.').id);
    fireEvent.click(next());
    expect(window.location.hash).toBe('#/modules/01/2');
  });

  it('lets Next on when a scored screen has a saved answer, and on an unscored screen at once', () => {
    const answers: ModuleAnswers = { 'check-one': { answer: [1], score: { raw: 0, max: 1 }, right: false } };
    renderFrame({ screen: 2, answers });
    expect(next().hasAttribute('aria-disabled')).toBe(false);
    expect(screen.queryByText('Answer the question to go on.')).toBeNull();
    fireEvent.click(next());
    expect(window.location.hash).toBe('#/modules/01/3');
  });

  it('passes a screen event on with the module and the screen it came from', () => {
    const onEvent = vi.fn();
    renderFrame({ screen: 2, onEvent });
    fireEvent.click(screen.getByRole('radio', { name: 'Right' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    expect(onEvent).toHaveBeenCalledWith(
      { type: 'answered', slug: 'check-one', right: true, score: { raw: 1, max: 1 }, response: 'Right', answer: { picked: [0] } },
      { module, screen: screens[1] },
    );
  });

  it("gives a screen its saved answer and the module's progress", () => {
    const answers: ModuleAnswers = { talk: { answer: [0] }, 'check-one': { answer: 'x', score: { raw: 1, max: 1 }, right: true } };
    renderFrame({ screen: 3, answers });
    expect(screen.getByText('saved: [0]')).toBeTruthy();
    expect(screen.getByText('score: 1 of 4')).toBeTruthy();
  });

  it("reads the module's score into a stats item with score: module", () => {
    const answers: ModuleAnswers = { 'check-one': { answer: 'x', score: { raw: 1, max: 1 } }, loop: { answer: ['a', 'b', 'c'], score: { raw: 3, max: 3 } } };
    renderFrame({ screen: 5, answers });
    expect(screen.getByText('4 out of 4')).toBeTruthy();
  });
});

describe('the answers held by the progress store', () => {
  const store = createProgressStore(course, createMemoryTracker({ id: 'https://example.org/frame-test/' }));
  function Session({ slug, at }: { slug: string; at: number }) {
    const { doc, onEvent } = useProgress(store);
    const shown = course.modules.find((m) => m.slug === slug)!;
    return <ModuleFrame course={course} module={shown} screen={at} answers={moduleAnswers(doc, slug)} onEvent={onEvent} />;
  }

  it('turns Next on once a scored screen sends answered, and keeps every answer across screens and modules', () => {
    const { rerender } = render(<Session slug="01" at={2} />);
    expect(next().getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'Right' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    expect(next().hasAttribute('aria-disabled')).toBe(false);

    rerender(<Session slug="01" at={3} />);
    expect(screen.getByText('saved: none')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
    expect(screen.getByText('saved: [1]')).toBeTruthy();
    expect(screen.getByText('score: 1 of 4')).toBeTruthy();

    rerender(<Session slug="02" at={1} />);
    expect(screen.getByText('Screen 1 of 2')).toBeTruthy();
    rerender(<Session slug="01" at={2} />);
    expect(next().hasAttribute('aria-disabled')).toBe(false);
    rerender(<Session slug="01" at={3} />);
    expect(screen.getByText('saved: [1]')).toBeTruthy();
  });
});
