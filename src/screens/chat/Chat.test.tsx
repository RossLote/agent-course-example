import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { course, type ScreenOf } from '../../content/index.ts';
import { fixtureModule, fixtureTakeaway } from '../../course/frame/fixture.ts';
import { NO_ANSWERS } from '../../course/frame/progress.ts';
import type { SavedAnswer } from '../types.ts';
import { ChatScreen } from './index.tsx';

// Module 00's "Just ask", as authored: no replies.
const module00 = course.modules.find((m) => m.slug === '00')!;
const justAsk = module00.screens.find((s): s is ScreenOf<'chat'> => s.type === 'chat' && s.slug === 'just-ask')!;

// Module 00 has no replies, so the replies are an inline chat.
const withReplies: ScreenOf<'chat'> = {
  type: 'chat',
  slug: 'sound-effects',
  heading: 'Talk back',
  opening: 'Build it.',
  messages: ['Done! Want me to add sound effects?'],
  replies: {
    prompt: 'What do you say?',
    options: [
      { label: 'Yes, add sound effects.', reply: "Done! I've added a ding and a buzzer." },
      { label: 'What rules did you use?', reply: 'The standard fridge rules.' },
    ],
  },
};

function renderChat(shown: ScreenOf<'chat'>, saved?: SavedAnswer) {
  const onEvent = vi.fn();
  const module = shown === justAsk ? module00 : fixtureModule('00', [shown, fixtureTakeaway()]);
  render(<ChatScreen screen={shown} module={module} course={course} saved={saved} progress={{ items: NO_ANSWERS, score: { raw: 0, max: 0 } }} onEvent={onEvent} />);
  return onEvent;
}

/** Each message in the conversation as "who: text". */
const messages = () =>
  within(screen.getByRole('list', { name: 'The conversation' }))
    .getAllByRole('listitem')
    .map((li) => `${li.querySelector('.chat-who')?.textContent}: ${li.querySelector('.chat-bubble')?.textContent}`);

describe('ChatScreen, just ask (module 00)', () => {
  it("shows the learner's fixed ask and the agent's scripted reply, named by who said them", () => {
    renderChat(justAsk);
    expect(messages()).toEqual([`You: ${justAsk.opening}`, `Agent: ${justAsk.messages[0]}`]);
    expect(justAsk.opening).toBe('Build a drag-and-drop fridge activity for the food hygiene course.');
    expect(justAsk.messages[0]).toMatch(/^Done! I've built a fridge activity\./);
  });

  it('has nothing to pick and reports nothing', () => {
    const onEvent = renderChat(justAsk);
    expect(screen.queryByRole('button')).toBeNull();
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('marks who said each message for the look: the learner amber, the agent teal', () => {
    renderChat(justAsk);
    const items = within(screen.getByRole('list', { name: 'The conversation' })).getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('data-who'))).toEqual(['learner', 'agent']);
  });
});

describe('ChatScreen with replies', () => {
  it('shows the options as unpressed buttons under the prompt, and no exchange yet', () => {
    renderChat(withReplies);
    const group = screen.getByRole('group', { name: 'What do you say?' });
    expect(within(group).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
      ['Yes, add sound effects.', 'false'],
      ['What rules did you use?', 'false'],
    ]);
    expect(messages()).toHaveLength(2);
  });

  it("sends interacted on a pick and shows the pick as the learner's message with the agent's reply", () => {
    const onEvent = renderChat(withReplies);
    fireEvent.click(screen.getByRole('button', { name: 'What rules did you use?' }));
    expect(onEvent.mock.calls.map(([e]) => e)).toEqual([{ type: 'interacted', slug: 'sound-effects', response: 'What rules did you use?', answer: { reply: 1 } }]);
    expect(screen.getByRole('button', { name: 'What rules did you use?' }).getAttribute('aria-pressed')).toBe('true');
    expect(messages().slice(2)).toEqual(['You: What rules did you use?', 'Agent: The standard fridge rules.']);
  });

  it('replaces the exchange and sends again on another pick; the same pick again sends nothing', () => {
    const onEvent = renderChat(withReplies);
    fireEvent.click(screen.getByRole('button', { name: 'What rules did you use?' }));
    fireEvent.click(screen.getByRole('button', { name: 'What rules did you use?' }));
    expect(onEvent).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Yes, add sound effects.' }));
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenLastCalledWith({ type: 'interacted', slug: 'sound-effects', response: 'Yes, add sound effects.', answer: { reply: 0 } });
    expect(messages().slice(2)).toEqual(['You: Yes, add sound effects.', "Agent: Done! I've added a ding and a buzzer."]);
    expect(screen.getByRole('button', { name: 'What rules did you use?' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('renders a saved reply with the exchange showing, and sends nothing', () => {
    const onEvent = renderChat(withReplies, { reply: 1 });
    expect(messages().slice(2)).toEqual(['You: What rules did you use?', 'Agent: The standard fridge rules.']);
    expect(screen.getByRole('button', { name: 'What rules did you use?' }).getAttribute('aria-pressed')).toBe('true');
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('ignores a saved answer that is not one of its options', () => {
    renderChat(withReplies, { reply: 5 });
    expect(messages()).toHaveLength(2);
  });
});
