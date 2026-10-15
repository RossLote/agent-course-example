---
date: 2026-10-15
stage: conversation
title: What the course teaches
participants: [Ross, agent]
source: live, written during the session
---

# What the course teaches

A conversation, condensed, not verbatim: Ross in his own words, the agent in
its own. Ross dictates; his entries keep the point he was making and drop the
rest. The first session in this repo, after the presentation repo's session
set it up; it comes before the brief.

## Ross: first, the content

- This repo was created by another agent from another project; the docs
  directory should give you everything you need.
- The first thing we need to do is discuss exactly what the content will be.
  You'll generally know, because you have access to all the skills I'll be
  talking about, and the workflows. Let's get started.

## Agent: a loop of seven modules, and four questions

- I read the plan, the idea bead, the presentation repo's plan and logs (the
  invite blurb, the first requirements, the shaping session, the retro-origin
  dossier) and the skills README. The course's subject is the talk's: the
  loop, and the message that trust comes from the work around the agent
  (planning, checks, judging what comes back) and that the process keeps
  changing.
- I proposed one module per stage of the loop, each with an objective stated
  as what the learner can do afterwards, the real artefact from the talk's
  record as its example, and an activity that tests the objective:
  0. Why a workflow: what goes wrong with a one-shot ask; the loop at a
     glance; where the effort goes.
  1. Work the agent can read (beads): a bead against a Jira ticket; detail at
     the level of execution; memories.
  2. Getting it out of your head (conversation and brief): the playback; rounds
     of ranked questions; decisions as the output.
  3. Define done before you start (epic): slices with acceptance criteria,
     what to read first, what each touches, the acceptance bar as a demo
     script, the epic review.
  4. Let it run, with checks (orchestrate): workers in parallel, then
     simplify, review and adversarial review, and the class of mistake each
     layer catches.
  5. Judging what comes back (the pull request): the door, the undo, the
     evidence and the recorded walkthrough; reviewing without reading the
     diff.
  6. Round again, and change the process: MVP then improvement rounds; the
     training-vault story; the retro over several runs.
- What changes from the talk: the talk has almost no text because you speak
  over it, so nearly all the course's prose is new; the artefacts carry over;
  the activities are new; module 0 is new because the talk assumes it.
- Four questions, ranked by how much they change the content, each with my
  recommendation: who the learner is and what they do differently afterwards
  (recommend everyone, principles first, the workflow as the worked example);
  whether the learner touches a real agent during the course (recommend
  everything inside the course for round one, with unassessed "try this"
  prompts); whether the examples are the real record or a neutral invented
  feature (recommend the real record, with the training-vault story told
  without names); and whether a learning designer joins for the brief or you
  design round one yourself.
- Logged here; committed to main per your standing instruction, no remote to
  push to yet.

## Ross: the learner, the thesis, and no real agent

- The learner is the LEDs and LXDs, and anyone else who is interested. They
  all have some technical background, and the developers could use it too.
- It's mostly to teach what works and what doesn't when working with agents.
  The thing I specifically want to emphasise is that agents are better at
  reviewing than building. Whenever you have agents do anything, also have
  agents look at what the agents have done. That is the emphasis of my whole
  workflow: checking and rechecking, and having things in place that keep the
  agents from wandering off. Tests are really good for this; with tests and
  linting and whatever else in place you put the agent in a tight box it
  can't wander off from.
- The learner will not touch a real agent. We could have some fun
  interactions where they talk to a fake agent and get fake responses.
- The examples don't need to be the real record. This is not the same as the
  presentation; we're teaching them how to do things and can give examples.
  What I'm trying to show the LEDs is that they could use AI for things like
  this: on the other side of the business the bespoke team sometimes has to
  break away from the authoring tools and build in code, and I want to
  emphasise that this is a thing we can do.
- Once we've decided what we're going to do, we'll send it to Claude Design
  for mockups. First, the content.

## Agent: the content re-cut around the thesis

