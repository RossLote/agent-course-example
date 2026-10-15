import { Copy } from '../scene/Copy.tsx';

/** A quote in curly quotes, with who said it when there is one: a quote block, and the home page's quote. */
export function Quote({ className, text, attribution }: { className: string; text: string; attribution?: string }) {
  return (
    <figure className={className}>
      <blockquote>
        <p>
          “<Copy text={text} />”
        </p>
      </blockquote>
      {attribution !== undefined && <figcaption>{attribution}</figcaption>}
    </figure>
  );
}
