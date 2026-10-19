# Plan: a course on getting the most out of agents, built by the workflow it teaches

Status: round one is epic `agent-course-wqw` ("Agent course, round one: engine, content,
fridges, xAPI, package"), filed and reviewed on 2026-10-15, 18 beads in four groups. It runs
on the decisions in §6 and the engine terms in §6a; §5 holds what is left to verify on the
LMS and what later rounds take up. Before it, the same day: the idea (bead `agent-course-r4n`,
log `docs/conversations/2026-10-15-where-the-course-starts.md`), the content draft
(`docs/course/`, decisions C1–C17), the design's first pass (`docs/design/2026-10-15-first-pass/`)
and the brief (D18–D24, log `docs/conversations/2026-10-15-brief.md`). Next:
`/orchestrate agent-course-wqw`.

## 1. The occasion

Ross's talk to work colleagues on getting the most out of agentic engineering (the
presentation repo, `https://github.com/RossLote/presenation`) is open to everyone at the
company, not only developers. The company builds e-learning and has many learning designers.
A course is the next form of the same subject: something a person works through alone, on
the company's LMS, rather than listening to Ross.

## 2. The idea

An xAPI-compliant course, added to the company's LMS, teaching people how to get the most
out of agents. It is built with Ross's workflow (brief, epic, epic review, orchestrate, pull
request), and the claim it tests is that the workflow builds a learning course as code as
well as it builds software, because a course package is web content with statements sent to
the LMS's record store as the learner moves through it.

Two ideas to keep hold of:

1. **A course, not the talk.** This is not the presentation turned into a course. It is a
   second thing, built the same way, that people can go through by themselves (Ross,
   2026-10-15).
2. **Courses as code.** The learning designers are the domain experts, as Ross was for the
   talk; the brief is where their thinking goes in, in plain text, and the pull request's
   recorded walkthrough is how they review what came out without reading code.

## 3. How the workflow maps, and what changes

The agent's assessment on 2026-10-15, for the brief to settle.

The stages map directly. The brief runs as plain-text questions and dictated answers, so a
learning designer can drive it. The epic turns modules and activities into beads with
acceptance criteria, in the course's order. Orchestrate builds; its gates are tests on the
statements the course emits (verb, activity, result) and a Playwright run through the whole
course against a fake record store, checking every statement arrives. The PR's walkthrough
is a recorded run-through of the course, one chapter per module.

Three things change:

- **Content review.** The review skills hunt code bugs with failure scenarios. A course
  fails pedagogically: an objective nothing teaches, an activity that does not test what it
  claims, a wrong claim about agents. The finders need lenses for objective alignment,
  accessibility and accuracy; the skeptic's rule becomes "cite the source" rather than
  "cite the line"; a learning designer still signs the content off. The run cannot judge
  pedagogy alone.
- **Content separate from engine.** Designers author the modules as data (markdown or
  JSON) and the agents build the engine that renders them and emits the statements, as the
  presentation's canvas reads its conversation logs. A wording change then needs no run; a
  run is for structure and engine.
- **Package format.** Plain xAPI packages, cmi5 and SCORM launch differently, and the LMS
  decides which it accepts. That is found out before the brief, since it fixes the manifest,
  the launch handshake and the tests. (The agent could not confirm this from the xAPI spec's
  documentation; it is from its own knowledge and is to be verified against the LMS.)

Two caveats: courses are code at export, not in how designers work today, so this course is
hand-built rather than exported from an authoring tool, and a first one should stay text and
interaction, since narration and video do not come out of the workflow. The subject is the
talk's, so the talk's logs and Ross's skills repo seed the content, but the reader is alone
with it, so it is a different piece of writing.

## 4. Constraints and assumptions

- The presentation repo's toolchain: Vite + React + TypeScript; gates lint, typecheck, unit
  (Vitest) and e2e (Playwright, Chromium); the walkthrough recorded by Playwright with video
  and slowMo into `docs/demos/<epic>/`, gitignored. See CLAUDE.md.
- Nothing fetched from the network at run time, apart from whatever record store the LMS
  hands the course at launch (to be settled in the brief).
- Several epics are expected: an MVP round, then improvement rounds. No date has been given
  and none is planned around.
- Each stage is captured as it happens: conversations are logged summarised, not verbatim,
  in `docs/conversations/`.
- Beads: bd 1.3.1, embedded Dolt, prefix `agent-course`, JSONL export tracked in git. No git
  origin or Dolt remote yet (see `bd memories`, `remote-pending`).
- Persistent agent knowledge on this project goes in `bd remember`, not memory files.
- Ross's employer and other projects are not named in this repo; the presentation repo is.

## 5. Open: to verify on the LMS, and later rounds

The questions this section held are settled: the learner, the objectives, the modules, the
assessment and the designers' review by the content draft (D1–D17); the package, the launch,
the statements, the library, the authoring format and resume by the brief (D18–D24); one
package for the whole course (D18); the look by the design's first pass. The record is §6.
What is left:

**To verify on Spark UAT after the first import.** Any gap becomes a bead under a round-two
epic.

- Completion shows without "passed" (D11, D19). If Spark needs "passed" to mark completion,
  it is added then.
