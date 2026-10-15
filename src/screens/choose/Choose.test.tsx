import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { course, type ScreenOf } from '../../content/index.ts';
import { NO_ANSWERS } from '../../course/frame/progress.ts';
import type { SavedAnswer } from '../types.ts';
import { ChooseScreen } from './index.tsx';

// The real modules, as authored.
function chooseIn(slug: string, choose: string) {
  const module = course.modules.find((m) => m.slug === slug)!;
  const shown = module.screens.find((s): s is ScreenOf<'choose'> => s.type === 'choose' && s.slug === choose)!;
  return { module, shown };
}

function renderChoose(slug: string, choose: string, saved?: SavedAnswer) {
  const { module, shown } = chooseIn(slug, choose);
  const onEvent = vi.fn();
  const { container, unmount } = render(
    <ChooseScreen screen={shown} module={module} course={course} saved={saved} progress={{ items: NO_ANSWERS, score: { raw: 0, max: 0 } }} onEvent={onEvent} />,
  );
  return { shown, onEvent, container, unmount };
}

const option = (name: string | RegExp) => screen.getByRole('checkbox', { name });
const pick = (name: string | RegExp) => fireEvent.click(screen.getByRole('radio', { name }));
const press = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
/** Each option's state: right, wrong, dim, on or none. */
const states = (container: HTMLElement) => [...container.querySelectorAll('.choice')].map((li) => li.getAttribute('data-state') ?? 'none');
/** The box panel's caption, "n of 4 walls up. …". */
const caption = () => screen.getByText(/of 4 walls up/, { selector: 'figcaption' }).textContent;
const marks = (container: HTMLElement) => within(container).queryAllByRole('img', { name: /^(Right|Wrong)$/ }).map((m) => m.getAttribute('aria-label'));

describe('ChooseScreen, tick everything (module 00)', () => {
  it('shows the five options unticked, with Check waiting for a tick', () => {
    const { container, onEvent } = renderChoose('00', 'what-went-wrong');
    expect(screen.getAllByRole('checkbox').map((c) => (c as HTMLInputElement).checked)).toEqual([false, false, false, false, false]);
    expect(screen.getByRole('group', { name: 'Tick everything that went wrong here.' })).toBeTruthy();
    const check = screen.getByRole('button', { name: 'Check my answer' });
    expect(check.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(check);
    expect(onEvent).not.toHaveBeenCalled();
    expect(states(container)).toEqual(['none', 'none', 'none', 'none', 'none']);
  });

  it('marks every option by its own rightness on Check, each with its feedback and the four cards after', () => {
    const { container, shown } = renderChoose('00', 'what-went-wrong');
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box);
    expect(states(container)).toEqual(['on', 'on', 'on', 'on', 'on']);
    expect(screen.queryByRole('heading', { name: 'What just happened' })).toBeNull();

    press('Check my answer');
    expect(states(container)).toEqual(['right', 'right', 'right', 'wrong', 'wrong']);
    expect(marks(container)).toEqual(['Right', 'Right', 'Right', 'Wrong', 'Wrong']);
    shown.options.forEach((o) => {
      const box = option(o.label);
      expect(box.hasAttribute('disabled')).toBe(true);
      expect(document.getElementById(box.getAttribute('aria-describedby')!)?.textContent).toBe(o.feedback);
    });
    expect(screen.getByRole('status').textContent).toBe('Checked. You ticked 3 of the 3 right options and 2 of the 2 wrong ones. Each option now says why.');

    const cards = screen.getByRole('heading', { name: 'What just happened' }).nextElementSibling as HTMLElement;
    expect(within(cards).getAllByRole('listitem')).toHaveLength(4);
  });

  it('marks the options it was not ticked for too: tick none of the right ones and the right ones still go green', () => {
    const { container } = renderChoose('00', 'what-went-wrong');
    fireEvent.click(option('It was too slow.'));
    press('Check my answer');
    expect(states(container)).toEqual(['right', 'right', 'right', 'wrong', 'wrong']);
    expect(screen.getByRole('status').textContent).toMatch(/ticked 0 of the 3 right options and 1 of the 2 wrong ones/);
  });

  it('sends one interacted per ticked option on Check, each with the whole pick, and again after Try again', () => {
    const { shown, onEvent } = renderChoose('00', 'what-went-wrong');
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box);
    expect(onEvent).not.toHaveBeenCalled();
    press('Check my answer');
    const answer = { picked: [0, 1, 2, 3, 4] };
    expect(onEvent.mock.calls.map(([e]) => e)).toEqual(shown.options.map((o) => ({ type: 'interacted', slug: 'what-went-wrong', response: o.label, answer })));

    onEvent.mockClear();
    press('Try again');
    fireEvent.click(option('It invented the rules.'));
    press('Check my answer');
    expect(onEvent.mock.calls.map(([e]) => e)).toEqual([{ type: 'interacted', slug: 'what-went-wrong', response: 'It invented the rules.', answer: { picked: [1] } }]);
  });

  it('clears the ticks, the marks, the feedback and the cards on Try again', () => {
    const { container } = renderChoose('00', 'what-went-wrong');
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box);
    press('Check my answer');
    press('Try again');
    expect(screen.getAllByRole('checkbox').map((c) => [(c as HTMLInputElement).checked, c.hasAttribute('disabled')])).toEqual(Array(5).fill([false, false]));
    expect(states(container)).toEqual(['none', 'none', 'none', 'none', 'none']);
    expect(marks(container)).toEqual([]);
    expect(container.querySelector('.choice-feedback')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'What just happened' })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('');
  });
});

