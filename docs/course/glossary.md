# Glossary

Plain-words definitions of the workflow's names, in the order the course introduces them.
Each appears in an aside the first time a module uses it.

- **Agent.** An AI that does not just answer but acts: reads files, runs commands, writes
  code, and keeps going until it thinks it is done. Claude Code is the one the workflow
  uses; the course applies to any.
- **Brief.** The conversation before anything is built: you describe what you want, the
  agent asks you ranked questions a few at a time, you answer in a paragraph, and the
  decisions come out numbered with their reasons.
- **Decision.** One settled answer from the brief, written as a sentence with its reason,
  numbered (D1, D2…) so later work can cite it.
- **Bead.** One unit of work written for execution: the outcome, the decisions that bind
  it, what to read first, what it may touch, and how a reviewer will know it is done. Much
  smaller and more exact than a ticket.
- **Epic.** The set of beads for one piece of work, with the decisions, the order and
  grouping they run in, the acceptance bar and what done means.
- **Acceptance.** What a reviewer can see to know a bead is done, written as things they
  can do and observe.
- **Acceptance bar.** The epic's demo script: numbered steps a person can perform to see the
  whole thing work.
- **Epic review.** A check of the epic before it runs: paths that do not exist, beads that
  would collide, acceptance a reviewer could not see.
- **Orchestrate.** Running the epic unattended: workers build the beads, then the reviews
  run, then the walkthrough is recorded and the pull request written.
- **Worker.** The agent that builds one bead, inside its own working area, with the gate as
  the condition of saying done.
- **Worktree.** A separate copy of the project a worker works in, so it cannot touch what
  it is not meant to and two workers cannot tread on each other.
- **Gate.** The checks that must all pass before work can be handed back: code style
  (lint), types, unit tests, and an end-to-end run through the thing in a browser.
- **Simplify.** The first review after the build: four reviewers look for code that should
  reuse what exists, that is more complicated than needed, that wastes work, or that sits
  at the wrong level; any fix that changes behaviour is reverted.
- **Review.** The plain pass: obvious bugs found and fixed before the harder review.
- **Adversarial review.** Find, dedupe, verify: finders each read the work through one
  lens and report findings with a failure scenario; a deduper folds findings that are the
  same bug; two skeptics verify each one.
- **Lens.** One way of reading the work (correctness, the states a screen can be in,
  consistency with what exists, what an ordinary caller would do, and so on). One finder,
  one lens.
- **Finding.** One suspected problem, with the concrete scenario in which it goes wrong
  and the lines the finder read.
- **Skeptic.** The agent that verifies one finding: confirmed, refuted or uncertain. A
  refutation must cite the exact line that makes the failure impossible; uncertain keeps
  the finding alive.
- **Walkthrough.** A recorded run through the acceptance bar, slowed down, one chapter per
  step, so a person can watch the thing work.
- **Pull request.** The hand-back: everything the run did, written so one time-poor
  reviewer can judge it without reading the code. Its first three lines are the door, what
  to do before merging, and the undo.
- **Door.** Two-way if undoing the change puts everything back; one-way if something is
  lost or changed for good.
- **Round.** One pass through the loop. Big things take more than one: a first round to see
  it, a second to get it right.
- **Retro.** Reading several runs' records back to see what went wrong more than once, and
  proposing changes to the process.
