import type { ScreenProps } from '../types.ts';

/** A placeholder until its screen bead builds the compare screen, so every module plays to its takeaway. */
export function CompareScreen({ screen }: ScreenProps<'compare'>) {
  return <p className="muted">{screen.type}: not built yet</p>;
}