describe('ChooseScreen, a check (module 00, check 1)', () => {
  it('shows one question with three options, one pick at a time', () => {
    renderChoose('00', 'check-1');
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    pick('It misread your message.');
    pick('It was showing off.');
    expect(screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).checked)).toEqual([false, false, true]);
  });

  it('marks a wrong pick red with its feedback, dims the rest, and reports answered wrong', () => {
    const { container, onEvent } = renderChoose('00', 'check-1');
    pick('It misread your message.');
    press('Check my answer');
    expect(states(container)).toEqual(['wrong', 'dim', 'dim']);
    expect(marks(container)).toEqual(['Wrong']);
    expect(container.querySelectorAll('.choice-feedback')).toHaveLength(1);
    expect(screen.getByText('Not usually. It read what you wrote; the feature came from what you did not write.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Wrong. Not usually. It read what you wrote; the feature came from what you did not write.');
    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledWith({
      type: 'answered',
      slug: 'check-1',
      right: false,
      score: { raw: 0, max: 1 },
      response: 'It misread your message.',
      answer: { picked: [0] },
    });
  });

  it('takes a new pick after Try again and reports every Check press', () => {
    const { container, onEvent } = renderChoose('00', 'check-1');
    pick('It misread your message.');
    press('Check my answer');
    press('Try again');
    expect(screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).checked)).toEqual([false, false, false]);
    pick('It filled a gap in your ask with a guess.');
    press('Check my answer');
    expect(states(container)).toEqual(['dim', 'right', 'dim']);
    expect(marks(container)).toEqual(['Right']);
    expect(screen.getByText('Yes. Gaps get filled, confidently.')).toBeTruthy();
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenLastCalledWith({
      type: 'answered',
      slug: 'check-1',
      right: true,
      score: { raw: 1, max: 1 },
      response: 'It filled a gap in your ask with a guess.',
      answer: { picked: [1] },
    });
  });
});

