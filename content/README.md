# content/: the course as data

Everything a learner reads in the course is here, as YAML, so a wording change is an edit to
a text file and needs no code (D13, D21). The engine in `src/` renders it.

```
content/
  course.yaml            the course: id, title, description, the scenario and home pages,
                         the box's labels, and the eight modules in order
  modules/00.yaml … 07.yaml   each module's screens, in order
  fridge/one-shot.yaml   the fridge the agent built from a one-line ask (modules 00 and 05)
  fridge/accepted.yaml   the fridge the learner accepted (module 05)
```

The storyboard in `docs/course/modules/` is the source of the copy and the YAML carries it
word for word; where the design boards in `docs/design/` differ in copy, the design wins.

## Checking an edit

Every file is checked against one schema when the app starts and by the unit tests, so a bad
edit fails `npm run gate:fast` (and `npm run test`) with a line naming the file and the path
to the bad field:

```
content/modules/03.yaml screens[4].options[1].rigth: unknown field "rigth"
content/modules/02.yaml screens[6].fridge: there is no fridge "freezer" (content/fridge/freezer.yaml)
```

`screens[4]` is the fifth screen: counting starts at 0. Every field below is checked: a
misspelt or unknown field is an error, never ignored, and so is a missing one that is not
marked optional. Run `npm run test` after an edit; the app checks the files again when it
starts, and a bad one stops it with the same message.

