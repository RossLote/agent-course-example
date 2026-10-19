// What the content alone decides about ids and the box, derived in one place so the record
// store (.8), the statements (.9, .18) and the takeaway never derive it again.
import { BOX_WALLS, wallsAdded, type BoxWall, type ModuleWall, type Screen } from './schema.ts';

/**
 * A screen's activity path under the course id (D24, PLAN.md §6a), or null for a screen that
 * sends no statement of its own (scene, takeaway, and compare, whose two fridges each have
 * their own: fridgeActivityPath). A scored choose is a check, numbered among the module's
 * checks from 1: `modules/<nn>/checks/<n>`. Any other choose, and every chat, brief, match and
 * order: `modules/<nn>/interactions/<slug>`. A fridge screen: `fridge/<name>`.
 */
export function activityPath(module: { slug: string; screens: readonly Screen[] }, screen: Screen): string | null {
  switch (screen.type) {
    case 'scene':
    case 'takeaway':
    case 'compare':
      return null;
    case 'fridge':
      return fridgeActivityPath(screen.fridge);
    case 'choose':
      if (screen.scored) {
        const checks = module.screens.flatMap((s) => (s.type === 'choose' && s.scored ? [s.slug] : []));
        const n = checks.indexOf(screen.slug) + 1;
        if (n === 0) throw new Error(`module ${module.slug} has no check "${screen.slug}"`);
        return `${moduleActivityPath(module)}/checks/${n}`;
      }
      return `${moduleActivityPath(module)}/interactions/${screen.slug}`;
    case 'chat':
    case 'brief':
    case 'match':
    case 'order':
      return `${moduleActivityPath(module)}/interactions/${screen.slug}`;
  }
}

/** A module's activity path: `modules/<nn>`. */
export function moduleActivityPath(module: { slug: string }): string {
  return `modules/${module.slug}`;
}

/** A fridge's activity path: `fridge/<name>`, the same wherever the fridge is played. */
export function fridgeActivityPath(fridge: string): string {
  return `fridge/${fridge}`;
}

/** The full activity id: the course id (which ends with a slash) and a path from above. */
export function activityId(course: { id: string }, path: string): string {
  return course.id + path;
}

/** The box as a module's takeaway draws it. */
export interface BoxState {
  /** The walls drawn solid, in BOX_WALLS order; the rest are dashed. */
  walls: BoxWall[];
  /** The retro's ring round the box, from the module that adds it on. */
  ring: boolean;
}

/**
 * The box once the module `slug` is complete: the walls it adds (none, one or two) and every
 * earlier module's, and the ring once a module up to it has added the ring.
 */
export function boxAfter(modules: readonly { slug: string; wall: ModuleWall }[], slug: string): BoxState {
  const upTo = modules.findIndex((m) => m.slug === slug);
  if (upTo === -1) throw new Error(`no module "${slug}"`);
  const added = new Set(modules.slice(0, upTo + 1).flatMap((m) => wallsAdded(m.wall)));
  return {
    walls: BOX_WALLS.filter((w) => added.has(w)),
    ring: added.has('ring'),
  };
}
