import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fixtureCourse } from '../frame/fixture.ts';
import { BoxDiagram } from './BoxDiagram.tsx';

const labels = fixtureCourse().box;

function states(container: HTMLElement) {
  return [...container.querySelectorAll('[data-wall]')].map((g) => `${g.getAttribute('data-wall')}:${g.getAttribute('data-state')}`);
}

describe('BoxDiagram', () => {
  it('draws every wall dashed, no ring, and counts them in its text alternative', () => {
    const { container } = render(<BoxDiagram labels={labels} centre="the agent" walls={[]} ring={false} caption="An open box." />);
    expect(states(container)).toEqual(['record:dashed', 'gate:dashed', 'agents:dashed', 'evidence:dashed']);
    expect(container.querySelector('.box-ring')).toBeNull();
    expect(screen.getByRole('img').getAttribute('aria-labelledby')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'The box round the agent. No wall is up yet; all four are dashed: R wall, G wall, A wall, E wall.' })).toBeTruthy();
    expect(screen.getByText('An open box.').tagName).toBe('FIGCAPTION');
  });

  it('draws the walls it is given solid and the rest dashed, in the order of the walls', () => {
    const { container } = render(<BoxDiagram labels={labels} walls={['agents', 'record', 'gate']} ring={false} />);
    expect(states(container)).toEqual(['record:solid', 'gate:solid', 'agents:solid', 'evidence:dashed']);
    expect(screen.getByRole('img', { name: 'The box round the builder. Walls up: R wall, G wall, A wall. Still dashed: E wall.' })).toBeTruthy();
  });

  it('draws the whole box and the ring', () => {
    const { container } = render(<BoxDiagram labels={labels} walls={['record', 'gate', 'agents', 'evidence']} ring />);
    expect(states(container).every((s) => s.endsWith(':solid'))).toBe(true);
    expect(container.querySelector('.box-ring')?.textContent).toBe('the ring');
    expect(screen.getByRole('img', { name: 'The box round the builder. All four walls are up: R wall, G wall, A wall, E wall. A ring is drawn round it: the ring.' })).toBeTruthy();
  });

  it('draws four walls as the sides of a box, top first and clockwise', () => {
    const { container } = render(<BoxDiagram labels={labels} walls={[]} ring={false} />);
    const turns = [...container.querySelectorAll('[data-wall] rect')].map((r) => r.getAttribute('transform'));
    expect(turns).toEqual(['rotate(0)', 'rotate(90)', 'rotate(180)', 'rotate(270)']);
  });

  it('renders **bold** and *italic* in the caption as strong and em, with no asterisks', () => {
    render(<BoxDiagram labels={labels} walls={[]} ring={false} caption="One **strong** wall and an *open* gate." />);
    const caption = document.querySelector('figcaption.box-caption');
    expect(caption?.querySelector('strong')?.textContent).toBe('strong');
    expect(caption?.querySelector('em')?.textContent).toBe('open');
    expect(caption?.textContent).toBe('One strong wall and an open gate.');
    expect(caption?.textContent).not.toContain('*');
  });
});