**The schema has one owner.** It lives in `src/content/schema.ts` and belongs to bead
agent-course-wqw.2. A bead that needs a field the schema lacks files a bead for it (the
epic's CHANGE PROTOCOL); it never edits the schema itself. This README and the schema change
together.

## Writing YAML here

- Copy is plain text. In any copy, `**bold**` and `*italic*` are rendered as such; nothing
  else is markup.
- Quote a value that contains `: ` or starts with a quote, `{`, `[`, `*` or `#`:
  `heading: "Check · 1 of 2"`, `text: "**The builder is the worst judge.** Everything…"`.
- Long copy can use a folded block, which joins its lines with spaces:

  ```yaml
  text: >-
    The timer came from a gap. So did the fifth shelf, the leaderboard and "the standard
    fridge rules".
  ```

- A **slug** or **id** is lower-case letters, digits and hyphens: `verdict`, `raw-chicken`.
- Some copy is a **template**: the engine fills in `{placeholders}`, and only the ones named
  for that field are allowed (`{up} of {total} walls up.`).
- A key written twice in one object is an error.

## Ids: what the LMS sees (D24)

Every statement names an activity under the course id in course.yaml,
`https://rosslote.github.io/agent-course/`. The ids come from the content alone:

| What | Activity id under the course id |
| --- | --- |
| a module | `modules/<nn>`, `<nn>` its slug in course.yaml (`modules/04`) |
| a check: a `choose` with `scored: true` | `modules/<nn>/checks/<n>`, `<n>` counting the module's scored chooses from 1 in screen order |
| any other interaction: chat, brief, unscored choose, match, order (module 07's scored order and match too) | `modules/<nn>/interactions/<slug>` |
| a fridge, wherever it is played | `fridge/<name>`, `<name>` its file name (`fridge/one-shot`) |

So every chat, brief, choose, match and order has a `slug`, unique within its module; scene,
takeaway, fridge and compare screens have none. Renaming a slug, reordering checks or
renaming a fridge file changes an id the LMS has already recorded, so do it before launch or
not at all. The code never works this out for itself: `activityPath(module, screen)` in
`src/content/` does it.

## course.yaml

```yaml
id: https://rosslote.github.io/agent-course/   # the course activity id: ends with a slash
title: Getting the most out of agents
description: A course on working with AI agents, …   # written into tincan.xml

box:                         # the labels the box is drawn with
  centre: the builder
  walls: { record: 01 the record, done: 02 done, gate: 03 the gate, agents: 04 other agents, evidence: 05 evidence }
  ring: "the retro: round again, change the check"

scenario:                    # the first page (D16)
  label: The scenario        # the top bar's subtitle
  role: "Your role: learning designer"
  heading: A client wants something the authoring tool can't do. …
  memo: { from: the client, date: "Monday, 9:05", subject: One more thing …, body: [first paragraph, second paragraph] }
  lines:                     # exactly three, numbered 01 to 03
    - { title: The tool doesn't do it., text: Its drag-and-drop can't … }
  button: Take the job
  note: Eight short modules, about 50 minutes. …

home:
  meta: Eight modules · about 50 minutes      # top bar
  leave: Leave after any module and come back # top bar
  eyebrow: The one thing to remember
  heading: Agents are better at reviewing than building.
  quote: { text: "So whenever you have agents do anything, …", attribution: Ross Lote }
  line: Every module adds one wall to the box on the right. …
  start: Start module 00
  scenarioLink: The scenario again
  box: { centre: the agent, caption: An open box. … }
  modulesHeading: The modules

modules:                     # in order
  - slug: "04"               # two digits, quoted: its number in ids and routes
    title: Agents checking agents
    minutes: 9
    wall: agents             # what this module adds to the box (below)
    wallLabel: "wall 4: other agents"   # the home page card's wall line
    blurb: Simplify, review, adversarial review. You play the skeptic.
    file: modules/04.yaml
```

**Walls.** A module's `wall` is one of `none` (module 00: the open box), `record`, `done`,
`gate`, `agents`, `evidence` (modules 01 to 05, one each), `ring` (module 06: the retro's
arrow round the box) or `all` (module 07: the whole box with the ring). Each wall is used
once. A module's takeaway draws its own wall and every earlier module's solid, the rest
dashed; `boxAfter(modules, slug)` in `src/content/` works it out.

## A module file

```yaml
slug: "04"        # must match its entry in course.yaml
screens:
  - type: scene
    …
  - type: takeaway   # always last, and only last
    …
```

One screen is one type. A storyboard screen that does two things becomes two screens in a
row (module 00's "Just ask" is a chat, then a choose, then a fridge; every Check is two
choose screens, "Check · 1 of 2" and "Check · 2 of 2").

Every screen except the takeaway has these, besides its own fields:

| Field | |
| --- | --- |
| `heading` | required |
| `eyebrow` | optional: the small line above the heading ("Try it", "Check · 1 of 2") |
| `intro` | optional: the muted line under the heading |
| `nav` | optional: the screen's name on the Next button before it ("Next: who catches it?"); the heading if absent |
| `side` | optional on scene, chat, choose, match, order and fridge: blocks shown in a side column, each as its own card |

**Scored or not.** `choose` and `match` say `scored: true` or `scored: false`; `order` is
always scored; the other types never are. Next stays disabled on a scored screen until it is
answered. A scored choose is a check: one point, single choice. The course's score is the
sum of the scored screens' points.

### scene

Reading: a heading and blocks (the blocks are below).

```yaml
# screen
- type: scene
  eyebrow: Module 01
  heading: Where did the timer come from?
  blocks:
    - type: paragraph
      text: >-
        The timer came from a gap. So did the fifth shelf, the leaderboard and "the standard
        fridge rules".
    - type: aside
      term: brief
      text: the conversation before anything is built, where the agent asks you ranked questions a few at a time and the decisions come out numbered.
```

### chat

The scripted agent (D7): the learner's fixed first message, the agent's messages, and
optional reply options, each with the agent's scripted answer. No free text, no branches.

```yaml
# screen
- type: chat
  slug: just-ask
  eyebrow: Try it
  heading: Just ask
  intro: The client wants a fridge activity. You have an agent. Let's do what most people do first.
  opening: Build a drag-and-drop fridge activity for the food hygiene course.
  messages:
    - >-
      Done! I've built a fridge activity. It has five shelves and fourteen food items, a
      15-second timer to keep it exciting, … Want me to add sound effects?
  replies:                     # optional
    prompt: What do you say?   # optional
    options:                   # two or more
      - label: Yes, add sound effects.
        reply: Done! I've added a ding for right answers and a buzzer for wrong ones.
      - label: What rules did you use?
        reply: The standard fridge rules. Want me to list them?
  side:
    - type: paragraph
      heading: What to watch for
      text: Read the agent's reply twice. Count the things you did not ask for.
```

### brief

The ranked questions with chips (module 01). Each question has two or more chips, exactly
one `recommended: true` (drawn dashed); each chip carries the `decision` it writes into the
panel. Questions number on across the rounds as D1, D2, …; round two's `message` is the
playback. `defaults` is the button on the last round that picks every recommended chip left.

The rounds come one at a time, under the learner's `opening`. Each round ends with a "Send
answers" button, off until every question in the round has an answer, and the hint "Answer
every question, then send." beside it. The last round also has the `defaults` button, until
every question in it is answered. Sending, or pressing `defaults`, fades the round out and
leaves one learner line in its place: "My answers to 1 to 5." (the round's questions,
numbered across the rounds), or the `defaults` reply. Then the agent shows "Thinking…" for
about a second and a half, and the next round's `message` arrives in the same place, or,
after the last round, the `closing` and the `comparison`. On screen at any time are the
opening, the latest learner line and the agent's current turn; the panel keeps every
decision. Send answers, its hint, the learner line and Thinking are fixed words in the
screen's code, not fields here. Every chip pick sends `interacted`, and `defaults` sends one
for each decision it fills; Send answers sends nothing.

```yaml
# screen
- type: brief
  slug: fridge-brief
  eyebrow: Try it
  heading: The fridge brief
  opening: A fridge activity for a client's food-hygiene course. …
  rounds:
    - message: I read the client's food-hygiene guide and the course outline. Five questions, ranked. …
      questions:
        - text: Who does this, and where?
          decides: Decides the device and how long it can take.        # optional
          chips:
            - label: Kitchen staff on induction, tablet or laptop, about five minutes
              decision: Kitchen staff on induction, on a tablet or laptop, about five minutes.
              recommended: true
            - label: Managers at a desk, as a refresher
              decision: Managers at a desk, as a refresher; no time pressure.
    - message: Took your answers as D1 to D5 on the right. Three more; the rest I can leave to the builder.
      questions:
        - text: A timer?
          recommendation: "Recommended: no. Induction, not a game; a timer punishes the people the course is for."   # optional
          chips:
            - label: No timer
              decision: No timer. No leaderboard.
              recommended: true
            - label: A sixty-second timer
              decision: A sixty-second timer.
  defaults:
    label: Your defaults
    hint: One line is a complete reply.   # optional
    reply: Your defaults.                 # the learner's message when it is pressed
  closing: That's the brief. … Eight decisions on the record.
  panel:
    heading: The record
    note: "{filled} of {total} decisions. The builder reads these, not your memory of the conversation."   # template: {filled}, {total}
  comparison: Compare this with module 00's one-line ask. Same agent. …   # optional: shown once the brief is closed
```

### choose

Options with right or wrong and feedback. `mode: multi` is "tick everything" with a Check
button; `mode: single` is one pick (every check). A single choice has exactly one right
option, a multi choice at least one.

Once checked, a single choice marks the pick right or wrong with its feedback and dims the
rest. A multi choice judges what the learner did with every option, ticked or left: a pill
beside the label says "Right to tick" or "Right to leave it" (green, with a tick), or
"Shouldn't be ticked" or "Missed: should be ticked" (red, with a cross), and the option's
`feedback` sits under it. A summary under the list counts them: "5 of 5 right." when every
choice is right, else, for example, "3 of 5 right: one tick shouldn't be there, and one
missed." The verdicts and the summary are fixed words in the screen's code, not fields here.

Optional extras:

- `body`: blocks above the prompt (excerpts, a pull request).
- `reveal` on an option: blocks shown only when that option is chosen (module 04's fix).
- `after`: blocks shown once the answer is checked (module 00's "what just happened").
- `box`: the box panel beside the options (module 03). Each option may name the `wall` it
  draws while ticked; `caption` is a template with `{up}` and `{total}`.
- `checkLabel`: the Check button's text, "Check my answer" if absent.
- `tryAgainLabel`: the same button's text once checked, "Try again" if absent (module 04's
  verdict: "Try another verdict"). Match and order take both labels too.

A check:

```yaml
# screen
- type: choose
  slug: check-gaps
  scored: true
  mode: single
  eyebrow: Check · 1 of 2
  heading: Your agent built a feature you never mentioned. What most likely happened?
  options:
    - label: It misread your message.
      right: false
      feedback: Not usually. It read what you wrote; the feature came from what you did not write.
    - label: It filled a gap in your ask with a guess.
      right: true
      feedback: Yes. Gaps get filled, confidently.
    - label: It was showing off.
      right: false
      feedback: Agents do not show off; they complete. An open ask is completed with more.
```

Tick everything, with a reveal, after blocks and the box panel:

```yaml
# screen
- type: choose
  slug: build-the-box
  scored: false
  mode: multi
  eyebrow: Try it
  heading: Build the box
  prompt: Tick everything that is a wall.
  checkLabel: Check my box
  options:
    - label: A run through the demo script in a browser, which must pass.
      right: true
      feedback: Wall. The touch drag breaking would be caught here.
      wall: gate
      reveal:
        - type: mono
          text: "gate: lint ok · typecheck ok · unit 14/14 · e2e fridge 6/6"
    - label: A line asking it to please be careful and not change anything else.
      right: false
      feedback: Not a wall. It will agree, and then it will tidy the shelves. Hope is not a check.
  box:
    builder: { title: the builder, subtitle: bead .4 }
    walls:
      - { id: gate, label: "the gate: lint, types, tests, a browser run" }
      - { id: area, label: "own area, its files only" }
    caption: "{up} of {total} walls up. Hope, context and a promise to report are not walls."
  after:
    - type: paragraph
      text: "**Three you can check, three you can only hope.**"
```

### match

Rows, each matched to one of a shared list of targets (drawn as chips). Each row's `key` is
the id of its right target; its `feedback` shows once checked. Scored: a point per row.

```yaml
# screen
- type: match
  slug: name-the-wall
  scored: true
  eyebrow: Capstone
  heading: Name the wall
  targets:
    - { id: record, label: the record }
    - { id: done, label: done }
  rows:
    - text: The builder added a "hint streak" counter nobody asked for.
      key: record
      feedback: The record. A gap in the brief was filled with a guess.
    - text: The builder says the hint is done, and you cannot say whether it is.
      key: done
      feedback: Done. No acceptance a reviewer can see.
  checkLabel: Check my answers
```

### order

Cards the learner puts in order; always scored, a point per card in its place. `cards` are
listed **in the correct order**; `start` is the order they start in, written out (never
random, so tests and the walkthrough are repeatable), every card id once and not already
correct. A card's `feedback` shows when it is out of place.

```yaml
# screen
- type: order
  slug: order-the-loop
  eyebrow: Capstone
  heading: Order the loop
  cards:
    - id: brief
      label: "Brief: the agent asks, you decide, D9 and D10 on the record."
      feedback: The brief comes first; everything after it builds to the record.
    - id: epic
      label: "Epic: the pieces, each with acceptance, and the demo script."
      feedback: The epic comes after the brief and before its review.
    - id: retro
      label: "Retro, over several runs: what repeats, what to change."
      feedback: The retro comes last; it reads the runs that came before it.
  start: [retro, brief, epic]
```

### fridge

One fridge, from its file in `content/fridge/`.

A timed fridge (a file with a `timer`, the one-shot's fifteen seconds) counts down from the
learner's first pick-up, and the timer cannot be switched off: there is no control for it,
and no mute. Its last five seconds warn: the timer turns red and pulses (no pulse under
reduced motion), the fridge's outline turns red, and a short beep sounds at 0:05, 0:04, 0:03,
0:02 and 0:01 and a long low tone at 0:00, made in the page, nothing fetched. At 0:00 the
tray gives way to the timer's `message` and one Reset button (`resetLabel`). An untimed
fridge (`timer: none`) has none of this.

```yaml
# screen
- type: fridge
  eyebrow: Try it
  heading: Try what it built
  intro: Optional, fifteen seconds. The timer starts as soon as you pick something up.
  fridge: one-shot
```

### compare

Two fridges side by side, and a table of what is different and the wall that made the
difference.

```yaml
# screen
- type: compare
  eyebrow: The job, done
  heading: The two fridges
  left: one-shot
  right: accepted
  table:
    heading: What is different, and which wall made the difference
    rows:
      - aspect: Shelves and items
        left: Five shelves including "the door", fourteen items.
        right: Four shelves, eight items, the ones in the client's guide.
        wall: 01 the record (D2)
```

### takeaway

The module's last screen, and the only one without a heading: the card, and the box with
this module's wall gained (from course.yaml's `wall`). Reaching it completes the module.
Of the fields every other screen has, it takes `eyebrow` (every module's reads "Takeaway")
and `nav`. `end` holds blocks shown after the card (module 07's end copy).

```yaml
# screen
- type: takeaway
  eyebrow: Takeaway
  nav: takeaway
  text: "**The builder is the worst judge of its own work.** Everything that follows is about putting walls round the builder and letting the reviewers in."
  caption: The box gains nothing yet; the next module adds the first wall.
  end:                       # optional
    - type: paragraph
      text: This course was built the way it describes. …
```

## Blocks

A scene's `blocks`, a screen's `side`, and a choose's `body`, `reveal` and `after` are lists
of blocks. Most take an optional `heading`, the small line above them.

```yaml
# blocks
- type: paragraph
  heading: Optional heading
  text: A paragraph of copy.

- type: cards                    # numbered: optional, false if absent
  numbered: true
  items:
    - title: It filled every gap with a guess.     # optional
      body: Agents do not stop at a gap; they fill it, and they sound sure when they do.

- type: quote
  text: You may not know what you want until you see the first round.
  attribution: Ross              # optional

- type: list                     # style: numbered (if absent) or bullets
  heading: The demo script (done means)
  items:
    - "Open the activity: four labelled shelves and eight items in a tray."
    - text: "Raw chicken to the top shelf: returns, message as specified."
      marker: ch 2               # optional: shown instead of the number
      tone: right                # optional: right (a tick), wrong (a cross) or neutral

- type: table                    # header optional; every row as wide as the header
  header: [Pieces built, Review agents, Findings, Fixed]
  rows:
    - ["16", 16 finders, "50", "39"]

- type: columns                  # exactly two; a column holds any block but columns
  columns:
    - heading: Loose
      blocks:
        - type: list
          items: [Changes the feedback files.]
    - heading: Boxed
      blocks:
        - type: mono
          text: "gate: lint ok · typecheck ok · unit 14/14"

- type: mono                     # monospace: gate output, code excerpts
  heading: A · drop handler, line 41
  text: "if (message.visible) return;"

- type: stats                    # numbers with captions
  heading: One real run of this workflow
  items:
    - value: 16
      caption: pieces built, all green at the gate
    - score: module              # this module's score so far, as "14 out of 14"
      caption: your score

- type: aside                    # a glossary term, introduced in plain words
  term: gate
  text: the checks that must be green before work is handed back.
```

## A fridge file

`content/fridge/<name>.yaml`; `<name>` is what fridge and compare screens name, and its
activity id (`fridge/<name>`). One fridge component plays every file (D17).

```yaml
# fridge
title: "Module 05: what you accepted"   # the panel's heading
caption: Four shelves, eight items, the client's rules. …   # the line under it
shelves:                       # top to bottom; the keyboard's arrows move through them in this order
  - id: top
    name: Top shelf
    subtitle: ready to eat     # optional
  - id: bottom
    name: Bottom shelf
    subtitle: raw meat and fish
items:                         # the tray, in this order
  - id: raw-chicken
    name: Raw chicken
    shelf: bottom              # the id of its right shelf
    reason: Raw meat and fish go on the bottom shelf so they can't drip onto other food.
  - id: cheese
    name: Cheese
    shelf: top
    reason: Dairy goes on the top shelf, away from raw meat.
feedback: reason               # reason: a wrong drop returns with its reason (every item needs one)
                               # flash: it flashes and returns; the learner is told only that it returned
score:
  mode: right-first-time       # or: { mode: points, right: 100, wrong: -50 } (never below zero)
timer: none                    # or: { seconds: 15, message: "**Time's up!** Better luck next time." }
leaderboard: none              # or rows in rank order, exactly one of them the learner's:
                               #   - { name: Sam, score: 1400 }
                               #   - { name: You, learner: true }
confetti: false                # a confetti banner on finishing
finish: "{right} out of {total} right first time"   # template: {right}, {total}, {score}
allRight: Every item on the right shelf first time. # optional
resetLabel: Try again          # the button that starts a new play
```
