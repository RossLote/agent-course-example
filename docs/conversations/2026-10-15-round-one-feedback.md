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

## Ross: yes to all of it

- I'm happy with all your recommendations: the green border and Done pill,
  the Send answers button, and the rest as designed.
- Please implement it, and use subagents to do the fixes.

## Agent: round two filed and running

- I filed it as epic agent-course-7ec, eight beads: the decision record, one
  bead per change (home, multi choose, the one-shot, cards, the brief), the
  e2e tier and the content README, and the walkthrough. Three of the change
  beads run at once, then the other two.
- Round one isn't merged yet, so round two is built on top of its branch and
  its pull request targets that branch: merge round one first, then round
  two.
- I skipped the multi-agent review of the plan because you asked for the
  build now; the plan is small and every path and count in its demo script
  was checked against round one's code. The usual reviews still run at the
  end of the build.

## Ross: no adversarial review this time

- Skip the adversarial review for this round. It's a few small fixes, so we
  don't need to go that far; a regular code review will do.

## Agent: noted

- Done: the end of this run is the full gate, the simplify pass, a plain code
  review with its fixes, the walkthrough and the pull request.

## Ross: and no pull request

- Obviously don't do a pull request: there's no remote repo for this.

## Agent: the branch and the video instead

- Agreed. The run ends with the branch to merge, the walkthrough video sent
  to you directly, and a short summary here.

## Ross: skip the walkthrough too

- Skip the walkthrough as well; I'll look through it myself.

## Agent: no recording this round

- Done: no recording this round. The run ends with the full gate, the
  simplify pass, the code review and its fixes, then the branch to merge and
  a summary of what to look at.

## Ross: do I have the old script?

- Actually, maybe not. Do you still have the walkthrough script from last
  time?

## Agent: no, but a new one is cheap

- No: round one's script was throwaway and deleted at clean-up. The recorder,
  its config and the e2e helpers that now play round two are all committed,
  and the epic's demo script is written, so a new one is one worker and a few
  minutes of recording. I recommended doing it.

## Ross: yes, record it

- Fine, do the walkthrough: I can see everything at once, and the script can
  pick up errors that would otherwise be missed.

## Agent: round two is done

- All five changes are built on branch agent-course-7ec/round-two, which
  sits on top of round one's branch: merge round one, then round two.
- Three choices came up mid-build and I made them: the one-shot shows a
  single Reset at time-up; a brief comes back from a reload with any round
  whose questions are all answered counted as sent, because the frame saves an
  answer only with a statement and Send answers sends none; and Your defaults
  hides once the last round is answered. The cards rule's wording was
  corrected (two to four columns), because as first written it always chose
  one.
- The code review found seven things and six were fixed, among them silent
  tones on a tablet when the play starts with a drag, and focus falling off
  the page during Thinking. The full gate is green (400 unit tests, 6 e2e
  specs, the package check), and the walkthrough passed all nine steps and is
  sent to you.
