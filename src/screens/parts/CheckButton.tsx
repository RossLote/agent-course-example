import { useId } from 'react';
import './CheckButton.css';

interface CheckButtonProps {
  checked: boolean;
  /** Nothing to check yet: the button says so instead of checking. */
  waiting?: boolean;
  /** Why it is waiting, read with the button while it is. */
  hint?: string;
  /** The content's `checkLabel`, when it has one. */
  label?: string;
  onCheck: () => void;
  onTryAgain: () => void;
}

/**
 * Check, and once checked Try again: one button that turns from one into the other and back, so
 * focus stays on it. While there is nothing to check it is aria-disabled (still focusable) and
 * its hint says why. Choose, match and order all use it.
 */
export function CheckButton({ checked, waiting = false, hint, label, onCheck, onTryAgain }: CheckButtonProps) {
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
        {checked ? 'Try again' : (label ?? 'Check my answer')}
      </button>
      {hint !== undefined && (
        <span id={hintId} hidden>
          {hint}
        </span>
      )}
    </>
  );
}
