import type { ScreenProps } from '../types.ts';

/** A placeholder until its screen bead builds the chat screen, so every module plays to its takeaway. */
export function ChatScreen({ screen }: ScreenProps<'chat'>) {
  return <p className="muted">{screen.type}: not built yet</p>;
}
