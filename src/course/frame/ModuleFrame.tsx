import { useCallback, useEffect, useId, useMemo } from 'react';
import type { Course, Module, Screen } from '../../content/index.ts';
import { Blocks } from '../../screens/scene/Blocks.tsx';
import { Copy } from '../../screens/scene/Copy.tsx';
import type { ModuleAnswers, ScreenEvent } from '../../screens/types.ts';
import { formatRoute, navigate, type Route } from '../route.ts';
import { TopBar } from '../TopBar.tsx';
import { answerKey, awaitsAnswer, moduleProgress, shownScreen, type EventSource } from './progress.ts';
import { ScreenView } from './ScreenView.tsx';
import './ModuleFrame.css';

const HOME: Route = { page: 'home' };

export interface ModuleFrameProps {
  course: Course;
  module: Module;
  /**
   * The screen the route names, counting from 1; one past the last shows the last, and one past
   * the first scored screen still unanswered shows that screen (shownScreen).
   */
  screen: number;
  /** The module's answers so far, by slug. */
  answers: ModuleAnswers;
  /** The progress store's generation (store.ts, getGeneration): the screen remounts when it changes. */
  generation?: number;
  /** Takes every event the screen reports, with the module and screen it came from. */
  onEvent: (event: ScreenEvent, source: EventSource) => void;
}

/** A screen's name on the Next button before it: its `nav`, else its heading (copy, rendered with Copy). */
function screenName(screen: Screen): string {
  return screen.nav ?? (screen.type === 'takeaway' ? 'takeaway' : screen.heading);
}

/** One dot per module, the current one marked, read out as "Module n of m". */
function ModuleDots({ modules, current }: { modules: readonly Module[]; current: number }) {
  return (
    <span className="frame-dots" role="img" aria-label={`Module ${current + 1} of ${modules.length}`}>
      {modules.map((m, i) => (
        <span key={m.slug} className="frame-dot" data-current={i === current || undefined} />
      ))}
    </span>
  );
}

/**
 * The frame every module plays in (PLAN.md §6a, "The frame"): the top bar with the module, the
 * eight dots and "Screen n of m"; the screen's eyebrow, heading, intro and side around the
 * screen itself; Back and Next. Back always works, and goes home from the first screen; Next
 * goes home from the takeaway, and waits on a scored screen until it is answered. A route past
 * a scored screen still unanswered shows that screen instead, and the hash is replaced to say so.
 */
export function ModuleFrame({ course, module, screen: requested, answers, generation = 0, onEvent }: ModuleFrameProps) {
  const count = module.screens.length;
  const index = shownScreen(module, answers, requested) - 1;
  const held = index + 1 < Math.min(Math.max(requested, 1), count);
  const screen = module.screens[index];
  const next: Screen | undefined = module.screens[index + 1];
  const key = answerKey(screen);
  const progress = useMemo(() => moduleProgress(module, answers), [module, answers]);
  const report = useCallback((event: ScreenEvent) => onEvent(event, { module, screen }), [onEvent, module, screen]);
  const waiting = awaitsAnswer(screen, answers);
  const hintId = useId();

  const at = (n: number): Route => ({ page: 'module', slug: module.slug, screen: n });
  const back = () => navigate(index === 0 ? HOME : at(index));
  const forward = () => {
    if (!waiting) navigate(next ? at(index + 2) : HOME);
  };

  // A relative URL of the hash alone keeps the path and the launch query string as they are.
  useEffect(() => {
    if (held) window.location.replace(formatRoute({ page: 'module', slug: module.slug, screen: index + 1 }));
  }, [held, module.slug, index]);

  const view = (
    <ScreenView
      key={`${generation}/${module.slug}/${index}`}
      screen={screen}
      module={module}
      course={course}
      saved={key === undefined ? undefined : answers[key]?.answer}
      progress={progress}
      onEvent={report}
    />
  );

  return (
    <div className="page">
      <TopBar title={course.title} subtitle={`Module ${module.slug} · ${module.title}`}>
        <ModuleDots modules={course.modules} current={course.modules.findIndex((m) => m.slug === module.slug)} />
        <span>
          Screen {index + 1} of {count}
        </span>
      </TopBar>
      <main className="page-main frame">
        {screen.type === 'takeaway' ? (
          view
        ) : (
          <div className="frame-layout">
            <div className="frame-screen">
              <div className="frame-head">
                {screen.eyebrow !== undefined && (
                  <p className="eyebrow">
                    <Copy text={screen.eyebrow} />
                  </p>
                )}
                <h1>
                  <Copy text={screen.heading} />
                </h1>
                {screen.intro !== undefined && (
                  <p className="muted frame-intro">
                    <Copy text={screen.intro} />
                  </p>
                )}
              </div>
              {view}
            </div>
            {'side' in screen && screen.side && (
              <div className="frame-side">
                <Blocks blocks={screen.side} progress={progress} boxed />
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="frame-foot">
        <button type="button" className="btn btn-ghost" onClick={back}>
          Back
        </button>
        <span className="muted small">
          {module.slug} · screen {index + 1} of {count}
        </span>
        <span className="frame-next">
          {waiting && (
            <span id={hintId} className="muted small">
              Answer the question to go on.
            </span>
          )}
          <button
            type="button"
            className="btn btn-primary"
            aria-disabled={waiting || undefined}
            aria-describedby={waiting ? hintId : undefined}
            onClick={forward}
          >
            {next ? (
              <>
                Next: <Copy text={screenName(next)} />
              </>
            ) : (
              'Next: home'
            )}
          </button>
        </span>
      </footer>
    </div>
  );
}
