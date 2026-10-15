import type { Course, ModuleEntry } from '../../content/index.ts';
import type { HomeNext, ModuleStatus } from '../../progress/progress.ts';
import { BoxDiagram } from '../box/BoxDiagram.tsx';
import { formatRoute, type Route } from '../route.ts';
import { TopBar } from '../TopBar.tsx';
import { continueLabel, doneLabel, reviewLabel, STATUS_LABELS } from './labels.ts';
import './HomePage.css';

/** What a module card shows: course.yaml's entry for the module. */
export type HomeModule = Pick<ModuleEntry, 'slug' | 'title' | 'minutes' | 'wallLabel' | 'blurb'>;

export interface ModuleCardProps {
  module: HomeModule;
  /** Where the learner is with the module; not started until progress says otherwise. */
  status?: ModuleStatus;
}

/** One module on the home page, a link that opens it at its first screen. */
export function ModuleCard({ module, status = 'not-started' }: ModuleCardProps) {
  return (
    <a className="module-card" href={formatRoute({ page: 'module', slug: module.slug, screen: 1 })}>
      <span className="module-card-number">
        {module.slug} · {module.minutes} min
      </span>
      <h3>{module.title}</h3>
      <span className="module-card-wall">{module.wallLabel}</span>
      <span className="muted small">{module.blurb}</span>
      <span className="module-card-status" data-status={status}>
        {STATUS_LABELS[status]}
      </span>
    </a>
  );
}

export interface HomePageProps {
  /** course.yaml's title, box labels, home page copy and modules. */
  course: Pick<Course, 'title' | 'box' | 'home'> & { modules: readonly HomeModule[] };
  /** How many modules are complete: the top bar reads "n of m done" from one, course.yaml's `home.meta` before. */
  done?: number;
  /** Each module card's status, by module slug; a card left out reads "Not started". */
  statuses?: Readonly<Record<string, ModuleStatus>>;
  /** Where the primary button goes (src/progress/progress.ts, homeNext); the first module when left out. */
  next?: HomeNext;
}

/** The primary button's label and where it goes, or null when the course has no modules. */
function primary(course: HomePageProps['course'], next: HomeNext): { label: string; route: Route } | null {
  const first = course.modules[0];
  if (!first) return null;
  switch (next.action) {
    case 'start':
      return { label: course.home.start, route: { page: 'module', slug: first.slug, screen: 1 } };
    case 'continue':
      return { label: continueLabel(next.slug), route: { page: 'module', slug: next.slug, screen: next.screen } };
    case 'review':
      return { label: reviewLabel(first.slug), route: { page: 'module', slug: first.slug, screen: 1 } };
  }
}

/** The course home: the thesis, the open box, and every module, any of which opens (D22). */
export function HomePage({ course, done = 0, statuses = {}, next = { action: 'start' } }: HomePageProps) {
  const { home, modules } = course;
  const button = primary(course, next);
  return (
    <div className="page">
      <TopBar title={course.title} subtitle={done > 0 ? doneLabel(done, modules.length) : home.meta}>
        {home.leave}
      </TopBar>
      <main className="page-main home">
        <section className="home-hero">
          <div className="home-thesis">
            <p className="eyebrow">{home.eyebrow}</p>
            <h1>{home.heading}</h1>
            <figure className="home-quote">
              <blockquote>
                <p>“{home.quote.text}”</p>
              </blockquote>
              <figcaption>{home.quote.attribution}</figcaption>
            </figure>
            <p className="home-line">{home.line}</p>
            <div className="home-actions">
              {button && (
                <a className="btn btn-primary" href={formatRoute(button.route)}>
                  {button.label}
                </a>
              )}
              <a className="btn btn-ghost" href={formatRoute({ page: 'scenario' })}>
                {home.scenarioLink}
              </a>
            </div>
          </div>
          <div className="home-box">
            <BoxDiagram labels={course.box} centre={home.box.centre} walls={[]} ring={false} caption={home.box.caption} />
          </div>
        </section>

        <section className="home-modules" aria-labelledby="home-modules-heading">
          <h2 id="home-modules-heading">{home.modulesHeading}</h2>
          <ul className="home-module-list">
            {modules.map((module) => (
              <li key={module.slug}>
                <ModuleCard module={module} status={statuses[module.slug]} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
