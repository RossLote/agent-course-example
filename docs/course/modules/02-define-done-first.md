# 02 · Define done before you start

**Wall:** done. **Time:** about 7 minutes.

**Objective.** The learner can tell acceptance a reviewer can see from a wish, can read an
epic's beads and say which could run at the same time, and knows that a gap found before the
run is cheaper than one found during it.

## Screen 1 · Who builds what, and how do you know it is done?

> Eight decisions. An agent could start building from them now, and when it said "done" you
> would have no way to say whether it was. So before anything is built, the work is cut into
> pieces, and each piece says how a reviewer will know it is finished.

Aside, **epic**: *the set of pieces for one job, with the decisions, the order they run in,
and a demo script for the whole thing.* Aside, **bead**: *one piece, written for execution.*

## Screen 2 · A bead is not a ticket

A side-by-side card.

**A ticket (what most of us write):**
> Fridge activity: feedback and scoring. Show feedback on wrong drops and a score at the end.

**A bead (what the builder gets):**
> **.4 Feedback and the score screen.** A wrong drop returns the item to the tray and shows
> its one-line reason (D3). When all eight are placed, the score screen shows how many were
> right first time out of eight and lists each wrong placement with its reason (D4). Try again
> resets the tray and clears the score; the latest attempt is what is reported (D7).
> *Acceptance:* dropping raw chicken on the top shelf returns it and shows "Raw meat and fish
> go on the bottom shelf so they can't drip onto other food"; after placing all eight with one
> wrong, the score screen reads "7 out of 8 right first time" and lists raw chicken with that
> reason; Try again empties the shelves.
> *Read first:* the data file from .1; the drop handling from .2. *Touches:* the feedback and
> score files only. *Depends on:* .2.

Three points under it:

1. **The decisions are cited, not re-explained.** D3, D4, D7. The builder reads the record.
2. **The acceptance is something a reviewer can do and see.** Drop this, read that.
3. **It says what it may touch.** So two builders working at once do not collide.

## Screen 3 · The fridge epic

The five beads as cards, with their dependencies drawn:

- **.1 The data.** Shelves, items, rules and reasons in one file, from the client's guide
  (D2). *Acceptance:* a test that every item has exactly one right shelf and a reason. Runs
  alone first.
- **.2 The fridge and dragging.** Four shelves, eight items, drag with mouse and touch; a
  right drop stays, a wrong drop returns (D3, D5). Depends on .1. Runs alone: it sets the
  pattern the next two copy.
- **.3 Keyboard and screen reader.** Enter, arrows, Enter; announcements of item, shelf and
  result (D5). Depends on .2.
- **.4 Feedback and the score screen.** Screen 2's bead. Depends on .2.
- **.5 The walkthrough.** Runs the demo script below in a browser, recorded. Depends on .3
  and .4.

**Order:** .1, then .2, then .3 and .4 together (they touch different files), then .5.

**The demo script** (the acceptance bar):

1. Open the activity: four labelled shelves and eight items in a tray.
2. Drag raw chicken to the top shelf: it returns, and the message reads "Raw meat and fish
   go on the bottom shelf so they can't drip onto other food."
3. Drag raw chicken to the bottom shelf: it stays.
4. Tab to the lettuce, press Enter, arrow down to the salad drawer, press Enter: it is
   placed; the screen reader says "Lettuce placed in the salad drawer. Correct."
5. Place the other six; the score screen reads "7 out of 8 right first time" and lists raw
   chicken with its reason.
6. Press Try again: the tray is full and the score is cleared.

Line under it: *Done means: every step of this script performed in a browser and recorded,
with all the checks green. Not "the agent says so".*

## Screen 4 · Try it: write the acceptance

> Bead .3, keyboard and screen reader, has no acceptance yet. Six lines have been suggested.
> Pick the three a reviewer could check.

- [ ] Pressing Enter on the focused tomatoes, then arrow down twice, then Enter, places them
  in the salad drawer. **Yes:** a reviewer can do it and see it.
- [ ] The screen reader says "Tomatoes placed in the salad drawer. Correct." **Yes:** a
  reviewer can hear it.
- [ ] Keyboard use is smooth and intuitive. **No:** nobody can check "smooth". What would
  they press?
- [ ] Works with a screen reader. **No:** which reader, saying what? Without the words, any
  noise passes.
- [ ] Pressing Escape while an item is picked up puts it back in the tray. **Yes:** a key,
  an action, a visible result.
- [ ] Accessibility is handled properly. **No:** a wish, not a test.

Feedback appears per tick. On submit: *Three you can check, three you can only hope. The
builder is held to the first three; the second three would have let it decide what "proper"
meant.*

## Screen 5 · Try it: the epic review

> Before the epic runs, another agent reads it against the project and the decisions. It
> found this:

> **Finding.** Beads .3 and .4 are set to run together, but both change the drop handling
> file to add their messages. They will collide. Also: .3's acceptance line "works with a
> screen reader" names nothing a reviewer could hear.

*What do you do?*

- (a) Let it run; the builders will sort it out. *They will each change the file, and the
  second one in will overwrite the first. Found mid-run, this costs a rebuild. Found now, it
  costs one line.*
- (b) **Fix the epic now: give .4 its own file to add messages to, and replace .3's line
  with the words the reader should say.** *Yes. Every gap found before the run is one line;
  every gap found during it is a rebuild.*
- (c) Cancel .3; accessibility can be a later round. *It is a decision (D5) and the client's
  learners are the point. Fix the bead, not the scope.*

A line after: *In Ross's runs, gaps like these added between twelve and thirty pieces of work
to an epic before this review existed. Now they cost a sentence.*

## Screen 6 · Check

**Q1.** Which of these is acceptance a reviewer can check?

- (a) "The feedback is clear and helpful." *Clear to whom? Nothing to do or see.*
- (b) **"Dropping yoghurt on the bottom shelf returns it and shows 'Dairy goes on the top
  shelf, away from raw meat.'"** *Yes. Do this, see that.*
- (c) "Feedback works." *What would the reviewer do to find out?*

**Q2.** Two beads are set to run at the same time. What has to be true?

- (a) They are about different features. *Not enough. Different features can share a file.*
- (b) **They touch different files, and neither depends on the other.** *Yes. Disjoint
  touches and no dependency, or they collide.*
- (c) They are both small. *Size decides how long they take, not whether they collide.*

## Screen 7 · Takeaway

> **Done is defined before the build starts, as things a reviewer can do and see.** The
> epic review finds the gaps while they still cost a sentence.

The box gains its second wall: **done**.

## Statements

Module launched; two interactions with their picks; two answers; module completed.
