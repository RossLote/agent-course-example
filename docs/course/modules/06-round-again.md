# 06 · Round again

**Wall:** the arrow round the box. **Time:** about 6 minutes.

**Objective.** The learner expects a second round and can say why; and when a check misses
something, they change the check rather than the hope.

## Screen 1 · The client tries it

> The fridge activity is live. The client's feedback: "Great. Could learners get a hint after
> two wrong drops? And the salad drawer should take the eggs too." Neither is in the brief.
> Nothing went wrong. This is round two.

Quote card, Ross: *The first round is not necessarily the one that hits. You merge it, and
you go round again. You may not know what you want until you see the first round.*

## Screen 2 · Rounds

Three cards:

1. **Big things are not one-shot.** A small fix, yes. A piece of a course, no: a first round
   to see it, a second to get it right. Expecting that is not failure; it is the plan.
2. **The first round's feedback shapes the second.** Round two starts with a brief, from
   what the client saw. The hint and the eggs become decisions D9 and D10, a short epic, a
   run, a pull request. Same loop, smaller.
3. **Each round leaves a record.** The decisions, the beads, the run's record, the pull
   request. The next brief starts from them, not from memory.

## Screen 3 · The check that missed

> Not every miss is the client's taste. Sometimes a wall has a gap. This happened, in Ross's
> work, in October 2026.

The story, as cards stepped with "next":

1. A feature was built twice, on purpose: once by an agent in one go, with no brief and none
   of this workflow, and once by this workflow, with every agent told to ignore the other
   attempt. The question was whether the workflow did any better than the one-shot.
2. A reviewer on the one-shot version asked for one change: a permission check looked at
   whether a field was *present* in the request, when it should have looked at whether the
   field was *changing*. An ordinary user who fetched a record, changed something else and
   sent it all back would be refused.
3. The workflow's version had the identical check. It had been written into the epic as a
   settled decision, so no review questioned it. The adversarial review found three other
   things and confirmed none. Two automated review rounds and two more review passes found
   nine things each. None of them was this.
4. The workflow had a gap: nothing in it asked what an ordinary caller would do. The decision
   was settled, so every agent respected it.
5. What changed, in the days after: a new lens for the finders, *what would an ordinary
   caller do*; the skeptic's rule tightened so that "the code does what the spec says" is
   not a refutation when the spec is the problem; the rule that a refutation must cite a
   line; and a new step, the **retro**, that reads several runs' records back to find what
   goes wrong more than once.

Line under: *The agent was not told to be more careful. The check was changed.*

Aside, **retro**: *reading several runs' records to see what repeats, and proposing changes
to the process.*

## Screen 4 · Try it: what would you change?

> A reviewer found something none of the checks did. Tick what you would do.

- [ ] Tell the builders to be more careful about permissions. **No.** They will agree. Hope
  is not a wall (module 03).
- [ ] Add a lens to the finders: what would an ordinary user do with this? **Yes.** A finder
  with that question would have found it.
- [ ] Write the decision as settled again, more clearly. **No.** It was settled; that was the
  problem. A settled decision still needs a reviewer who is allowed to question whether it
  is the right rule.
- [ ] Look back over the last few runs to see whether this kind of miss repeats. **Yes.**
  That is the retro. One miss is a story; a pattern is a change to the process.
- [ ] Add a test for the exact case that was missed. **Yes, and not only.** The test catches
  this case next time. The lens catches the next case like it.

On submit: *Three changes to the process, none to the hope.*

## Screen 5 · Check

**Q1.** The client asks for two things that were not in the brief. What does that mean?

- (a) The brief failed. *It did not. The client saw round one and knew what they wanted.
  That is what round one is for.*
- (b) **Round two: a short brief, two decisions, a small run.** *Yes. Same loop, smaller.*
- (c) The builder should have anticipated it. *Then it would have guessed. Module 00.*

**Q2.** A review missed a bug that a person caught. What is the useful question?

- (a) Which agent was at fault? *None of them disobeyed anything. They did what the process
  asked.*
- (b) **Which check, if it had existed, would have caught it, and does the miss repeat?**
  *Yes. That is the retro's question.*
- (c) Should we stop trusting the reviews? *They found fifty things in one run. One miss is
  a gap to close, not a reason to go back to reading everything.*

## Screen 6 · Takeaway

> **Expect a second round. When a check misses, change the check.** The process is not set
> in stone; it is the thing you improve.

The box is complete, and the arrow of the retro is drawn round it.

## Statements

Module launched; the story's steps and the what-would-you-change ticks as interactions; two
answers; module completed.
