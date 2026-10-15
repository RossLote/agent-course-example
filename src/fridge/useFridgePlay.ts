import { useRef, useState } from 'react';
import type { Fridge } from '../content/index.ts';
import type { SavedAnswer } from '../screens/types.ts';
import { fridgeReducer, isFinished, playFromSaved, type FridgeAction, type FridgePlay } from './play.ts';

/**
 * A fridge's play, from its saved answer when it has one, and the dispatch that changes it.
 * Dispatch returns the play before and after at once (the same object when nothing changed), so
 * the caller can move focus to what changed, and calls `onEnd` in the same handler when that
 * action ended the play: once per play, never from an effect, so a remount or a strict-mode
 * rerender never ends a play twice.
 */
export function useFridgePlay(fridge: Fridge, saved: SavedAnswer | undefined, onEnd: (play: FridgePlay) => void) {
  const [play, setPlay] = useState(() => playFromSaved(fridge, saved));
  // The play as of the last dispatch, so two actions before a render still chain.
  const latest = useRef(play);

  const dispatch = (action: FridgeAction): { before: FridgePlay; after: FridgePlay } => {
    const before = latest.current;
    const after = fridgeReducer(fridge, before, action);
    if (after === before) return { before, after };
    latest.current = after;
    setPlay(after);
    if (!isFinished(fridge, before) && isFinished(fridge, after)) onEnd(after);
    return { before, after };
  };

  return [play, dispatch] as const;
}
