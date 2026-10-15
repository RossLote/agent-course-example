// The fridge's words: one function makes what the live region announces and the status line
// shows, so a screen reader and a sighted learner get the same item, shelf and result (D14).
import { plainText } from '../content/copy.ts';
import type { Fridge } from '../content/index.ts';
import type { FridgePlay } from './play.ts';

type Shelf = Fridge['shelves'][number];

/** A shelf's name mid-sentence after "the": "the salad drawer", and "the door" for "The door". */
export function theShelf(shelf: Shelf): string {
  const name = shelf.name.replace(/^the\s+/i, '');
  return `the ${name.charAt(0).toLowerCase()}${name.slice(1)}`;
}

/** "in" for a drawer or the door, "on" for a shelf: "in the salad drawer", "on the lower middle". */
function placeOf(shelf: Shelf): string {
  return `${/drawer|door/i.test(shelf.name) ? 'in' : 'on'} ${theShelf(shelf)}`;
}

/** A shelf as the cursor reaches it: its name, then its subtitle when it has one. */
function shelfHeard(shelf: Shelf): string {
  return shelf.subtitle === undefined ? `${shelf.name}.` : `${shelf.name}, ${shelf.subtitle}.`;
}

/**
 * What the last action did, in words: "Lettuce picked up. Top shelf, ready to eat.", "Lettuce
 * placed in the salad drawer. Correct.", "Raw chicken returned to the tray. <its reason>" (on
 * a flash fridge, only that it returned), and the timer's "Time's up!" with its markup taken
 * off. Empty before anything has happened.
 */
export function fridgeWords(fridge: Fridge, play: FridgePlay): string {
  const last = play.last;
  if (last === null) return '';
  if (last.kind === 'reset') return 'Every item is back in the tray.';
  if (last.kind === 'no-timer') return 'Timer off.';
  if (last.kind === 'time-up') return fridge.timer === 'none' ? '' : plainText(fridge.timer.message);
  const item = fridge.items.find((candidate) => candidate.id === last.item);
  if (item === undefined) return '';
  const shelf = 'shelf' in last ? fridge.shelves.find((candidate) => candidate.id === last.shelf) : undefined;
  switch (last.kind) {
    case 'picked':
      return shelf === undefined ? `${item.name} picked up.` : `${item.name} picked up. ${shelfHeard(shelf)}`;
    case 'moved':
      return shelf === undefined ? item.name : `${item.name}. ${shelfHeard(shelf)}`;
    case 'put-back':
      return `${item.name} put back in the tray.`;
    case 'placed':
      return shelf === undefined ? `${item.name} placed. Correct.` : `${item.name} placed ${placeOf(shelf)}. Correct.`;
    case 'returned':
      return fridge.feedback === 'reason' && item.reason !== undefined
        ? `${item.name} returned to the tray. ${item.reason}`
        : `${item.name} returned to the tray.`;
  }
}
