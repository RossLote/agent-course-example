// The grammar of copy (content/README.md): `**bold**` and `*italic*` inline, and the
// `{placeholders}` a template has (schema.ts's `template()` says which are allowed). The screens'
// Copy renders the emphasis; the statements and the status lines read copy as plain text.

/** `**bold**` or `*italic*`: the only markup copy has. */
export const EMPHASIS = /\*\*(.+?)\*\*|\*(.+?)\*/g;

/**
 * Copy as plain text, for a response, an activity's name or a status line: the words of
 * `**bold**` and `*italic*` without their markers; a lone asterisk stays.
 */
export function plainText(text: string): string {
  return text.replace(EMPHASIS, (_, bold: string | undefined, italic: string | undefined) => plainText(bold ?? italic ?? ''));
}

/** A template with its `{name}` slots filled ("7 out of 8 right first time"); a slot with no value stays. */
export function fillTemplate(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (slot, name: string) => (name in values ? String(values[name]) : slot));
}
