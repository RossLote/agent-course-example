# 03 · The box

**Wall:** the gate. **Time:** about 6 minutes.

**Objective.** The learner can name the walls that keep a builder in (its own working area,
the files it may touch, the gate of checks that must be green, done written into its
instructions) and can tell a wall from a wish.

## Screen 1 · The wandering worker

> Bead .4 is clear. The builder gets it, and its decisions, and starts. Forty minutes later:

> **Agent:** Done! Feedback and the score screen are in. While I was there I noticed the
> shelf layout was a bit cramped so I tidied that up too, and I simplified the drag code. I
> ran it and it looks good.

> Two things happened that nobody asked for. The tidying changed the file bead .3 was working
> in. The simplified drag code no longer works on touch. The builder does not know either of
> these, because nothing stopped it and nothing checked.

Quote card, Ross: *Tests, linting, whatever else you have: you want to put the agent in a
tight box it can't wander off from.*

## Screen 2 · The walls

Four cards, each a wall the workflow puts up before a builder starts:

1. **Its own working area.** Every builder gets a separate copy of the project (a
   **worktree**) and a list of the files it may touch. Two builders at once cannot tread on
   each other, and a change outside the list is a failure, not a favour.
2. **The gate.** Before the builder may say done, a set of checks must all pass: code style,
   types, the unit tests, and a run through the thing in a real browser. A red check is the
   box pushing back. The builder fixes and runs it again, as many times as it takes.
3. **Done, in its instructions.** The bead's acceptance, the gate, and the rule "nothing
   outside your files" are in the prompt the builder is given, as the finish line, not as
   advice.
4. **Its word is not taken.** The builder pastes the gate's own output into its report, and
   says plainly what it could not confirm. The orchestrator reads the output, not the
   summary. "I ran it and it looks good" is not a gate result.

Aside, **gate**: *the checks that must be green before work is handed back.* Aside,
**worktree**: *a builder's own copy of the project.*

## Screen 3 · Try it: build the box

> Bead .4 is about to start. Choose what goes round the builder. Tick everything that is a
> wall.

- [ ] A unit test that every item has exactly one right shelf and a reason. **Wall.** If the
  builder breaks the data, this goes red.
- [ ] A run through the demo script in a browser, which must pass. **Wall.** The touch drag
  breaking would be caught here.
- [ ] Its own working area, with the feedback and score files as the only ones it may
  touch. **Wall.** The shelf layout is not on the list.
- [ ] "Done means" written into its instructions: the acceptance, the gate green, nothing
  outside its files. **Wall.** The finish line, in writing.
- [ ] A line asking it to please be careful and not change anything else. **Not a wall.**
  It will agree, and then it will tidy the shelves. Hope is not a check.
- [ ] A much longer prompt explaining the whole project so it understands. **Not a wall.**
  More context is not a constraint. The record from the brief is what it needs; the rest is
  room to wander in.
- [ ] Asking it to tell you when it has finished. **Not a wall.** It will. The question is
  what it has to show.

On submit, the four walls draw themselves round the builder.

## Screen 4 · The same bead, twice

A side-by-side play, stepped with "next":

**Loose.** The builder changes the feedback files, tidies the shelves, simplifies the drag,
reports "looks good". Done in 40 minutes. The touch bug and the collision with .3 are found
a week later by the client.

**Boxed.** The builder changes the feedback files. It tries to tidy the shelves: the file is
outside its list, so the change is rejected. It runs the gate: the browser run goes red at
step 3 (touch drag). It reads the failure, fixes it, runs the gate again: green. It reports
with the gate's output pasted in and one line: "Could not confirm the screen-reader wording;
that is bead .3's." Done in 55 minutes. Nothing is found a week later.

Line under: *Fifteen minutes slower. The whole of the difference is that the box pushed back
twice.*

## Screen 5 · Check

**Q1.** The gate is red. What happens?

- (a) The builder explains why the failure does not matter and hands back. *A red gate is
  not a discussion. Green or not done.*
- (b) **The builder fixes it and runs the gate again, as many times as it takes.** *Yes.
  The gate is the finish line; it does not move.*
- (c) You turn off the failing check so the work can land. *Then it is not a wall. If the
  check is wrong, that is its own piece of work, found and fixed as one.*

**Q2.** The builder's report says "I tested it manually and everything works." The gate
output is not in the report. What do you do?

- (a) Accept it; it tested it. *Its word. Module 00.*
- (b) **Treat it as not done until the gate's own output is there and green.** *Yes. The
  output, not the summary.*
- (c) Run the tests yourself. *You can, but then you are the gate, every time, for every
  builder. The point is that the box does it.*

## Screen 6 · Takeaway

> **A builder needs walls, not advice.** Its own area, the files it may touch, a gate that
> must be green, and done written in. The gate's output is the proof, never the builder's
> word.

The box gains its third wall: **the gate**.

## Statements

Module launched; the walls interaction with its ticks; the two-play step count; two answers;
module completed.
