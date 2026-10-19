import { useSyncExternalStore } from 'react';
import type { Statement } from '@xapi/xapi';
import type { Tracker } from './tracker.ts';

const NONE: readonly Statement[] = [];
const noSubscription = () => () => {};
const none = () => NONE;

/** The statements a preview tracker's in-memory store has received, oldest first; none with a launch. */
export function useStatements(tracker: Tracker): readonly Statement[] {
  const log = tracker.log;
  return useSyncExternalStore(log?.subscribe ?? noSubscription, log?.list ?? none);
}
