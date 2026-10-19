---
date: 2026-10-19
stage: review
title: Four walls, not five
participants: [Ross, agent]
source: live, written during the session, while Ross reviewed the two builds
---

# Four walls, not five

A conversation, condensed, not verbatim: Ross in his own words, the agent in
its own. Ross dictates; his entries keep the point he was making and drop the
rest. Ross was reviewing the two builds screen by screen and stopped on module
02's "write the acceptance" exercise.

## Ross: this screen, and the wall it belongs to

- This page (bead .3 has no acceptance yet, pick the three lines a reviewer
  could check) has a lot in it that is not obvious, because we have not taught
  them any of it at this point.
- It made me realise something bigger. The whole of module 02 is the definition
  of done. But I never interact with a definition of done. My agents decide what
  done is, from the brief: I go through the brief, the agent creates the epic, I
  review the epic, and by then the epic is full of pieces and the definition of
  done comes purely from the information I gave. So we are teaching something I
  never even touch, and I don't think they need to think about it either.
- What I am suggesting is removing that section and having four walls: the
  brief; the gate, which is tests and linting; the reviews, which are the
  agents; and the evidence, which forces the agent to walk through the whole
  thing from beginning to end. Four walls is enough. I don't know why we ended
  up with five; I think that was a mistake. What do you think?

## Agent: I agree, and here is what moves rather than vanishes

- I agree with four. In your workflow "done" is written by the epic skill from
  the brief's decisions and checked by the epic review's agents; what you do is
  read the epic and say go. For a learning designer that is the honest picture
  too: the record goes in, the plan with its acceptance and demo script comes
  out, and nobody in the audience will ever write a bead. Module 02's two
  exercises (write the acceptance; say which beads can run together) test the
  agent's skills, not the learner's.
- A box has four walls. Five never drew as a box: the Vite build calls it a
  five-wall box and the Bricks build draws a pentagon. With four, the diagram is
  literally the thing the course keeps saying it is.
- Three things from module 02 are still needed downstream and should move, not
  go: the demo script, which module 05's walkthrough is judged against and
  module 04's "none of the reviews: the epic" row depends on; the fact that the
  bead's acceptance is written into the builder's instructions, which is already
  wall three of module 03's box; and the epic review, which is agents checking
  agents before the build and fits one line in module 04. I would open module 03
  with one scene, the epic on the table: from the eight decisions the agent cut
  the job into five pieces, each saying what a reviewer will see, with a
  six-step demo script; another agent read it for gaps; you read it and said go.
- The capstone changes with it: "name the wall" drops to five rows, the score to
  thirteen, and the loop cards merge epic and epic review into one "the plan"
  card. Module 00's scenario line "decide what done means" goes; module 07's
  "write done before it starts" card becomes "have it write the finish line and
  read it before it starts".
- Your first point stands beyond this screen: a Try it should use only what its
  own module put on the table. I will check the remaining exercises for that in
  the rewrite.
- Nothing changed yet in the content or either build; this is your call. If you
  say yes, it is a decision for the README (C18), a rewrite of the modules and
  glossary, and a small round for both builds: the box diagram and the capstone
  scoring are engine, the rest is content.

## Ross: is the rejection real?

- Another bit I am not sure is correct, and it is mentioned a couple of times.
  On "The same bead, twice", the boxed side says the builder tries to tidy the
  shelves, the file is outside its list, and it gets rejected. Is that true? Is
  there anything in our workflows during orchestration that prevents files
  being edited outside the ones you give it?

## Agent: no, not as drawn

- No. Nothing stops the edit at the moment it happens. I read the orchestrate
  skill, the worker agent definitions and the hooks in your settings: the only
  hooks are sounds, and an "ask" on infrastructure commands in Bash. There is
  no hook on Edit or Write that checks a path, and the worker has every tool.
- What exists is three softer things. The worker is told, twice, not to edit
  outside TOUCHES, and its finish line says "nothing edited outside TOUCHES".
  The worker's report lists the files it changed, and the orchestrator reviews
  the diff against the bead ("every acceptance item, nothing beyond"), so a
  stray file comes back as a round-two push-back, or the orchestrator widens
  the list on purpose and records it as a SCHEDULE line and a touches-widened
  count. And the worktree keeps the stray edit away from the other worker until
  the merge, where a clash is a git conflict that the merge-resolver settles,
  with the fast gate run on the epic branch afterwards.