- The loop stays as the worked example, but every module now teaches one wall
  of the box or one layer of checking, in a fixed shape: something goes wrong
  without the practice, the practice, the learner tries it on a fake agent,
  and what it catches. Seven modules: what works and what doesn't (a vague
  ask one-shotted wrong); write it down (the brief and the bead); define done
  first (the epic's acceptance bar); the box (tests, lint, gates, the
  worktree); agents checking agents (simplify, review, adversarial review;
  the heart of the course); judging what comes back (the pull request as
  evidence); round again (MVP then rounds, and when a check misses, add a
  check, the training-vault story without names).
- The fake agent is a scripted dialogue authored as data: the learner picks a
  reply, the agent answers from the script, some branches wander off on
  purpose. That fits content-separate-from-engine and needs nothing at run
  time.
- Four questions: the worked example (recommended a small bespoke learning
  interaction a client asked for that the authoring tool cannot do, taken
  from brief to pull request; alternatives this course itself or a generic
  software feature); how far the fake agent goes (recommended scripted
  choose-your-reply, no free text judged); vocabulary (plain words with the
  real names in an aside, or the real names throughout); and what LED stands
  for.
- Taken as settled: nobody touches a real agent; examples need not be the real
  record; Ross designs round one himself and Claude Design mocks it up once
  the content is fixed.

## Ross: you decide; I'll review the draft

- LED and LXD are the same role, just different acronyms.
- Honestly, I don't want to think about this too much. I'd like you to make
  as many of the decisions as possible. Believe it or not, I'm not an LXD,
  so I'm not going to pretend to know how to make a good course.
- Come up with the course content: something interactive, something
  interesting, completely based on my workflow, and go from there. I'll
  review the draft. Normally we'd do a brief and you'd ask me loads of
  questions, but at this point I'm relying on you.

## Agent: the storyboard, and fifteen decisions

- I read the brief, epic, epic-review, orchestrate, adversarial-review, pr
  and retro skills and the skeptic agent so the course says what the
  workflow does, and took one real run's numbers from the presentation
  repo's epic.
- I wrote the draft as a storyboard in `docs/course/`: a README (who it is
  for, the one message, the outcome, the worked example, the module shape,
  the fake agent, assessment, statements, decisions C1–C15 with reasons,
  what stays open for the brief), eight modules with every screen, the
  full script of every fake-agent interaction and every check question
  with its feedback, and a glossary.
