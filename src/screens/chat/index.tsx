import { useId, useState } from 'react';
import { Copy } from '../scene/Copy.tsx';
import { indexBelow, savedField } from '../saved.ts';
import type { SavedAnswer, ScreenProps } from '../types.ts';
import { ChatLog, Chip, Message } from './Conversation.tsx';

/** What a chat saves: the picked reply's position. */
type ChatAnswer = { reply: number };

/** The reply a saved answer holds, or undefined when there is none or it is not an option. */
function savedReply(saved: SavedAnswer | undefined, count: number): number | undefined {
  const reply = savedField(saved, 'reply');
  return indexBelow(reply, count) ? reply : undefined;
}

/**
 * The scripted agent (D7, PLAN.md §6a "Screen types"): the learner's fixed opening, the agent's
 * messages, and, when the content gives them, reply options. Picking one shows it as the
 * learner's message and the agent's scripted reply under it, and reports `interacted`. The
 * options stay, so the learner can pick another: it replaces the exchange and reports again;
 * picking the one already picked does nothing. The saved answer is `{reply}`, and the screen
 * renders from it with the exchange showing.
 */
export function ChatScreen({ screen, saved, onEvent }: ScreenProps<'chat'>) {
  const { replies } = screen;
  const [picked, setPicked] = useState(() => savedReply(saved, replies?.options.length ?? 0));
  const promptId = useId();
  const chosen = picked === undefined ? undefined : replies?.options[picked];

  const pick = (i: number) => {
    if (replies === undefined || i === picked) return;
    setPicked(i);
    const answer: ChatAnswer = { reply: i };
    onEvent({ type: 'interacted', slug: screen.slug, response: replies.options[i].label, answer });
  };

  return (
    <div className="scene-card chat">
      <ChatLog label="The conversation" live>
        <Message who="learner">
          <p>
            <Copy text={screen.opening} />
          </p>
        </Message>
        {screen.messages.map((message, i) => (
          <Message key={i} who="agent">
            <p>
              <Copy text={message} />
            </p>
          </Message>
        ))}
        {/* Keyed by the pick, so another pick replaces the exchange and is read out anew. */}
        {chosen && (
          <Message key={`learner-${picked}`} who="learner">
            <p>
              <Copy text={chosen.label} />
            </p>
          </Message>
        )}
        {chosen && (
          <Message key={`agent-${picked}`} who="agent">
            <p>
              <Copy text={chosen.reply} />
            </p>
          </Message>
        )}
      </ChatLog>
      {replies && (
        <div className="chat-replies" role="group" aria-labelledby={promptId}>
          <p id={promptId} className="chat-prompt">
            <Copy text={replies.prompt ?? 'Your reply'} />
          </p>
          <div className="chips">
            {replies.options.map((option, i) => (
              <Chip key={i} pressed={i === picked} onPick={() => pick(i)}>
                <Copy text={option.label} />
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
