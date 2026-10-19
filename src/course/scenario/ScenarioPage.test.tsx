import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { expectEmphasis, markedAll } from '../frame/emphasis.ts';
import { ScenarioPage } from './ScenarioPage.tsx';

const course = {
  title: 'Course title',
  scenario: {
    label: 'Scenario label',
    role: 'Your role: tester',
    heading: 'The scenario heading.',
    memo: { from: 'a sender', date: 'Tuesday, 10:00', subject: 'A subject', body: ['First paragraph.', 'Second paragraph.'] },
    lines: [
      { title: 'Line one.', text: 'Its text.' },
      { title: 'Line two.', text: 'More text.' },
      { title: 'Line three.', text: 'Last text.' },
    ],
    button: 'Go on',
    note: 'A note under the button.',
  },
};

describe('ScenarioPage', () => {
  it('shows the role chip, the heading, the memo, three numbered lines and the button, from its copy', () => {
    render(<ScenarioPage course={course} />);

    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['The scenario heading.']);
    expect(screen.getByText('Your role: tester')).toBeTruthy();
    expect(screen.getByText('a sender')).toBeTruthy();
    expect(screen.getByText('A subject')).toBeTruthy();
    expect(screen.getByText('Second paragraph.')).toBeTruthy();

    const lines = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(lines.map((li) => li.textContent)).toEqual(['01Line one. Its text.', '02Line two. More text.', '03Line three. Last text.']);

    expect(screen.getByRole('link', { name: 'Go on' }).getAttribute('href')).toBe('#/home');
    expect(screen.getByText('A note under the button.')).toBeTruthy();
  });

  it('has the top bar with the course name and the label, and one main', () => {
    render(<ScenarioPage course={course} />);
    const bar = screen.getByRole('banner');
    expect(within(bar).getByRole('link', { name: 'Course title' }).getAttribute('href')).toBe('#/home');
    expect(within(bar).getByText('Scenario label')).toBeTruthy();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('renders **bold** and *italic* in every piece of its copy as strong and em, with no asterisks', () => {
    const lineNumbers = [1, 2, 3];
    const names = ['label', 'role', 'heading', 'from', 'date', 'subject', 'body 1', 'body 2', 'button', 'note', ...lineNumbers.flatMap((n) => [`title ${n}`, `text ${n}`])] as const;
    const c = markedAll(names);
    const scenario = {
      label: c.label,
      role: c.role,
      heading: c.heading,
      memo: { from: c.from, date: c.date, subject: c.subject, body: [c['body 1'], c['body 2']] },
      lines: lineNumbers.map((n) => ({ title: c[`title ${n}`], text: c[`text ${n}`] })),
      button: c.button,
      note: c.note,
    };
    const { container } = render(<ScenarioPage course={{ ...course, scenario }} />);
    expectEmphasis(container, names);
  });
});
