// The shared half of the "bold and italic in every piece of copy" tests (home page, scenario
// page): a field's copy marked up, and the check that each field's emphasis was rendered.
import { expect } from 'vitest';

/** A field's copy, in bold and in italic, named so each field's emphasis can be found. */
export const marked = (name: string) => `**${name}** and *${name} too*`;

/** The marked copy of every name, so a fixture is built from the list `expectEmphasis` checks. */
export const markedAll = <N extends string>(names: readonly N[]): Record<N, string> => Object.fromEntries(names.map((n) => [n, marked(n)])) as Record<N, string>;

/** Every name is rendered once in bold and once in italic ("<name> too"), and no asterisk is left. */
export function expectEmphasis(container: HTMLElement, names: readonly string[]): void {
  const texts = (tag: string) => [...container.querySelectorAll(tag)].map((e) => e.textContent);
  expect(texts('strong')).toEqual(expect.arrayContaining([...names]));
  expect(texts('em')).toEqual(expect.arrayContaining(names.map((n) => `${n} too`)));
  expect(container.textContent).not.toContain('*');
}