- The State API is accepted, so resume works through it rather than the localStorage
  fallback (D22).
- The activity_id the LMS passes for a tincan.xml package, and whether it is course.yaml's
  id or the LMS's own (D23; the statements cope with either through grouping).

**Deferred by the brief to later rounds.**

- The Spark postMessage bridge, keydown forwarding and a Close button on `close-message`
  (D23). Direct calls do the job in round one.
- Whether Ross's name stays on the home page quote (D10), or the course is the company's.
- LMS module length limits. None are known.
- Also outside round one: cmi5 or SCORM packaging, a pass mark (D11), narration and video
  (D12), a developer track, translation.

## 6. Decisions

Every decision the course runs on, each a rule and its reason. D1–D17 are the content
decisions C1–C17 in `docs/course/README.md` §9, with the same numbers. D18–D24 are the
brief's, recorded with their reasons on bead `agent-course-r4n` (log
`docs/conversations/2026-10-15-brief.md`). The rules after them are epic
`agent-course-wqw`'s, with the epic review's additions folded in; where an addition replaced
an earlier rule, only the final rule is here. Round two's rules, epic `agent-course-7ec`'s,
follow, then round three's, epic `agent-course-bsg`'s, whose C18–C24 are the same numbers in
`docs/course/README.md` §9; where a later rule replaces an earlier one, the later rule
records the reversal. All of them bind every bead.

### From the content draft (D1–D17)

- **D1 Audience.** Learning designers (LED and LXD name the same role) and anyone
  interested; a light technical background; no code read or written. *Reason:* Ross's call
  when the content was drafted.
- **D2 One message.** Agents are better at reviewing than building, so box the builder and
  have agents check agents. *Reason:* it is the thesis of the whole workflow.
- **D3 Outcome.** The six walls of `docs/course/README.md` §3: written down, defined as
  done, boxed, checked by other agents, judged from evidence, improved by rounds. *Reason:*
  a course needs a behaviour to aim at.
- **D4 Structure.** Eight modules following the loop, about fifty minutes, each standalone.
  *Reason:* the order is the argument, and standalone modules suit a self-paced LMS.
- **D5 Module shape.** Something goes wrong, the practice, try it, check, takeaway; the box
  diagram gains a wall each module. *Reason:* every module shows what does not work first,
  and one repeated shape is easier to build, review and learn from.
- **D6 Worked example.** The fridge activity, a bespoke interaction the authoring tool
  cannot do. *Reason:* it is the bespoke team's work, and its rules are checkable.
- **D7 Fake agent.** Scripted choose-a-reply exchanges authored as data, with deliberate
  wrong turns; nothing touches a real agent. *Reason:* deterministic, testable by the gates,
  nothing fetched; a wrong turn the learner chooses teaches more than one described. (Round
  one has no free-text box: see the chat rule below.)
- **D8 Examples invented, two real cards.** The fridge is invented; module 04 shows one real
  run's numbers from the presentation repo; module 06 tells the story of the check that
  missed without naming anyone. *Reason:* one real card makes the thesis credible, and the
  story is the best reason for retros there is. (Since C21 the numbers are in module 02 and
  the story in module 04: "Module numbers after C21" in round three's rules.)
- **D9 Vocabulary.** The workflow's own names, each introduced in plain words first, with a
  glossary. *Reason:* the bespoke team will meet these words.
- **D10 Voice.** Second person; Ross named as the author, with his thesis in his words.
  *Reason:* it is one colleague's workflow, and the attribution is honest. (Whether the name
  stays is open: §5.)
- **D11 Assessment.** Feedback on every option; a score reported; no pass mark in round
  one. *Reason:* practice over grading, and a wrong answer still teaches.
- **D12 Text and interaction only.** No narration, no video. *Reason:* the workflow does
  not produce them.
- **D13 Content as data.** The designer's content lives in the repo as data the engine
  renders. *Reason:* a wording change needs no run.
- **D14 Accessibility.** WCAG 2.2 AA: every interaction keyboard-operable and announced to a
  screen reader. *Reason:* the course teaches it, and the LMS audience expects it.
- **D15 Statements.** The smallest set: launch, module completion, choices, checks, course
  completion with the score (made exact by D19). *Reason:* enough to see completion, score
  and where learners wander.
- **D16 The course opens as a scenario.** One calm screen puts the learner in the role
  before the home page; each module's first screen is the next scene of the job.
  *Reason:* Ross's first looks at the design: the home page had too much on it, and a role
  gives the learner a frame of mind.