describe('ChooseScreen, build the box (module 03)', () => {
  const box = () => screen.getByRole('img', { name: /^The box round the builder/ });
  const drawn = (container: HTMLElement) =>
    Object.fromEntries([...container.querySelectorAll('[data-wall]')].map((g) => [g.getAttribute('data-wall'), g.getAttribute('data-state')]));

  it('draws each wall as an option naming it is ticked, counting a wall once', () => {
    const { container } = renderChoose('03', 'build-the-box');
    expect(caption()).toBe('0 of 4 walls up. Hope, context and a promise to report are not walls.');
    expect(drawn(container)).toEqual({ area: 'down', gate: 'down', done: 'down', word: 'down' });

    fireEvent.click(option('A unit test that every item has exactly one right shelf and a reason.'));
    expect(caption()).toMatch(/^1 of 4/);
    fireEvent.click(option('A run through the demo script in a browser, which must pass.'));
    expect(caption()).toMatch(/^1 of 4/);
    fireEvent.click(option('A line asking it to please be careful and not change anything else.'));
    expect(caption()).toMatch(/^1 of 4/);
    fireEvent.click(option(/^Its own working area/));
    fireEvent.click(option(/^"Done means" in its instructions/));
    expect(caption()).toMatch(/^3 of 4/);
    expect(drawn(container)).toEqual({ area: 'up', gate: 'up', done: 'up', word: 'down' });
    expect(box().querySelector('title')?.textContent).toBe(
      'The box round the builder: 3 of 4 walls up. Up: own area, its files only; the gate: lint, types, tests, a browser run; done, in its instructions. Not up: its word not taken.',
    );

    fireEvent.click(option(/^The gate's own output pasted into its report/));
    expect(caption()).toMatch(/^4 of 4 walls up/);
    expect(box().querySelector('title')?.textContent).toMatch(/4 of 4 walls up\. Up: .*\.$/);

    // Unticking takes a wall down only when no other ticked option draws it.
    fireEvent.click(option('A unit test that every item has exactly one right shelf and a reason.'));
    expect(drawn(container).gate).toBe('up');
    fireEvent.click(option('A run through the demo script in a browser, which must pass.'));
    expect(drawn(container).gate).toBe('down');
  });

  it('keeps the walls drawn once checked, with its own Check label, and takes them down on Try again', () => {
    const { container } = renderChoose('03', 'build-the-box');
    fireEvent.click(option(/^Its own working area/));
    press('Check my box');
    expect(drawn(container).area).toBe('up');
    expect(states(container)).toEqual(['right', 'wrong', 'right', 'right', 'wrong', 'right', 'right']);
    press('Try again');
    expect(drawn(container).area).toBe('down');
    expect(caption()).toMatch(/^0 of 4/);
  });
});

describe('ChooseScreen, the verdict (module 04)', () => {
  it('shows the body excerpts and the prompt', () => {
    renderChoose('04', 'verdict');
    expect(screen.getByText('if (message.visible) return;')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Your verdict?' })).toBeTruthy();
  });

  it('shows a wrong verdict its feedback and Try again, with no fix', () => {
    const { container, onEvent } = renderChoose('04', 'verdict');
    pick('Refuted: there is a test for wrong drops (C).');
    press('Check my verdict');
    expect(states(container)).toEqual(['dim', 'wrong', 'dim', 'dim']);
    expect(screen.getByText(/^Not a refutation\. The test drops one item/)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'The fix' })).toBeNull();
    expect(onEvent).toHaveBeenCalledWith({
      type: 'interacted',
      slug: 'verdict',
      response: 'Refuted: there is a test for wrong drops (C).',
      answer: { picked: [1] },
    });
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('reveals the fix on the right verdict', () => {
    const { container } = renderChoose('04', 'verdict');
    pick('Refuted: there is a test for wrong drops (C).');
    press('Check my verdict');
    press('Try again');
    pick('Confirmed, citing A.');
    expect(screen.queryByRole('heading', { name: 'The fix' })).toBeNull();
    press('Check my verdict');
    expect(states(container)).toEqual(['right', 'dim', 'dim', 'dim']);
    expect(screen.getByRole('heading', { name: 'The fix' })).toBeTruthy();
    expect(screen.getByText(/The second skeptic also confirmed/)).toBeTruthy();
  });
});

describe('ChooseScreen, from a saved answer', () => {
  it('renders the verdict checked, with its feedback and its fix', () => {
    const { container, onEvent } = renderChoose('04', 'verdict', { picked: [0] });
    expect((screen.getByRole('radio', { name: 'Confirmed, citing A.' }) as HTMLInputElement).checked).toBe(true);
    expect(states(container)).toEqual(['right', 'dim', 'dim', 'dim']);
    expect(screen.getByText(/^Yes\. Line 41 returns/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'The fix' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('renders a tick-everything checked, with the after cards, and the box from its ticks', () => {
    const tick = renderChoose('00', 'what-went-wrong', { picked: [0, 3] });
    expect(screen.getAllByRole('checkbox').map((c) => (c as HTMLInputElement).checked)).toEqual([true, false, false, true, false]);
    expect(states(tick.container)).toEqual(['right', 'right', 'right', 'wrong', 'wrong']);
    expect(screen.getByRole('heading', { name: 'What just happened' })).toBeTruthy();
    tick.unmount();

    renderChoose('03', 'build-the-box', { picked: [3, 5] });
    expect(caption()).toMatch(/^2 of 4/);
  });

  it('renders any saved answer checked, dropping what is not an option', () => {
    const { container, unmount } = renderChoose('00', 'check-1', 'placeholder');
    expect(states(container)).toEqual(['dim', 'dim', 'dim']);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    unmount();

    const { container: other } = renderChoose('00', 'check-1', { picked: [7, 2] });
    expect(states(other)).toEqual(['dim', 'dim', 'wrong']);
  });
});
