// The top bar's tracking slot (D18, PLAN.md §6 "Preview mode"): in preview, the PREVIEW badge
// and a button opening the statements drawer; with a launch, nothing.
import { useId, useRef, useState } from 'react';
import { tracker as courseTracker, useStatements, type Tracker } from '../xapi/index.ts';
import { StatementsDrawer } from '../xapi/preview/StatementsDrawer.tsx';
import '../xapi/preview/preview.css';

export interface TrackingProps {
  /** The tracker to show; the course's own unless a test gives one. */
  tracker?: Tracker;
}

/** The PREVIEW badge and the statements drawer, or nothing with a launch. */
export function Tracking({ tracker = courseTracker }: TrackingProps) {
  return tracker.log ? <PreviewTracking tracker={tracker} /> : null;
}

function PreviewTracking({ tracker }: { tracker: Tracker }) {
  const statements = useStatements(tracker);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();

  function close() {
    setOpen(false);
    toggle.current?.focus();
  }

  return (
    <span className="tracking">
      <span className="tracking-badge">PREVIEW</span>
      <button
        ref={toggle}
        type="button"
        className="btn btn-ghost tracking-toggle"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(!open)}
      >
        Statements ({statements.length})
      </button>
      {open && <StatementsDrawer id={id} statements={statements} onClose={close} />}
    </span>
  );
}
