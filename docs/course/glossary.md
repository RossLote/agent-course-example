# Glossary

Plain-words definitions of the workflow's names the five modules use, grouped by the module
that introduces each, in the course's order: Agent from 00, Brief to Round from 01,
Orchestrator to Skeptic from 02, Pull request and Door from 03, Retro and Skill from 04.
Where a module gives a name an aside, the aside is on the screen where that module first
uses it. The agents' own working words stay out of the course (C22).

- **Agent.** An AI that does not just answer but acts: reads files, runs commands, writes
  code, and keeps going until it thinks it is done. Claude Code is the one the workflow
  uses; the course applies to any.
- **Brief.** The conversation before anything is built: you describe what you want
  loosely, the agent explores and asks you ranked questions a few at a time, with its
  recommendation and its own ideas, and you accept, decline or talk them through. The
  decisions come out numbered with their reasons.
- **Decision.** One settled answer from the brief, written as a sentence with its reason,
  numbered (D1, D2…) so later work can cite it. The decisions are the record.
- **Round.** One pass. The brief asks its questions in rounds, and the whole loop goes round
  too: big things take more than one, a first round to see it and a second to get it right.
- **Orchestrator.** The agent that runs the job while you are away. It turns the decisions
  into a plan, waits for your go, hands each piece to a builder, reads what each builder
  hands back against its piece, sends the reviewers in, and never writes code itself.
- **Walkthrough.** A recorded run through the demo script, slowed down, one chapter per
  step, so a person can watch the thing work and judge it.
- **Demo script.** Numbered steps a person can perform to see the whole thing work. The
  recorded walkthrough follows it, and what is not in it is not proven.
- **Epic.** The plan's name: the job cut into pieces, each saying what a reviewer will see
  when it is done, with the order they run in and a demo script. Another agent reads it for
  gaps before you say go.
- **Gate.** The checks a builder's work must pass before it can hand it back: code style
  (lint), types and the unit tests, with their output pasted into its report. The run
  through the whole thing in a browser is the full gate, at the end of the run.
- **Review.** Other agents reading the built work, in three layers: simplify, which looks
  for what could be simpler or reuse what exists; a plain review for obvious bugs; and the
  adversarial review, where many reviewers each read the work one way and every finding is
  then checked by skeptics.
- **Finding.** One suspected problem, with the situation in which it goes wrong.
- **Skeptic.** One of the two agents that check each finding on their own, each saying
  confirmed, refuted or uncertain. A finding dies only when both skeptics show what makes
  the failure impossible; when only one refutes, it is a tie, which the builder sent to fix
  it settles by reading the line that skeptic cited. Uncertain is allowed, and keeps
  the finding alive.
- **Pull request.** The hand-back: everything the run did, written so one time-poor
  reviewer can judge it without reading the code. Its first three lines are the door, what
  to do before merging, and the undo.
- **Door.** Two-way if undoing the change puts everything back; one-way if something is
  lost or changed for good.
- **Retro.** Reading several runs' records back to see what went wrong more than once, and
  proposing changes to the process, such as changing a check that missed something. It
  changes nothing itself: you decide which proposals to take.
- **Skill.** A written-down way of working that the agent follows every time. The whole
  workflow is a handful of them, made by telling the agent how you work; a process you like
  can become one.
