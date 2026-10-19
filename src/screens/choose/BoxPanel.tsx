import { useId } from 'react';
import { fillTemplate, plainText } from '../../content/copy.ts';
import type { ScreenOf } from '../../content/index.ts';
import { Copy } from '../scene/Copy.tsx';

type Box = NonNullable<ScreenOf<'choose'>['box']>;

// The box is a regular polygon with a side per wall (a square for four), its bottom side level,
// round the builder in the middle.
const SIZE = 300;
const CENTRE = SIZE / 2;
const RADIUS = 126;

/** The corners of the box, from the one before the first side, clockwise. */
function corners(sides: number): [number, number][] {
  const start = Math.PI / 2 + Math.PI / sides;
  return Array.from({ length: sides }, (_, i) => {
    const angle = start + (i * 2 * Math.PI) / sides;
    return [CENTRE + RADIUS * Math.cos(angle), CENTRE + RADIUS * Math.sin(angle)];
  });
}

/** The box in words, its text alternative (plain text, as a title is): the walls up and the walls still down. */
function describe(box: Box, up: ReadonlySet<string>): string {
  const raised = box.walls.filter((w) => up.has(w.id)).map((w) => plainText(w.label));
  const down = box.walls.filter((w) => !up.has(w.id)).map((w) => plainText(w.label));
  const parts = [`The box round ${plainText(box.builder.title)}: ${raised.length} of ${box.walls.length} walls up.`];
  if (raised.length > 0) parts.push(`Up: ${raised.join('; ')}.`);
  if (down.length > 0) parts.push(`Not up: ${down.join('; ')}.`);
  return parts.join(' ');
}

/**
 * The box panel beside a choose's options (module 03): each wall the ticked options name is
 * drawn solid, the rest dashed, with the caption counting them. A wall counts once however many
 * options draw it. The box is the screen's own walls, not the course's five.
 */
export function BoxPanel({ box, up }: { box: Box; up: ReadonlySet<string> }) {
  const titleId = useId();
  const points = corners(Math.max(box.walls.length, 3));
  const count = box.walls.filter((w) => up.has(w.id)).length;
  const caption = fillTemplate(box.caption, { up: count, total: box.walls.length });
  return (
    <figure className="choose-box">
      <svg className="choose-box-drawing" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-labelledby={titleId}>
        <title id={titleId}>{describe(box, up)}</title>
        <rect className="choose-box-builder" x={CENTRE - 70} y={CENTRE - 42} width={140} height={84} rx={12} />
        <text className="choose-box-title" x={CENTRE} y={box.builder.subtitle === undefined ? CENTRE : CENTRE - 10}>
          {plainText(box.builder.title)}
        </text>
        {box.builder.subtitle !== undefined && (
          <text className="choose-box-subtitle" x={CENTRE} y={CENTRE + 14}>
            {plainText(box.builder.subtitle)}
          </text>
        )}
        {box.walls.map((wall, i) => {
          const [x1, y1] = points[i];
          const [x2, y2] = points[(i + 1) % points.length];
          return (
            <g key={wall.id} className="choose-box-wall" data-wall={wall.id} data-state={up.has(wall.id) ? 'up' : 'down'}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r={13} />
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2}>
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      {/* The drawing's title already says this; the key is for the eye. */}
      <ol className="choose-box-key" aria-hidden="true">
        {box.walls.map((wall, i) => (
          <li key={wall.id} data-state={up.has(wall.id) ? 'up' : 'down'}>
            <span className="choose-box-key-number">{i + 1}</span>
            <Copy text={wall.label} />
          </li>
        ))}
      </ol>
      <figcaption className="muted small choose-box-caption" aria-live="polite">
        <Copy text={caption} />
      </figcaption>
    </figure>
  );
}
