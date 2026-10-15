# Getting the most out of agents: the course

A content draft for Ross's review, 2026-10-15, written by the agent at Ross's request
(log: `docs/conversations/2026-10-15-what-the-course-teaches.md`). Ross is not a learning
designer and asked the agent to make the content decisions; they are listed in §9 with
their reasons so any one can be reversed. The draft is a storyboard: every module's
screens in order, with draft copy for the teaching, the full script of every fake-agent
interaction, and every check question with its feedback. It is not the final copy and not
the authoring format; the brief settles the format and the epic's beads move the content
into it.

Next: Ross reviews; Claude Design mocks up the module shape and the fake agent; the brief,
which is short because §9 is already decided and only §10 is open; then the epic.

## 1. Who it is for

Learning experience designers at the company (LED and LXD name the same role), and anyone
else who is interested. Everyone has some technical background; nobody needs to write or
read code to follow the course. Developers can take it too; the workflow is theirs as well.

The reason it exists: the bespoke team sometimes has to leave the authoring tools and build
a piece of a course in code. Agents can do that building. The course shows what it takes to
get something trustworthy out of them, so a designer can see that this is a thing the
company can do, and knows what the work around the agent looks like.

## 2. The one thing to remember

**Agents are better at reviewing than building.** So never let a builder run loose: write
down what it is building, define done before it starts, put it in a box of tests and gates
it cannot leave, have other agents check its work, judge the result from evidence, and when
something slips through, change the process rather than the hope. Every module of the
course adds one wall to that box.

## 3. What the learner can do afterwards

After the course a learner can set up a piece of agent work so that it is:

1. **written down**: the agent asked, they answered, the decisions are on the record;
2. **defined as done**: each piece has acceptance a reviewer can see, in a demo script;
3. **boxed**: the builder has its own working area and a gate of tests and checks that must
   be green before it can say done;
4. **checked by other agents**: simplified, reviewed and adversarially reviewed, and they can
   say which mistake each layer catches;
5. **judged from evidence**: they can decide from a pull request's door, undo and recorded
   walkthrough whether to accept it, without reading the diff;
6. **improved by rounds**: they expect a second round, and when a check misses something
   they change the check.

Each module's own objective is on its page.

## 4. The worked example

One request runs through the whole course. A client's food-hygiene course needs a
**fridge activity**: the learner drags eight food items onto the right shelf of a fridge
(top, middle, bottom, salad drawer), gets told why when a drop is wrong, and sees a score.
The authoring tool's drag-and-drop cannot do shelves with rules and feedback, so it would be
built in code. The course puts the learner in the seat of the person asking an agent to build
it, and the example grows module by module: the vague ask (00), the brief and its decisions
(01), the epic and its beads (02), the box around the builder (03), the reviews (04), the pull
request (05), the second round and the check that missed (06), and a fresh request to do it
all again (07).

The fridge rules are illustrative and are the designer's to check; the course's claim is
about agents, not food hygiene. Items and shelves are in `modules/01-write-it-down.md`
(decision D2 of the fake brief).

## 5. The shape of a module

Eight modules, five to nine minutes each, about fifty minutes in all; a learner can leave
after any module and come back. Every module has the same five parts, so the shape itself
teaches:

1. **Something goes wrong.** A short scene where an agent without this wall does what agents
   do: guesses, over-builds, wanders, marks its own homework.
2. **The practice.** What the workflow does instead, in plain words, with the real name of the
   thing (brief, bead, epic, gate, pull request, retro) introduced once and kept.
3. **Try it.** The learner does it on the fake agent (§6) or on the example's artefacts.
4. **Check.** Two scenario questions with feedback on every option, right or wrong.
5. **Takeaway.** One card, and the box diagram gains its wall.

The box diagram is the course's through-line: an open box in module 00, a wall added in each
of 01 to 05 (the record, done, the gate, other agents, evidence), and the retro drawn as the
arrow that goes round it in 06. Module 07 shows the whole thing and asks the learner to
build it for a new request. Module 00 opens with the scenario (C16) before any of this.

