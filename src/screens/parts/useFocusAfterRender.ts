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
  /**
   * Moves focus only if it has not gone elsewhere meanwhile: when the render comes, focus must be
   * on nothing (<body>, as when the focused element was removed) or on an element this selector
   * names. Without it focus moves wherever it is.
   */
  from?: string;
}

/** Whether focus is on nothing, or on an element `from` names. */
function focusIsFrom(from: string): boolean {
  const active = document.activeElement;
  return active === null || active === document.body || active.matches(from);
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
 * the element inside `root` the selector names, if there is one (and, with `from`, if focus has
 * not gone elsewhere).
 */
export function useFocusAfterRender(root: RefObject<HTMLElement | null>): (selector: string, options?: FocusOptions) => void {
  const next = useRef<{ selector: string; options: FocusOptions } | null>(null);
  useEffect(() => {
    const pending = next.current;
    next.current = null;
    const target = pending && root.current?.querySelector<HTMLElement>(pending.selector);
    if (pending && target && (pending.options.from === undefined || focusIsFrom(pending.options.from))) focusOn(target, pending.options);
  });
  return (selector, options = {}) => {
    next.current = { selector, options };
  };
}
