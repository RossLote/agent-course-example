import { describe, expect, it } from 'vitest';
import { course } from '../content/index.ts';
import { newPlay, type FridgePlay } from './play.ts';
import { fridgeWords, theShelf } from './words.ts';

describe('theShelf', () => {
  it('lower-cases the first letter after "the"', () => {
    expect(theShelf({ id: 'salad-drawer', name: 'Salad drawer' })).toBe('the salad drawer');
    expect(theShelf({ id: 'top', name: 'Top shelf' })).toBe('the top shelf');
  });

  it('keeps a single "the" for a name that has one', () => {
    expect(theShelf({ id: 'door', name: 'The door' })).toBe('the door');
  });
});

describe('fridgeWords', () => {
  const oneShot = course.fridges['one-shot'];
  const accepted = course.fridges.accepted;
  const after = (last: FridgePlay['last']): FridgePlay => ({ ...newPlay(oneShot), last });

  it('places on a shelf and in a drawer or the door', () => {
    expect(fridgeWords(oneShot, after({ kind: 'placed', item: 'raw-chicken', shelf: 'lower-middle' }))).toBe('Raw chicken placed on the lower middle. Correct.');
    expect(fridgeWords(oneShot, after({ kind: 'placed', item: 'cheese', shelf: 'top' }))).toBe('Cheese placed on the top shelf. Correct.');
    expect(fridgeWords(oneShot, after({ kind: 'placed', item: 'milk', shelf: 'door' }))).toBe('Milk placed in the door. Correct.');
    expect(fridgeWords(accepted, { ...newPlay(accepted), last: { kind: 'placed', item: 'lettuce', shelf: 'salad-drawer' } })).toBe('Lettuce placed in the salad drawer. Correct.');
  });

  it('says only that an item returned on a flash fridge, and why on a reason one', () => {
    expect(fridgeWords(oneShot, after({ kind: 'returned', item: 'cheese', shelf: 'bottom' }))).toBe('Cheese returned to the tray.');
    expect(fridgeWords(accepted, { ...newPlay(accepted), last: { kind: 'returned', item: 'cheese', shelf: 'bottom' } })).toBe(
      'Cheese returned to the tray. Dairy goes on the top shelf, away from raw meat.',
    );
  });

  it('announces the timer ending with its markup taken off, and the timer going off', () => {
    expect(fridgeWords(oneShot, after({ kind: 'time-up' }))).toBe("Time's up! Better luck next time.");
    expect(fridgeWords(oneShot, after({ kind: 'no-timer' }))).toBe('Timer off.');
  });

  it('says the item held when time ran out went back to the tray, after the message', () => {
    expect(fridgeWords(oneShot, after({ kind: 'time-up', item: 'cheese' }))).toBe("Time's up! Better luck next time. Cheese put back in the tray.");
  });
});
