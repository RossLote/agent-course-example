import { useId, type ReactNode } from 'react';
import { Copy } from '../scene/Copy.tsx';
import './CheckButton.css';

interface CheckButtonProps {
  checked: boolean;
  /** Nothing to check yet: the button says so instead of checking. */
  waiting?: boolean;
  /** Why it is waiting, read with the button while it is. */
  hint?: string;
  /** The content's `checkLabel`, when it has one. */
  label?: string;
  /** The content's `tryAgainLabel`, when it has one. */
  tryAgainLabel?: string;
  onCheck: () => void;
  onTryAgain: () => void;
}

/**
 * Check, and once checked Try again: one button that turns from one into the other and back, so
 * focus stays on it. While there is nothing to check it is aria-disabled (still focusable) and
 * its hint says why. Both labels are copy, from the content when it gives them. Choose, match
 * and order all use it.
 */
export function CheckButton({ checked, waiting = false, hint, label, tryAgainLabel, onCheck, onTryAgain }: CheckButtonProps) {
  const hintId = useId();
  const idle = !checked && waiting;
  return (
    <>
      <button
        type="button"
        className={checked ? 'btn btn-ghost' : 'btn btn-primary'}
        aria-disabled={idle || undefined}
        aria-describedby={idle && hint !== undefined ? hintId : undefined}
        onClick={checked ? onTryAgain : idle ? undefined : onCheck}
      >
        <Copy text={checked ? (tryAgainLabel ?? 'Try again') : (label ?? 'Check my answer')} />
      </button>
      {hint !== undefined && (
        <span id={hintId} hidden>
          {hint}
        </span>
      )}
    </>
  );
}

/**
 * The result beside the Check button (match and order), and its polite live region. It is in
 * the page from the start, empty until Check fills it, so a screen reader is listening before the
 * first result arrives; it is never hidden while empty.
 */
export function CheckResult({ children }: { children: ReactNode }) {
  return (
    <p className="check-result" role="status">
      {children}
    </p>
  );
}
