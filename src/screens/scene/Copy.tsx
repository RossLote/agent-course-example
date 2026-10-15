import type { ReactNode } from 'react';

// `**bold**` or `*italic*`: the only markup copy has (content/README.md).
const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*/g;

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > at) parts.push(text.slice(at, match.index));
    parts.push(
      match[1] !== undefined ? <strong key={match.index}>{inline(match[1])}</strong> : <em key={match.index}>{inline(match[2])}</em>,
    );
    at = match.index + match[0].length;
  }
  if (at < text.length) parts.push(text.slice(at));
  return parts;
}

/** A piece of copy with its `**bold**` and `*italic*` rendered; everything else as written. */
export function Copy({ text }: { text: string }) {
  return <>{inline(text)}</>;
}
