// Pointer drag for the fridge's items and the order screen's cards, hand-rolled on Pointer
// Events (no drag library: PLAN.md §6, "Hash routing, hand-rolled"), so a mouse, a pen and a
// finger all drag the same way. The item captures the pointer, a ghost follows it (DragGhost),
// and the drop target under it, an element marked `data-drop-target` with its id, is found with
// elementFromPoint, kept to the root's own targets so two fridges on a page never mix.
import { useRef, useState, type PointerEvent, type RefObject } from 'react';

/** How far the pointer moves before a press becomes a drag; less is a click. */
const DRAG_START = 6;

/** A drag in progress: the item, where the pointer is, and the drop target under it. */
export interface Drag {
  item: string;
  x: number;
  y: number;
  over: string | undefined;
}

interface Press {
  item: string;
  pointer: number;
  x: number;
  y: number;
  dragging: boolean;
}

/** The id of the `[data-drop-target]` element at this point inside `root`, if there is one. */
function targetAt(root: HTMLElement | null, x: number, y: number): string | undefined {
  const target = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-target]');
  return target && root?.contains(target) ? target.dataset.dropTarget : undefined;
}

export interface PointerDragOptions {
  /** Gets the item and the target it was let go over; let go anywhere else, nothing happens. */
  onDrop: (item: string, target: string) => void;
  /** Called once when a press turns into a drag, so a timer can begin with it. */
  onStart?: () => void;
  /** False while the items may not move. */
  enabled: boolean;
}

/**
 * The drag in progress and the handlers an item spreads onto its button. `swallowClick` is true
 * for the click a browser fires at the end of a drag, which is not one.
 */
export function usePointerDrag(root: RefObject<HTMLElement | null>, { onDrop, onStart, enabled }: PointerDragOptions) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const press = useRef<Press | null>(null);
  const dragged = useRef(false);

  const end = () => {
    press.current = null;
    setDrag(null);
  };

  const handlers = (item: string) => ({
    onPointerDown(event: PointerEvent<HTMLElement>) {
      dragged.current = false;
      if (!enabled || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      press.current = { item, pointer: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const current = press.current;
      if (current === null || current.pointer !== event.pointerId) return;
      if (!current.dragging && Math.hypot(event.clientX - current.x, event.clientY - current.y) < DRAG_START) return;
      if (!current.dragging) onStart?.();
      current.dragging = true;
      event.preventDefault();
      setDrag({ item, x: event.clientX, y: event.clientY, over: targetAt(root.current, event.clientX, event.clientY) });
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const current = press.current;
      if (current === null || current.pointer !== event.pointerId) return;
      end();
      if (!current.dragging) return;
      dragged.current = true;
      const target = targetAt(root.current, event.clientX, event.clientY);
      if (target !== undefined) onDrop(item, target);
    },
    onPointerCancel: end,
    onLostPointerCapture() {
      if (press.current !== null) end();
    },
  });

  /** Whether the click now arriving ends a drag rather than being a click; asking clears it. */
  const swallowClick = () => {
    const was = dragged.current;
    dragged.current = false;
    return was;
  };

  return { drag, handlers, swallowClick };
}
