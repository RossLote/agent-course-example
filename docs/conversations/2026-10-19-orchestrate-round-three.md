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
