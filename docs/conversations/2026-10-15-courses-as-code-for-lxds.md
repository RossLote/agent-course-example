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

## Ross: drop ngage, drop the course; this is new

- Drop the authoring tool. I am not suggesting it is related to this in any
  way. I pointed at it only so you could look at its component library.
- And do not tie this to the course or its modules. This project gave me an
  idea for a product LXDs can use to build courses; the course itself has
  nothing to do with it. Disregard this project entirely. It is a completely
  new thing. Don't do what you just did; that was annoying.

## Agent: fresh, as its own thing

- Noted in the project memory so it does not happen again. The reference is
  used only for what a component library needs; nothing from the course
  carries over.
- What it is: a product in which an LXD describes a course and an agent
  builds it, with three things under their hands: a component library, a
  set of skills, and a repo of their own content. The agent is the authoring
  tool; Git is the save button. Phase one is those three used from Claude
  Code in VS Code; phase two wraps them in an app.
- The library: a versioned package holding the components, the player that
  renders a course from config plus components, and the packager that turns
  it into what an LMS accepts. A component carries a schema for the config
  the agent writes, a renderer, a reporting contract, its accessibility
  behaviour, a fixture, and a note the agent reads on when to use it. Each
  has its own schema version with migrations; the library has a semver
  release; a course pins the release. A default set ships; themes are tokens
  per client that every component consumes.
- The skills: the LXD's loop with the guardrails built in. Brief; outline
  reviewed as a document; build module by module behind a gate (schema,
  accessibility, reporting tests, a play-through); preview; change by
  saying what is wrong; content review by agents with lenses (objective
  alignment, accuracy against source material, accessibility, reading
  level, brand); client review from a built preview or the walkthrough;
  package; revise. A missing component takes a stricter path: built with
  its contract tests, kept in the repo's own components folder, promoted
  to the shared library by pull request. The guardrails: no code written by
  the LXD, the engine a dependency not in their repo, only validating
  config, nothing done until the gate is green, commits and pull requests
  made by the skills, no component usable until it passes the contract.
- The repo: the team's whole library. Clients at the top, each with a theme,
  brand assets and courses; each course a directory with a manifest, one
  file per module, a media manifest and a lockfile; self-contained so a
  client can move to its own repo. Media: small assets in the repo, the
  rest in an object store with content-addressed keys, the media manifest
  recording hash, URL and alt text, the packager inlining at build so no
  package links out.
- The app: a shell over all of that: GitHub sign-in and a repo, chat with
  dictation running the agent with the skills, the player as the preview,
  click an element to change or flag it (handing the component and its
  config path to the agent), a read-mostly view of config and code, tasks,
  a publish button. No capability the VS Code route lacks; it removes the
  terminal, Git and the file tree from view.
- Decisions it forces: YAML with a JSON schema as the config format; SCORM
  1.2 and 2004, xAPI and cmi5 from day one because clients decide; one repo
  per team or per client, decided by confidentiality and GitHub policy;
  media in a bucket or the company's DAM, pluggable; client review via a
  hosted preview or the walkthrough; a person owning library releases; a
  seat and a token budget per LXD.
- Where to start: one small kit repo built with the workflow (a dozen
  components, the player, SCORM 1.2 and xAPI packaging, preview mode, the
  skills), then a sample content repo with one client and one course built
  by one LXD in VS Code from a real brief; the pilot's retro says what the
  guardrails and the app need to be.
- Questions back: the first LXD and a real first course; the LMS formats
  clients need in year one; one repo per team or per client; a new repo and
  idea bead now or after Tuesday.

## Ross: entertain phase two, the installable app, in Rust

- Let's entertain phase two: an application an LXD can install. I was
  thinking of building it in Rust, because I want it small, installable on
  any system, fast, with a low memory footprint.
- It is basically a chat window where you can also open files and manage
  config and media. Creating a course would also create a manifest of the
  images, video and audio it needs. That manifest drives a UI built per
  course: a form with a field per asset, "here is the video referenced
  here, here is the audio", rendered dynamically.
- A preview button opens a new window, probably a WebView, because then the
  agent can drive the browser, collect the analytics and errors from it, and
  run scripts inside it to analyse things.