- **D17 The fridge activity is real.** One data-driven component, shown as the one-shot in
  module 00 and beside the accepted version in module 05, both keyboard-operable.
  *Reason:* seeing the two side by side is the payoff (Ross). (Since C21 the two fridges are
  in module 03: "Module numbers after C21" in round three's rules.)

### From the brief (D18–D24)

- **D18 Launch and package.** The TinCan launch; a zip with tincan.xml at the root naming
  the course activity id and index.html; version header 1.0.2; no launch data in the URL
  means preview mode against an in-memory store with a PREVIEW badge. *Reason:* that is how
  SparkLMS launches, and the preview keeps the gates and local runs honest.
- **D19 Statements.** initialized on launch; completed per module; answered per check with
  response and success; interacted per fake-agent choice with the option as response;
  completed on the course with completion true and a scaled score; no passed or failed;
  context.registration on every statement and the course as parent on module-level ones.
  *Reason:* the smallest set a designer can read completion, score and wandering from.
- **D20 Library and sending.** `@xapi/xapi` with the fetch adapter and version "1.0.2",
  behind one Tracker interface (send, setState, getState); a queue that never blocks the
  learner and retries once; failures logged, shown only in preview. *Reason:* typed,
  maintained, takes the Spark auth string as it is, and keeps the record store out of the
  components.
- **D21 Authoring format.** One YAML file per module and per fridge, validated against a
  schema at build time. *Reason:* YAML reads as text to a designer, and a bad edit fails the
  fast gate.
- **D22 Resume.** Progress kept with the xAPI State API under the course activity, agent
  and registration, with localStorage as the fallback; the home page always lets a learner
  open any module. *Reason:* a learner leaves and comes back, and State is per registration.
- **D23 Spark specifics.** The auth value sent verbatim as the Authorization header; the
  actor used verbatim; course-level statements on the launch activity_id when present, with
  the course's own id in grouping when they differ; the postMessage bridge unused in round
  one. *Reason:* the example launch URL, and the record store's open CORS makes direct
  calls work.
- **D24 Activity ids.** Under `https://rosslote.github.io/agent-course/`: modules,
  checks, interactions and the two fridges (§6a). *Reason:* one stable root the LMS imports
  from tincan.xml, and a hierarchy that reads in a report.

### Epic `agent-course-wqw`'s rules

- **Content in YAML.** `content/` holds course.yaml, modules/00.yaml to 07.yaml and
  fridge/one-shot.yaml and fridge/accepted.yaml, parsed at build time by a Vite YAML plugin
  and validated by one schema at startup and in a unit test; nothing is fetched at run time.
  The storyboard in `docs/course/modules/` is the source of the copy, carried word for word;
  where the design boards differ in copy, the design wins. *Reason:* D13 and D21, and the
  storyboard and design are already reviewed.
- **One schema, one owner.** `src/content/` belongs to bead .2; a bead that needs a field
  the schema lacks files a bead, never edits the schema. *Reason:* parallel beads build to
  one contract without colliding on it.
- **One screen type per screen.** A storyboard screen that combines types becomes
  consecutive screens (module 00's "Just ask" is the chat, the tick-everything choose, then
  the one-shot fridge; every Check screen is two choose screens, "Check 1 of 2" and "Check 2
  of 2"); acceptance counts refer to the YAML, never the storyboard's numbers. In copy the
  design wins; in structure this rule wins. *Reason:* each type is built and tested once.
- **Screen types.** scene, takeaway, chat, brief, choose, match, order, fridge, compare,
  each defined in §6a; every interaction and check carries a slug that becomes its activity
  id. *Reason:* that is every kind of screen the storyboard uses, and nothing more.
- **Scene blocks.** paragraph, cards, quote, numbered list, table, two columns of blocks, a
  monospace block, a stats row, and an aside with a glossary term. Module 04's finding
  journey is a scene, then a choose with the fix revealed on the right verdict. *Reason:*
  they cover the stepped plays, the timeline, the gate output, the pull request's chapters
  and the numbers card.
- **Choose extras.** An option may carry reveal blocks, shown only when it is chosen; a
  choose may carry after blocks, shown once checked, and a box panel where each option names
  the wall it draws when ticked (module 03). A wrong verdict in module 04 shows its feedback
  and Try again. *Reason:* modules 00, 03 and 04 need them, and they keep one screen one
  type.
- **The chat is scripted.** A fixed learner opening, agent messages, optional reply options
  each with the agent's scripted reply, and a side panel. No free-text box, no branches, no
  debriefs in round one (this replaced a fuller chat). *Reason:* nothing in the storyboard
  uses them.
- **Course-level pages.** The scenario and the home page are the course's, not module
  00's, and their copy is in course.yaml with the course's description for tincan.xml;
  module 00 starts at "The request"; the home page always opens any module (D22).
  *Reason:* they belong to no module, and their copy is content too.
- **The look.** The design's first pass: the tokens, type and exclusions in
  `docs/design/2026-10-15-first-pass/README.md`; fonts bundled with @fontsource packages
  imported from `src/index.css`; icons inline SVG; no emoji, no gradient washes, no cream or
  serif display, no left-border cards. *Reason:* the design was reviewed with Ross, and
  nothing is fetched at run time.
- **Hash routing, hand-rolled.** No router library and no drag library. *Reason:* the LMS
  launch query string survives every navigation (D18, D23), and package.json stays with two
  beads.
- **The frame and its callback.** The module frame (bead .16) gives every screen its
  content, its saved answer when one exists, and a read-only view of the module's progress,
  and one event callback for its four events (§6a). No screen talks to the record store.
  This replaced a callback defined by the course shell. *Reason:* screens stay driven by
  content and testable alone, and a reopened screen renders itself answered.
- **Progress and score.** A check or capstone item can be re-answered and the latest answer
  counts; the score is 28 points and the scaled score is points over 28 (§6a). This replaced
  30 points, which counted checks module 07 does not have. *Reason:* the point is the
  practice, as in the fake brief's own D7 for the fridge (module 01: the latest attempt is
  what the LMS gets).
- **Module completion.** A module is complete when its takeaway is reached with every scored
  screen in it answered; Next is disabled on a scored screen until it is answered, and a
  route to a screen past the first scored screen still unanswered (typed, or resumed) shows
  that screen instead, so reaching the takeaway means every check is done (tightened on
  2026-10-15: Next alone did not stop a typed route reaching the takeaway); unscored
  interactions can be skipped. Back always works; Back on a module's first screen and Next
  on its takeaway go home. The course is complete when all eight modules are. *Reason:* one
  event marks completion, and it still reconciles with D11's checks.
- **Module 07.** No checks; its end screen is its takeaway (the complete box with the ring,
  then the end copy); its score screen is a scene whose stats row reads the module's
  progress ("14 out of 14"). *Reason:* the capstone's order and walls are its scored items.
- **Resume.** Progress (modules completed, screen reached, every answer) is written to State
  after every change and to localStorage always, stamped with when it was saved; in preview
  localStorage alone. On load the newer of State and the local copy wins by that stamp, State
  on a tie (reversed on 2026-10-15 from State always winning, which lost what a dropped State
  write had left only in localStorage). State is keyed by the launch activity_id when
  present, else course.yaml's id. A State read finds a document; or none (a 404, or an
  answer that is not a JSON progress document); or nothing known (a network error, 401, 403,
  5xx, or no answer in time). While nothing is known the course plays from the local copy,
  writes no State, reads again before a write at most every 30 seconds, and holds the module
  and course completions back until a read answers, then works them out against the document
  it adopted (reversed on 2026-10-15 from a failed read counting as none, which let the local
  copy overwrite State it had never read). The State read bypasses the HTTP cache, and what
  is still queued, the statements and the last State write, goes out with fetch keepalive
  when the page is hidden or closed. localStorage is keyed by course id and registration
  ("preview" in preview; for a launch that carries no registration, "launch:" and the
  learner: the account's homePage and name, else the mbox, mbox_sha1sum or openid; reversed
  on 2026-10-15 from "preview" for both, then from "launch" alone, which every learner in one
  browser shared), and a launch never loads preview's progress nor another learner's.
  *Reason:* D22, and a dead endpoint or a preview run must not leak into a real learner's
  record; sharing the "preview" key let exactly that happen.
