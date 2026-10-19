// Pointer drag for the fridge's items and the order screen's cards, hand-rolled on Pointer
// Events (no drag library: PLAN.md §6, "Hash routing, hand-rolled"), so a mouse, a pen and a
// finger all drag the same way. The item captures the pointer, a ghost follows it (DragGhost),
// and the drop target under it, an element marked `data-drop-target` with its id, is found with
// elementFromPoint, kept to the root's own targets so two fridges on a page never mix.
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';

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
  /** The item's element, which holds the pointer capture until the press ends. */
  element: HTMLElement;
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
  /** False while the items may not move; turning false mid-drag cancels the drag. */
  enabled: boolean;
}

/**
 * The drag in progress and the handlers an item spreads onto its button. `swallowClick` is true
 * for the click a browser fires at the end of a drag, which is not one. `cancel` ends a drag
 * where it is with nothing dropped (a reset mid-drag); `enabled` turning false does the same.
 */
export function usePointerDrag(root: RefObject<HTMLElement | null>, { onDrop, onStart, enabled }: PointerDragOptions) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const press = useRef<Press | null>(null);
  const dragged = useRef(false);
  // Clears `dragged` once the click that ends a drag has had its chance to arrive.
  const forget = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Lets go of the press and its capture; the capture's loss then finds nothing to end. */
  const release = () => {
    const current = press.current;
    press.current = null;
    if (current !== null && current.element.hasPointerCapture(current.pointer)) current.element.releasePointerCapture(current.pointer);
  };

  const end = () => {
    press.current = null;
    setDrag(null);
  };

  const cancel = () => {
    release();
    setDrag(null);
  };

  // Items that stop moving mid-drag (time up, Check) drop the ghost now, during the render…
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    if (!enabled) setDrag(null);
  }
  // …and give the pointer back once it has happened.
  useEffect(() => {
    if (!enabled) release();
  }, [enabled]);

  useEffect(() => () => clearTimeout(forget.current), []);

  const handlers = (item: string) => ({
    onPointerDown(event: PointerEvent<HTMLElement>) {
      clearTimeout(forget.current);
      dragged.current = false;
      if (!enabled || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      press.current = { item, element: event.currentTarget, pointer: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const current = press.current;
      if (!enabled || current === null || current.pointer !== event.pointerId) return;
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
      if (!current.dragging || !enabled) return;
      // The click a browser fires after this pointerup comes in the same task; a drag that
      // ends with none (a touch, or an item that left with its drop) must not swallow a later one.
      dragged.current = true;
      clearTimeout(forget.current);
      forget.current = setTimeout(() => {
        dragged.current = false;
      });
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

  return { drag, handlers, swallowClick, cancel };
}
