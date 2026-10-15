import type { ScreenProps } from '../types.ts';

/** A placeholder until its screen bead builds the brief screen, so every module plays to its takeaway. */
export function BriefScreen({ screen }: ScreenProps<'brief'>) {
  return <p className="muted">{screen.type}: not built yet</p>;
}