- **Preview mode.** No endpoint in the URL, or an endpoint without actor or auth, means an
  in-memory store, a PREVIEW badge in the top bar and a statements drawer, newest first,
  with verb, object and result; with a launch neither shows. *Reason:* D18, and a designer
  or a test can read every statement without an LMS.
- **Statements.** The actor and Authorization verbatim, context.registration on every
  statement, header 1.0.2, ADL's verbs (initialized, completed, answered, interacted).
  initialized and the course's completed use the launch activity_id as object when present,
  else course.yaml's id; module, check, interaction and fridge statements use the D24 ids
  with course.yaml's id as parent and the launch activity_id as grouping when it differs.
  answered goes on every Check press of a scored screen (wrong then right sends two);
  interacted once per option pick on unscored screens; completed once per fridge play when
  it ends, with its score; the course's completed when the last module completes and again
  with the new score whenever a scored item changes afterwards. The storyboards' own
  "Statements" lines are superseded: no "module launched", no chapter opened, no per-item
  fridge statements. *Reason:* D19 and D23, sent exactly once per thing a designer reads.
- **The fridge component.** One component driven by its fridge file (D17): shelves, items
  with their shelf and reason, feedback mode (reason, or flash only), score mode (right
  first time out of n, or points), timer seconds or none, leaderboard entries or none,
  confetti or not, a Try again. Pointer drag with mouse and touch; the keyboard route (Enter
  picks up, arrows move between shelves, Enter places, Escape puts back); a live region and
  a visible status line with the same words (item, shelf, result). *Reason:* both fridges
  are one engine, and D14 holds for both.
- **A fridge play.** A play ends when every item is placed or, on the one-shot, when the
  timer runs out; Try again or Reset starts a new play; leaving mid-play ends nothing. The
  one-shot's wrong drop returns the item and says only that it returned, never why (its "No
  timer" control, which worked before or during a play for WCAG 2.2.1, was reversed on
  2026-10-15 under 2.2.1's essential exception: the time pressure is what the activity
  shows, it is optional and unscored, and nothing waits on it; see "The one-shot's timer" in
  round two's rules). After Enter picks an item up, the cursor starts on the first shelf, so
  the salad drawer is three arrow-downs away. *Reason:* one completed statement per play,
  and the one-shot shows what an unbriefed build leaves out.
- **Accessibility.** WCAG 2.2 AA throughout: real buttons and links, 44px targets, visible
  focus, every control reachable by Tab, right and wrong carried by an icon as well as
  colour. The one-shot is keyboard-operable too, and its comparison row says so. *Reason:*
  D14, which the course teaches.