- So the rejection is real but late: it happens when the orchestrator reads the
  diff at hand-back, not at 00:20. Module 02's "the second one in will
  overwrite the first" is wrong too: git conflicts or merges, it does not
  overwrite.
- Two ways to make the course honest. Reword the boxed timeline so the tidy
  goes in, the hand-back lists three files against a list of two, and the
  orchestrator sends it back; that is still the box pushing back, and it is
  what happens. Or add the wall the course draws: a hook that refuses an Edit
  or Write outside the worker's list, which is small to build and would make
  the wall true. My recommendation is to reword now and file the hook as a
  workflow bead, because the course's own line is that a wall is not a wish.

## Ross: review the rest against what we actually do

- With those two things in mind, review the rest of the content and make sure
  it represents what it is we are doing here.

## Agent: the review, against the skills and agents

- I read every skill and agent definition the workflow runs on (brief, epic,
  epic-review and its finder, orchestrate and its workers, adversarial-review
  and its finder, deduper and skeptic, merge-resolver, pr, retro) and checked
  the eight modules, the glossary and the README against them, then checked
  the built content in the round-two folder carries the same wording.
- Most of it is right: the brief's five rules, the shape of a bead and an
  epic, "twelve to thirty pieces" for the epic review, done written into the
  builder's prompt, the gate output pasted and the not-confirmed line, the
  three review layers in order, simplify reverting behaviour changes, every
  adversarial-review rule including no third skeptic and the refuted-race
  story, the pull request's first three lines and worst-signal door, the
  walkthrough as the proof, the retro's question, the loop order in 07, and
  module 04's real numbers, which match the presentation repo's run record
  (16 finders, 50 findings, 39 fixed, 16 beads planned).
- Wrong, to fix: the builder's gate does not include a browser run; the fast
  tier is lint, types, unit tests and the test files the bead touches, and the
  browser run is the full gate at the end of the epic, so module 03's wall,
  tick list, boxed timeline and gate output, and the glossary's gate entry,
  put the touch-drag catch in the wrong place. The "rejected" edit (03, 07)
  and "overwrite" (02) as already discussed. Module 04's "none of the
  reviews" row: the unasked-for timer is caught by the orchestrator reading
  each bead's diff against the bead ("every acceptance item, nothing
  beyond") and by the decisions in every builder's prompt, not by the demo
  script; the orchestrator is the course's missing character and should be
  named once in module 03 and the glossary. Modules 04 and 06 disagree on
  where the cite-a-line rule came from; the skill says the refuted race, so
  it comes off 06's list. Module 07's "a pull request someone judged" is not
  yet true of this course, which has no remote and no pull request.
- Overstated, to tweak: 05's "choices made for you" would not carry a choice
  that contradicts D5, since workers build decisions as written and flag a
  mismatch and the orchestrator checks every acceptance item; make the gap
  one the learner finds between chapter 4 and step 4, with the choices list
  naming something the record left open. The PR lists only one-way choices
  up top, the rest in an appendix. The brief never says how many questions
  remain, so "three more; the rest I can leave to the builder" goes. Two
  builders cannot tread on each other while building, but a clash at the
  join is a merge conflict another agent settles. The one-shot timer is
  fifteen seconds in module 00 and sixty in module 05's table.
- Could not verify from the skills: simplify's reviewer count (the four
  questions match its four dimensions) and the numbers in module 06's story,
  which are Ross's to confirm.
- Nothing changed; these fold into the same rewrite as the four-walls change
  if Ross agrees.

## Ross: the skeptic page is for programmers

- While you were looking at that: the "You are the skeptic" page is very much
  a page for a programmer. There is no way I can get most normal people to
  look at three code excerpts and understand what they are supposed to be
  doing. It has to go. Maybe put a different exercise in.

## Agent: judge the skeptics instead, in plain words

