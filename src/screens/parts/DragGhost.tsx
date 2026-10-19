import type { ReactNode } from 'react';
import type { Drag } from './usePointerDrag.ts';
import './DragGhost.css';

/** The item's name following the pointer during a drag (./usePointerDrag.ts); drawn only, the live region says the move. */
export function DragGhost({ drag, children }: { drag: Drag; children: ReactNode }) {
  return (
    <span className="drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
      {children}
    </span>
  );
}