- **The package.** `npm run package` builds with relative asset paths and writes
  `dist/agent-course.zip` with tincan.xml at its root naming the course activity id and
  index.html as the launch file, then checks the zip it wrote; it joins `npm run gate`;
  `dist/` stays gitignored. *Reason:* D18, and the LMS unzips it into a folder of its own.
- **Dependencies.** Bead .2 adds the YAML plugin, the schema library, @xapi/xapi and the
  three @fontsource packages; bead .12 the zip library; no other bead touches package.json.
  *Reason:* parallel beads never conflict on the lockfile.
- **The gate.** No integration tier (CLAUDE.md): the full gate is lint, typecheck, unit and
  e2e, plus the package. *Reason:* the course has no server to integrate with.
- **Test fixtures.** The shell's and the frame's tests use inline fixtures, never the stub
  modules the content beads replace. *Reason:* the tests survive the content arriving.

### Epic `agent-course-7ec`'s rules (round two)

Ross played round one from its branch and asked for five changes (log
`docs/conversations/2026-10-15-round-one-feedback.md`; design
`docs/design/2026-10-15-round-one-feedback/`). Round one's rules above still bind every
bead, except where a rule here replaces one.

- **Home, done at a glance.** Every module card on the home page says where it stands in one
  place, a pill in the card's top row beside the module number. A done module's pill is
  solid green with a tick and the word "Done", and its card has a 2px green border; "In
  progress" (indigo, soft fill) and "Not started" (outline, muted) are quieter pills in the
  same place. The status line at the card's foot goes. The words stay those of
  `src/course/home/labels.ts`, and tick, word and colour go together (D14). The design is
  `Main` ("1a") on the round's canvas. *Reason:* Ross could not tell a done module from one
  not started.
- **The multi choose's verdicts.** A multi-select choose (mode multi), once checked, judges
  what the learner did with each option, not whether the option is a right one: ticked and
  right "Right to tick"; left and wrong "Right to leave it"; ticked and wrong "Shouldn't be
  ticked"; left and right "Missed: should be ticked". The first two are green with a tick,
  the last two red with a cross, as a pill beside the option's label; the option's own
  feedback sits under it with no icon of its own. A summary line under the list, visible and
  announced, reads "5 of 5 right." when every choice is right, else "<n> of <total> right: "
  then "one tick shouldn't be there" or "<k> ticks shouldn't be there", and "one missed" or
  "<m> missed", joined by ", and ", ending with a full stop. It holds for every multi choose
  (00 what-went-wrong, 02 write-the-acceptance, 03 build-the-box, 06
  what-would-you-change); single choice and the statements are unchanged. *Reason:* Ross
  read red crosses on rows he had rightly left unticked as his own mistakes.
- **The one-shot's timer.** The one-shot fridge runs fifteen seconds
  (`content/fridge/one-shot.yaml`), and no fridge has a No timer control. This reverses
  round one's No timer ("A fridge play"), put there for WCAG 2.2.1, under 2.2.1's essential
  exception: the time pressure is what the activity shows, it is optional and unscored, and
  nothing waits on it. *Reason:* Ross wants learners to run out of time quickly; a minute
  with no information is longer than anyone will try.
- **The last five seconds.** The last five seconds of any timed fridge warn: the timer reads
  red and pulses (no pulse under prefers-reduced-motion), the fridge's outline turns red,
  and a short high beep sounds at 0:05, 0:04, 0:03, 0:02 and 0:01 and a long low tone at
  0:00, six tones a play. The tones are made in the page with the Web Audio API (no audio
  file, nothing fetched, no new dependency) and start only after the learner's first
  pick-up. There is no mute control. When time is up the tray gives way to the fridge
  file's time-up message and Reset. *Reason:* Ross asked for sound in the last five seconds
  to raise the stress, so the learner feels how bad the unbriefed build is.
