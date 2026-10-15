import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fixtureCourse } from '../frame/fixture.ts';
import { BoxDiagram } from './BoxDiagram.tsx';

const labels = fixtureCourse().box;

function states(container: HTMLElement) {
  return [...container.querySelectorAll('[data-wall]')].map((g) => `${g.getAttribute('data-wall')}:${g.getAttribute('data-state')}`);
}

describe('BoxDiagram', () => {
  it('draws every wall dashed, no ring, and says so in its text alternative', () => {
    const { container } = render(<BoxDiagram labels={labels} centre="the agent" walls={[]} ring={false} caption="An open box." />);
    expect(states(container)).toEqual(['record:dashed', 'done:dashed', 'gate:dashed', 'agents:dashed', 'evidence:dashed']);
    expect(container.querySelector('.box-ring')).toBeNull();
    expect(screen.getByRole('img').getAttribute('aria-labelledby')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'The box round the agent. No wall is up yet; all five are dashed: R wall, D wall, G wall, A wall, E wall.' })).toBeTruthy();
    expect(screen.getByText('An open box.').tagName).toBe('FIGCAPTION');
  });

  it('draws the walls it is given solid and the rest dashed', () => {
    const { container } = render(<BoxDiagram labels={labels} walls={['done', 'record']} ring={false} />);
    expect(states(container)).toEqual(['record:solid', 'done:solid', 'gate:dashed', 'agents:dashed', 'evidence:dashed']);
    expect(screen.getByRole('img', { name: 'The box round the builder. Walls up: R wall, D wall. Still dashed: G wall, A wall, E wall.' })).toBeTruthy();
  });

  it('draws the whole box and the ring', () => {
    const { container } = render(<BoxDiagram labels={labels} walls={['record', 'done', 'gate', 'agents', 'evidence']} ring />);
    expect(states(container).every((s) => s.endsWith(':solid'))).toBe(true);
    expect(container.querySelector('.box-ring')?.textContent).toBe('the ring');
    expect(
      screen.getByRole('img', { name: 'The box round the builder. All five walls are up: R wall, D wall, G wall, A wall, E wall. A ring is drawn round it: the ring.' }),
    ).toBeTruthy();
  });
});
