# Plan: a course on getting the most out of agents, built by the workflow it teaches

Status: idea raised on 2026-10-15 in the presentation repo's session and captured here
(`docs/conversations/2026-10-15-where-the-course-starts.md`); repo, beads and toolchain set
up the same day. Idea bead: `agent-course-r4n`. Content draft written the same day at Ross's request, with the content
decisions made by the agent (`docs/course/README.md` §9; log
`docs/conversations/2026-10-15-what-the-course-teaches.md`). Next: Ross reviews the
draft, Claude Design mocks it up, then `/brief agent-course-r4n` for what §10 there leaves
open.

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

## 5. Open questions for the brief

Settled on 2026-10-15 by the content draft (`docs/course/README.md` §9): who the learner
is, the objectives and the modules, what is assessed, how designers review (the draft,
then the walkthrough), and what carries over from the talk. Still open (§10 there): the
package format and the LMS launch, the authoring format, look and feel, a pass mark.

- Which package format the company's LMS launches (cmi5, a plain xAPI package, SCORM), and
  how the record store's endpoint and credentials reach the course at launch.
- Who the learner is (developers, learning designers, everyone) and what they should do
  differently afterwards.
- The learning objectives and the modules; what is assessed; which statements the course
  sends (verbs, activities, results, completion) and what the LMS does with them.
- How the learning designers author content: the format in the repo, and how they review
  (the PR's walkthrough, the running course, both).
- Which review lenses a course needs, and who signs the content off.
- Which of the talk's content carries over and which is new.
- How the course is tested: statement tests, the e2e run against a fake record store,
  conformance tooling for the package format.
- One package or several, one per module.
- Look and feel, and whether it gets a design pass.

## 6. Decisions

Decisions are made in the brief and recorded on its bead. The epic's first bead writes the
durable record here.

(none yet)

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