- I know we're getting ahead of ourselves; this is one step past the basic
  thing. I just want to see whether it is feasible.

## Agent: feasible, in Tauri, with three honest caveats

- I checked the Claude Code docs (headless mode, the Agent SDK, setup,
  authentication, permissions, hooks, MCP, legal) and the Tauri 2 docs
  (process model, sidecars, WebDriver, the window and webview APIs), and
  looked for a Rust client for the Chrome DevTools Protocol.
- Verdict: feasible, and Rust is the right call for the shell. Tauri 2 is
  the frame: a Rust core process, the OS webview for the UI (WKWebView,
  WebView2, WebKitGTK), and installers in single-digit megabytes with idle
  memory in the tens of megabytes, against Electron's hundred-plus. The
  figures are blog benchmarks, directional only.
- How each piece would work. Chat: the app spawns the native `claude`
  binary as a child process in headless mode with streaming JSON in and
  out, resumes sessions by id, and ends a turn with SIGINT. Dictation is the
  OS's own, into the chat box, for free. Guardrails come from the CLI
  itself: an allowed-tools list, a permission-prompt tool so prompts render
  in the app, PreToolUse hooks with path rules, an appended system prompt
  for the LXD role, and the restricted mode if needed. Preview: a second
  Tauri window serving the built course from a tiny local HTTP server that
  is also the fake record store. An initialization script injected into
  that window gives the agent a driver (snapshot, click, fill, wait), wraps
  console and errors, runs an accessibility audit, and in review mode turns
  a click on an element into a note carrying the component and config path
  the player tags it with. The app exposes all of that to the agent as an
  MCP server over HTTP, which the CLI connects to by config. Media: course
  creation writes a media manifest (id, kind, where used, requirements,
  status, source, hash); the app renders a form from it, a field per asset
  with a drop zone; a drop hashes, uploads to the bucket and writes the
  reference back. Git and GitHub: the app does the git work itself with
  the git2 crate and a GitHub App device-flow login, and the agent asks for
  commits and pull requests through the same MCP server; the LXD sees Save
  and Send for review. Publish: validate, copy the prebuilt player and the
  config and assets, write the manifest XML, zip, all in Rust.
- A design choice that keeps it small: no Node on the LXD's machine. Kit
  releases ship a prebuilt player, schemas and component docs from GitHub
  Releases; component development and the heavy gate (Chromium
  play-through, unit tests) run in the kit repo's CI on the pull request;
  the local gate is in the app: schema validation, the accessibility audit
  in the preview, the statement check, a scripted play.
- Caveat one: Claude Code is the heavy part. Its minimum is 4 GB of RAM and
  about 1 GB per session is the documented starting point, whichever shell
  wraps it. Each LXD authenticates with their own subscription or key; the
  terms forbid an app collecting or proxying Claude.ai credentials or
  offering its login inside the app, and shipping Claude Code in a product
  means agreeing to the Commercial Terms, binary unmodified, auth intact,
  no resale. So the app detects the binary, offers to run the official
  installer, and hands login to `claude auth login` in the browser.
  Commercial decisions before technical ones.
- Caveat two: there is no Rust SDK and no local HTTP surface. The documented
  path for other languages is spawning the binary with the streaming JSON
  flags; multi-turn over stdin is implied by the docs but the envelope is
  not fully documented. The fallback is a small Node sidecar running the
  TypeScript SDK, which costs a bundled runtime of tens of megabytes.
- Caveat three: the preview is the OS webview, not Chromium, and WebDriver
  for Tauri on macOS is a dead end because WKWebView has no driver. The
  injected-script route needs no driver and covers driving, console,
  statements, audits and click-to-flag; screenshots come from OS window
  capture since Tauri has no capture API; Chromium conformance lives in CI.
  For deep debugging the agent can attach to the user's installed Chrome
  over the DevTools Protocol with the chromiumoxide crate, nothing bundled.
- The spike to de-risk it: three things in one small repo. A Tauri shell
  that spawns the CLI and renders a resumable chat; a preview window with
  the injected driver exposed over MCP, the agent clicking through a sample
  course and reading console and statements; the media form from a
  manifest with drop-to-upload. If those three work, the rest is plumbing.

