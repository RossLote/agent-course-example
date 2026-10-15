import type { ScreenProps } from '../types.ts';

/** A placeholder until its screen bead builds the fridge screen, so every module plays to its takeaway. */
export function FridgeScreen({ screen }: ScreenProps<'fridge'>) {
  return <p className="muted">{screen.type}: not built yet</p>;
}
