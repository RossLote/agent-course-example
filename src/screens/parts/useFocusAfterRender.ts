// Focus that has to wait for a render: an item that moved in a list, the next item in the tray,
// a message that has only just appeared. The fridge, the order screen and the brief use it.
import { useEffect, useRef, type RefObject } from 'react';

export interface FocusOptions {
  /**
   * 'top': focus without the browser's own scroll, then bring the element's top into view only
   * when it is above the window or low in it (the brief's turn, which arrives where the sent
   * round was). Without it the browser scrolls as focus does.
   */
  reveal?: 'top';
}

/** Focuses `target`, revealing it as `options` asks. */
function focusOn(target: HTMLElement, { reveal }: FocusOptions) {
  if (reveal !== 'top') {
    target.focus();
    return;
  }
  target.focus({ preventScroll: true });
  const { top } = target.getBoundingClientRect();
  if (top < 0 || top > window.innerHeight / 2) target.scrollIntoView({ block: 'start' });
}

/**
 * Returns `focusNext(selector, options)`: once the render now coming has happened, focus moves to
 * the element inside `root` the selector names, if there is one.
 */
export function useFocusAfterRender(root: RefObject<HTMLElement | null>): (selector: string, options?: FocusOptions) => void {
  const next = useRef<{ selector: string; options: FocusOptions } | null>(null);
  useEffect(() => {
    const pending = next.current;
    next.current = null;
    const target = pending && root.current?.querySelector<HTMLElement>(pending.selector);
    if (pending && target) focusOn(target, pending.options);
  });
  return (selector, options = {}) => {
    next.current = { selector, options };
  };
}
