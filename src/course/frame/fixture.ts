// An inline course for the frame's and the screens' tests (PLAN.md §6, "Test fixtures"):
// never the files under content/, so the tests hold whatever the content says. Beside it, the
// empty progress a screen is rendered with, a fridge, and the screens more than one test plays.
// A test that needs the real course reads it from content/index.ts and builds what it expects
// from what it reads (its counts, slugs and points), never from a module's copy or screen list.
import type { Course, Fridge, Module, Screen, ScreenOf } from '../../content/index.ts';
import { moduleWall } from '../../content/schema.ts';
import type { ModuleProgress } from '../../screens/types.ts';
import { NO_ANSWERS } from './progress.ts';

const WALLS = moduleWall.options;

/** The progress of a module nothing has been answered in: what a screen's test renders it with. */
export const NO_PROGRESS: ModuleProgress = { items: NO_ANSWERS, score: { raw: 0, max: 0 } };

/** A module with these screens; its title is "Module <nn> title" and its wall the course's order. */
export function fixtureModule(slug: string, screens: Screen[]): Module {
  return {
    slug,
    title: `Module ${slug} title`,
    minutes: 5,
    wall: WALLS[Number(slug)] ?? 'none',
    wallLabel: `wall of ${slug}`,
    blurb: `The blurb of ${slug}.`,
    file: `modules/${slug}.yaml`,
    screens,
  };
}

/** A takeaway screen, the last of every module. */
export function fixtureTakeaway(text = 'The takeaway card.'): Screen {
  return { type: 'takeaway', text, caption: 'The box caption.' };
}

/**
 * The course: eight modules 00 to 07 walled as the real one is (none, the five walls, the ring,
 * all), each a scene and its takeaway unless `modules` gives some of them by slug.
 */
export function fixtureCourse(modules: Readonly<Record<string, Screen[]>> = {}): Course {
  return {
    id: 'https://example.org/course/',
    title: 'Course title',
    description: 'The description.',
    box: {
      centre: 'the builder',
      walls: { record: 'R wall', done: 'D wall', gate: 'G wall', agents: 'A wall', evidence: 'E wall' },
      ring: 'the ring',
    },
    scenario: {
      label: 'The scenario',
      role: 'Your role',
      heading: 'The scenario heading.',
      memo: { from: 'the client', date: 'Monday', subject: 'A subject', body: ['The memo.'] },
      lines: [
        { title: 'One.', text: 'First.' },
        { title: 'Two.', text: 'Second.' },
        { title: 'Three.', text: 'Third.' },
      ],
      button: 'Take the job',
      note: 'A note.',
    },
    home: {
      meta: 'Eight modules',
      leave: 'Leave any time',
      eyebrow: 'Remember',
      heading: 'The home heading.',
      quote: { text: 'A quote.', attribution: 'Someone' },
      line: 'A line.',
      start: 'Start',
      scenarioLink: 'The scenario again',
      box: { centre: 'the agent', caption: 'An open box.' },
      modulesHeading: 'The modules',
    },
    modules: WALLS.map((_, i) => {
      const slug = `0${i}`;
      return fixtureModule(slug, modules[slug] ?? [{ type: 'scene', heading: `Scene of ${slug}`, blocks: [{ type: 'paragraph', text: 'Text.' }] }, fixtureTakeaway()]);
    }),
    fridges: {},
  };
}

/** A fridge for the tests that need one by name: two shelves, one item, no timer or leaderboard. */
export function fixtureFridge(title = 'A fridge'): Fridge {
  return {
    title,
    caption: 'The caption.',
    shelves: [
      { id: 'top', name: 'Top shelf' },
      { id: 'bottom', name: 'Bottom shelf' },
    ],
    items: [{ id: 'raw-chicken', name: 'Raw chicken', shelf: 'bottom', reason: 'Raw meat goes at the bottom.' }],
    feedback: 'reason',
    score: { mode: 'right-first-time' },
    timer: 'none',
    leaderboard: 'none',
    confetti: false,
    finish: '{right} out of {total} right first time',
    resetLabel: 'Try again',
  };
}

/** An order of eight cards, retro fifth in the start order, so four start in the right place. */
export const fixtureOrder: ScreenOf<'order'> = {
  type: 'order',
  slug: 'order-the-loop',
  heading: 'Order the loop',
  cards: [
    { id: 'brief', label: 'Brief: the agent asks, you decide.', feedback: 'The brief comes first.' },
    { id: 'epic', label: 'Epic: the pieces and the demo script.', feedback: 'The epic comes after the brief.' },
    { id: 'epic-review', label: 'Epic review: gaps found early.', feedback: 'The epic review comes before the build.' },
    { id: 'build', label: 'Build: workers in their boxes.', feedback: 'The build comes after the epic review.' },
    { id: 'reviews', label: 'Simplify, review, adversarial review.', feedback: 'The reviews come once the build is green.' },
    { id: 'pull-request', label: 'Walkthrough and pull request.', feedback: 'The pull request comes after the reviews.' },
    { id: 'judge', label: 'You judge it: evidence against the acceptance.', feedback: 'You judge once the pull request is written.' },
    { id: 'retro', label: 'Retro, over several runs.', feedback: 'The retro comes last.' },
  ],
  start: ['brief', 'epic', 'epic-review', 'build', 'retro', 'reviews', 'pull-request', 'judge'],
  checkLabel: 'Check the order',
};

/** An unscored match: four rows, each picking one of four targets. */
export const fixtureMatch: ScreenOf<'match'> = {
  type: 'match',
  slug: 'who-catches-it',
  scored: false,
  heading: 'Who catches it?',
  prompt: 'Match each to the layer that catches it.',
  targets: [
    { id: 'simplify', label: 'Simplify' },
    { id: 'review', label: 'Review' },
    { id: 'adversarial', label: 'Adversarial review' },
    { id: 'epic', label: 'None of the reviews: the epic' },
  ],
  rows: [
    { text: 'Three copies of the same code, one per shelf.', key: 'simplify', feedback: 'Simplify (reuse).' },
    { text: 'A message names the wrong shelf.', key: 'review', feedback: 'Review (obvious).' },
    { text: 'A drop during a message is silently lost.', key: 'adversarial', feedback: 'Adversarial review (a scenario, verified).' },
    { text: 'A timer was built that the record said no to.', key: 'epic', feedback: 'None of the reviews: the epic.' },
  ],
  checkLabel: 'Check my matches',
};
