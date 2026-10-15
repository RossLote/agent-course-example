/**
 * The column count a cards block lays out in: one a card up to four (and one for none), then
 * whichever of four, three and two leaves the fewest empty places in the last row, more columns
 * on a tie. 5 cards: three then two; 6: three and three; 7: four then three.
 */
export function cardColumns(count: number): number {
  if (count <= 4) return Math.max(count, 1);
  const empty = (columns: number) => (columns - (count % columns)) % columns;
  return [4, 3, 2].reduce((best, columns) => (empty(columns) < empty(best) ? columns : best));
}
