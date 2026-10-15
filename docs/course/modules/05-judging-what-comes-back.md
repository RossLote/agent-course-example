# 05 · Judging what comes back

**Wall:** evidence. **Time:** about 8 minutes.

**Objective.** The learner can read a pull request's first three lines (the door, what to do
before merging, the undo), find the evidence for each acceptance step, and decide from that
whether to accept the work, without reading the code.

## Screen 1 · It finished at two in the morning

> The run built five pieces, simplified, reviewed, fixed, recorded the walkthrough and wrote
> up the result. It is waiting for you: forty changed files. Reading them is not your job.
> Judging them is.

Aside, **pull request**: *the hand-back: everything the run did, written for one time-poor
reviewer who will not read the code.*

## Screen 2 · The first three lines

The fridge pull request's top, as it would appear:

> **Two-way door.** Reverting the merge removes the activity and nothing else depends on it.
> **Before merging:** nothing.
> **Undo:** revert the merge commit and redeploy.

Three cards:

1. **The door.** *Two-way* if undoing puts everything back; *one-way* if something is
   dropped or changed for good (data deleted, a format changed). The door is the worst
   signal in the change, never an average. You read this line first because it sets how
   careful the rest of your reading has to be.
2. **Before merging.** What someone has to do first, if anything. "Nothing" is an answer.
3. **Undo.** A recipe, not a reassurance. If it cannot be written, the door is one-way.

Aside, **door**: *whether undoing the change puts everything back.*

## Screen 3 · The rest of the page

Four cards, what follows the three lines:

- **What changed, in one picture.** A diagram of the piece and where it sits.
- **Evidence, matched to the change.** For a thing you can see: the recorded walkthrough of
  the demo script, one chapter per step, slowed down so a person can follow it. For a bug
  fix: the test that failed and now passes.
- **A review guide.** At most ten places to look, each with what to check there. Not the
  whole change: the places where a mistake would hide.
- **Choices made for you.** Everything the run decided on its own, in a list, so you can
  disagree with any of them.

Quote card, Ross: *The pull request is the point where everything the agents did is shown
to you in a way you can consume safely.*

## Screen 4 · Try it: merge or not?

The fridge pull request, condensed to what matters. The learner can open each chapter of
the walkthrough (a still and a one-line transcript each):

1. Open: four shelves, eight items in the tray. ✓
2. Raw chicken to the top shelf: returns, message as specified. ✓
3. Raw chicken to the bottom shelf: stays. ✓
4. Keyboard: Tab to lettuce, Enter, arrow down twice, Enter: placed. Screen reader transcript:
   *"Lettuce placed. Correct."*
5. All eight placed: "7 out of 8 right first time", raw chicken listed with its reason. ✓
6. Try again: tray full, score cleared. ✓

**Choices made for you:** *The screen reader announcement names the item and the result;
the shelf is implied by focus, so it is not read out.*

*What do you do?*

- (a) Merge; every chapter passes and the choice is reasonable. *Every chapter plays, but
  chapter 4 does not match the acceptance. D5 and the demo script say the announcement
  names the item, the shelf and the result. "Implied by focus" is the builder deciding what
  the client's learners need. Reasonable is not the test; the record is.*
- (b) **Send it back as one piece of work: the announcement must name the shelf, per
  D5 and step 4.** *Yes. You judged from the evidence against the acceptance, found the
  one gap, and sent back exactly that. It goes through the box like any other piece.*
- (c) Read the forty files to be sure there is nothing else. *You can, but the reviews
  already did, with lenses and evidence. Your time goes on judging the evidence against the
  record. If the evidence were missing, that would be the reason to send it back.*

Line after: *You did not read a line of code. You read six chapters against six steps and a
list of choices against eight decisions.*

## Screen 5 · The two fridges

Added after Ross's look at the design (2026-10-15): the job's payoff. Both versions of the
fridge activity, real and playable, side by side.

> On the left, what the agent handed you in module 00 from a one-line ask. On the right,
> what you just accepted. Both work. Try them.

**Left, "Build me a fridge activity":** five shelves including "the door", fourteen items,
rules the agent guessed (raw chicken is accepted on the lower middle shelf), a wrong drop
flashes red and snaps back with no reason, a sixty-second timer that ends in "Time's up", a
leaderboard against people who do not exist, points, confetti at the end.

**Right, what you accepted:** four shelves, eight items, the client's rules; a wrong drop
returns the item with its one-line reason; right-first-time out of eight, the wrong ones
listed with their reasons, Try again; no timer; keyboard route and screen-reader
announcements of item, shelf and result (the shelf is there because the pull request was
sent back once).

Both are the same engine component with different data: shelves, items, rules, feedback
mode, timer, leaderboard, confetti are all authored content. Drag and drop with mouse and
touch, and the keyboard route (Enter picks up, arrows move between shelves, Enter places),
on both; the one-shot version is keyboard-operable too, and says so, because the course
itself must be, even where a real one-shot build would not have been.

Under the two, a table: what is different, row by row (shelves and items; the rules; a
wrong drop; the score; time; keyboard and screen reader), and which wall made the difference
(the record and its decision numbers, done and the step of the demo script, the gate,
evidence).

The one-shot version also appears in module 00, screen 3, as "Try what it built" (optional,
a minute), so the learner has felt it before they are asked what went wrong with it.

## Screen 6 · Check

**Q1.** A pull request's door line says "Two-way door" but the change deletes a column of
learner data. What is wrong?

- (a) Nothing; the code can be reverted. *The code can. The data cannot. A revert does not
  put the column back.*
- (b) **The door is wrong: it is one-way, and the rest of the page has to be read as one.**
  *Yes. The door is the worst signal in the change.*
- (c) It should say "no door". *Every change has a door. This one is one-way.*

**Q2.** The walkthrough has five chapters and the demo script has six steps. What does that
tell you?

- (a) The sixth step was not important. *The script is the definition of done. A missing
  step is missing proof.*
- (b) **One step has no evidence, so it is not shown to be done.** *Yes. Send it back for
  the chapter, or for the fix the chapter would have shown.*
- (c) The video was cut for length. *Then the proof was cut for length.*

## Screen 7 · Takeaway

> **You still sign off. You just do not start from the code.** Door, undo, evidence against
> the acceptance, the choices made for you. A gap in the evidence is a gap in the work.

The box gains its fifth wall: **evidence**.

## Statements

Module launched; the merge-or-not choice and the chapters opened as interactions; each
fridge tried, with the items placed and the score reached; two answers; module completed.
