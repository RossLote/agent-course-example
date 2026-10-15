---
date: 2026-10-15
stage: design
title: Round one feedback, and a design pass on it
participants: [Ross, agent]
source: live, written during the session, after the round-one pull request was published
---

# Round one feedback, and a design pass on it

A conversation, condensed, not verbatim: Ross in his own words, the agent in
its own. Ross dictates; his entries keep the point he was making and drop the
rest. Ross played round one locally from its branch and came back with five
things to change; the agent takes them into a Claude Design pass before any
of them is built.

## Ross: start it so I can run it

- Could you start the project so I can run it locally?

## Agent: running from the branch

- The branch is not merged, so I checked it out in its own folder,
  ../agent-course-round-one, installed it and started the dev server at
  http://localhost:5173/. Your main checkout is untouched.

## Ross: my first round of feedback

- **Home page: done is not obvious.** A module that is complete has to look
  complete: a green border, a check mark, a badge, something. We can work out
  which afterwards, but it must clearly say done.
- **The tick-everything feedback reads as wrong.** The ticks make sense. But
  the two options I rightly left unticked get big red crosses, so it looks as
  if I answered them wrong and maybe should have ticked them.
- **The one-shot fridge.** You should not be able to turn the timer off, and
  it should be much shorter: 15 seconds. I want people to run out of time,
  quickly. They have been given no information, so nobody will try for a whole
  minute; the point is that the timer adds stress. Add some audio in the last
  five seconds to raise it further, so they feel how bad this solution is.
- **"How a brief goes" layout.** Five cards laid out four and one, so
  everything is taller than it needs to be and the last one looks stuck on. I
  want three and two, with the two centred so they look as if they belong.
- **The brief screen.** Each round should give way to the next. When I answer
  the first five questions they fade off, a spinner says "Thinking" for a
  moment, and the second round appears; answer those, they fade, "Thinking"
  again, and "That's the brief" comes at the very end. That is how it works
  when I really do this: I answer a batch, press enter, the agent thinks for a
  few seconds and comes back with the next batch. It also fixes a scrolling
  problem: I didn't know the second round had appeared below the first until
  I scrolled down.
- Do a Claude Design session on all of this.

## Agent: the design pass

- I made a new canvas in the first pass's look, one row per point, with the
  ones that move made playable: https://claude.ai/artifact/M4HMcmBczGvHui5zJVBDD9.
  Its files and a README are in docs/design/2026-10-15-round-one-feedback/.
- **Done:** three ways, and I recommend the first: a green border and a solid
  green "Done" pill with a tick in the card's top row, with "In progress" and
  "Not started" as quieter pills in the same place. The other two tint the
  whole card, or put a tick disc on its corner.
- **Tick everything:** the feedback now judges what you did with each option,
  not the option: "Right to tick", "Right to leave it", "Shouldn't be ticked",
  "Missed". Your answer now reads as five of five right. The same rule fixes
  every multi-select in the course, not only module 00.
- **The one-shot:** fifteen seconds, no No timer, red and pulsing with a beep
  each second for the last five, a long beep at zero. Taking away No timer
  reverses one of the epic's own rules, which put it there for WCAG 2.2.1. I
  think that is fine under 2.2.1's essential exception, because the stress is
  the point and the activity is optional and unscored; I will record it as a
  reversed decision when it is built.
- **How a brief goes:** three, then two centred, and the same rule for every
  cards block.
- **The brief:** one round at a time, as you described. I added a Send answers
  button, so the fifth chip doesn't make the round vanish under your cursor;
  it is your Enter. Your answers leave a one-line reply in the chat ("My
  answers to 1 to 5.") so the conversation still reads as a conversation.
