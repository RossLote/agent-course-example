# Glossary

Plain-words definitions of the workflow's names the five modules use, in the order the
course introduces them. Where a module gives a name an aside, it is the first time that
module uses it. The agents' own working words stay out of the course (C22).

- **Agent.** An AI that does not just answer but acts: reads files, runs commands, writes
  code, and keeps going until it thinks it is done. Claude Code is the one the workflow
  uses; the course applies to any.
- **Brief.** The conversation before anything is built: you describe what you want
  loosely, the agent explores and asks you ranked questions a few at a time, with its
  recommendation and its own ideas, and you accept, decline or talk them through. The
  decisions come out numbered with their reasons.
- **Decision.** One settled answer from the brief, written as a sentence with its reason,
  numbered (D1, D2…) so later work can cite it. The decisions are the record.
- **Orchestrator.** The agent that runs the job while you are away. It turns the decisions
  into a plan, waits for your go, hands each piece to a builder, reads what each builder
  hands back against its piece, sends the reviewers in, and never writes code itself.
- **Epic.** The plan's name: the job cut into pieces, each saying what a reviewer will see
  when it is done, with the order they run in and a demo script. Another agent reads it for
  gaps before you say go.
- **Demo script.** Numbered steps a person can perform to see the whole thing work. The
  recorded walkthrough follows it, and what is not in it is not proven.
- **Gate.** The checks a builder's work must pass before it can hand it back: code style
  (lint), types and the unit tests, with their output pasted into its report. The run
  through the whole thing in a browser is the full gate, at the end of the run.
- **Review.** Other agents reading the built work, in three layers: simplify, which looks
  for what could be simpler or reuse what exists; a plain review for obvious bugs; and the
  adversarial review, where many reviewers each read the work one way and every finding is
  then checked by skeptics.
- **Finding.** One suspected problem, with the situation in which it goes wrong.
- **Skeptic.** The agent that checks one finding and says confirmed, refuted or uncertain.
  A finding dies only when a skeptic shows what makes the failure impossible; uncertain is
  allowed, and keeps the finding alive.
- **Pull request.** The hand-back: everything the run did, written so one time-poor
  reviewer can judge it without reading the code. Its first three lines are the door, what
  to do before merging, and the undo.
- **Door.** Two-way if undoing the change puts everything back; one-way if something is
  lost or changed for good.
- **Walkthrough.** A recorded run through the demo script, slowed down, one chapter per
  step, so a person can watch the thing work and judge it.
- **Round.** One pass through the loop. Big things take more than one: a first round to see
  it, a second to get it right.
- **Retro.** Reading several runs' records back to see what went wrong more than once, and
  changing the process: when a check misses something, the check changes.
- **Skill.** A written-down way of working that the agent follows every time. The whole
  workflow is a handful of them, made by telling the agent how you work; a process you like
  can become one.
