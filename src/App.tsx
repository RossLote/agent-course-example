import { useEffect, useRef } from 'react';
import { course } from './content/index.ts';
import { HomePage } from './course/home/HomePage.tsx';
import { ModuleFrame } from './course/frame/ModuleFrame.tsx';
import { formatRoute, useRoute, type Route } from './course/route.ts';
import { ScenarioPage } from './course/scenario/ScenarioPage.tsx';
import { progress } from './progress/index.ts';
import { homeNext, moduleAnswers, modulesDone, moduleStatus } from './progress/progress.ts';
import type { ProgressStore } from './progress/store.ts';
import { useProgress, useVisit } from './progress/useProgress.ts';

/**
 * After a navigation, focus moves to the new page's heading, so a keyboard or screen reader
 * user starts at the top of what changed; the page as first loaded is left alone.
 */
function useFocusHeadingOnNavigate(route: Route) {
  const key = formatRoute(route);
  const previous = useRef(key);
  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    const heading = document.querySelector<HTMLElement>('main h1');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus();
  }, [key]);
}

export interface AppProps {
  /** The learner's progress; the course's own store unless a test gives one. */
  store?: ProgressStore;
}

/**
 * The course: the scenario, the home page, or a module, by the route in the hash. Progress
 * comes from the store: the frame's events go into it, every module screen shown is recorded
 * as reached, and the home page shows each module's status and where to go on.
 */
export default function App({ store = progress }: AppProps) {
  const route = useRoute();
  useFocusHeadingOnNavigate(route);
  const { doc, onEvent } = useProgress(store);
  const module = route.page === 'module' ? course.modules.find((m) => m.slug === route.slug) : undefined;
  useVisit(store, module, route.page === 'module' ? route.screen : 1);

  if (route.page === 'module' && module) {
    return <ModuleFrame course={course} module={module} screen={route.screen} answers={moduleAnswers(doc, module.slug)} onEvent={onEvent} />;
  }
  if (route.page === 'scenario') return <ScenarioPage course={course} />;
  const statuses = Object.fromEntries(course.modules.map((m) => [m.slug, moduleStatus(doc, m.slug)]));
  return <HomePage course={course} done={modulesDone(course, doc)} statuses={statuses} next={homeNext(course, doc)} />;
}
