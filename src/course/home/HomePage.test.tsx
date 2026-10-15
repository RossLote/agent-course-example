import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { HomePage } from './HomePage.tsx';

const course = {
  title: 'Course title',
  box: {
    centre: 'the builder',
    walls: { record: 'R wall', done: 'D wall', gate: 'G wall', agents: 'A wall', evidence: 'E wall' },
    ring: 'the ring',
  },
  home: {
    meta: 'Two modules',
    leave: 'Leave any time',
    eyebrow: 'Remember',
    heading: 'The home heading.',
    quote: { text: 'A quoted line.', attribution: 'Someone' },
    line: 'The line under the quote.',
    start: 'Start the first',
    scenarioLink: 'Back to the scenario',
    box: { centre: 'the agent', caption: 'The caption.' },
    modulesHeading: 'The modules here',
  },
  modules: [
    { slug: '00', title: 'First module', minutes: 5, wallLabel: 'no wall', blurb: 'The first blurb.' },
    { slug: '01', title: 'Second module', minutes: 7, wallLabel: 'wall 1', blurb: 'The second blurb.' },
  ],
};

describe('HomePage', () => {
  it('shows the thesis, the quote, the line and the two links, from its copy', () => {
    render(<HomePage course={course} />);
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['The home heading.']);
    expect(screen.getByText('Remember')).toBeTruthy();
    expect(screen.getByText('“A quoted line.”')).toBeTruthy();
    expect(screen.getByText('Someone')).toBeTruthy();
    expect(screen.getByText('The line under the quote.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Start the first' }).getAttribute('href')).toBe('#/modules/00/1');
    expect(screen.getByRole('link', { name: 'Back to the scenario' }).getAttribute('href')).toBe('#/');
  });

  it('draws the open box: every wall dashed round the agent, with its caption', () => {
    const { container } = render(<HomePage course={course} />);
    expect(screen.getByRole('img').textContent).toContain('The box round the agent. No wall is up yet');
    expect([...container.querySelectorAll('[data-wall]')].map((g) => g.getAttribute('data-state'))).toEqual(Array(5).fill('dashed'));
    expect(screen.getByText('The caption.')).toBeTruthy();
  });

  it('lists every module as a card that opens it, each "Not started" until told otherwise', () => {
    render(<HomePage course={course} statuses={{ '01': 'done' }} />);
    const modules = screen.getByRole('region', { name: 'The modules here' });
    const cards = within(modules).getAllByRole('link');
    expect(cards.map((a) => a.getAttribute('href'))).toEqual(['#/modules/00/1', '#/modules/01/1']);
    expect(within(cards[0]).getByRole('heading', { level: 3 }).textContent).toBe('First module');
    expect(cards[0].textContent).toBe('00 · 5 minFirst moduleno wallThe first blurb.Not started');
    expect(cards[1].textContent).toBe('01 · 7 minSecond modulewall 1The second blurb.Done');
  });

  it('puts the meta and the leave line in the top bar, and "n of m done" once a module is done', () => {
    const { rerender } = render(<HomePage course={course} done={0} />);
    const bar = () => screen.getByRole('banner');
    expect(within(bar()).getByText('Two modules')).toBeTruthy();
    expect(within(bar()).getByText('Leave any time')).toBeTruthy();
    rerender(<HomePage course={course} done={1} />);
    expect(within(bar()).getByText('1 of 2 done')).toBeTruthy();
    expect(within(bar()).queryByText('Two modules')).toBeNull();
    rerender(<HomePage course={course} done={2} />);
    expect(within(bar()).getByText('2 of 2 done')).toBeTruthy();
  });

  it('reads each status in words on its card', () => {
    render(<HomePage course={course} statuses={{ '00': 'in-progress', '01': 'not-started' }} />);
    const cards = within(screen.getByRole('region', { name: 'The modules here' })).getAllByRole('link');
    expect(cards.map((card) => card.querySelector('.module-card-status')?.textContent)).toEqual(['In progress', 'Not started']);
  });

  it('starts, continues where the learner got to, or reviews from the first module', () => {
    const { rerender } = render(<HomePage course={course} next={{ action: 'start' }} />);
    const primary = () => screen.getByRole('link', { name: /^(Start the first|Continue|Review)/ });
    expect(primary().textContent).toBe('Start the first');
    expect(primary().getAttribute('href')).toBe('#/modules/00/1');

    rerender(<HomePage course={course} next={{ action: 'continue', slug: '01', screen: 4 }} />);
    expect(primary().textContent).toBe('Continue module 01');
    expect(primary().getAttribute('href')).toBe('#/modules/01/4');

    rerender(<HomePage course={course} next={{ action: 'review' }} />);
    expect(primary().textContent).toBe('Review from module 00');
    expect(primary().getAttribute('href')).toBe('#/modules/00/1');
  });
});
