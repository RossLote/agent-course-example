// Right and wrong carried by an icon as well as colour (D14). Decorative: the words beside
// them always say right or wrong too.
const PATHS = {
  right: 'M5 13l4 4L19 7',
  wrong: 'M6 6l12 12M18 6L6 18',
};

/** A tick or a cross, in the text's colour. */
export function ToneIcon({ tone, size = 14 }: { tone: 'right' | 'wrong'; size?: number }) {
  return (
    <svg className="fridge-icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path d={PATHS[tone]} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