- The decisions, in short: eight modules following the loop, about fifty
  minutes, each standalone; every module shows something going wrong, then
  the practice, then the learner tries it on a scripted fake agent, then
  two checks, then a takeaway, and a box diagram gains one wall per module
  (the record, done, the gate, other agents, evidence, the retro's arrow).
  The worked example is a fridge-stacking activity for a client's
  food-hygiene course that the authoring tool cannot do. The fake agent is
  scripted choose-a-reply with deliberate wrong turns; free text is only
  played back. Examples are invented, with one real card of numbers and the
  check-that-missed story told without names. The workflow's own names,
  introduced in plain words, with a glossary. Second person, Ross credited.
  Checks give feedback on every option; score reported, no pass mark in
  round one. Text and interaction only; WCAG 2.2 AA.
- Left for the brief: the package format and LMS launch, the authoring
  format, look and feel, a pass mark, and whether Ross's name appears.
- PLAN.md's status, §5 and log updated; the idea bead's notes point at the
  draft; committed to main.

## Ross: show me the modules as a designed course

- Can you create a Claude Design artifact for this? I'd like to see your
  modules in the context of a designed course. That'll make it easier for
  me to decide whether it's any good or not.

## Agent: the first design pass

- Built at https://claude.ai/artifact/My3Z79MHvyCBktJsMfAggM: ten
  artboards, each a working page. The course home with the thesis, the
  open box and the eight modules; then the key screen of each module, with
  its interaction working: the vague ask and "tick what went wrong", the
  fridge brief with the decisions filling in, the beads and the acceptance
  pick, build-the-box drawing its walls, the finding's journey with you as
  the skeptic, the pull request and merge-or-not, the check that missed,
  name-the-wall scored with the box complete; and the check-and-takeaway
  shape every module ends on. Links join them in course order.
- Own look, as the presentation's first pass: light ground, one indigo
  accent for the course and the walls, teal for the agent and amber for
  the learner in the chat, Manrope and Atkinson Hyperlegible. The box is a
  pentagon of walls round the builder, with the retro as a ring round it.
- The canvas's source is copied into `docs/design/2026-10-15-first-pass/`
  with a README, so the design phase leaves an artefact in the repo.

## Ross: I like it, but the start is confusing

- I'm really liking it. But there's confusion at the very beginning: it
  isn't clear what exactly we're going to be doing. The first page does
  explain it, but at the very bottom, and there's so much on it that it's
  hard to know what you're actually doing.
- We're talking about two things here: the fact that we're building
  something using AI, and the thing that we're building. Those two collide
  at some point and it's "what am I actually doing here?"
- So there should be an initial page with less on it. It loads, it tells
  you what this whole thing is, you click continue, and then it takes you
  into a page like the current first page.

## Agent: a welcome page, the roles drawn apart

- It makes sense, and it is the course's one real framing problem: the
  subject and the example are on screen together throughout, so the
  learner has to be told which is which before anything else.
- Added a welcome page as the entry: one heading ("This course is about
  working with an AI agent. To show it, we follow one job from start to
  finish"), the three roles drawn apart with arrows (you; the agent, in a
  dashed box; the fridge activity, "only the example, you never build it
  yourself"), three lines on what each means, and one Continue. The old
  first page is now the home page, trimmed: the thesis, the box and the
  modules, with the example card gone and a "What am I doing here?" link
  back to the welcome. Every module's brand link goes home.
- Recorded as C16 in the course README; module 00's storyboard gains the
  welcome as its first screen; the design README notes the correction;
  the canvas source in the repo is refreshed.

## Ross: frame it as a role-playing game

- Rather than saying two things are on screen at once, which is confusing
  again, frame the whole thing like a role-playing game: you are an LXD,
  you're using AI to build a module from scratch, here is the scenario.
  They can then enter a frame of mind and view it from that perspective.

## Agent: the scenario page

- The entry is now the scenario. A role chip, "Your role: learning
  designer"; the heading "A client wants something the authoring tool
  can't do. You have an AI agent. You've never used one for this"; the
  client's message as a memo card asking for the fridge activity for
  kitchen staff on induction; three lines (the tool doesn't do it and the
  bespoke team is booked for a month; you have an agent that writes code
  and your job is to get something you'd put in front of the client; the
  agent here is scripted and behaves as real ones do); and one button,
  "Take the job". The "two things at once" explanation is gone.
- The frame carries through: every module's first screen is the next
  scene of the job, in character. Recorded as C16, in module 00's
  storyboard, and in the design README; canvas source refreshed.

## Ross: could we see both fridges, for real?

- Would it be too much to have a preview of the two versions of the output?
  In module 00 we ask the agent to do something without much guidance and
  decide what's wrong with it; then we ask it to do it properly and go
  through the whole design thing. Could we see the fridge activity we've
  built at the end, both of them next to each other, so you see the
  differences? Literally build the drag and drop.

## Agent: not too much, and it is the payoff

- Not too much: one drag-and-drop component driven by data (shelves,
  items, rules, feedback, timer, leaderboard, confetti), shown twice with
  different content. A bead or two in the epic. It also makes the course
  carry its own proof: a bespoke interaction, built in code by the
  workflow, inside the course that says that is possible.
- One catch: a real one-shot build would have no keyboard route, and the
  course must be accessible, so the one-shot version is keyboard-operable
  too and the comparison says so.
- Added to the canvas as a playable board after merge-or-not: both fridges
  side by side, click to pick and click to place standing in for drag.
  The one-shot runs its sixty-second timer, flashes red on a wrong drop
  with no reason, accepts raw chicken on the lower middle shelf, keeps a
  leaderboard against people who do not exist, and ends in confetti. The
  accepted one returns a wrong drop with its reason, scores right first
  time out of eight, lists the wrong ones, and announces item, shelf and
  result. Under them, a table of what is different and which wall made
  the difference.
- Recorded as C17; module 05 gains the screen and module 00 gains "try
  what it built"; canvas source refreshed; committed.

## Ross: start building

- This is looking really, really good. I'd like you to start building it. We
  need a brief first, on implementation: the xAPI data and the LMS, which
  needs xAPI 1.0.2. The brief continues in `2026-10-15-brief.md`.
