import type { ReactNode } from 'react';
import type { Course, ModuleEntry } from '../../content/index.ts';
import type { HomeNext, ModuleStatus } from '../../progress/progress.ts';
import { Quote } from '../../screens/parts/Quote.tsx';
import { Copy } from '../../screens/scene/Copy.tsx';
import { ToneIcon } from '../../screens/parts/Tone.tsx';
import { BoxDiagram } from '../box/BoxDiagram.tsx';
import { formatRoute } from '../route.ts';
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

/** A half-filled ring: under way. Decorative; the pill's words say the status. */
function GoingIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" focusable="false" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
    </svg>
  );
}

/** The status pill in a card's top row: an icon (done, under way) and the words, never colour alone (D14). */
function StatusPill({ status }: { status: ModuleStatus }) {
  return (
    <span className="module-card-status" data-status={status}>
      {status === 'done' && <ToneIcon tone="right" />}
      {status === 'in-progress' && <GoingIcon />}
      {STATUS_LABELS[status]}
    </span>
  );
}

/** One module on the home page, a link that opens it at its first screen; a done one has a green border. */
export function ModuleCard({ module, status = 'not-started' }: ModuleCardProps) {
  return (
    <a className="module-card" data-status={status} href={formatRoute({ page: 'module', slug: module.slug, screen: 1 })}>
      <span className="module-card-head">
        <span className="module-card-number">
          {module.slug} · {module.minutes} min
        </span>
        <StatusPill status={status} />
      </span>
      <h3>
        <Copy text={module.title} />
      </h3>
      <span className="module-card-wall">
        <Copy text={module.wallLabel} />
      </span>
      <span className="muted small">
        <Copy text={module.blurb} />
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
  /** Where the primary button goes (src/progress/progress.ts, homeNext); start the first module when left out. */
  next?: HomeNext;
}

/** The primary button's label. */
function primaryLabel(course: HomePageProps['course'], next: HomeNext): ReactNode {
  switch (next.action) {
    case 'start':
      return <Copy text={course.home.start} />;
    case 'continue':
      return continueLabel(next.slug);
    case 'review':
      return reviewLabel(next.slug);
  }
}

/** The course home: the thesis, the open box, and every module, any of which opens (D22). */
export function HomePage({ course, done = 0, statuses = {}, next = { action: 'start', slug: course.modules[0].slug, screen: 1 } }: HomePageProps) {
  const { home, modules } = course;
  return (
    <div className="page">
      <TopBar title={course.title} subtitle={done > 0 ? doneLabel(done, modules.length) : <Copy text={home.meta} />}>
        <Copy text={home.leave} />
      </TopBar>
      <main className="page-main home">
        <section className="home-hero">
          <div className="home-thesis">
            <p className="eyebrow">
              <Copy text={home.eyebrow} />
            </p>
            <h1>
              <Copy text={home.heading} />
            </h1>
            <Quote className="home-quote" text={home.quote.text} attribution={home.quote.attribution} />
            <p className="home-line">
              <Copy text={home.line} />
            </p>
            <div className="home-actions">
              <a className="btn btn-primary" href={formatRoute({ page: 'module', slug: next.slug, screen: next.screen })}>
                {primaryLabel(course, next)}
              </a>
              <a className="btn btn-ghost" href={formatRoute({ page: 'scenario' })}>
                <Copy text={home.scenarioLink} />
              </a>
            </div>
          </div>
          <div className="home-box">
            <BoxDiagram labels={course.box} centre={home.box.centre} walls={[]} ring={false} caption={home.box.caption} />
          </div>
        </section>

        <section className="home-modules" aria-labelledby="home-modules-heading">
          <h2 id="home-modules-heading">
            <Copy text={home.modulesHeading} />
          </h2>
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
