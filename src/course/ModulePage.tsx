import type { ModuleEntry } from '../content/index.ts';
import { formatRoute } from './route.ts';
import { TopBar } from './TopBar.tsx';

export interface ModulePageProps {
  courseTitle: string;
  module: Pick<ModuleEntry, 'slug' | 'title'>;
  /** The screen the route names, counting from 1. */
  screen: number;
}

/** A module's route until bead .16's frame takes it over: the module, the screen, a way home. */
export function ModulePage({ courseTitle, module, screen }: ModulePageProps) {
  return (
    <div className="page">
      <TopBar title={courseTitle} subtitle={`Module ${module.slug} · ${module.title}`} />
      <main className="page-main" style={{ maxWidth: 880, gap: 24 }}>
        <h1>{module.title}</h1>
        <p>Screen {screen}</p>
        <p>
          <a className="btn btn-ghost" href={formatRoute({ page: 'home' })}>
            Home
          </a>
        </p>
      </main>
    </div>
  );
}