- **The one-shot's copy.** Module 00's fridge intro reads "Optional, fifteen seconds. The
  timer starts as soon as you pick something up."; the agent's two "60-second timer" lines
  in module 00 read "15-second timer". A saved one-shot play with the timer switched off
  (round one's No timer) no longer fits and counts as none. *Reason:* the copy follows the
  timer, and a play without the timer is not a play of this one-shot.
- **Balanced cards rows.** A cards block, numbered or plain, lays out in balanced rows: the
  column count from two to four (one for a single card, never more than the cards) that
  leaves the fewest empty places in the last row, more columns on a tie (5 cards: three
  then two; 6: three and three; 7: four then three); a short last row is centred. Narrower screens drop to fewer columns and keep a short last
  row centred. *Reason:* "How a brief goes" ran four and one, every card taller than it
  needed to be.
- **The brief, one round at a time.** The learner's opening message stays; the current round
  shows alone under it with a "Send answers" button, off until every question in the round
  has an answer, with the hint "Answer every question, then send." beside it; the last round
  keeps Your defaults beside Send answers until every question in it is answered (as round
  one hid it). Send answers or Your defaults fades the round out
  and puts one learner line in its place ("My answers to 1 to 5.", "My answers to 6 to 8.",
  or the defaults reply from the YAML); then the agent shows a spinner and "Thinking…" for
  about 1.5 seconds, and the next round's message and questions arrive in the same place,
  with focus moved to that message. After the last round come Thinking, the closing message
  and the comparison card. On screen at any time: the opening, the latest learner line and
  the agent's current turn; the record panel keeps every decision and fills as chips are
  picked. Under prefers-reduced-motion nothing fades, and Thinking still shows. *Reason:*
  it is Ross's real workflow (answer a batch, press Enter, the agent thinks and comes back),
  and he did not see round two appear below round one.
- **The brief's statements and resume.** The brief's statements are unchanged (interacted per
  chip pick, three for Your defaults); Send answers sends nothing. Its saved answer stays
  round one's (the picks and whether Your defaults was pressed), and a resumed brief counts
  a round as sent once every question in it is answered: it opens on the first round with a
  question unanswered, with its picks and no Thinking, or closed once every question is
  answered (chosen on 2026-10-15 over recording each Send, because the frame saves an answer
  only with a statement and Send answers sends none). Module 01's brief intro reads "…pick it or pick differently, then send your
  answers. Every answer becomes a decision on the right." *Reason:* sending is the learner's
  Enter, not a choice a designer reads, and a learner who comes back finds the brief where
  they left it.
- **Fixed words in code.** The new fixed words (the four verdicts and the summary, Send
  answers and its hint, the "My answers to …" line, Thinking…) live in the screens' code
  beside round one's fixed words, as `src/course/home/labels.ts` does, not in the schema;
  this epic changes no schema. *Reason:* moving fixed words into course.yaml is a later
  round's, and no schema change keeps the beads disjoint.
- **The look, round two.** The first pass's tokens (`src/styles/tokens.css`); the only new
  visual pieces are the status pills, the verdict pills and the red timer warning. No new
  dependency. *Reason:* the round's design pass kept the first pass's look unchanged, and
  package.json stays as round one left it.
- **Back and Next always in view.** The frame's footer, Back and Next, sticks to the foot of
  the window however long the screen is; a control scrolled into view stops above it, never
  under it (WCAG 2.4.11). *Reason:* Ross could not see on a long screen whether Next was
  open, so whether he could skip it (added 2026-10-15 after round two).

### Epic `agent-course-bsg`'s rules (round three)

Ross reviewed both builds on 2026-10-19 and asked for the course to be reshaped: the
learner's seat, four walls, five modules (log
`docs/conversations/2026-10-19-four-walls-not-five.md`). Round one's and two's rules above
still bind every bead, except where a rule here replaces one. C18–C24 are recorded with the
same numbers in `docs/course/README.md` §9.

- **C18 The learner's seat.** The course teaches what the learner does with the workflow:
  describe what you want loosely and answer the brief; read the plan and say go; wait;
  judge what comes back from its evidence; go round again; and tell the agent how you like
  to work, so it becomes a skill. No screen asks the learner to do an agent's job (write
  acceptance, box a builder, play the skeptic, order the loop): the agents' work is shown as
  a story. This replaces D3's six outcomes. *Reason:* the audience never writes a bead;
  walking them through the workflow as if they were a worker is absurd (Ross).
- **C19 Two ideas.** First, how you ask: the hand-holder's page of detail gets exactly that,
  the designer's mistakes built in and no suggestion; "go and do it" gets surprises; the
  middle is to describe it loosely, let the agent explore, and use the brief as the forum
  where its questions and its own ideas meet your decisions, accepted, declined or talked
  through, so the surprises that matter are gone before the build and the agent is an
  extension of your creativity. Second, the builder is the worst judge of its own work: box
  it, let other agents at it, judge from evidence. The first is the record wall; the second
  the other three. This replaces D2's one message. *Reason:* Ross, 2026-10-19.
- **C20 Four walls and the arrow.** The record (01), the gate and the reviews (both gained
  in 02), evidence (03), and the retro's ring (04). "Done" is not a wall: the plan with its
  acceptance and demo script is the orchestrator's work, shown in 02 and judged against in
  03. course.yaml's box has four wall labels, in this order and with these words: record "01
  the record", gate "02 the gate", agents "02 the reviews", evidence "03 evidence"; the ring
  label stays "the retro: round again, change the check". The diagram draws a box with four
  sides, top first and clockwise, and its text alternative counts the walls instead of
  saying five. A module may add two walls. This replaces round one's five walls (D5, and
  "Choose extras"' box panel in module 03). *Reason:* Ross never writes a definition of
  done, and a five-walled box drew as a pentagon.
- **C21 Five modules.** About thirty minutes, slugs "00" to "04": 00 "What works and what
  doesn't" (5 minutes, wall none), 01 "The brief" (7, record), 02 "While you're away" (8,
  gate and agents), 03 "What comes back" (8, evidence), 04 "Round again, and make it yours"
  (7, ring). No module has wall all. Module files 05, 06 and 07 go. The home page's meta
  reads "Five modules · about 30 minutes", the scenario's note begins "Five short modules,
  about 30 minutes.", and the scenario's second line no longer says "decide what done
  means" (it reads: answer its questions, say go to its plan, judge what comes back). The
  score is the ten checks, two per module, one point each, and the scaled score is the
  points over 10; there is no order or match screen in the content. This replaces D4's
  eight modules, round one's "Progress and score" (28 points), "Module 07" and the
  completion rule's "all eight modules". *Reason:* too many modules for what is taught; the
  score follows the content, as round one's rule says.