## Ross: what about Claude Code mods?

- It's also possible we could use Claude Code mods for this. I haven't
  looked at them yet to see how they work, but I'd like to at some point,
  and this might be a good place to start.

## Agent: mods change the recommendation

- I had not considered them; I loaded the mod-authoring skill and read the
  API. A mod is a plugin folder with a manifest and one hooks module. The
  module hooks events (tool calls, prompt submit, system-prompt compose,
  drawing, slash commands, session start) and reaches the engine through
  one interface: panes, bands, status line and toasts drawn with Box, Text,
  Button, Input, Select, Link, Markdown and Image on the terminal, desktop,
  VS Code and mobile surfaces; slash commands; tools the model calls;
  subagent types; files, processes, timers; state within and across
  sessions. It runs with no DOM and no Node of its own. It validates, tests
  and hot-reloads from the CLI, and installs from a GitHub marketplace with
  one command.
- What a course mod would be: a course pane (module tree, media status,
  gate status, the statements), slash commands for new course, media,
  preview and publish, the guardrails as hooks (deny writes outside the
  content folder, a command whitelist, the LXD role appended to the system
  prompt), gate results on the status line, and tools the model calls for
  the preview. Preview in Chrome, driven by the Chrome DevTools MCP server
  that already exists (snapshot, click, console, network, audits, run a
  script), with the player's review mode writing click-to-flag notes to the
  local preview server.
- Why it changes the recommendation: the mod plus the Claude Code desktop
  app is the installable app, with the LXD's own login, no spawning
  protocol, no embedding terms, no sidecar, and the skills, guardrails and
  UI in one install from GitHub. What it cannot do: embed the course in a
  webview, drag-and-drop files, a branded product. The media form is a
  small local page served by the preview server, or Input and Select in
  the pane. Everything written for the mod (tools, guardrails, commands)
  carries into the Rust app's MCP server if that is still wanted later.
- A first mod to learn on: the guardrail hook, a status line for the gate,
  and a preview command that starts the server and opens Chrome. Small,
  useful, and the seed of the course pane. I can write it when asked.

## Ross: dictation must not be an afterthought

- Can we tap into the OS's dictation, or do the LXDs have to set that up
  themselves? I like the dictation in VS Code. I don't want to use the OS
  one; the Mac's is a pain. Or the app bundles its own: I use Whispering
  locally, which needs a model installed, and that's fine depending on how
  much they use it. I don't want dictation to be an afterthought.

## Agent: Claude Code has its own, and the Rust route can bundle one

- Neither route uses the OS dictation. Claude Code has its own: `/voice`,
  hold or tap, in the CLI and in the VS Code extension, which is likely the
  one you like. The speech appears live in the prompt, mixes with typing,
  can auto-submit, persists in settings, and costs no tokens. Caveats from
  the docs: audio streams to Anthropic's servers, not local; it needs a
  claude.ai sign-in, not an API key or a cloud provider; an organisation
  policy can turn it off; twenty languages, English by default; vocabulary
  hints are only the project and branch names, nothing custom; the docs
  page names the CLI and the VS Code extension and not the desktop app,
  which I have not verified. The mod API has play and speak and no
  microphone, so a mod cannot add dictation, and with the built-in one it
  need not. The kit ships voice on in settings and an onboarding command
  runs the microphone check, so the LXD configures nothing.
- The Rust route bundles its own, and it is a solved subproblem: Whispering
  is Tauri, Svelte and Rust under MIT (archived in February 2026, now part
  of Epicenter), with local engines and cloud ones; Handy and its fork
  AudioBud are Tauri plus whisper.cpp and Parakeet with a global shortcut,
  also open. Their capture and transcription pipelines lift straight into a
  Tauri app. Cost: a model download on first run, from about 150 MB to
  600 MB depending on quality; gain: local, offline, and a custom
  vocabulary, since whisper takes an initial prompt that biases it towards
  client names, product names and LMS terms, which the built-in one cannot.
- Either way, not an afterthought means: on by default, one key, a visible
  listening state, the language set per user, and in the Rust route the
  client's vocabulary.
