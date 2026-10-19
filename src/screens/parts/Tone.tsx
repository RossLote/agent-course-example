// Right and wrong carried by an icon as well as colour (D14): a tick or a cross, bare or on a
// green or red disc. The words beside them, or their label, always say right or wrong too.
import './Tone.css';

const PATHS = {
  right: 'M5 13l4 4L19 7',
  wrong: 'M6 6l12 12M18 6L6 18',
};

/**
 * A tick or a cross, in the text's colour. With `label` it is an image a screen reader names
 * (a list block's tone); without, it is decorative and hidden.
 */
export function ToneIcon({ tone, size = 14, label }: { tone: 'right' | 'wrong'; size?: number; label?: string }) {
  const named = label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label };
  return (
    <svg className="tone-icon" viewBox="0 0 24 24" width={size} height={size} focusable="false" {...named}>
      <path d={PATHS[tone]} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Right or wrong, told by a tick or a cross on green or red and by a word a screen reader says,
 * never by the colour alone. The choose screen marks its options with it; match and order mark
 * their rows and cards the same way.
 */
export function Mark({ right }: { right: boolean }) {
  return (
    <svg className="mark" data-right={right} viewBox="0 0 24 24" width="22" height="22" role="img" aria-label={right ? 'Right' : 'Wrong'}>
      <circle cx="12" cy="12" r="12" />
      <path d={PATHS[right ? 'right' : 'wrong']} transform="translate(4.8 4.8) scale(0.6)" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
