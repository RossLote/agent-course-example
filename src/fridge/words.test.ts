import { describe, expect, it } from 'vitest';
import { fillTemplate, theShelf } from './words.ts';

describe('theShelf', () => {
  it('lower-cases the first letter after "the"', () => {
    expect(theShelf({ id: 'salad-drawer', name: 'Salad drawer' })).toBe('the salad drawer');
    expect(theShelf({ id: 'top', name: 'Top shelf' })).toBe('the top shelf');
  });

  it('keeps a single "the" for a name that has one', () => {
    expect(theShelf({ id: 'door', name: 'The door' })).toBe('the door');
  });
});

describe('fillTemplate', () => {
  it('fills the slots it has values for and leaves the rest', () => {
    expect(fillTemplate('{right} out of {total} right first time', { right: 7, total: 8 })).toBe('7 out of 8 right first time');
    expect(fillTemplate('Final score {score}. {other}', { score: 0 })).toBe('Final score 0. {other}');
  });
});
