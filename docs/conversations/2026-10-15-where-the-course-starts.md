---
date: 2026-10-15
stage: conversation
title: Where the course starts
participants: [Ross, agent]
source: Claude Code session in the presentation repo, written during the session
---

# Where the course starts

A conversation, condensed, not verbatim: Ross in his own words, the agent in
its own. Ross dictates; his entries keep the point he was making and drop the
rest. It began in the presentation repo's session, after the blurb for the
talk's invite, and is copied here because it is this project's first log.

## Ross: a course, built the same way

- I'm also inviting non-engineers to the talk. We're an e-learning company
  that builds courses, and we have a lot of learning designers.
- I'd like to build an xAPI-compliant course with this method: one I can
  put on our LMS for people to work through, teaching them how to get the
  most out of agents, using the workflow I have.
- I think the workflow could be used just as well to build learning courses
  as code. Courses are generally made of code, and if you can build them
  with AI, that would be good. Do you think we could do that?
- To be clear: I'm not saying turn the presentation into a course. I'm
  saying we should also build a course people can go through.

## Agent: yes, and three things change

- Yes, and as a separate build in its own repo. A course package is web
  content with xAPI statements sent to the LMS's record store as the
  learner progresses, which the same stack as the presentation builds. The
  stages map: the brief is where the learning designers think, in
  plain-text questions and answers; the epic turns modules into beads with
  acceptance criteria; orchestrate builds; the PR's walkthrough recording
  is a run-through of the course, one chapter per module, which a learning
  designer can review without reading code. The gates map too: tests on
  the statements the course sends, and a Playwright run-through against a
  fake record store checking every statement arrives.
- Three things change. Content review: the review skills hunt code bugs
  with failure scenarios, and a course fails pedagogically (an objective
  nothing teaches, an activity that does not test what it claims, a wrong
  claim about agents), so the finders need lenses for objective alignment,
  accessibility and accuracy, the skeptics cite a source instead of a
  line, and a learning designer still signs the content off. Content
  separate from engine: the designers author modules as data and the
  agents build the engine that renders them and emits statements, so
  wording changes need no run. Package format: plain xAPI packages, cmi5
  and SCORM launch differently and the LMS decides which, so that is found
  out before the brief.
- Caveats: courses are code at export, not in how designers work today,
  so this course is hand-built rather than exported from an authoring
  tool, and a first one should be text and interaction, since narration
  and video do not come out of the workflow. The subject is the talk's,
  so the talk's logs and the skills repo seed the content, but the reader
  is alone with it rather than listening to you.
- I suggested starting it as an idea bead in a new repo, as the
  presentation started, and running the brief with a learning designer in
  the room.

## Ross: start with the new repo

- Let's start with the new repo. Create it for me next to the presentation
  one, set it up with beads and the other things, to the point where we can
  start developing. Then I'll close this session down and move over into
  that repo.

## Agent: the repo set up

- This repo, at `~/Projects/personal/agent-course/agent-course`, laid out
  as your other projects are. Git on `main` with the repo-level identity;
  beads initialised with the prefix `agent-course`, the JSONL export in
  every commit, and the Claude Code hook that primes a session; the six
  memories that carry over from the presentation repo, adapted.
- The presentation's toolchain, copied and trimmed: Vite, React, TypeScript,
  ESLint, Vitest, Playwright, the fast and full gates, and the walkthrough
  target with its step helper, on ports that do not clash with the
  presentation's. A placeholder page so every gate runs green, which it
  did: lint, typecheck, one unit test, one smoke spec, the build.
- [PLAN.md](../../PLAN.md) in the presentation's shape: the occasion, the
  idea, how the workflow maps and what changes, constraints, open questions
  for the brief, decisions (none yet) and a log. The idea bead `agent-course-r4n` in the
  shape the brief resumes from. CLAUDE.md and AGENTS.md carry the build
  commands and the conversation-log convention.
- Not done: no GitHub repo, so no origin and no Dolt remote; the recipe is
  in `bd memories` under `remote-pending`. One commit on main.
