import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { course } from '../../content/index.ts';
import { NO_PROGRESS, realScreen } from '../../course/frame/fixture.ts';
import type { SavedAnswer } from '../types.ts';
import { BoxPanel } from './BoxPanel.tsx';
import { ChooseScreen } from './index.tsx';

// The real modules, as authored.
function renderChoose(slug: string, choose: string, saved?: SavedAnswer) {
  const { module, screen: shown } = realScreen(slug, 'choose', choose);
  const onEvent = vi.fn();
  const { container, unmount } = render(
    <ChooseScreen screen={shown} module={module} course={course} saved={saved} progress={NO_PROGRESS} onEvent={onEvent} />,
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
/** Each option's verdict pill, its words and its tone, or none. */
const verdicts = (container: HTMLElement) =>
  [...container.querySelectorAll('.choice')].map((li) => {
    const pill = li.querySelector('.choice-verdict');
    return pill === null ? 'none' : `${pill.getAttribute('data-tone')}: ${pill.textContent}`;
  });
const RIGHT_TICK = 'right: Right to tick';
const RIGHT_LEAVE = 'right: Right to leave it';
const WRONG_TICK = "wrong: Shouldn't be ticked";
const MISSED = 'wrong: Missed: should be ticked';

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

  it('judges every option right with the three right ones ticked: five green pills, each with its feedback, and the four cards after', () => {
    const { container, shown } = renderChoose('00', 'what-went-wrong');
    fireEvent.click(option(/^It built things nobody asked for/));
    fireEvent.click(option('It invented the rules.'));
    fireEvent.click(option('It checked its own work.'));
    expect(states(container)).toEqual(['on', 'on', 'on', 'none', 'none']);
    expect(screen.queryByRole('heading', { name: 'What just happened' })).toBeNull();

    press('Check my answer');
    expect(states(container)).toEqual(['right-tick', 'right-tick', 'right-tick', 'right-leave', 'right-leave']);
    expect(verdicts(container)).toEqual([RIGHT_TICK, RIGHT_TICK, RIGHT_TICK, RIGHT_LEAVE, RIGHT_LEAVE]);
    // The pill carries right and wrong; the feedback under it has no mark of its own.
    expect(marks(container)).toEqual([]);
    shown.options.forEach((o) => {
      // The option keeps its name; its verdict and feedback are its description.
      const box = option(o.label);
      expect(box.hasAttribute('disabled')).toBe(true);
      const [verdictId, feedbackId] = box.getAttribute('aria-describedby')!.split(' ');
      expect(document.getElementById(verdictId)?.textContent).toMatch(/^Right to (tick|leave it)$/);
      expect(document.getElementById(feedbackId)?.textContent).toBe(o.feedback);
    });
    const summary = screen.getByRole('status');
    expect(summary.textContent).toBe('5 of 5 right.');
    expect(summary.getAttribute('data-tone')).toBe('right');
    expect(summary.className).toBe('choice-summary');

    const cards = screen.getByRole('heading', { name: 'What just happened' }).nextElementSibling as HTMLElement;
    expect(within(cards).getAllByRole('listitem')).toHaveLength(4);
  });

  it('judges what was done with each option: a wrong tick and a missed one go red, and the summary counts both', () => {
    const { container } = renderChoose('00', 'what-went-wrong');
    fireEvent.click(option(/^It built things nobody asked for/));
    fireEvent.click(option('It invented the rules.'));
    fireEvent.click(option('It should have said no.'));
    press('Check my answer');
    expect(states(container)).toEqual(['right-tick', 'right-tick', 'missed', 'wrong-tick', 'right-leave']);
    expect(verdicts(container)).toEqual([RIGHT_TICK, RIGHT_TICK, MISSED, WRONG_TICK, RIGHT_LEAVE]);
    const summary = screen.getByRole('status');
    expect(summary.textContent).toBe("3 of 5 right: one tick shouldn't be there, and one missed.");
    expect(summary.getAttribute('data-tone')).toBe('wrong');
  });

  it('says the summary in the one live region, there from the start, once per Check', () => {
    const { container } = renderChoose('00', 'what-went-wrong');
    const region = screen.getByRole('status');
    expect(region.textContent).toBe('');
    fireEvent.click(option('It was too slow.'));
    expect(region.textContent).toBe('');
    press('Check my answer');
    expect(screen.getByRole('status')).toBe(region);
    expect(region.textContent).toBe("1 of 5 right: one tick shouldn't be there, and 3 missed.");
    press('Try again');
    expect(screen.getByRole('status')).toBe(region);
    expect(region.textContent).toBe('');
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
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

  it('clears the ticks, the verdicts, the feedback, the summary and the cards on Try again', () => {
    const { container } = renderChoose('00', 'what-went-wrong');
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box);
    press('Check my answer');
    press('Try again');
    expect(screen.getAllByRole('checkbox').map((c) => [(c as HTMLInputElement).checked, c.hasAttribute('disabled')])).toEqual(Array(5).fill([false, false]));
    expect(states(container)).toEqual(['none', 'none', 'none', 'none', 'none']);
    expect(verdicts(container)).toEqual(Array(5).fill('none'));
    expect(screen.getByRole('status').className).toBe('sr-only');
    expect(container.querySelector('.choice-feedback')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'What just happened' })).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('');
  });
});