- **C22 No code on any screen.** No code, file paths, line numbers, gate output, bead cards
  or read-first and touches lines anywhere; evidence is described in words ("the drop code,
  where it says to ignore a drop while a message is showing"). Copy says "piece" for a bead
  and names "epic" once as the plan's name; "orchestrator" is introduced once, in 02, as
  the agent that runs the job and never writes code. The glossary keeps only the words the
  five modules use, at most sixteen, with door kept for module 03's aside. *Reason:* the
  skeptic page and the gate block were pages for programmers (Ross).
- **C23 True to the skills.** Every claim the course makes about the workflow is what the
  skills do: a builder's gate is lint, types and the unit tests, and the browser run is the
  full gate at the end of the run; a builder that edits outside its files is sent back by
  the orchestrator reading its report and the change against the piece at hand-back, never
  refused at the keystroke, so no copy says "rejected"; a clash where two builders' work is
  joined is a merge conflict another agent settles, not an overwrite; the cite-a-line rule
  came from a refuted race, so 04's story does not list it; the one-shot runs fifteen
  seconds everywhere, 03's table included; the orchestrator, not the demo script, catches a
  thing built that nobody asked for; the closing copy says "a recorded walkthrough someone
  judged", not a pull request; the brief never says how many questions remain. *Reason:*
  the course claimed walls the workflow does not have (the log's review against the skills
  and agents).
- **C24 content/ is the source of the copy.** `docs/course/modules/*.md` are round one's
  draft, kept for the record and not updated; `content/README.md` and
  `docs/course/README.md` say so. Copy this epic does not decide is the worker's, in the
  course's register (second person, plain words, the existing YAML as the pattern); a
  product choice the decisions leave open is the orchestrator's, recorded under "chosen by
  orchestrator". This replaces round one's "Content in YAML" rule that the storyboard is
  the source, carried word for word. *Reason:* Ross reviews the running course, not
  markdown, and two copies drift.
- **Unit tests hold whatever the content says.** No unit test depends on a module's copy,
  screen list, slug, option count or point total except through the content it reads at
  run time or an inline fixture, so a content edit never turns the fast gate red (D13).
  This finishes round one's "Test fixtures" rule. *Reason:* round two's tests played module
  07 and asserted 28 points, which every content bead would have broken.
- **Activity ids reused.** The slugs 00 to 04 are reused with new content, so the module,
  check and interaction ids keep their shape (D24); the statement shapes are unchanged.
  *Reason:* the course has not launched, so nothing is recorded against them.
- **Module numbers after C21.** The earlier rules that name a module read against the five
  modules; the rest of each rule stands. D8: the real run's numbers are in module 02 and the
  story of the check that missed in module 04. D17: the accepted fridge is beside the
  one-shot in module 03. "Content in YAML": the module files are `modules/00.yaml` to
  `04.yaml`. "One screen type per screen": module 00 runs the "Just ask" chat, the "Hold its
  hand" scene, the tick-everything choose, then the one-shot fridge. "Scene blocks" and
  "Choose extras": module 04's finding journey and its wrong verdict with Try again are gone,
  because no screen has the learner play the skeptic (C18); the blocks and the extras stay
  in the engine, with reveal blocks in module 02, after blocks in modules 00, 03 and 04, and
  Try again on every choose once checked. Round two's "The multi choose's verdicts" holds
  for every multi choose, which is now module 00's what-went-wrong alone. This replaces the
  module numbers in those rules. *Reason:* C21 renumbered and cut the modules, and a rule
  naming a module that moved sends a bead to the wrong file.
- **Engine unchanged but for the walls.** The look, the engine's fixed words, the screen
  types and the blocks are unchanged; the schema changes only for the walls (four of them,
  and a module adding two). No new dependency. *Reason:* round three changes what the
  course teaches, not how it looks or what it sends; the box is the one engine change it
  needs.

## 6a. Engine terms

The names later beads cite. The rules behind them are §6.

- **Content.** `content/course.yaml` (title, description, activity id, the scenario and home
  copy, the box's labels, the five modules in order with slug, title, minutes, wall and
  file), `content/modules/00.yaml` to `04.yaml` (each module's screens),
  `content/fridge/one-shot.yaml` and `content/fridge/accepted.yaml`. One schema in
  `src/content/` validates all of it and gives the app a typed course; `content/README.md`
  documents each screen type. `content/` is the source of the copy (C24).
- **The box.** Four walls, in this order: the record, the gate, the reviews (the wall
  called agents) and evidence, labelled "01 the record", "02 the gate", "02 the reviews" and
  "03 evidence"; and the ring round them, "the retro: round again, change the check".
  Drawn as a box with four sides, top first and clockwise; its text alternative counts the
  walls. Each module adds no wall (00), one wall (01 the record, 03 evidence), two walls (02
  the gate and the reviews) or the ring (04); no module adds the whole box at once (C20,
  C21).
- **Screen types.** *scene*: heading, eyebrow, body blocks. *takeaway*: the card and the box
  with the walls gained (the ring on 04, with the end copy after it). *chat*: a
  fixed learner opening, agent messages, optional reply options each with a scripted reply,
  a side panel. *brief*: ranked questions with chips, the recommended one marked, decision
  text per option filling a panel, a playback message, round two, a "Your defaults" button,
  a closing message. *choose*: prompt, options with label, right or wrong and feedback,
  optional reveal blocks; mode multi or single; scored or not; optional after blocks and a
  box panel; the checks are scored single-choice. *fridge*: one fridge from a fridge file.
  *compare*: two fridges side by side and a table of differences. Round one's capstone
  types stay in the engine and `content/README.md`, and no module uses them (C21).
- **Scene blocks.** paragraph, cards, quote, numbered list, table, two columns (each a list
  of blocks), monospace, stats row (numbers with captions), aside (with a glossary term).
- **Course-level pages.** The scenario (role chip, heading, memo, three lines, "Take the
  job") and the home page (thesis quote and attribution, the box, five module cards with
  blurbs). Neither is part of a module; module 00 starts at "The request".
- **The frame.** `src/course/frame/`: the top bar with the module name, one progress dot per
  module (five) and "Screen n of m"; Back and Next; a screen registry keyed by type; hash routes per
  screen. It gives each screen three props: its content, its saved answer when one exists,
  and a read-only view of the module's progress (every slug's latest answer and score).
- **The event callback.** One function the frame passes to every screen, with four events:
  *answered* (slug, right, score raw and max: 1 of 1 for a check; one per Check
  press); *interacted* (slug, option; one per option
  pick, three for the brief's defaults); *fridge ended* (slug, score raw and max);
  *takeaway reached*.
- **Module completion.** The module's takeaway is reached with every scored screen in it
  answered. Next is disabled on a scored screen until it is answered, and no route passes
  the first one still unanswered. The course is complete when all five modules are.
- **The score.** The ten checks: two in each of modules 00 to 04, one point each. Scaled
  is points over 10. The latest answer counts. Fridge scores are reported per play and are
  not part of it (C21).
- **Preview mode.** No launch (no endpoint, or no actor or auth): an in-memory store, the
  PREVIEW badge and the statements drawer; progress in localStorage under "preview".
- **Activity ids.** Course `https://rosslote.github.io/agent-course/`; modules
  `…/modules/<nn>`; checks `…/modules/<nn>/checks/<n>`; interactions
  `…/modules/<nn>/interactions/<slug>`; fridges `…/fridge/one-shot` and
  `…/fridge/accepted`.
- **The package.** `npm run package` writes `dist/agent-course.zip`: the built course with
  relative asset paths, and tincan.xml at the root naming the course activity id, name and
  description from course.yaml, and index.html as the launch file.

## 7. Log

- 2026-10-15: idea raised in the presentation repo's session and assessed; repo and beads
  initialised; toolchain scaffolded with every gate green; this document written; idea bead
  `agent-course-r4n` filed. Next: `/brief agent-course-r4n`.
- 2026-10-15, later: Ross asked the agent to decide the content rather than answer rounds
  of questions, since he is not a learning designer. Storyboard draft in `docs/course/`: README
  with decisions C1–C15, eight modules, glossary. Next: Ross reviews, Claude Design, the brief.
- 2026-10-15, later still: design first pass in Claude Design (docs/design/2026-10-15-first-pass/),
  corrected twice from Ross's reactions (the scenario entry, C16; both fridges playable, C17). The
  brief ran in one round on bead `agent-course-r4n` (docs/conversations/2026-10-15-brief.md): D18–D24,
  the SparkLMS TinCan launch, 1.0.2, statements, @xapi/xapi, YAML authoring, State resume. Next:
  `/epic agent-course-r4n`.
- 2026-10-15, round one filed: epic `agent-course-wqw` from the brief, then `/epic-review`,
  whose 49 findings were all fixed on the beads (the score 28 not 30, module 07's end screen
  its takeaway, one screen type per screen, the chat scripted only, four beads split; 18 in
  four groups). Its first bead wrote the decision record (§6, §6a), rewrote §5 to what is left
  for UAT and later rounds, and corrected `docs/course/README.md` §7 and §10 and module 07.
  Next: `/orchestrate agent-course-wqw`.
- 2026-10-19, round three filed: Ross reviewed both builds and reshaped the course (log
  `docs/conversations/2026-10-19-four-walls-not-five.md`): the learner's seat, not the
  agent's; two ideas, how you ask and the builder as the worst judge of its own work; four
  walls and the arrow, "done" no longer a wall; five modules of about thirty minutes; no
  code on any screen; every claim true of the skills; content/ the source of the copy. Rounds
  one and two merged into main (3a83f84). Epic `agent-course-bsg` filed, nine beads, then
  `/epic-review`: 29 findings, all confirmed, 24 fixed on the beads and five answered (the
  agent's own idea in the brief is labelling each shelf, not shuffling; 03's choices name
  the reason staying until the next move). Its first bead wrote the decision record (C18–C24
  in `docs/course/README.md` §9, with its preamble, §2–§5, §7, §8 and §11 in line; round
  three's rules in §6; §6a) and cut the glossary to sixteen words. Next:
  `/orchestrate agent-course-bsg`.
