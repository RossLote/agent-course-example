// The CSS custom properties the screens set inline, so React's style prop takes them typed: the
// cards block's column count (src/screens/scene/cardColumns.ts) and the brief's fade length
// (src/screens/brief/labels.ts, FADE_MS), which their stylesheets read.
declare module 'react' {
  interface CSSProperties {
    '--cards-columns'?: number;
    '--brief-fade'?: string;
  }
}

export {};
