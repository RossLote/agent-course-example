// Where the modules' answers live until the progress store (.9) arrives: React state held by
// App for the session, so moving between screens or leaving a module and reopening it keeps
// them. .9 replaces this hook with its store; the frame and the screens only ever see
// `answers` and `onEvent`, so neither changes.
import { useCallback, useState } from 'react';
import type { Module, Screen } from '../../content/index.ts';
import type { ModuleAnswers, ScreenEvent } from '../../screens/types.ts';
import { recordEvent } from './progress.ts';

/** Where an event came from: what the frame adds to a screen's event. */
export interface EventSource {
  module: Module;
  screen: Screen;
}

export interface CourseAnswers {
  /** Every module's answers, by module slug; a module with none is left out. */
  answers: Readonly<Record<string, ModuleAnswers>>;
  /** Takes in an event from a screen of a module. Stable across renders. */
  onEvent: (event: ScreenEvent, source: EventSource) => void;
}

/** The course's answers for this session, in React state. */
export function useCourseAnswers(): CourseAnswers {
  const [answers, setAnswers] = useState<Readonly<Record<string, ModuleAnswers>>>({});
  const onEvent = useCallback((event: ScreenEvent, { module }: EventSource) => {
    setAnswers((all) => {
      const before = all[module.slug] ?? {};
      const after = recordEvent(before, event);
      return after === before ? all : { ...all, [module.slug]: after };
    });
  }, []);
  return { answers, onEvent };
}
