import { useId } from 'react';
import { BOX_WALLS, type BoxWall, type Course } from '../../content/index.ts';
import './BoxDiagram.css';

export interface BoxDiagramProps {
  /** The labels it is drawn with: course.yaml's `box`. */
  labels: Course['box'];
  /** The label in the middle when it is not `labels.centre` (the home page's "the agent"). */
  centre?: string;
  /** The walls drawn solid; the rest are dashed. `boxAfter()` gives these and `ring`. */
  walls: readonly BoxWall[];
  /** The retro's ring round the whole box. */
  ring: boolean;
  /** The line under the box. */
  caption?: string;
}

// The pentagon: wall i is turned 72° × i about the centre, top first, clockwise.
const APOTHEM = 112;
const WALL_LENGTH = 128;
const LABEL_RADIUS = 146;
// The two lower walls slope towards their labels, so those labels sit further out; the two
// side walls' labels start just outside the wall and run outwards.
const LOWER_LABEL_RADIUS = 158;
const SIDE_LABEL_RADIUS = 122;
const HALF_WIDTH = 210;
const RING_RADIUS = 178;

/** What the diagram shows, in words: its text alternative. */
function describeBox({ labels, centre, walls, ring }: BoxDiagramProps): string {
  const up = BOX_WALLS.filter((w) => walls.includes(w)).map((w) => labels.walls[w]);
  const dashed = BOX_WALLS.filter((w) => !walls.includes(w)).map((w) => labels.walls[w]);
  const parts = [`The box round ${centre ?? labels.centre}.`];
  if (up.length === 0) parts.push(`No wall is up yet; all five are dashed: ${dashed.join(', ')}.`);
  else if (dashed.length === 0) parts.push(`All five walls are up: ${up.join(', ')}.`);
  else parts.push(`Walls up: ${up.join(', ')}. Still dashed: ${dashed.join(', ')}.`);
  if (ring) parts.push(`A ring is drawn round it: ${labels.ring}.`);
  return parts.join(' ');
}

/** The course's through-line: five walls round the builder, each dashed or solid, and the ring. */
export function BoxDiagram(props: BoxDiagramProps) {
  const { labels, centre, walls, ring, caption } = props;
  const titleId = useId();
  const top = ring ? -(RING_RADIUS + 8) : -(LABEL_RADIUS + 14);
  const bottom = ring ? RING_RADIUS + 22 : LOWER_LABEL_RADIUS - 10;
  return (
    <figure className="box">
      <svg
        className="box-drawing"
        viewBox={`${-HALF_WIDTH} ${top} ${2 * HALF_WIDTH} ${bottom - top}`}
        role="img"
        aria-labelledby={titleId}
        data-ring={ring}
      >
        <title id={titleId}>{describeBox(props)}</title>
        {ring && (
          <g className="box-ring">
            <circle r={RING_RADIUS} />
            <text y={RING_RADIUS + 10}>{labels.ring}</text>
          </g>
        )}
        <circle className={walls.length > 0 ? 'box-centre box-centre-held' : 'box-centre'} r={48} />
        <text className="box-centre-label">{centre ?? labels.centre}</text>
        {BOX_WALLS.map((wall, i) => {
          const solid = walls.includes(wall);
          const degrees = (i * 360) / BOX_WALLS.length;
          const radians = (degrees * Math.PI) / 180;
          const side = Math.abs(Math.sin(radians)) > 0.9;
          const radius = side ? SIDE_LABEL_RADIUS : Math.cos(radians) < 0 ? LOWER_LABEL_RADIUS : LABEL_RADIUS;
          return (
            <g key={wall} className="box-wall" data-wall={wall} data-state={solid ? 'solid' : 'dashed'}>
              <rect
                transform={`rotate(${degrees})`}
                x={-WALL_LENGTH / 2}
                y={-APOTHEM - (solid ? 5 : 4)}
                width={WALL_LENGTH}
                height={solid ? 10 : 8}
                rx={solid ? 5 : 4}
              />
              <text
                x={radius * Math.sin(radians)}
                y={-radius * Math.cos(radians)}
                style={side ? { textAnchor: Math.sin(radians) > 0 ? 'start' : 'end' } : undefined}
              >
                {labels.walls[wall]}
              </text>
            </g>
          );
        })}
      </svg>
      {caption !== undefined && <figcaption className="box-caption">{caption}</figcaption>}
    </figure>
  );
}
