import { useEffect, useRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { Result, Statement } from '@xapi/xapi';

export interface StatementsDrawerProps {
  /** The panel's id, for the toggle's aria-controls. */
  id: string;
  /** The statements, oldest first; the drawer lists them newest first. */
  statements: readonly Statement[];
  /** Closes the drawer (the Close button, or Escape inside it). */
  onClose: () => void;
}

/**
 * The preview's statements drawer (D18): what the in-memory store received, newest first, each
 * with its verb, its object's name and id, and its result. A non-modal dialog: focus moves to
 * its heading on opening, Escape or Close shuts it. It is rendered at the end of the body, out
 * of the top bar's inline markup. Each item carries `data-verb` and `data-object` (the object's
 * id) for a test to read.
 */
export function StatementsDrawer({ id, statements, onClose }: StatementsDrawerProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    onClose();
  }

  return createPortal(
    <section id={id} className="statements-drawer" role="dialog" aria-labelledby={`${id}-heading`} onKeyDown={onKeyDown}>
      <div className="statements-drawer-head">
        <h2 id={`${id}-heading`} ref={heading} tabIndex={-1}>
          Statements sent ({statements.length})
        </h2>
        <button type="button" className="btn btn-ghost statements-drawer-close" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="muted small">Preview: these went to an in-memory store, not an LMS. Newest first.</p>
      <ol className="statements-list" reversed>
        {[...statements].reverse().map((statement, i) => {
          const { id: objectId, name } = describeObject(statement);
          const verb = statement.verb.display?.['en-US'] ?? statement.verb.id;
          return (
            <li key={statement.id ?? i} className="statement" data-verb={verb} data-object={objectId}>
              <p className="statement-line">
                <span className="statement-verb">{verb}</span> {name}
              </p>
              <p className="statement-id">{objectId}</p>
              {statement.result && <ResultList result={statement.result} />}
            </li>
          );
        })}
      </ol>
    </section>,
    document.body,
  );
}

function ResultList({ result }: { result: Result }) {
  const { response, success, score, completion } = result;
  return (
    <dl className="statement-result">
      {response !== undefined && <Entry term="Response" value={response} />}
      {success !== undefined && <Entry term="Success" value={String(success)} />}
      {score && <Entry term="Score" value={`${score.raw ?? '?'} of ${score.max ?? '?'} (min ${score.min ?? '?'}, scaled ${score.scaled})`} />}
      {completion !== undefined && <Entry term="Completion" value={String(completion)} />}
    </dl>
  );
}

function Entry({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** The statement's object id and its name, when it is an activity with one. */
function describeObject({ object }: Statement): { id: string; name: string } {
  const id = 'id' in object && typeof object.id === 'string' ? object.id : '';
  const name = ('definition' in object && object.definition?.name?.['en-US']) || id;
  return { id, name };
}
