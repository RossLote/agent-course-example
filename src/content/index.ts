// The course's content: every YAML file under content/, parsed at build time by the YAML
// plugin in vite.config.ts (nothing is fetched at run time) and validated when this module is
// first imported, so a bad file stops the app at startup with the same message the unit test
// shows. Import `course` from here; never import a YAML file anywhere else.
import { validateContent } from './validate.ts';

const globbed = import.meta.glob<unknown>(['../../content/course.yaml', '../../content/modules/*.yaml', '../../content/fridge/*.yaml'], {
  eager: true,
  import: 'default',
});

/** Every parsed file under content/, keyed by its path under content/ ("modules/00.yaml"). */
export const contentFiles: Readonly<Record<string, unknown>> = Object.fromEntries(
  Object.entries(globbed).map(([path, data]) => [path.replace('../../content/', ''), data]),
);

/** The validated course: course.yaml, its eight modules in order, and the fridges by name. */
export const course = validateContent(contentFiles);

export { ContentError, validateContent } from './validate.ts';
export { activityId, activityPath, boxAfter, fridgeActivityPath, moduleActivityPath, type BoxState } from './ids.ts';
export { BOX_WALLS } from './schema.ts';
export type { Block, BoxWall, Course, Fridge, ListItem, Module, ModuleEntry, ModuleWall, Screen, ScreenOf, ScreenType, StatsItem } from './schema.ts';