- Agreed. The rule the page teaches (a finding dies only on evidence, and
  uncertain is allowed) survives without code. Replace it with "judge the
  skeptics": the finding in plain words, then three skeptic reports as
  agents would write them: one refutes because a test exists, one confirms
  and says where it read the rule and how to make it happen, one refutes
  because nobody would do that. The learner picks which verdict stands and
  what the finding becomes. That is what you do in practice: you read the
  review's record, never the code.
- A bigger option if you want it playable: the finding is tried on the
  fridge itself (drop a second item while a reason is showing) and the
  verdict is what the learner saw. It needs a third fridge configuration
  with the bug in it, so it is engine work.
- The same problem is on other screens: the gate output block and the
  "touched" line in module 03, the bead card's read-first and touches lines
  in 02, "lines read" in 04. The rule for the rewrite: no code, no file
  paths, no line numbers anywhere; evidence is described in words.

## Ross: past the first module it is all too complicated

- Overall, past the first module, everything is way too complicated. We are
  teaching people about the process, not how to implement every detail of
  it. Most of this has nothing to do with the person I am trying to teach. I
  want them to learn how to think about using agents to code, not how to
  make all the details work.
- One thing I really want to emphasise: if you have processes you like, talk
  to the agent about them and create skills from them. Don't think you have
  to come up with all these solutions yourself.
- There are too many modules. We are trying to teach what a brief is, what
  a review is, what an epic is, and how they glue together to make a good
  feature. What has been built walks the person through the whole workflow
  as if they were one of the agents building something, which is absurd,
  because they don't have to think about any of that.

## Agent: the learner's seat, five modules

- Agreed. Your seat in the workflow is five things: say what you want and
  answer the questions; read the plan and say go; wait; judge what comes
  back; go round again. And one more: tell the agent how you like to work,
  so it becomes a skill. Everything else is an agent's job, and the course
  should show it, never make the learner practise it.
- Proposed shape, five modules, about twenty-five minutes. 00 Take the job,
  as it is. 01 The brief, as it is, with the "what the record is for" cards
  cut to one. 02 While you're away: one story told by the orchestrator
  agent, which turns the decisions into a plan (the pieces, each saying
  what a reviewer will see, and a demo script), waits for your go, holds
  each builder in a box of checks, then sends in the reviewers; the loose
  and boxed play is its one interaction, made honest; this module adds two
  walls, the gate and the reviews, because the learner is outside both.
  03 What comes back: the three lines, the walkthrough, merge or send back,
  the two fridges. 04 Round again, and make it yours: expect a second
  round, change the check when one misses, and the new emphasis: this whole
  workflow is a handful of skills you wrote by telling the agent how you
  work, so a learner with a process they like should tell the agent and
  have it made into a skill; one exercise on that, then try this tomorrow.
- Cut: module 02 whole; module 03's walls tick list and gate detail; 04's
  skeptic and matching; the capstone, with its order-the-loop folded into
  04 as five cards if a score is wanted. No code, paths or line numbers
  anywhere. The glossary halves.
- This also fixes most of the accuracy list, since the wrong details lived
  in the material that goes, and the orchestrator as narrator of 02 is the
  honest version of who rejects and who catches.
- Engine impact is small: four walls on the diagram, the capstone screens
  gone, the process-to-skill exercise is the existing single-answer type.
  The work is content. Next, if Ross agrees: C18 in the README, the
  storyboard rewritten, then the round-three epic.

## Ross: the brief is where you and the agent are both creative

- Nothing wrong with what you said; this is extra from my head, to hone it.
  I like the first module: this is how you would build the fridge if you
  one-shot it, and if you want something good, this is how you do it. That
  is where we teach the brief and how to ask for a good feature.
- There are a few ways people ask. Some hold the agent's hand: here is every
  file, every detail, do this very specific thing. That constricts it; it
  cannot come up with new solutions or even suggest anything, because you
  gave it no space. Others are really vague: go and do it. That gives the
  agent all the flexibility, and you get surprises.
- You need the middle ground. Be vague enough in how you first describe it
  that the agent can be creative and explore. The brief is where you chisel
  that down into what you actually expect. It prevents surprises: anything
  the agent would think of doing has come up by then, so you can take out
  what you don't want and add what you do. Give it the forum to bring its
  suggestions, so you can accept them, decline them, or have a conversation,
  and you end up thinking about things you would never have thought of, and
  the result is better for it.
