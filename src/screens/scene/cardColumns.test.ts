import { describe, expect, it } from 'vitest';
import { cardColumns } from './cardColumns.ts';

describe('cardColumns', () => {
  it.each([
    [0, 1],
    [1, 1],
    [2, 2],
    [3, 3],
    [4, 4],
    [5, 3],
    [6, 3],
    [7, 4],
    [8, 4],
    [9, 3],
    [10, 2],
    [11, 4],
  ])('lays %i cards out in %i columns', (count, columns) => {
    expect(cardColumns(count)).toBe(columns);
  });
});
