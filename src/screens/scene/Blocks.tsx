import type { ReactNode } from 'react';
import type { Block, ListItem, StatsItem } from '../../content/index.ts';
import { Quote } from '../parts/Quote.tsx';
import { ToneIcon } from '../parts/Tone.tsx';
import type { ModuleProgress } from '../types.ts';
import { Copy } from './Copy.tsx';
import './Blocks.css';

/** The level of a block's own heading: 2 on a screen, 3 under a column's heading. */
type Level = 2 | 3;

export interface BlocksProps {
  blocks: readonly Block[];
  /** The module's progress, which a stats item with `score: module` reads. */
  progress: ModuleProgress;
  /** Each block on a card of its own: how the side column shows them. */
  boxed?: boolean;
  /** The heading level of the blocks' own headings; 2 unless they sit under another heading. */
  level?: Level;
}

/**
 * A list of content blocks (content/README.md, "Blocks"): a scene's body, a screen's side, a
 * choose's body, reveal and after blocks. Every screen that shows blocks renders them with this.
 */
export function Blocks({ blocks, progress, boxed = false, level = 2 }: BlocksProps) {
  return (
    <div className={boxed ? 'blocks blocks-boxed' : 'blocks'}>
      {blocks.map((block, i) => {
        const shown = <BlockView key={i} block={block} progress={progress} level={level} />;
        // A quote is a card already.
        return boxed && block.type !== 'quote' ? (
          <div key={i} className="scene-card">
            {shown}
          </div>
        ) : (
          shown
        );
      })}
    </div>
  );
}

function BlockHeading({ level, className = 'eyebrow block-heading', children }: { level: Level; className?: string; children: ReactNode }) {
  const Heading = `h${level}` as const;
  return <Heading className={className}>{children}</Heading>;
}

function BlockView({ block, progress, level }: { block: Block; progress: ModuleProgress; level: Level }) {
  const heading = 'heading' in block && block.heading !== undefined && <BlockHeading level={level}><Copy text={block.heading} /></BlockHeading>;
  switch (block.type) {
    case 'paragraph':
      return (
        <div className="block block-paragraph">
          {heading}
          <p>
            <Copy text={block.text} />
          </p>
        </div>
      );
    case 'cards': {
      const List = block.numbered ? 'ol' : 'ul';
      return (
        <div className="block block-cards">
          {heading}
          <List className="block-cards-list">
            {block.items.map((item, i) => (
              <li key={i} className="scene-card block-card">
                {block.numbered && (
                  <span className="block-card-number" aria-hidden="true">
                    {i + 1}
                  </span>
                )}
                <p>
                  {item.title !== undefined && (
                    <>
                      <strong>
                        <Copy text={item.title} />
                      </strong>{' '}
                    </>
                  )}
                  <Copy text={item.body} />
                </p>
              </li>
            ))}
          </List>
        </div>
      );
    }
    case 'quote':
      return <Quote className="block block-quote" text={block.text} attribution={block.attribution} />;
    case 'list': {
      const numbered = block.style !== 'bullets';
      const List = numbered ? 'ol' : 'ul';
      return (
        <div className="block block-list">
          {heading}
          <List className="block-list-items">
            {block.items.map((item, i) => (
              <ListLine key={i} item={item} number={numbered ? i + 1 : undefined} />
            ))}
          </List>
        </div>
      );
    }
    case 'table':
      return (
        <table className="block block-table">
          {block.heading !== undefined && <caption className="eyebrow block-heading"><Copy text={block.heading} /></caption>}
          {block.header && (
            <thead>
              <tr>
                {block.header.map((cell, i) => (
                  <th key={i} scope="col">
                    <Copy text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, i) => (
                  <td key={i}>
                    <Copy text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'columns':
      return (
        <div className="block block-columns">
          {block.columns.map((column, i) => (
            <div key={i} className="scene-card block-column">
              {column.heading !== undefined && (
                <BlockHeading level={level} className="block-column-heading">
                  <Copy text={column.heading} />
                </BlockHeading>
              )}
              <Blocks blocks={column.blocks} progress={progress} level={column.heading !== undefined ? 3 : level} />
            </div>
          ))}
        </div>
      );
    case 'mono':
      return (
        <figure className="block block-mono">
          {block.heading !== undefined && <figcaption><Copy text={block.heading} /></figcaption>}
          <pre>{block.text}</pre>
        </figure>
      );
    case 'stats':
      return (
        <div className="block block-stats">
          {heading}
          <ul className="block-stats-items">
            {block.items.map((item, i) => (
              <li key={i}>
                <span className="block-stat-value">
                  <Copy text={statValue(item, progress)} />
                </span>
                <span className="block-stat-caption">
                  <Copy text={item.caption} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'aside':
      return (
        <div className="block block-aside" role="note">
          <dfn className="block-aside-term">
            <Copy text={block.term} />
          </dfn>
          <p>
            <Copy text={block.text} />
          </p>
        </div>
      );
  }
}

/** A stats item's number, as copy: its value, or the module's score so far, "14 out of 14". */
function statValue(item: StatsItem, progress: ModuleProgress): string {
  if ('score' in item) return `${progress.score.raw} out of ${progress.score.max}`;
  return String(item.value);
}

/** One line of a list block: its number or marker, its tone's icon, its copy. */
function ListLine({ item, number }: { item: ListItem; number?: number }) {
  const { text, marker, tone } = typeof item === 'string' ? { text: item, marker: undefined, tone: undefined } : item;
  return (
    <li className="block-list-item" data-tone={tone}>
      {marker !== undefined ? (
        <span className="block-list-marker">
          <Copy text={marker} />
        </span>
      ) : (
        <span className="block-list-marker" aria-hidden="true">
          {number ?? '•'}
        </span>
      )}
      {tone === 'right' || tone === 'wrong' ? (
        <span className="block-list-tone">
          <ToneIcon tone={tone} label={tone} />
        </span>
      ) : (
        tone === 'neutral' && <span className="block-list-tone" aria-hidden="true" />
      )}
      <span className="block-list-text">
        <Copy text={text} />
      </span>
    </li>
  );
}
