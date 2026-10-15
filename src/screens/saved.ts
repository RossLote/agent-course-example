// Reading a saved answer back (src/screens/types.ts, SavedAnswer): a saved answer comes from
// State or localStorage, so a screen trusts nothing in it and keeps only what still fits its
// content. No imports at all, so the xAPI layer (and the e2e specs through it) can use the same
// guard on what it reads.

/** A JSON object: not null, not an array. */
export function isRecord(value: unknown): value is { readonly [key: string]: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** One field of a saved answer, or undefined when there is no answer, it is not an object, or it has no such field. */
export function savedField(saved: unknown, key: string): unknown {
  return isRecord(saved) ? saved[key] : undefined;
}

/** Whether a saved value is a position in a list of `count`: a whole number from 0 to count - 1. */
export function indexBelow(value: unknown, count: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < count;
}