- You are working with your agent. It is not working for you and you are
  not working for it. It is an extension of your creativity. After the
  brief the exploration is done, and the build follows.

## Agent: how that hones the shape

- It sharpens the first two modules and gives the course two ideas instead
  of one: how you ask, and the builder is the worst judge of its own work.
  The first is the record wall; the second is the other three.
- Module 00 gains the second failure mode. Beside the one-line ask and its
  surprises, the hand-holder's ask: a page of files and details, and what
  comes back is exactly that, with your mistakes built in and nothing you
  did not think of. Two ways to ask, two ways to lose.
- Module 01 becomes the forum. You describe it loosely; the agent reads and
  explores first; it comes back with ranked questions, its recommendations
  and its own ideas; you accept, decline or talk it through. The fake brief
  gains one suggestion the learner would never have thought of and keeps
  the leaderboard as one they decline. The check questions gain the
  hand-holder: a two-page spec gets you exactly that and no ideas. Your
  "extension of your creativity" line is the quote card.
- One honest nuance to keep: the brief stops when what is left would not
  change what the learner sees. The builder still decides how, and the few
  small calls the run makes come back listed on the pull request, so the
  surprises that matter are gone and the rest is shown to you. That ties
  01 to 03.
- The workflow already says this at both ends. The brief skill takes the
  feature in your own words, researches before asking and recommends an
  answer to every question. The epic skill says a piece of work is a task
  for a trusted developer, not a plan of edits, because the planner's file
  lists were the gaps in one review. The course can cite both.
- Nothing changed yet; added to the memory and the log.

## Ross: give me the rundown

- Could you give me a rundown of exactly what the course would be after
  these changes?

## Agent: the course in five modules

- Two ideas, four walls and the arrow, five modules, about thirty minutes.
  Every module: a scene from the job, the idea in plain words, one
  interaction from the learner's seat, two check questions, a takeaway with
  the box. No code, paths or line numbers anywhere.
- 00 Take the job (the open box): the scenario; the thesis; two ways to
  ask side by side, the one-liner with its surprises and the hand-holder's
  page with its blind spots built in and no ideas; tick what went wrong;
  try the one-shot fridge; what just happened; the builder is the worst
  judge of its own work.
- 01 The brief (the record): where the timer came from; how a brief goes,
  with the forum point and the "extension of your creativity" quote; the
  fridge brief one round at a time, eight decisions, one of them the
  agent's own idea (shuffle the tray each attempt) and the leaderboard
  declined; what the record is for, one card; checks on the hand-holder
  and the leaderboard.
- 02 While you're away (the gate and the reviews), narrated by the
  orchestrator: the plan in plain words, five pieces and a six-step demo
  script, another agent reads it for gaps, you say go; the box round each
  builder and its finish line; the same piece twice, made honest, with the
  checks going red on a test and the orchestrator sending back the stray
  tidy; the three kinds of review and the real card from the presentation
  repo; checks on the pasted output and on refuting without evidence.
- 03 What comes back (evidence): two in the morning; the three lines; the
  rest of the page; merge or send back, with the gap found between chapter
  4 and step 4 and the choices list naming something the record left open;
  the two fridges with the wall that made each difference; checks on the
  door and the missing chapter.
- 04 Round again, and make it yours (the arrow): the client's two asks;
  rounds; the check that missed, without the cite-a-line line; make it
  yours: the workflow is a handful of skills Ross made by telling the agent
  how he works; the exercise "you have a process: type it every time, have
  it made a skill, or check by hand"; order the loop as five cards if a
  score is wanted; checks on round two and the retro's question; try this
  tomorrow with a fifth card on skills; the end, with the pull-request line
  corrected.
- Cut: define done as a module; the walls tick list; the skeptic and
  who-catches-it exercises; the capstone matrix; every bead card and gate
  output block. Kept: both fridges, the brief interaction as redesigned,
  the loose and boxed play, merge or send back, the box diagram with four
  walls. Engine work is small; the work is content.

## Ross: do we need a brief?

- Do we need to do a brief?

## Agent: this conversation was the brief