describe('ChooseScreen, every multi choose judges the same way (modules 00, 02, 03, 06)', () => {
  const multis: [string, string][] = [
    ['00', 'what-went-wrong'],
    ['02', 'write-the-acceptance'],
    ['03', 'build-the-box'],
    ['06', 'what-would-you-change'],
  ];

  it.each(multis)('module %s %s: the right ones ticked is all right, everything ticked marks the wrong ones', (slug, choose) => {
    const first = renderChoose(slug, choose);
    const { options } = first.shown;
    const total = options.length;
    options.forEach((o) => o.right && fireEvent.click(option(o.label)));
    press(first.shown.checkLabel ?? 'Check my answer');
    expect(verdicts(first.container)).toEqual(options.map((o) => (o.right ? RIGHT_TICK : RIGHT_LEAVE)));
    expect(screen.getByRole('status').textContent).toBe(`${total} of ${total} right.`);
    expect(marks(first.container)).toEqual([]);
    first.unmount();

    const all = renderChoose(slug, choose);
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box);
    press(all.shown.checkLabel ?? 'Check my answer');
    expect(verdicts(all.container)).toEqual(options.map((o) => (o.right ? RIGHT_TICK : WRONG_TICK)));
    const wrong = options.filter((o) => !o.right).length;
    expect(screen.getByRole('status').textContent).toBe(
      `${total - wrong} of ${total} right: ${wrong === 1 ? 'one tick' : `${wrong} ticks`} shouldn't be there.`,
    );
    all.unmount();
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
    expect(states(container)).toEqual(['missed', 'right-leave', 'missed', 'right-tick', 'right-leave', 'missed', 'missed']);
    expect(screen.getByRole('status').textContent).toBe('3 of 7 right: 4 missed.');
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

  it('shows a wrong verdict its feedback and "Try another verdict", with no fix', () => {
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
    expect(screen.getByRole('button', { name: 'Try another verdict' })).toBeTruthy();
  });

  it('reveals the fix on the right verdict', () => {
    const { container } = renderChoose('04', 'verdict');
    pick('Refuted: there is a test for wrong drops (C).');
    press('Check my verdict');
    press('Try another verdict');
    pick('Confirmed, citing A.');
    expect(screen.queryByRole('heading', { name: 'The fix' })).toBeNull();
    press('Check my verdict');
    expect(states(container)).toEqual(['right', 'dim', 'dim', 'dim']);
    expect(screen.getByRole('heading', { name: 'The fix' })).toBeTruthy();
    expect(screen.getByText(/The second skeptic also confirmed/)).toBeTruthy();
  });
});

describe('BoxPanel', () => {
  it('names its walls as copy in the key, and in plain words in the drawing', () => {
    const box = { builder: { title: 'the *builder*', subtitle: 'bead **.4**' }, walls: [{ id: 'gate', label: 'the *gate*' }, { id: 'area', label: 'its own area' }], caption: '{up} of {total} walls up.' };
    const { container } = render(<BoxPanel box={box} up={new Set(['gate'])} />);
    expect(container.querySelector('.choose-box-key li')?.innerHTML).toBe('<span class="choose-box-key-number">1</span>the <em>gate</em>');
    expect(screen.getByRole('img').textContent).toContain('The box round the builder: 1 of 2 walls up. Up: the gate. Not up: its own area.');
    expect([...container.querySelectorAll('svg > text')].map((t) => t.textContent)).toEqual(['the builder', 'bead .4']);
  });
});

describe('ChooseScreen, from a saved answer', () => {
  it('renders the verdict checked, with its feedback and its fix', () => {
    const { container, onEvent } = renderChoose('04', 'verdict', { picked: [0] });
    expect((screen.getByRole('radio', { name: 'Confirmed, citing A.' }) as HTMLInputElement).checked).toBe(true);
    expect(states(container)).toEqual(['right', 'dim', 'dim', 'dim']);
    expect(screen.getByText(/^Yes\. Line 41 returns/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'The fix' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try another verdict' })).toBeTruthy();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('renders a tick-everything checked, with the after cards, and the box from its ticks', () => {
    const tick = renderChoose('00', 'what-went-wrong', { picked: [0, 3] });
    expect(screen.getAllByRole('checkbox').map((c) => (c as HTMLInputElement).checked)).toEqual([true, false, false, true, false]);
    expect(states(tick.container)).toEqual(['right-tick', 'missed', 'missed', 'wrong-tick', 'right-leave']);
    expect(verdicts(tick.container)).toEqual([RIGHT_TICK, MISSED, MISSED, WRONG_TICK, RIGHT_LEAVE]);
    expect(screen.getByRole('status').textContent).toBe("2 of 5 right: one tick shouldn't be there, and 2 missed.");
    expect(screen.getByRole('heading', { name: 'What just happened' })).toBeTruthy();
    tick.unmount();

    renderChoose('03', 'build-the-box', { picked: [3, 5] });
    expect(caption()).toMatch(/^2 of 4/);
  });

  it('renders unanswered from a saved answer that does not fit: the wrong shape, a position that is not an option, the wrong count', () => {
    const misfits: [string, SavedAnswer][] = [
      ['check-1', 'placeholder'],
      ['check-1', { picked: 2 }],
      ['check-1', { picked: [7, 2] }],
      ['check-1', { picked: [5] }],
      ['check-1', { picked: [0, 2] }],
      ['check-1', { picked: [] }],
      ['what-went-wrong', { picked: [] }],
      ['what-went-wrong', { picked: [1, 1] }],
    ];
    for (const [slug, saved] of misfits) {
      const { container, unmount } = renderChoose('00', slug, saved);
      expect(states(container), JSON.stringify(saved)).toEqual(states(container).map(() => 'none'));
      expect(screen.getByRole('button', { name: 'Check my answer' }).getAttribute('aria-disabled')).toBe('true');
      expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
      expect(screen.getByRole('status').textContent).toBe('');
      unmount();
    }
  });
});
