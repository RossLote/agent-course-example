import type { ReactNode } from 'react';
import type { Course, ModuleEntry } from '../../content/index.ts';
import { BoxDiagram } from '../box/BoxDiagram.tsx';
import { formatRoute } from '../route.ts';
import { TopBar } from '../TopBar.tsx';
import './HomePage.css';

/** What a module card shows: course.yaml's entry for the module. */
export type HomeModule = Pick<ModuleEntry, 'slug' | 'title' | 'minutes' | 'wallLabel' | 'blurb'>;

export interface ModuleCardProps {
  module: HomeModule;
  /** Where the learner is with the module; "Not started" until progress says otherwise. */
  status?: ReactNode;
}

/** One module on the home page, a link that opens it at its first screen. */
export function ModuleCard({ module, status = 'Not started' }: ModuleCardProps) {
  return (
    <a className="module-card" href={formatRoute({ page: 'module', slug: module.slug, screen: 1 })}>
      <span className="module-card-number">
        {module.slug} · {module.minutes} min
      </span>
      <h3>{module.title}</h3>
      <span className="module-card-wall">{module.wallLabel}</span>
      <span className="muted small">{module.blurb}</span>
      <span className="module-card-status">{status}</span>
    </a>
  );
}

export interface HomePageProps {
  /** course.yaml's title, box labels, home page copy and modules. */
  course: Pick<Course, 'title' | 'box' | 'home'> & { modules: readonly HomeModule[] };
  /** The top bar's subtitle; course.yaml's `home.meta` when left out. */
  subtitle?: ReactNode;
  /** Each module card's status, by module slug; a card left out reads "Not started". */
  statuses?: Readonly<Record<string, ReactNode>>;
}

/** The course home: the thesis, the open box, and every module, any of which opens (D22). */
export function HomePage({ course, subtitle, statuses = {} }: HomePageProps) {
  const { home, modules } = course;
  return (
    <div className="page">
      <TopBar title={course.title} subtitle={subtitle ?? home.meta}>
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
              {modules.length > 0 && (
                <a className="btn btn-primary" href={formatRoute({ page: 'module', slug: modules[0].slug, screen: 1 })}>
                  {home.start}
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
