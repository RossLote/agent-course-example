---
date: 2026-10-19
stage: build
title: Orchestrating round three
participants: [Ross, agent]
source: Claude Code session in this repo, written during the session
---

# Orchestrating round three

A conversation, condensed, not verbatim: Ross in his own words, the agent in
its own. The session runs epic agent-course-bsg with /orchestrate; most of it
is the agent working alone, so the log is short.

## Ross: run the epic

- /orchestrate agent-course-bsg.

## Agent: set up, base is main

- Rounds one and two are merged into main, so the epic branch
  agent-course-bsg/round-three starts from main, as the epic's RUN RECORD
  says, in its own worktree beside the repo. The fast gate is green there
  before anything changes: lint, types and 400 unit tests.
- No remote, so no pull request: the run ends with the branch named, the
  recorded walkthrough sent to you and a short summary here.
- The decision record (.1) and the unit tests that hold whatever the content
  says (.2) start together; they touch different files.

## Agent: the build, up to the e2e tier

- .1 and .2 landed in one round each. The unit tests now read the course at
  run time or render an inline fixture, and they stayed green with modules
  05 to 07 gone, a screen inserted, three modules cut to the bone and copy
  changed.
- .3 drew the box square with four walls, put the five modules in
  course.yaml and deleted 05 to 07; .4 to .7 wrote the five modules, three at
  a time, each worker walking its module in the running app.
- Two things the workers found I settled on the way: module 03 quoted round
  two's step 4, so I made it read as module 02 now adds it; and the box's
  caption showed bold as asterisks, though the content guide promises bold in
  any copy, so a small piece (.15) renders it like all other copy.
- The fast gate is green after every merge (405 unit tests). The e2e tier
  (.8) is next, then the review passes and the walkthrough.

## Agent: reviews, the walkthrough, done

- .8 brought the e2e tier to the five modules and 10 of 10; the full gate went
  green: lint, types, unit, e2e and the package check.
- Simplify, then a plain review, then the adversarial review: ten finders, 32
  findings, 26 after folding duplicates, 25 confirmed and one tie. Most were
  about the course telling the truth about the workflow: the skeptic rule
  (both skeptics must show a finding impossible, not one), the retro proposes
  changes rather than making them, the walkthrough comes last, the content
  guide's examples still taught round two's gate. All are fixed in four
  batches; the tie (round two's decisions numbered D9 and D10) held, because
  a later brief does carry the numbering on.
- One choice I made for you: progress saved against round two's content is
  dropped when round three loads, because the modules under 00 to 04 are new
  and nothing was launched. It is in the epic's DECISIONS and reversible.
- The walkthrough plays the acceptance bar in six chapters. The first take
  ran 39 seconds, too fast to follow, so it was recorded again with a pause
  on every screen: 4 minutes 43. I sent it to you; there is no remote, so no
  pull request. The branch to merge is agent-course-bsg/round-three.

## Ross: two walls with the same number

- In the home page picture, the box on the right has two walls both numbered 02.
  Quickly fix that.

## Agent: walls numbered one to four

- The numbers were the module that raises each wall, and module 02 raises two. I
  numbered the walls in the order they go up instead: 01 the record, 02 the gate,
  03 the reviews, 04 evidence. Module 03's comparison table now cites 04 evidence,
  and C20 says why. I made it on the round-three branch, so it merges with the rest.
