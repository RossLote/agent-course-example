# Design, first pass (2026-10-15)

Live, interactive canvas: https://claude.ai/artifact/My3Z79MHvyCBktJsMfAggM (Claude Design; private to Ross).

These files are the canvas's own source as published: `canvas.json` is the index (one entry
per artboard with its frame on the canvas), and each `*.dc.html` is one artboard, a
self-contained page in the Design Component format. They are kept here so the design phase
leaves a real artefact in the repo. The live link is the thing to look at; these files are
what it is made of.

The pass shows the storyboard in `docs/course/` as a designed course, so Ross can judge the
content in context. Eleven artboards at 1440 wide, laid out as pages (they fill the window and
scroll), every one with working controls (Play): `Main` (the welcome page, added after Ross's first
look: what the course is about, the fridge as the example, what the learner does, and a
Continue), `Home` (the course home: the thesis, the open box, the eight modules), then the key screen of each module: `M00`
(the vague ask to the fake agent and "tick what went wrong"), `M01` (the fridge brief: ranked
questions as chips, the decisions filling in on the right, "your defaults"), `M02` (the five
beads, the demo script, and "pick the acceptance a reviewer can check"), `M03` ("build the
box", which draws the walls as they are ticked, and the loose-against-boxed replay), `M04`
(one finding's journey, with the learner as the skeptic), `M05` (the pull request condensed,
merge or not), `M06` (the check that missed, and "what would you change"), `M07` (name the
wall, scored, with the box complete and the retro ring), and `Check` (the check-question and
takeaway shape every module ends on, with the box gaining its wall). Prototype links join
them in course order.

Own look, as the presentation's first pass was (the only design system on the account
belongs to another project): a cool light ground `#F3F5F7` with white cards, ink `#172029`,
one accent, indigo `#2F4BD6`, for the course's own controls and the walls of the box; the
agent in teal `#0E7C86` and the learner in amber `#B45309` in the chat; green and red for
right and wrong, always with a tick or a cross as well as the colour. Manrope for headings,
Atkinson Hyperlegible for body text, JetBrains Mono for ids, gate output and excerpts. The
box is a pentagon of five walls round "the builder", dashed until a module adds it, with the
retro as a dashed ring round the whole thing.

Corrected the same day after Ross's first reaction: the home page opened on too much at
once, and the fact that two things are going on (working with an agent, and the thing the
agent builds) was explained only at the bottom. A welcome page now comes first, with the
three roles drawn apart (you, the agent in its box, the fridge activity) and nothing else,
and the home page lost the example card. The live canvas and these files both carry it.
