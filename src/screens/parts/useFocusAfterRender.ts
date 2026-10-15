// Focus that has to wait for a render: an item that moved in a list, the next item in the tray,
// a message that has only just appeared. The fridge, the order screen and the brief use it.
import { useEffect, useRef, type RefObject } from 'react';

/**
 * Returns `focusNext(selector)`: once the render now coming has happened, focus moves to the
 * element inside `root` the selector names, if there is one.
 */
export function useFocusAfterRender(root: RefObject<HTMLElement | null>): (selector: string) => void {
  const next = useRef<string | null>(null);
  useEffect(() => {
    const target = next.current;
    next.current = null;
    if (target !== null) root.current?.querySelector<HTMLElement>(target)?.focus();
  });
  return (selector) => {
    next.current = selector;
  };
}
