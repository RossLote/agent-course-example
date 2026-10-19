// The course's progress store, made when this module is first imported: one per page load,
// loading this launch's State or this browser's localStorage copy (store.ts), and connected to
// the tracker so its changes send their statements (statements.ts), once per page load as
// `initialized` is. Import `progress` from here; the views and types from their own modules.
import { course } from '../content/index.ts';
import { launch, tracker } from '../xapi/index.ts';
import { connectStatements } from './statements.ts';
import { createProgressStore } from './store.ts';

/** The progress store for this page's lifetime. */
export const progress = createProgressStore(course, tracker);

connectStatements(progress, tracker, course, launch);
