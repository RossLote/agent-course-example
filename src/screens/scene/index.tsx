import type { ScreenProps } from '../types.ts';
import { Blocks } from './Blocks.tsx';

/** A scene: reading. The frame shows its heading and side; this shows its blocks. */
export function SceneScreen({ screen, progress }: ScreenProps<'scene'>) {
  return <Blocks blocks={screen.blocks} progress={progress} />;
}
