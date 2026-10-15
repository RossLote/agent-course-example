---
date: 2026-10-15
stage: conversation
title: Courses as code for LXDs: a library, skills, a repo, and later an app
participants: [Ross, agent]
source: live, written during the session, while the round-one epic was orchestrating on its branch
---

# Courses as code for LXDs: a library, skills, a repo, and later an app

A conversation, condensed, not verbatim: Ross in his own words, the agent in
its own. Ross dictates; his entries keep the point he was making and drop the
rest. It is a tangent from the course: an idea the course's build gave Ross,
for a product that would let learning designers build modules the way he
builds software. Nothing here changes the round-one epic.

## Ross: the idea the course gave me

- Building this course has given me an idea. For reference I pointed the
  agent at two other things: the presentation I'm giving on Tuesday, which
  explains my workflow and its benefits and was itself built with the
  workflow (so it is a bit recursive), and another project of mine, an
  authoring tool in development, because of the way it pieces together its
  components: a big component library with versioning, a player, and the
  rest. This course is also my way of showing the LXDs they could use the
  same process.
- The idea: a component library, a workflow and a structure so LXDs can
  develop their modules the way I develop my products and features, with a
  bit more guardrails. The library lives in GitHub, the skills live in
  GitHub, and they use Claude Code in VS Code to build modules in a
  predictable way, by dictation or by typing.
- The next phase would be an installable app where all of this lives. It
  would let them build without being exposed to much code, but still let
  them look at the code and the config. They would talk to Claude Code in
  it the way I talk to you, by voice or chat. It would preview the course
  they are building, and in the preview they could click around, change
  things, or mark things for review and hand them back to the AI to fix,
  the way I work with my AI. I'm trying to bring what I've learned as a
  software engineer working with agents into the LXD world.
- Git and GitHub as the store and the version control for everything they
  build, because a course would be config plus components, so it can be
  version controlled. Media needs some other home: I don't want Git LFS,
  it's expensive. The app would ask them to authenticate with GitHub and
  point at a repo, and that repo is the source of truth for their whole
  library, not one course: a directory per client, the client's courses
  inside, all referencing the components. Everything built in natural
  language.
- If a component they need doesn't exist in the library (a default one
  ships), they ask the agents to build it.
- Take all of that, look at what I've pointed you at, and let's have a
  conversation about what this may look like.

## Agent: you have already built the small version of it

- I read this repo's plan, course design and epic, the content schema and
  YAML in the round-one worktree, and had two agents survey the presentation
  repo and the authoring tool. The round-one orchestrate was running on its
  branch the whole time and I touched nothing there.
- My read: the course is the small version of the product. Content as YAML,
  a fixed set of screen types, an engine, an xAPI layer, a preview with a
  statements drawer, gates and a recorded walkthrough, and the workflow built
  it in a day. The product is that, pulled out of the course and generalised,
  with skills for LXDs on top. The app comes after, as a thin shell over
  something that already works in VS Code.
- Four pieces, and where each comes from. The kit (library, engine, player,
  packager): seeded from this course's source; from the authoring tool, borrow
  the designs rather than the code: the block manifest (schema, integer
  version, migrations, which props are assets or localisable), the rule that
  a package never links out, the pure packagers for SCORM, cmi5 and xAPI. The
  content repo convention: a directory per client, a course directory per
  course with its YAML, a lockfile pinning the kit version, a theme per
  client, a local components directory, each course self-contained so a
  client can be split into its own repo later. The LXD skills: yours,
  narrowed: a module brief, a build with the same phases and a fixed gate, a
  content review with lenses for objective alignment, accuracy, accessibility
  and reading level, and a package step; the LXD never edits engine code; a
  missing component is a bead that goes through a stricter path (contract,
  accessibility and statement tests, a fixture) and a pull request to the
  kit. The app, phase two: GitHub sign-in and clone, an agent chat with
  dictation, the player as preview with the statements drawer, click-to-
  comment that writes a structured note (screen, element, text) which becomes
  a bead, and a viewer for the config and code. The authoring tool's review
  links, tickets and ticket replay are that click-to-review, pointed at a
  human today.
- The fork to name early: Git or a database as the source of truth. The
  authoring tool is database-first with agents as guests over MCP, which its
  plan already has. This idea is Git-first with the agent as the author.
  Git gives history, branches, pull requests, walkthrough review, offline
  work and free versioning; it costs real-time collaboration and a WYSIWYG
  editor. I recommend Git-first, started from the course's kit and not from
  the authoring tool, because what an LXD runs must be Node and Claude Code
  and nothing else, and the tool is a Next, Nest, CRDT, Postgres, multi-
  tenant monorepo whose plugin runtime half is not loaded yet. Keep the door
  open: its course JSON could become the kit's format and its blocks the
  library if the two converge.
- Versioning: the tool versions each block type with an integer and
  migrations and has no library-wide pin, because there is one live registry
  per tenant. Many course repos need the opposite: the kit released with a
  semver, each course pinning it in a lockfile, and an upgrade being a bead
  that runs the migrations and the gate.
- Media: agreed on no LFS. Small assets live in the repo; the rest in an
  S3-compatible bucket, content-addressed as the tool does it, with a media
  lockfile in the course directory recording hash, size, URL and alt text so
  Git still knows every asset. The package step fetches, rewrites and refuses
  to link out.
- The hard part is review, not building. The presentation's retro found the
  gap: review verified the code; a colleague validated it like a user. For a
  course the equivalent is pedagogy. The content lenses, a skeptic that cites
  a source, and the LXD playing the walkthrough and signing off are the piece
  that exists nowhere yet, and the piece that makes "ask the agent for a new
  component" safe.
- Flags: one repo for all clients is one permission boundary, so the
  convention must allow a client to be split out, and the company's policy
  on client content in GitHub matters; the authoring tool's checkout holds a
  named client's real courses in two gitignored folders, which the survey
  kept out; a kit used by many courses needs a release owner; agent runs
  need a budget line per module; the packager must do several LMS formats
  from day one; a theme per client replaces the design pass.
- The order I proposed: finish round one of the course; a round-two epic
  that extracts the kit and makes the course its first consumer; the LXD
  skills and a pilot with one LXD on one real module in VS Code, whose retro
  writes the guardrails; the media service and the repo convention; then the
  app, built by the workflow, over all of that. Module 07 can one day end by
  pointing at the kit: the course teaches the loop, the kit runs it, and the
  course is built with the kit.
- Questions back: Git-first or authoring-tool-first; who the first LXD is
  and what the first real module is; whether one repo for all clients is
  acceptable to the company; and whether this gets an idea bead and a repo
  now, as the course did, or waits until after Tuesday.
