# Design pass on round one's feedback (2026-10-15)

Live, interactive canvas: https://claude.ai/artifact/M4HMcmBczGvHui5zJVBDD9 (Claude Design;
private to Ross).

These files are the canvas's own source as published, kept here as the first pass's are
(`../2026-10-15-first-pass/`): `canvas.json` is the index, each `*.dc.html` one artboard. The
live link is the thing to look at. The look is the first pass's, unchanged: the same tokens,
type and icons.

Ross played round one from its branch and asked for five changes
(`docs/conversations/2026-10-15-round-one-feedback.md`). One row of artboards each:

1. **Home: done at a glance.** `Main` (recommended): a done module gets a 2px green border and
   a solid green "Done" pill with a tick in its top row; "In progress" and "Not started" take
   the same place as quieter pills, so every card says where it stands in one spot. `Home-Fill`:
   the done card tinted green, "Done" with a tick at the foot. `Home-Corner`: a green tick disc
   on the card's corner, the card otherwise unchanged. Each carries the tick and the word as
   well as the colour.
2. **Tick everything: feedback on the learner's choice, not on the option.** After Check each
   row says whether what the learner did with it was right: "Right to tick", "Right to leave
   it", "Shouldn't be ticked", "Missed: this went wrong too", as a pill beside the option, with
   the option's own feedback under it and no big icon of its own; a line under the list sums
   it up ("5 of 5 right…"). `Tick-AllRight` is Ross's answer, which now reads as all right;
   `Tick-Mixed` shows the two mistakes. The same rule applies to every multi-select choose
   (modules 00, 02, 03, 06).
3. **The one-shot: fifteen seconds, no way out.** `Fridge-15s` is playable: no No timer
   control, the clock starts at the first pick-up from 0:15; for the last five seconds the
   chip turns red and pulses, the fridge's border goes red, and a short high beep sounds each
   second, a long low one at zero. Time's up replaces the tray with the message and Reset.
   `Fridge-Timer` shows the three states side by side. The intro becomes "Optional, fifteen
   seconds." and the agent's chat says "a 15-second timer".
4. **How a brief goes: three, then two centred.** `BriefSteps`: numbered cards wrap in rows of
   three and the last row is centred. As a rule for every cards block: the fewest columns (up
   to four) that keep the rows even, and a short last row centred.
5. **The brief, one round at a time.** `Brief-Rounds` is playable (its Tweaks set how long
   the agent thinks); `Brief-Storyboard` shows the four beats. The learner answers round one
   and presses Send answers; the round fades, a one-line reply ("My answers to 1 to 5.")
   stands in for it, the agent shows a spinner and "Thinking…" for about a second and a half,
   and round two arrives in the same place, so nothing appears off screen. Round two sends the
   same way or with Your defaults; after a second Thinking comes "That's the brief" and the
   comparison card. The record on the right fills as chips are picked, as now.
