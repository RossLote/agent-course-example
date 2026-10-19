# Getting the most out of agents: the course

The course's decision record and outline. It began as a content draft for Ross's review,
2026-10-15, written by the agent at Ross's request (log:
`docs/conversations/2026-10-15-what-the-course-teaches.md`). Ross is not a learning designer
and asked the agent to make the content decisions; they are listed in §9 with their reasons
so any one can be reversed. Round three (2026-10-19, log
`docs/conversations/2026-10-19-four-walls-not-five.md`) reshaped the course after Ross
reviewed both builds, and added C18–C24.

The copy now lives in `content/`, which is the source (C24): the YAML the engine renders,
which Ross reviews by playing the course. The storyboard under `modules/` (every module's
screens in order, with draft copy, the fake agent's scripts and the check questions) is
round one's draft for eight modules, kept for the record and not updated.

Next: epic `agent-course-bsg` builds round three: four walls, five modules, the learner's
seat.

## 1. Who it is for

Learning experience designers at the company (LED and LXD name the same role), and anyone
else who is interested. Everyone has some technical background; nobody needs to write or
read code to follow the course, and no screen shows any (C22). Developers can take it too;
the workflow is theirs as well.

The reason it exists: the bespoke team sometimes has to leave the authoring tools and build
a piece of a course in code. Agents can do that building. The course shows what it takes to
get something trustworthy out of them, so a designer can see that this is a thing the
company can do, and knows what the work around the agent looks like.

## 2. The two ideas

The course has two ideas to remember (C19).

1. **How you ask.** Hold the agent's hand with a page of detail and you get exactly that:
   your mistakes built in, and no suggestion, because you left it no room. Say "go and do
   it" and you get surprises. The middle is to describe what you want loosely, let the agent
   explore, and use the brief as the forum where its questions and its own ideas meet your
   decisions: accepted, declined or talked through. The surprises that matter are gone
   before the build, and the agent is an extension of your creativity, working with you.
2. **The builder is the worst judge of its own work.** So box it, let other agents at it,
   and judge what comes back from evidence.

The first idea is the record, the first wall of the box; the second is the other three: the
gate, the reviews and evidence. The retro is the arrow round the box: when a check misses
something, change the check (C20).

## 3. What the learner can do afterwards

The course teaches the learner's seat, not the agent's (C18). After it a learner can:

1. **describe what they want loosely and answer the brief**: the agent explores, asks and
   brings its own ideas, and the decisions go on the record;
2. **read the plan and say go**, or ask for what is missing first;
3. **wait**, while the agents build inside the box and review each other's work;
4. **judge what comes back from its evidence**: the pull request's first lines and its
   recorded walkthrough, without reading the code;
5. **go round again**, expecting a second round, and changing the check when one misses;
6. **tell the agent how they like to work**, so that it becomes a skill the agent follows
   every time.

The four walls are what make that seat safe to sit in: the record holds what they
decided, the gate and the reviews hold the builders while they are away, and evidence is
what they judge from. The agents' own work (writing the plan, boxing a builder, reviewing,
settling a clash) is shown as a story; no screen asks the learner to do it. Each module's
own objective is on its page.

## 4. The worked example

One request runs through the whole course. A client's food-hygiene course needs a
**fridge activity**: the learner drags eight food items onto the right shelf of a fridge
(top, middle, bottom, salad drawer), gets told why when a drop is wrong, and sees a score.
The authoring tool's drag-and-drop cannot do shelves with rules and feedback, so it would be
built in code. The course puts the learner in the seat of the person asking an agent to build
it, and the example grows through five modules: the one-line ask and the hand-holder's page,
each going wrong its own way (00); the brief, its decisions and the agent's own idea (01);
what happens while you are away: the plan, the box round each builder, and the reviews (02);
the pull request, its walkthrough and the two fridges side by side (03); and the client's
second round, the check that missed, and making your own process a skill (04).

The fridge rules are illustrative and are the designer's to check; the course's claim is
about agents, not food hygiene. The items and shelves are in `content/fridge/accepted.yaml`.

## 5. The shape of a module

Five modules, five to eight minutes each, about thirty minutes in all (C21); a learner can
leave after any module and come back. Every module has the same five parts, so the shape
itself teaches:

1. **A scene from the job.** What happens when the wall is missing: an agent guesses,
   over-builds, wanders, marks its own homework.
2. **The idea.** What the workflow does instead, in plain words, with the real name of the
   thing (brief, epic, gate, pull request, retro, skill) introduced once and kept.
