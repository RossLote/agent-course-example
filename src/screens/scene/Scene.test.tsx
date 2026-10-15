import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { Block } from '../../content/index.ts';
import { fixtureCourse } from '../../course/frame/fixture.ts';
import type { ModuleProgress } from '../types.ts';
import { Blocks } from './Blocks.tsx';
import { Copy } from './Copy.tsx';
import { SceneScreen } from './index.tsx';

const progress: ModuleProgress = { items: {}, score: { raw: 2, max: 3 } };

const blocks: Block[] = [
  { type: 'paragraph', heading: 'A paragraph heading', text: 'A paragraph with **bold** and *italic*.' },
  {
    type: 'cards',
    numbered: true,
    items: [
      { title: 'First card.', body: 'Its body.' },
      { body: 'A card with no title.' },
    ],
  },
  { type: 'quote', text: 'A quoted line.', attribution: 'Someone' },
  {
    type: 'list',
    heading: 'A numbered list',
    items: ['Step one.', { text: 'Step two passed.', marker: 'ch 2', tone: 'right' }, { text: 'Step three failed.', tone: 'wrong' }, { text: 'Just so.', tone: 'neutral' }],
  },
  { type: 'list', style: 'bullets', items: ['A bullet.'] },
  { type: 'table', heading: 'The numbers', header: ['Built', 'Fixed'], rows: [['16', '39']] },
  {
    type: 'columns',
    columns: [
      { heading: 'Loose', blocks: [{ type: 'paragraph', heading: 'Inside', text: 'Left column.' }] },
      { heading: 'Boxed', blocks: [{ type: 'mono', text: 'gate: ok' }] },
    ],
  },
  { type: 'mono', heading: 'A · line 41', text: 'if (x) return;\n  touched: src/a/*, src/b/*' },
  {
    type: 'stats',
    heading: 'One run',
    items: [
      { value: 16, caption: 'pieces built' },
      { score: 'module', caption: 'your score' },
    ],
  },
  { type: 'aside', term: 'gate', text: 'the checks that must be green.' },
];

function renderScene() {
  const course = fixtureCourse();
  const shown = { type: 'scene', heading: 'A scene', blocks } as const;
  return render(<SceneScreen screen={shown} module={course.modules[0]} course={course} progress={progress} onEvent={() => {}} />);
}

