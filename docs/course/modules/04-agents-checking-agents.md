# 04 · Agents checking agents

**Wall:** other agents. **Time:** about 9 minutes. The heart of the course.

**Objective.** The learner can name the three review layers (simplify, review, adversarial
review), say which kind of mistake each catches, and play the skeptic on one finding:
confirm, refute only by citing the line, or say uncertain.

## Screen 1 · The build was green

A card of real numbers, from one real run of this workflow (a public project of Ross's, a
presentation, built in October 2026):

| Pieces built | Review agents | Findings | Fixed |
|---|---|---|---|
| 16 | 16 finders | 50 | 39 |

> Every one of those sixteen pieces passed its gate. The gate catches what a test can
> describe. It does not catch three copies of the same function, a message that reads
> wrongly, or a drop that is silently lost while another message is on screen. Those took
> other agents, reading with a question in mind.

Quote card, Ross: *Agents are better at reviewing than building. Whenever you have agents do
anything, have agents look at what the agents have done.*

## Screen 2 · Three layers, three kinds of mistake

Three cards, in the order they run:

1. **Simplify.** Agents over-build, and they write a new helper rather than find the one
   that exists. Four reviewers read the whole change with one question each: *should this
   reuse something? is it more complicated than it needs to be? does it waste work? is it at
   the wrong level?* The fixes are applied and the gate run again. Any fix that changes
   behaviour is reverted: this layer tidies, it does not decide.
2. **Review.** A plain pass for the obvious bugs: a typo in a shelf name, a message that
   never shows, a case that was not handled. Its fixes are applied first so the next layer
   is not spent on easy things.
3. **Adversarial review.** The hard look. It is built so that a real bug cannot be waved
   away:
   - **Find.** Several finders each read the work through one **lens** (is it correct; what
     states can the screen be in; is it consistent with what already exists; what would an
     ordinary user do). Each finding carries a concrete scenario in which it goes wrong and
     the exact lines the finder read.
   - **Dedupe.** One agent reads only the list of findings, never the code, and says which
     ones are the same bug, so each bug is verified once and fixed in every place.
   - **Verify.** Two **skeptics** per finding, independently. **Confirmed**: they read the
     lines and the scenario happens. **Refuted**: only by citing the exact line that makes
     the scenario impossible; a refutation without a line is recorded as uncertain.
     **Uncertain**: a legitimate answer that keeps the finding alive at lower priority.
     If the two disagree, the finding goes to the fixer with both views; there is no third
     vote to kill it.
   - **Fix.** Every surviving finding becomes a piece of work and goes through the box.

Line under: *Why so strict about refuting? An earlier version let skeptics refute whenever
they were unsure. The record showed it killed a real bug, which a second review raised again
later. A wrong refutation costs a bug in production; an uncertain costs a few minutes.*

## Screen 3 · Try it: follow one finding

A stepped play, with "next", that ends with the learner as the skeptic.

**Step 1, the finder.** A finder with the *screen states* lens reads the fridge activity and
reports:

> **Finding.** If the learner drops a second item while a wrong-placement message is still
> on screen, the drop is ignored: the item snaps back to the tray with no message.
> *Scenario:* drop raw chicken on the top shelf (message shows for 2.5 seconds); within that
> time drop cheese on the top shelf; cheese returns to the tray and nothing explains why.
> *Lines read:* the drop handler, lines 40–58; the message timer, lines 80–84.

**Step 2, the deduper.** A finder with the *correctness* lens found the same thing in
different words. The deduper folds the two into one finding with both locations.

**Step 3, you are the skeptic.** You are shown the finding and three excerpts:

- (A) The drop handler, line 41: `if (message.visible) return;` and nothing after it.
- (B) The message timer, line 82: the message hides after 2.5 seconds.
- (C) A test, "shows the reason on a wrong drop": drops one item, checks the message.

*Your verdict?*

- (a) **Confirmed, citing A.** *Yes. Line 41 returns before anything happens when a message
  is showing. The scenario happens. You cited the line.*
- (b) Refuted: there is a test for wrong drops (C). *Not a refutation. The test drops one
  item. It never exercises this scenario. "A test exists" refutes nothing unless it tests
  exactly this.*
- (c) Refuted: nobody drops two items within 2.5 seconds. *Not a refutation. "Unlikely" is
  about how bad it is, not whether it is true. Likelihood is severity.*
- (d) Uncertain. *Allowed, and never wrong to say. But you were shown line 41; the honest
  reading here is confirmed. Uncertain is for when you cannot find the line either way.*

**Step 4, the fix.** The second skeptic also confirmed. The finding becomes a piece of work:
*a drop while a message is showing replaces the message*, with its own acceptance, built in
the box, gate green.

## Screen 4 · Try it: who catches it?

> Four things went wrong in the fridge build. Match each to the layer that catches it.

| Mistake | Layer |
|---|---|
| Three copies of the "return the item to the tray" code, one per shelf. | **Simplify** (reuse) |
| The message for yoghurt says "Dairy goes on the top shelf" and the top shelf is labelled "Top (ready to eat)". | **Review** (obvious) |
| A drop during a message is silently lost. | **Adversarial review** (a scenario, verified) |
| A 60-second timer was built, which D6 said no to. | **None of the reviews: the epic.** The acceptance bar has no timer step, and the walkthrough would show one. The reviews read code for mistakes; the demo script holds the build to the decisions. |

Feedback per match. The fourth row is the point: *not every miss is a review's job. Some are
caught by done being defined.*

## Screen 5 · Check

**Q1.** A skeptic writes: "Refuted. The framework handles this." No line is cited. What is
recorded?

- (a) Refuted; frameworks do handle things. *Which line of the framework, for this call?
  Without it this is a belief.*
- (b) **Uncertain; the finding stays alive.** *Yes. A refutation without a line is not one.*
- (c) Confirmed, to be safe. *No. Confirmed also needs the lines read. Uncertain is the
  honest verdict.*

**Q2.** Simplify's reviewer proposes a change that makes the score screen also show the
time taken. What happens to it?

- (a) Applied; it is an improvement. *It is a change of behaviour, and D6 said no timer.*
- (b) **Reverted; simplify tidies, it does not decide.** *Yes. A behaviour change in the
  simplify layer is reverted on sight.*
- (c) Sent to the client to decide. *The record already decided. Reverted.*

## Screen 6 · Takeaway

> **The same kind of agent that guessed in module 00 is a sharp reviewer, given one question
> and the rule that it must cite its evidence.** Three layers, three kinds of mistake, and
> no finding dies on a feeling.

The box gains its fourth wall: **other agents**.

## Statements

Module launched; the skeptic verdict and the four matches as interactions; two answers;
module completed.