3. **One interaction from the learner's seat.** The learner does what they would do in the
   workflow (answer the brief, say go or ask, merge or send back, decide what to do with a
   process), on the fake agent (§6) or on the example's artefacts (C18).
4. **Check.** Two scenario questions with feedback on every option, right or wrong.
5. **Takeaway.** One card, and the box diagram with the walls gained so far.

The box diagram is the course's through-line (C20): a box with four sides, open in module
00; the record goes up in 01; the gate and the reviews both in 02, because the learner is
away for both; evidence in 03; and in 04 the retro is drawn as the arrow that goes round it.
Module 04's takeaway is also the course's end: the box with its ring, then the end copy.

The scenario (C16) and the home page come before module 00 and belong to the course, not to
any module, so module 00 starts at "The request" (plan §6).

## 6. The fake agent

Nobody touches a real agent. The interactions are scripted conversations: the learner picks
a reply from two to four options, the agent answers from the script, and some branches
wander off on purpose so the learner watches it happen and is told why. Where a free-text
box appears, the course plays the text back and never judges it. The script is data the
designer authors (every option, every agent reply, every branch's debrief), the engine
renders it, and nothing is fetched at run time. The agent in the scripts behaves as real
ones do: confident, helpful, fast, and happy to fill a gap with a guess.

## 7. Assessment and completion

- Every check question gives feedback on the option chosen, so the checks teach as well as
  measure.
- A module is complete when its takeaway is reached. Next stays disabled on a scored screen
  until it is answered, so a learner reaches the takeaway only with every check done;
  unscored interactions can be skipped. The course is complete when all five modules are.
- The score is the ten checks: two in each of modules 00 to 04, one point each (C21). The
  scaled score is the points over 10, and when a check is answered again the latest answer
  counts. There is no order or match screen, and no pass mark: the point is the practice,
  and a learner who gets a check wrong has read why. The brief kept it so (D11, D19);
  "passed" is added only if the LMS turns out to need it (plan §5).
- Every interaction is operable by keyboard and announced to a screen reader (WCAG 2.2 AA).
  The plan in module 02 asks for exactly that and module 03 judges it, so the course has to
  do it.

## 8. What the course sends to the LMS

xAPI statements, as the brief settled them (D19; the full rules in plan §6): initialized
when the course launches; completed on each of the five modules at its takeaway; answered
on every Check press of a scored screen, with the response and whether it was right;
interacted on each option pick on an unscored screen, so a designer can see where learners
wander; completed on each fridge play, with its score; and completed on the course with the
scaled score, the points out of 10. Nothing else leaves the course.

## 9. Decisions

C1–C17 were made by the agent for Ross on 2026-10-15. C18–C24 come from Ross's review of
both builds on 2026-10-19 (log `docs/conversations/2026-10-19-four-walls-not-five.md`, epic
`agent-course-bsg`); where one replaces an earlier decision, both say so.

- **C1 Audience.** LXDs and anyone interested; light technical background assumed; no code
  read or written. Reason: Ross, this session.
- **C2 One message.** Agents review better than they build; box the builder and have agents
  check agents. Reason: Ross's emphasis, this session; it is the thesis of the whole workflow.
  (Replaced by C19's two ideas, 2026-10-19.)
- **C3 Outcome.** §3. Reason: a course needs a behaviour to aim at, and the six walls are the
  behaviour. (Replaced by C18: §3 is now the learner's seat, 2026-10-19.)
- **C4 Structure.** Eight modules following the loop, about fifty minutes, each standalone.
  Reason: the loop is the subject and the order is the argument; standalone modules suit a
  self-paced LMS. (Replaced by C21's five modules, 2026-10-19.)
- **C5 Module shape.** Wrong, practice, try, check, takeaway; the box gains a wall each time.
  Reason: "what works and what doesn't" is the brief, so every module shows the doesn't
  first; one repeated shape is easier to build, review and learn from. (The try is now one
  interaction from the learner's seat, C18, and a module may add two walls, C20.)
- **C6 Worked example.** The fridge activity, a bespoke interaction for a client's course
  that the authoring tool cannot do. Reason: it is what the bespoke team does and what Ross
  wants designers to see is possible; designers know the domain; the rules are checkable, so
  acceptance criteria and failing tests are concrete.
- **C7 Fake agent.** Scripted choose-a-reply dialogues authored as data; free text only
  played back; deliberate wrong turns. Reason: deterministic, testable by the gates, nothing
  at run time; a wrong turn the learner chooses teaches more than one described.
- **C8 Examples invented, two real cards.** The fridge example is invented. Module 04 shows
  one real run's numbers from the presentation repo, which is public; module 06 tells the
  story of the check that missed, without the colleague's or the repo's name. Reason: Ross
  said the real record is not needed; one real card makes the thesis credible; the story is
  the best reason for retros there is. (Since C21 the numbers are in module 02 and the story
  in module 04.)
- **C9 Vocabulary.** The workflow's own names, each introduced in plain words first, with a
  glossary. Reason: it is Ross's workflow and the bespoke team will meet these words; plain
  words first keep the designers in. (C22 keeps the names the learner meets and drops the
  agents' own.)
- **C10 Voice.** Second person throughout; Ross named as the author on the opening screen,
  with his thesis in his words there and as an occasional quote card. Reason: the course is
  one colleague's workflow, and the attribution is honest and persuasive.
- **C11 Assessment.** §7. Reason: practice over grading for an awareness course; feedback on
  every option so wrong answers still teach.
- **C12 Text and interaction only.** No narration, no video. Reason: plan §3's caveat; the
  workflow does not produce them.
- **C13 Content as data.** This storyboard is the draft; the designer's content lives in the
  repo as data the engine renders. Reason: plan §3; a wording change needs no run.
- **C14 Accessibility.** Every interaction keyboard-operable and screen-reader-announced,
  WCAG 2.2 AA. Reason: the course teaches it, and the LMS audience expects it.
- **C15 Statements.** §8. Reason: the smallest set that lets a designer see completion,
  score and where learners wandered.
- **C16 The course opens as a scenario.** Before the course home, one calm screen puts the
  learner in a role: you are a learning designer, here is the client's message asking for
  the fridge activity, the tool can't do it, you have an agent, your job is to get something
  you would put in front of the client. One button, "Take the job". Every module's first
  screen is then the next scene of that job. Reason: Ross's first two looks at the design,
  2026-10-15: the home page had too much on it, and explaining "two things at once"
  confused; a role-playing frame lets the learner enter a frame of mind and see every
  screen from inside it.
- **C17 The fridge activity is real.** The course contains a working drag-and-drop fridge
  activity, one engine component driven by data, shown twice: the one-shot version (five
  shelves, guessed rules, no reasons, a timer, a leaderboard, confetti) in module 00 as
  "try what it built" and again in module 05 beside the version the learner accepted (four
  shelves, the client's rules, reasons, right-first-time score, keyboard and screen reader),
  with a table of the differences and the wall that made each. Both keyboard-operable,
  because the course must be, and the one-shot says so. It is built by the workflow as part
  of the course, so the course carries its own proof that a bespoke interaction comes out of
  it. Reason: Ross, 2026-10-15: seeing the two next to each other is the payoff, and it is
  what the LXDs are meant to see is possible. (Since C21 the two fridges are in module 03.)
- **C18 The learner's seat.** The course teaches what the learner does with the workflow:
  describe what you want loosely and answer the brief; read the plan and say go; wait; judge
  what comes back from its evidence; go round again; and tell the agent how you like to
  work, so it becomes a skill. No screen asks the learner to do an agent's job (write
  acceptance, box a builder, play the skeptic, order the loop): the agents' work is shown as
  a story. Replaces C3's six outcomes. Reason: the audience never writes a bead, and walking
  them through the workflow as if they were one of the agents is absurd (Ross).
- **C19 Two ideas.** First, how you ask: the hand-holder's page of detail gets exactly that,
  the designer's mistakes built in and no suggestion; "go and do it" gets surprises; the
  middle is to describe it loosely, let the agent explore, and use the brief as the forum
  where its questions and its own ideas meet your decisions, accepted, declined or talked
  through, so the surprises that matter are gone before the build and the agent is an
  extension of your creativity, working with you. Second, the builder is the worst judge of
  its own work: box it, let other agents at it, judge from evidence. The first is the record
  wall; the second the other three. Replaces C2's one message. Reason: Ross, 2026-10-19: the
  brief is where you and the agent are both creative, and that is half of what the course
  is for.
- **C20 Four walls and the arrow.** The record (01), the gate and the reviews (both gained
  in 02), evidence (03), and the retro's ring (04). "Done" is not a wall: the plan with its
  acceptance and demo script is the orchestrator's work, shown in 02 and judged against in
  03. The walls are numbered in the order they go up, not by module, so no two share a
  number: "01 the record", "02 the gate", "03 the reviews" and "04 evidence" (Ross,
  2026-10-19: two walls both read 02), and its ring "the retro: round again, change the check"; it is drawn with four
  sides, top first and clockwise, and its text alternative counts the walls. A module may
  add two walls. Replaces the five walls of C5 and §5. Reason: Ross never writes a
  definition of done, and a five-walled box drew as a pentagon.
- **C21 Five modules.** About thirty minutes: 00 "What works and what doesn't" (5 minutes,
  no wall), 01 "The brief" (7, the record), 02 "While you're away" (8, the gate and the
  reviews), 03 "What comes back" (8, evidence), 04 "Round again, and make it yours" (7, the
  ring). No module adds the whole box at once; module files 05, 06 and 07 go. The home
  page's meta reads "Five modules · about 30 minutes", the scenario's note begins "Five
  short modules, about 30 minutes.", and the scenario's second line no longer says "decide
  what done means": it reads answer its questions, say go to its plan, judge what comes
  back. The score is the ten checks, two per module, and the scaled score is the points
  over 10; there is no order or match screen. Replaces C4's eight modules. Reason: too many
  modules for what is taught; the score follows the content, as round one's rule says.
- **C22 No code on any screen.** No code, file paths, line numbers, gate output, bead
  cards, or read-first and touches lines anywhere; evidence is described in words ("the
  drop code, where it says to ignore a drop while a message is showing"). The copy says
  "piece" for a bead and names "epic" once, as the plan's name; "orchestrator" is
  introduced once, in 02, as the agent that runs the job and never writes code. The
  glossary keeps only the words the five modules use, at most sixteen, with door kept for
  module 03's aside. Reason: the skeptic page and the gate output were pages for
  programmers (Ross).
- **C23 True to the skills.** Every claim the course makes about the workflow is what the
  skills do. A builder's gate is lint, types and the unit tests, and the browser run is the
  full gate at the end of the run. A builder that edits outside its files is sent back by
  the orchestrator reading its report and the change against the piece at hand-back, never
  refused at the keystroke, so no copy says "rejected". A clash where two builders' work is
  joined is a merge conflict another agent settles, not an overwrite. The rule that a
  skeptic must show what makes a failure impossible came from a refuted race, so 04's story
  does not list it. The one-shot runs fifteen seconds everywhere, 03's table included. The
  orchestrator, not the demo script, catches a thing built that nobody asked for. The
  closing copy says "a recorded walkthrough someone judged", not a pull request. The brief
  never says how many questions remain. Reason: the course claimed walls the workflow does
  not have (the log's review against the skills and agents).
- **C24 content/ is the source of the copy.** `docs/course/modules/*.md` are round one's
  draft, kept for the record and not updated; `content/README.md` and this file say so.
  Copy the decisions do not fix is the worker's, in the course's register (second person,
  plain words, the existing YAML as the pattern); a product choice the decisions leave open
  is the orchestrator's, recorded as chosen by the orchestrator. Replaces round one's rule
  that the storyboard is the source (plan §6). Reason: Ross reviews the running course, not
  markdown, and two copies drift.

## 10. Settled by the brief

What this section left open was settled on 2026-10-15: by the design's first pass, then by
the brief (bead `agent-course-r4n`, log `docs/conversations/2026-10-15-brief.md`). The
decisions are D18–D24, recorded with this draft's C1–C17 (as D1–D17) and the epic's rules
in plan §6.

- **Package and launch.** The TinCan launch the LMS uses: a zip with tincan.xml at its root,
  the record store's endpoint, auth and actor in the launch query string, version header
  1.0.2 (D18, D23).
- **Look and feel.** Claude Design's first pass, `docs/design/2026-10-15-first-pass/`; it
  also produced C16 and C17.
- **Pass mark.** None (D11, D19). Whether the LMS shows completion without "passed" is
  checked on its UAT after the first import; length limits are none known (plan §5).
- **Ross's name.** Stays on the opening screen for round one (C10); whether it stays on the
  home page quote is a later round's question (plan §5).
- **Authoring format.** YAML, one file per module and per fridge, checked against a schema
  at build time (D21).

## 11. The modules

| # | Module | Wall | Minutes |
|---|---|---|---|
| 00 | [What works and what doesn't](../../content/modules/00.yaml) | the open box | 5 |
| 01 | [The brief](../../content/modules/01.yaml) | the record | 7 |
| 02 | [While you're away](../../content/modules/02.yaml) | the gate and the reviews | 8 |
| 03 | [What comes back](../../content/modules/03.yaml) | evidence | 8 |
| 04 | [Round again, and make it yours](../../content/modules/04.yaml) | the arrow round the box | 7 |

`content/` is now the source of the copy: `content/course.yaml` lists the modules and
`content/modules/00.yaml` to `04.yaml` hold their screens (C24). `docs/course/modules/` is
round one's draft of eight modules, kept for the record and not updated.

Glossary: [glossary.md](glossary.md).