describe('SceneScreen', () => {
  it('renders a paragraph with its heading and its bold and italic', () => {
    renderScene();
    expect(screen.getByRole('heading', { level: 2, name: 'A paragraph heading' })).toBeTruthy();
    expect(screen.getByText(/A paragraph with/).innerHTML).toBe('A paragraph with <strong>bold</strong> and <em>italic</em>.');
  });

  it('renders numbered cards, each with its title in bold before its body', () => {
    const { container } = renderScene();
    const cards = within(container.querySelector('.block-cards')! as HTMLElement).getAllByRole('listitem');
    expect(cards.map((c) => c.textContent)).toEqual(['1First card. Its body.', '2A card with no title.']);
    expect(container.querySelector('.block-cards ol')).toBeTruthy();
  });

  it('renders a quote with its attribution', () => {
    renderScene();
    expect(screen.getByText('A quoted line.', { exact: false }).closest('blockquote')).toBeTruthy();
    expect(screen.getByText('Someone').tagName).toBe('FIGCAPTION');
  });

  it('renders a numbered list with markers and right and wrong told by an icon with a name, and a bulleted one', () => {
    const { container } = renderScene();
    const list = screen.getByRole('heading', { name: 'A numbered list' }).nextElementSibling as HTMLElement;
    expect(list.tagName).toBe('OL');
    const lines = within(list).getAllByRole('listitem');
    expect(lines.map((l) => l.textContent)).toEqual(['1Step one.', 'ch 2Step two passed.', '3Step three failed.', '4Just so.']);
    expect(within(lines[1]).getByRole('img', { name: 'right' })).toBeTruthy();
    expect(within(lines[2]).getByRole('img', { name: 'wrong' })).toBeTruthy();
    expect(within(lines[3]).queryByRole('img')).toBeNull();
    expect(container.querySelector('ul.block-list-items')?.textContent).toBe('•A bullet.');
  });

  it('renders a table with its caption, header and rows', () => {
    renderScene();
    const table = screen.getByRole('table', { name: 'The numbers' });
    expect(within(table).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Built', 'Fixed']);
    expect(within(table).getAllByRole('cell').map((c) => c.textContent)).toEqual(['16', '39']);
  });

  it('renders two columns, each with its heading and its own blocks a level below it', () => {
    const { container } = renderScene();
    const columns = [...container.querySelectorAll('.block-column')] as HTMLElement[];
    expect(columns).toHaveLength(2);
    expect(within(columns[0]).getByRole('heading', { level: 2, name: 'Loose' })).toBeTruthy();
    expect(within(columns[0]).getByRole('heading', { level: 3, name: 'Inside' })).toBeTruthy();
    expect(within(columns[0]).getByText('Left column.')).toBeTruthy();
    expect(within(columns[1]).getByRole('heading', { level: 2, name: 'Boxed' })).toBeTruthy();
    expect(columns[1].querySelector('pre')?.textContent).toBe('gate: ok');
  });

  it('renders monospace text exactly as written, asterisks and line breaks too', () => {
    renderScene();
    const mono = screen.getByText('A · line 41').closest('figure')!;
    expect(mono.querySelector('pre')?.textContent).toBe('if (x) return;\n  touched: src/a/*, src/b/*');
  });

  it("renders a stats row, reading the module's score for score: module", () => {
    const { container } = renderScene();
    const stats = [...container.querySelectorAll('.block-stats li')].map((li) => li.textContent);
    expect(stats).toEqual(['16pieces built', '2 out of 3your score']);
  });

  it('renders an aside with its glossary term', () => {
    renderScene();
    const note = screen.getByRole('note');
    expect(within(note).getByText('gate').tagName).toBe('DFN');
    expect(note.textContent).toBe('gatethe checks that must be green.');
  });
});

describe('Blocks', () => {
  it('puts each block on a card of its own when boxed, a quote being one already', () => {
    const { container } = render(
      <Blocks
        boxed
        progress={progress}
        blocks={[
          { type: 'paragraph', heading: 'What to watch for', text: 'Read it twice.' },
          { type: 'quote', text: 'A line.' },
        ]}
      />,
    );
    const shown = [...container.querySelector('.blocks')!.children];
    expect(shown.map((el) => el.className)).toEqual(['scene-card', 'block block-quote']);
  });

  it("renders an aside's term, a list marker, a stat's value and a quote's attribution as copy", () => {
    const { container } = render(
      <Blocks
        progress={progress}
        blocks={[
          { type: 'aside', term: 'the *gate*', text: 'The checks.' },
          { type: 'list', items: [{ text: 'A step.', marker: '**ch 2**' }] },
          { type: 'stats', items: [{ value: '**16**', caption: 'pieces' }] },
          { type: 'quote', text: 'A line.', attribution: '*Ross*' },
        ]}
      />,
    );
    expect(container.querySelector('dfn')?.innerHTML).toBe('the <em>gate</em>');
    expect(container.querySelector('.block-list-marker')?.innerHTML).toBe('<strong>ch 2</strong>');
    expect(container.querySelector('.block-stat-value')?.innerHTML).toBe('<strong>16</strong>');
    expect(container.querySelector('figcaption')?.innerHTML).toBe('<em>Ross</em>');
  });
});

describe('Copy', () => {
  it('renders **bold** and *italic*, nested too, and leaves everything else as written', () => {
    const { container } = render(
      <p>
        <Copy text="Plain, **bold with *italic* inside**, *italic*, and 2 * 3 = 6." />
      </p>,
    );
    expect(container.querySelector('p')?.innerHTML).toBe('Plain, <strong>bold with <em>italic</em> inside</strong>, <em>italic</em>, and 2 * 3 = 6.');
  });
});
