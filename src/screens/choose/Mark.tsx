const MARKS = {
  right: { label: 'Right', path: 'M5 13l4 4L19 7' },
  wrong: { label: 'Wrong', path: 'M6 6l12 12M18 6L6 18' },
};

/**
 * Right or wrong, told by a tick or a cross on green or red and by a word a screen reader says,
 * never by the colour alone. The choose screen marks its options with it; match and order mark
 * their rows and cards the same way.
 */
export function Mark({ right }: { right: boolean }) {
  const mark = MARKS[right ? 'right' : 'wrong'];
  return (
    <svg className="mark" data-right={right} viewBox="0 0 24 24" width="22" height="22" role="img" aria-label={mark.label}>
      <circle cx="12" cy="12" r="12" />
      <path d={mark.path} transform="translate(4.8 4.8) scale(0.6)" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