## 6. The fake agent

Nobody touches a real agent. The interactions are scripted conversations: the learner picks
a reply from two to four options, the agent answers from the script, and some branches
wander off on purpose so the learner watches it happen and is told why. Where a free-text
box appears, the course plays the text back and never judges it. The script is data the
designer authors (every option, every agent reply, every branch's debrief), the engine
renders it, and nothing is fetched at run time. The agent in the scripts behaves as real
ones do: confident, helpful, fast, and happy to fill a gap with a guess.

## 7. Assessment and completion

- Every check question and capstone item gives feedback on the option chosen, so the checks
  teach as well as measure.
- A module is complete when its interaction and its check are done. The course is complete
  when every module is.
- The course reports a score out of the check and capstone items. There is no pass mark in
  round one: the point is the practice, and a learner who gets a check wrong has read why.
  The brief revisits this if the LMS needs passed or failed.
- Every interaction is operable by keyboard and announced to a screen reader (WCAG 2.2 AA).
  The course teaches that in 02 and 03, so it has to do it.

## 8. What the course sends to the LMS

xAPI statements, the exact verbs and the package format to be settled in the brief against
the LMS (plan §5): the course launched; each module completed; each fake-agent choice as an
interaction with the option chosen, so a designer can see where learners wander; each check
answered with the response and whether it was right; the course completed with the score.
Nothing else leaves the course.

## 9. Decisions (made by the agent for Ross, 2026-10-15)

- **C1 Audience.** LXDs and anyone interested; light technical background assumed; no code
  read or written. Reason: Ross, this session.
- **C2 One message.** Agents review better than they build; box the builder and have agents
  check agents. Reason: Ross's emphasis, this session; it is the thesis of the whole workflow.
- **C3 Outcome.** §3. Reason: a course needs a behaviour to aim at, and the six walls are the
  behaviour.
- **C4 Structure.** Eight modules following the loop, about fifty minutes, each standalone.
  Reason: the loop is the subject and the order is the argument; standalone modules suit a
  self-paced LMS.
- **C5 Module shape.** Wrong, practice, try, check, takeaway; the box gains a wall each time.
  Reason: "what works and what doesn't" is the brief, so every module shows the doesn't
  first; one repeated shape is easier to build, review and learn from.
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
  the best reason for retros there is.
- **C9 Vocabulary.** The workflow's own names, each introduced in plain words first, with a
  glossary. Reason: it is Ross's workflow and the bespoke team will meet these words; plain
  words first keep the designers in.
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

## 10. Open for the brief

- Which package format the LMS launches (cmi5, plain xAPI, SCORM) and how the record store
  reaches the course (plan §5). This fixes the manifest, the handshake and the tests.
- Look and feel: Claude Design's pass on the module shape, the box diagram and the fake
  agent's chat.
- Whether the LMS needs a pass mark, and the module length limits it imposes, if any.
- Whether Ross's name appears on the opening screen (C10) or the course is the company's.
- The authoring format for the content (markdown, JSON, or both).

## 11. The modules

| # | Module | Wall | Minutes |
|---|---|---|---|
| 00 | [What works and what doesn't](modules/00-what-works-and-what-doesnt.md) | the open box | 5 |
| 01 | [Write it down](modules/01-write-it-down.md) | the record | 7 |
| 02 | [Define done before you start](modules/02-define-done-first.md) | done | 7 |
| 03 | [The box](modules/03-the-box.md) | the gate | 6 |
| 04 | [Agents checking agents](modules/04-agents-checking-agents.md) | other agents | 9 |
| 05 | [Judging what comes back](modules/05-judging-what-comes-back.md) | evidence | 6 |
| 06 | [Round again](modules/06-round-again.md) | the arrow round the box | 6 |
| 07 | [Put it together](modules/07-put-it-together.md) | all of them | 6 |

Glossary: [glossary.md](glossary.md).
