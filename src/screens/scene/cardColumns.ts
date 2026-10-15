/**
 * The column count a cards block lays out in: from two to four (one for a single card, never
 * more than the cards) that leaves the fewest empty places in the last row, more columns on a
 * tie. 5 cards: three then two; 6: three and three; 7: four then three.
 */
export function cardColumns(count: number): number {
  const most = Math.min(4, count);
  let best = Math.max(1, Math.min(2, most));
  let bestEmpty = Infinity;
  for (let columns = best; columns <= most; columns++) {
    const empty = (columns - (count % columns)) % columns;
    if (empty <= bestEmpty) {
      best = columns;
      bestEmpty = empty;
    }
  }
  return best;
}
