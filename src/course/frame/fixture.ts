// An inline course for the frame's and the screens' tests (PLAN.md §6, "Test fixtures"):
// never the files under content/, so the tests hold whatever the content says. Beside it, the
// empty progress a screen is rendered with, and `realScreen` for the tests that play a screen
// as authored.
import { course, type Course, type Module, type Screen, type ScreenOf, type ScreenType } from '../../content/index.ts';
import { moduleWall } from '../../content/schema.ts';
import type { ModuleProgress } from '../../screens/types.ts';
import { NO_ANSWERS } from './progress.ts';

const WALLS = moduleWall.options;

/** The progress of a module nothing has been answered in: what a screen's test renders it with. */
export const NO_PROGRESS: ModuleProgress = { items: NO_ANSWERS, score: { raw: 0, max: 0 } };

/** A screen of the real course, as authored, and its module: the first of `type` in the module, or the one with `slug`. */
export function realScreen<T extends ScreenType>(moduleSlug: string, type: T, slug?: string): { module: Module; screen: ScreenOf<T> } {
  const module = course.modules.find((m) => m.slug === moduleSlug);
  const screen = module?.screens.find((s): s is ScreenOf<T> => s.type === type && (slug === undefined || ('slug' in s && s.slug === slug)));
  if (!module || !screen) throw new Error(`module ${moduleSlug} has no ${type} ${slug ?? ''}`);
  return { module, screen };
}

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
