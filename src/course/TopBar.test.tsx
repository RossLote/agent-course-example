import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { TopBar } from './TopBar.tsx';

describe('TopBar', () => {
  it('shows the course name as a link home, the subtitle and the end slot', () => {
    render(
      <TopBar title="Course title" subtitle="Module 01 · A module">
        <span>Screen 2 of 6</span>
      </TopBar>,
    );
    const bar = screen.getByRole('banner');
    expect(within(bar).getByRole('link', { name: 'Course title' }).getAttribute('href')).toBe('#/home');
    expect(within(bar).getByText('Module 01 · A module')).toBeTruthy();
    expect(within(bar).getByText('Screen 2 of 6')).toBeTruthy();
  });

  it('leaves the subtitle out when it has none', () => {
    const { container } = render(<TopBar title="Course title" />);
    expect(container.querySelector('.topbar-subtitle')).toBeNull();
  });
});