- No. A brief draws the decisions out in rounds until nothing left would
  change what gets built, and that is what this session did: Ross described
  it freely, I read the workflow and the content, and the decisions are in
  this log. What is missing is the brief's output, the decisions numbered
  where the epic can cite them, and two questions still open, asked the way
  a brief would, recommendation first.
- Open: which build gets the round (the Vite build here, the Bricks build,
  or both); recommendation: write the storyboard first, since it is
  build-independent and Ross reviews it, and name the build when the epic
  is filed. The score: with the capstone gone, the ten check questions are
  the score sent to the LMS, scaled as now; recommendation: that, and no
  order-the-loop. The content details (the hand-holder's mistake, the
  agent's own idea in the brief, the process-to-skill wording) are mine to
  draft under the C-decisions, as in round one, for Ross to review.
- Next on Ross's word: the decisions into the README as C18 onward with
  their reasons, the storyboard rewritten, Ross reviews, then /epic and
  /epic-review for the build.

## Ross: create the epic

- Could you please create the epic?

## Agent: epic agent-course-bsg filed, nine beads

- Filed as agent-course-bsg: "Agent course, round three: the learner's seat,
  four walls, five modules", with this conversation as its pointer, the
  decisions C18 to C24 in its notes, a module-by-module decision list that
  is the storyboard, a six-step acceptance bar, and nine beads: .1 the
  decision record and the glossary; .2 unit tests that hold whatever the
  content says; .3 the engine's four walls and five modules; .4 modules 00
  and 01; .5 module 02; .6 module 03; .7 module 04; .8 the e2e tier; .9 the
  walkthrough. .1 and .2 run together, then .3 alone, then the four content
  beads three at a time, then .8, then .9.
- Scope calls I made: the epic runs on the Vite build in this repo, from the
  round-two branch (or main once Ross merges it), with no pull request since
  there is no remote; the Bricks build is out of scope and carries the same
  content over separately. The storyboard files under docs/course/modules
  are not rewritten: content/ is now the source of the copy (C24). A bead
  for the unit tests comes before the engine change, because today's tests
  play the real content and every content bead would otherwise turn the
  fast gate red. Every content bead reads the skills before it writes, so
  the course stays true to them (C23).
- The lint found nothing a worker would hit. Next: /epic-review
  agent-course-bsg, then /orchestrate agent-course-bsg.

## Ross: review the epic in a subagent, and merge everything into main

- Can you review that epic, in a subagent please? And you can merge
  everything into main now, before we get started on the orchestration.

## Agent: the review running, rounds one and two merged

- The epic review is running in one subagent: the lint, the finders through
  the four lenses, the skeptics, fixes on the beads, and the questions for
  you with a recommendation each.
- Merged the round-two branch, which carries round one, into main as
  3a83f84. The only conflict was the beads export, which I regenerated from
  the database. Main now holds the whole course; the epic's run mode is
  updated to say base is main.

## Agent: the epic review's result, and the five answers

- The review ran through Agent calls (the Workflow tool was not available to
  the subagent): 16 finders, one deduper, 58 skeptics; 29 findings, all
  confirmed, 24 fixed on the beads, 5 put as questions. The biggest fix: .2's
  acceptance now rehearses everything the later beads do to the content
  (delete three modules, add a screen, cut three modules to a scene and two
  checks), since as written it only rehearsed deleting one file and every
  content bead's fast gate would have gone red in tests no bead may touch.
  The rest: more of the README and PLAN.md brought into line by .1; the
  home page's copy and the content guide's module numbers named for .3; the
  brief's "Three more." dropped, as the brief skill never says how many
  remain; 02's plan steps pinned to round two's script minus the keyboard
  step, which the learner's ask puts back as step 4; the accepted fridge's
  title given to .6; the smoke and launch specs added to .8.
- The five questions, answered under Ross's standing delegation of content
  details, each reversible: D8 becomes an idea the accepted fridge already
  shows, labelling each shelf with what goes there, because the fridge
  cannot shuffle; 03's "choices made for you" names what the fridge does,
  the reason staying until the next move; 02's boxed builder says the
  screen-reader wording is another piece's rather than "could not confirm",
  which would fail its own finish line; 04's story carries no counts; .2
  stays one bead. Recorded on the epic and on beads .4 and .6.
- Ready to orchestrate.
