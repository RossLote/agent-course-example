// The home page's progress words. course.yaml has `home.start` for the primary button before
// anything is reached; the rest have no field yet, so they are fixed here, named, for a later
// round to move into the content.
import type { ModuleStatus } from '../../progress/progress.ts';

/** A module card's status. */
export const STATUS_LABELS: Readonly<Record<ModuleStatus, string>> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  done: 'Done',
};

/** The primary button while the course is under way: the first module not complete. */
export const continueLabel = (slug: string) => `Continue module ${slug}`;

/** The primary button once every module is complete. */
export const reviewLabel = (slug: string) => `Review from module ${slug}`;

/** The top bar's subtitle once a module is complete. */
export const doneLabel = (done: number, total: number) => `${done} of ${total} done`;
