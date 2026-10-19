import { useId } from 'react';
import { BOX_WALLS, type BoxWall, type Course } from '../../content/index.ts';
import { Copy } from '../../screens/scene/Copy.tsx';
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

// Wall i is turned 360° / n × i about the centre, top first, clockwise: four walls make a
// square. Each wall stops short of the corners, so the box reads as four walls, not an outline.
const APOTHEM = 104;
const WALL_LENGTH = 2 * APOTHEM * Math.tan(Math.PI / BOX_WALLS.length) * 0.8;
// The top and bottom walls' labels sit centred beyond their wall; the side walls' labels
// start just outside their wall and run outwards, inside the drawing's width.
const LABEL_RADIUS = APOTHEM + 30;
const SIDE_LABEL_RADIUS = APOTHEM + 12;
const HALF_WIDTH = 215;
const RING_RADIUS = 170;

/**
 * How many walls the box has, in words, for the text alternative; keyed by BOX_WALLS' length, so
 * a box with another number of walls does not type-check until its word is given.
 */
const ALL_WALLS = ({ 4: 'four' } satisfies Record<typeof BOX_WALLS.length, string>)[BOX_WALLS.length];

/** What the diagram shows, in words: its text alternative. */
function describeBox({ labels, centre, walls, ring }: BoxDiagramProps): string {
  const up = BOX_WALLS.filter((w) => walls.includes(w)).map((w) => labels.walls[w]);
  const dashed = BOX_WALLS.filter((w) => !walls.includes(w)).map((w) => labels.walls[w]);
  const parts = [`The box round ${centre ?? labels.centre}.`];
  if (up.length === 0) parts.push(`No wall is up yet; all ${ALL_WALLS} are dashed: ${dashed.join(', ')}.`);
  else if (dashed.length === 0) parts.push(`All ${ALL_WALLS} walls are up: ${up.join(', ')}.`);
  else parts.push(`Walls up: ${up.join(', ')}. Still dashed: ${dashed.join(', ')}.`);
  if (ring) parts.push(`A ring is drawn round it: ${labels.ring}.`);
  return parts.join(' ');
}

/** The course's through-line: the walls round the builder, each dashed or solid, and the ring. */
export function BoxDiagram(props: BoxDiagramProps) {
  const { labels, centre, walls, ring, caption } = props;
  const titleId = useId();
  const top = ring ? -(RING_RADIUS + 8) : -(LABEL_RADIUS + 14);
  const bottom = ring ? RING_RADIUS + 22 : LABEL_RADIUS + 14;
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
          const radius = side ? SIDE_LABEL_RADIUS : LABEL_RADIUS;
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
      {caption !== undefined && <figcaption className="box-caption"><Copy text={caption} /></figcaption>}
    </figure>
  );
}
