import { useEffect, useRef } from 'react';
import { course } from './content/index.ts';
import { HomePage } from './course/home/HomePage.tsx';
import { ModulePage } from './course/ModulePage.tsx';
import { formatRoute, useRoute, type Route } from './course/route.ts';
import { ScenarioPage } from './course/scenario/ScenarioPage.tsx';

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

/** The course: the scenario, the home page, or a module, by the route in the hash. */
export default function App() {
  const route = useRoute();
  useFocusHeadingOnNavigate(route);

  if (route.page === 'module') {
    const module = course.modules.find((m) => m.slug === route.slug);
    if (module) return <ModulePage courseTitle={course.title} module={module} screen={route.screen} />;
  }
  if (route.page === 'scenario') return <ScenarioPage course={course} />;
  return <HomePage course={course} />;
}
