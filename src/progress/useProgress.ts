import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { Module } from '../content/index.ts';
import type { EventSource } from '../course/frame/progress.ts';
import type { ScreenEvent } from '../screens/types.ts';
import type { ProgressDoc } from './progress.ts';
import type { ProgressStore } from './store.ts';

export interface Progress {
  /** The learner's progress document. */
  doc: ProgressDoc;
  /** Takes in an event from a screen of a module, as the frame passes it on. Stable across renders. */
  onEvent: (event: ScreenEvent, source: EventSource) => void;
}

/** The store's document for rendering, and the frame's event callback into it. */
export function useProgress(store: ProgressStore): Progress {
  const doc = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const onEvent = useCallback((event: ScreenEvent, { module, screen }: EventSource) => store.take({ type: 'event', event, module, screen }), [store]);
  return { doc, onEvent };
}

/** Records a visit to a module's screen (from 1) whenever the one shown changes; nothing when no module is shown. */
export function useVisit(store: ProgressStore, module: Module | undefined, screen: number): void {
  useEffect(() => {
    if (module) store.take({ type: 'visit', module, screen });
  }, [store, module, screen]);
}
