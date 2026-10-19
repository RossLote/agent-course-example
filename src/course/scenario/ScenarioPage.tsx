import type { Course } from '../../content/index.ts';
import { Copy } from '../../screens/scene/Copy.tsx';
import { formatRoute } from '../route.ts';
import { TopBar } from '../TopBar.tsx';
import './ScenarioPage.css';

export interface ScenarioPageProps {
  /** course.yaml's title and the scenario's copy. */
  course: Pick<Course, 'title' | 'scenario'>;
}

/** The course's first page (D16): the learner's role, the client's message, the job. */
export function ScenarioPage({ course }: ScenarioPageProps) {
  const { scenario } = course;
  return (
    <div className="page">
      <TopBar title={course.title}>
        <Copy text={scenario.label} />
      </TopBar>
      <main className="page-main scenario">
        <div className="scenario-intro">
          <p className="scenario-role">
            <span className="scenario-role-dot" aria-hidden="true">
              You
            </span>
            <Copy text={scenario.role} />
          </p>
          <h1>
            <Copy text={scenario.heading} />
          </h1>
        </div>

        <div className="scenario-memo">
          <p className="scenario-memo-head">
            <span>
              From:{' '}
              <strong>
                <Copy text={scenario.memo.from} />
              </strong>
            </span>
            <span>
              <Copy text={scenario.memo.date} />
            </span>
            <span>
              Subject:{' '}
              <strong>
                <Copy text={scenario.memo.subject} />
              </strong>
            </span>
          </p>
          <div className="scenario-memo-body">
            {scenario.memo.body.map((paragraph, i) => (
              <p key={i}>
                <Copy text={paragraph} />
              </p>
            ))}
          </div>
        </div>

        <ol className="scenario-lines">
          {scenario.lines.map((line, i) => (
            <li key={i}>
              <span className="scenario-line-number" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p>
                <strong>
                  <Copy text={line.title} />
                </strong>{' '}
                <Copy text={line.text} />
              </p>
            </li>
          ))}
        </ol>

        <div className="scenario-go">
          <a className="btn btn-primary btn-large" href={formatRoute({ page: 'home' })}>
            <Copy text={scenario.button} />
          </a>
          <p className="muted small">
            <Copy text={scenario.note} />
          </p>
        </div>
      </main>
    </div>
  );
}
