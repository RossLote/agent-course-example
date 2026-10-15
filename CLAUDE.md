# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:1105d646 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/core-concepts/sync-concepts.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->


## Build & Test

Vite + React + TypeScript at the repo root, the presentation repo's toolchain. Node 22.22.2 or
newer on 22, 24.15.0 or newer on 24, or 26 and later (`engines` in package.json: the range the
pinned tools declare; an older 24 only warns).

```bash
npm ci                 # install exactly what package-lock.json pins
npx playwright install chromium   # once, if Playwright's pinned Chromium is missing
npm run dev            # dev server (Vite)
npm run build          # type-check (tsc -b) and build to dist/ (gitignored)
npm run preview        # serve the built dist/
npm run lint           # ESLint, zero warnings allowed
npm run typecheck      # tsc -b over src/ and e2e/ (the type-check half of build)
npm run test           # Vitest unit tests (src/**/*.test.ts[x])
npm run gate:fast      # lint + typecheck + unit
npm run gate           # gate:fast + e2e; there is no integration tier
npm run e2e            # Playwright e2e, Chromium only (e2e/, excluding e2e/walkthrough/)
E2E_PORT=5281 npx playwright test e2e/smoke   # one spec, on its own port (default 5280)
npm run walkthrough    # the throwaway e2e/walkthrough/*.spec.ts the orchestrator writes
                       # (e2e/walkthrough/recorder.ts is its committed step helper), with
                       # video and slowMo, 1280x800, into docs/demos/$DEMO_ID/ (gitignored);
                       # SLOW_MO sets the delay in ms (default 250)
```

The e2e web server starts on `E2E_PORT` and is never reused, so parallel runs need distinct
ports; the defaults (5280, walkthrough 5290) differ from the presentation repo's so both can
run at once. Nothing is fetched from the network at run time, and the smoke spec asserts it.

## Architecture Overview

Nothing is built yet: `src/App.tsx` is a placeholder the gates check. The brief settles the
shape (PLAN.md §5). The plan's current thinking is that the learning designers author the
modules as data in the repo and the agents build the engine that renders them and sends the
xAPI statements, so a wording change needs no run.

## Conventions & Patterns

### Conversation log

Every conversation with Ross on this project is logged in `docs/conversations/`, one file
per session, named `YYYY-MM-DD-<slug>.md` with the same frontmatter as the existing files
(date, stage, title, participants, source). An entry reads like the conversation it was:
Ross's turns in the first person, in his voice ("I want…", "my workflow"), and the agent's
turns in the first person as the agent, addressing Ross as "you". Entries summarise what each
side said; they are not verbatim. Ross dictates, so condense his words to the point he was
making, keep his decisions and his reasons, and drop the hesitations and false starts. Write
the entry during the session and keep it current as the conversation moves, not at the end.
The logs are the project's record, which the brief and the epic cite, so they are part of
the product, not working notes.

Every log keeps the presentation repo's shape, so the same tooling can read both. A turn is
a `## Ross: <subtitle>` or `## Agent: <subtitle>` heading followed by its body (bullets,
numbered items or prose); the subtitle is a few words naming the turn and is never left off
(never a bare `## Agent`). Headings that are not turns, such as the log's `# ` title or a
`## Closed` note, are left as they are. In a brief-stage log, a round is a
`## Agent: round N` heading (optionally `round N, <a few words>`) holding that round's
questions, followed by the next `## Ross: round N → Dn Dm` heading holding the answer,
with the decisions the round produced listed on the heading (for example
`## Ross: round 2 → D21 D22`). Turns outside a round (a first reaction, a tangent, a yes,
an exchange about filing) keep an ordinary subtitle and are not rounds.
