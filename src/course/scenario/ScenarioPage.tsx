import type { Course } from '../../content/index.ts';
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
      <TopBar title={course.title}>{scenario.label}</TopBar>
      <main className="page-main scenario">
        <div className="scenario-intro">
          <p className="scenario-role">
            <span className="scenario-role-dot" aria-hidden="true">
              You
            </span>
            {scenario.role}
          </p>
          <h1>{scenario.heading}</h1>
        </div>

        <div className="scenario-memo">
          <p className="scenario-memo-head">
            <span>
              From: <strong>{scenario.memo.from}</strong>
            </span>
            <span>{scenario.memo.date}</span>
            <span>
              Subject: <strong>{scenario.memo.subject}</strong>
            </span>
          </p>
          <div className="scenario-memo-body">
            {scenario.memo.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
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
                <strong>{line.title}</strong> {line.text}
              </p>
            </li>
          ))}
        </ol>

        <div className="scenario-go">
          <a className="btn btn-primary btn-large" href={formatRoute({ page: 'home' })}>
            {scenario.button}
          </a>
          <p className="muted small">{scenario.note}</p>
        </div>
      </main>
    </div>
  );
}
