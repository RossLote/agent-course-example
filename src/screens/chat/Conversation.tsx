import type { ReactNode } from 'react';
import './Chat.css';

/** Who said a message: the scripted agent (teal) or the learner (amber). */
export type Speaker = 'agent' | 'learner';

const SPEAKERS = {
  agent: { name: 'Agent', avatar: 'A' },
  learner: { name: 'You', avatar: 'You' },
} as const;

/**
 * The conversation with the scripted agent (D7): a list of messages, each named by who said
 * it, in words as well as colour. The chat and the brief both show theirs with it. `live` reads
 * out the messages added after it first renders (the agent's reply to a picked option).
 */
export function ChatLog({ label, live = false, children }: { label: string; live?: boolean; children: ReactNode }) {
  return (
    <ol className="chat-log" aria-label={label} aria-live={live ? 'polite' : undefined}>
      {children}
    </ol>
  );
}

export interface MessageProps {
  who: Speaker;
  /** The bubble's content: copy in a paragraph, or the brief's questions and chips. */
  children: ReactNode;
  /** A bubble as wide as the conversation, for the brief's questions. */
  wide?: boolean;
  /**
   * Names a message focus moves to (the brief's rounds after the first, and its closing
   * message): its `data-message`, and focusable from script only.
   */
  anchor?: string;
}

/** One message: the speaker's avatar and name over the bubble, the learner's on the right. */
export function Message({ who, children, wide = false, anchor }: MessageProps) {
  const speaker = SPEAKERS[who];
  return (
    <li data-message={anchor} tabIndex={anchor === undefined ? undefined : -1} className={wide ? 'chat-msg chat-msg-wide' : 'chat-msg'} data-who={who}>
      <span className="chat-avatar" aria-hidden="true">
        {speaker.avatar}
      </span>
      <div className="chat-body">
        <p className="chat-who">{speaker.name}</p>
        <div className="chat-bubble">{children}</div>
      </div>
    </li>
  );
}

/**
 * An option to pick, as a toggle button (aria-pressed): a chat reply or a brief chip. A
 * recommended chip is drawn dashed and says "recommended" to a screen reader.
 */
export function Chip({ pressed, recommended = false, onPick, children }: { pressed: boolean; recommended?: boolean; onPick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} data-recommended={recommended || undefined} onClick={onPick}>
      {children}
      {recommended && (
        <>
          {' '}
          <span className="sr-only">(recommended)</span>
        </>
      )}
    </button>
  );
}
