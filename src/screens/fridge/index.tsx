import { Fridge } from '../../fridge/index.ts';
import type { ScreenProps } from '../types.ts';

/**
 * A fridge screen: the fridge its file names, played here. A finished play saved under the
 * fridge's name comes back finished, with its score card; each play's end is reported as
 * `fridge-ended` with the fridge's name, and leaving mid-play reports nothing.
 */
export function FridgeScreen({ screen, course, saved, onEvent }: ScreenProps<'fridge'>) {
  return <Fridge fridge={course.fridges[screen.fridge]} name={screen.fridge} saved={saved} onEvent={onEvent} />;
}
