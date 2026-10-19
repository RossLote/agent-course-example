// The one schema for everything under content/ (PLAN.md §6, "One schema, one owner"). Every
// object is strict, so a misspelt field is an error, not a silently ignored key. What one file
// cannot check on its own (the module files course.yaml lists, the fridges a screen names) is
// checked in validate.ts. content/README.md documents every type here with an example; keep
// the two in step.
import { z } from 'zod';

/** Any non-empty piece of copy. Copy may use **bold** and *italic* inline (content/README.md). */
const text = z.string().trim().min(1, 'must not be empty');

/** A lower-case id or slug: letters, digits and single hyphens ("verdict", "raw-chicken"). */
export const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const slug = z.string().regex(slugPattern, 'must be lower-case letters, digits and hyphens');

/** Copy with {placeholders} the engine fills in; only the named ones are allowed. */
function template(...allowed: string[]) {
  return text.refine(
    (s) => [...s.matchAll(/\{([^}]*)\}/g)].every((m) => allowed.includes(m[1])),
    `the only placeholders allowed here are ${allowed.map((a) => `{${a}}`).join(', ')}`,
  );
}

/** Ids must be unique; each repeat is reported at its own path. */
function uniqueIds(entries: { id: string; path: (string | number)[] }[], ctx: z.RefinementCtx, what: string) {
  const seen = new Set<string>();
  for (const { id, path } of entries) {
    if (seen.has(id)) ctx.addIssue({ code: 'custom', path, message: `${what} "${id}" is used twice` });
    seen.add(id);
  }
}

/** The entries of a list for uniqueIds, at `<list>.<index>`. */
function idsOf<T>(items: readonly T[], list: string, key: (item: T) => string) {
  return items.map((item, i) => ({ id: key(item), path: [list, i] }));
}

// ---------------------------------------------------------------------------------------------
// The box and its walls.

/** The four walls of the box, in the order the modules add them and the diagram draws them (C20). */
export const BOX_WALLS = ['record', 'gate', 'agents', 'evidence'] as const;
export type BoxWall = (typeof BOX_WALLS)[number];

/**
 * What a module adds to the box: nothing (`none`), one wall, two walls as a list
 * (`[gate, agents]`), or the retro's ring round it (`ring`). No module adds the whole box.
 * Parsed as a list of what it adds: `none` is `[]`.
 */
export const moduleWall = z
  .union(
    [
      z.enum(['none', ...BOX_WALLS, 'ring']),
      z.tuple([z.enum(BOX_WALLS), z.enum(BOX_WALLS)], { error: (issue) => (issue.code === 'too_big' || issue.code === 'too_small' ? 'must list exactly two walls' : undefined) }),
    ],
    `must be none, one of ${BOX_WALLS.join(', ')}, a list of two of them, or ring`,
  )
  .transform((wall): (BoxWall | 'ring')[] => (wall === 'none' ? [] : [wall].flat()));
/** The walls and the ring a module adds, as parsed: `[]` for none. */
export type ModuleWall = z.output<typeof moduleWall>;

// ---------------------------------------------------------------------------------------------
// Scene blocks (PLAN.md §6a). Columns hold any block but another columns block.

const paragraphBlock = z.strictObject({
  type: z.literal('paragraph'),
  heading: text.optional(),
  text,
});

const cardsBlock = z.strictObject({
  type: z.literal('cards'),
  heading: text.optional(),
  numbered: z.boolean().optional(),
  items: z.array(z.strictObject({ title: text.optional(), body: text })).min(1),
});

const quoteBlock = z.strictObject({
  type: z.literal('quote'),
  text,
  attribution: text.optional(),
});

/** A list item: plain copy, or copy with its own marker (a time, "ch 4") and a right/wrong tone. */
const listItem = z.union(
  [text, z.strictObject({ text, marker: text.optional(), tone: z.enum(['right', 'wrong', 'neutral']).optional() })],
  'must be a line of copy, or text with an optional marker and tone',
);

const listBlock = z.strictObject({
  type: z.literal('list'),
  heading: text.optional(),
  style: z.enum(['numbered', 'bullets']).optional(),
  items: z.array(listItem).min(1),
});

const tableBlock = z
  .strictObject({
    type: z.literal('table'),
    heading: text.optional(),
    header: z.array(text).min(1).optional(),
    rows: z.array(z.array(text).min(1)).min(1),
  })
  .superRefine((t, ctx) => {
    const width = t.header?.length ?? t.rows[0].length;
    t.rows.forEach((row, i) => {
      if (row.length !== width) ctx.addIssue({ code: 'custom', path: ['rows', i], message: `has ${row.length} cells; the table has ${width} columns` });
    });
  });

const monoBlock = z.strictObject({
  type: z.literal('mono'),
  heading: text.optional(),
  text,
});

/** A stats item shows a fixed value, or `score: module`: this module's score, "14 out of 14". */
const statsItem = z.union(
  [z.strictObject({ value: z.union([text, z.number()]), caption: text }), z.strictObject({ score: z.literal('module'), caption: text })],
  'must be a value and a caption, or score: module and a caption',
);

const statsBlock = z.strictObject({
  type: z.literal('stats'),
  heading: text.optional(),
  items: z.array(statsItem).min(1),
});

const asideBlock = z.strictObject({
  type: z.literal('aside'),
  term: text,
  text,
});

/** Every block but columns: what a column may hold. */
const innerBlocks = [paragraphBlock, cardsBlock, quoteBlock, listBlock, tableBlock, monoBlock, statsBlock, asideBlock] as const;
const innerBlock = z.discriminatedUnion('type', innerBlocks);

const columnsBlock = z.strictObject({
  type: z.literal('columns'),
  columns: z.array(z.strictObject({ heading: text.optional(), blocks: z.array(innerBlock).min(1) })).length(2),
});

export const block = z.discriminatedUnion('type', [...innerBlocks, columnsBlock]);
export type Block = z.infer<typeof block>;
export type StatsItem = z.infer<typeof statsItem>;
export type ListItem = z.infer<typeof listItem>;

const blocks = z.array(block).min(1);

// ---------------------------------------------------------------------------------------------
// Screens. Every screen has a type; the fields every screen with a heading shares come first.

const screenBase = {
  /** The small line above the heading ("Try it", "Check · 1 of 2"). */
  eyebrow: text.optional(),
  heading: text,
  /** The muted line under the heading. */
  intro: text.optional(),
  /** This screen's name on the previous screen's Next button ("Next: <nav>"); the heading if absent. */
  nav: text.optional(),
};

/** Blocks shown in the side column, each as its own card. */
const side = blocks.optional();

const sceneScreen = z.strictObject({
  type: z.literal('scene'),
  ...screenBase,
  blocks,
  side,
});

const takeawayScreen = z.strictObject({
  type: z.literal('takeaway'),
  eyebrow: text.optional(),
  nav: text.optional(),
  /** The takeaway card. */
  text,
  /** The line under the box ("The box gains its first wall. Three to go, then the arrow."). */
  caption: text,
  /** Shown after the card; the last module's end copy. */
  end: blocks.optional(),
});

const chatScreen = z.strictObject({
  type: z.literal('chat'),
  slug,
  ...screenBase,
  /** The learner's fixed first message, shown as typed. */
  opening: text,
  /** The agent's messages, one bubble each, in order. */
  messages: z.array(text).min(1),
  /** Optional reply options; picking one shows the agent's scripted reply. */
  replies: z
    .strictObject({
      prompt: text.optional(),
      options: z.array(z.strictObject({ label: text, reply: text })).min(2),
    })
    .optional(),
  side,
});

const briefChip = z.strictObject({
  /** The chip's text. */
  label: text,
  /** The decision this chip writes into the panel when picked. */
  decision: text,
  /** The agent's recommended answer; exactly one chip per question. */
  recommended: z.boolean().optional(),
});

const briefQuestion = z
  .strictObject({
    text,
    /** What the answer decides ("Decides the device and how long it can take."). */
    decides: text.optional(),
    /** The recommended answer in words ("Recommended: no. Induction, not a game; ..."). */
    recommendation: text.optional(),
    chips: z.array(briefChip).min(2),
  })
  .superRefine((q, ctx) => {
    const n = q.chips.filter((c) => c.recommended).length;
    if (n !== 1) ctx.addIssue({ code: 'custom', path: ['chips'], message: `marks ${n} chips recommended; mark exactly one` });
  });

const briefScreen = z.strictObject({
  type: z.literal('brief'),
  slug,
  ...screenBase,
  /** The learner's fixed opening message. */
  opening: text,
  /**
   * The rounds in order. Each opens with the agent's message (round two's is the playback);
   * the questions are ranked, and number on across rounds as decisions D1, D2, ...
   */
  rounds: z.array(z.strictObject({ message: text, questions: z.array(briefQuestion).min(1) })).min(1),
  /** The "Your defaults" button on the last round: it picks every recommended chip left. */
  defaults: z.strictObject({ label: text, hint: text.optional(), reply: text }),
  /** The agent's closing message once every question is answered. */
  closing: text,
  /** The decisions panel. */
  panel: z.strictObject({ heading: text, note: template('filled', 'total') }),
  /** The card shown under the panel once the brief is closed. */
  comparison: text.optional(),
});

const chooseOption = z.strictObject({
  label: text,
  right: z.boolean(),
  feedback: text,
  /** Shown only when this option is chosen (a fix shown on the right verdict). */
  reveal: blocks.optional(),
  /** The box panel wall this option draws while ticked; the id of one of `box.walls`. */
  wall: slug.optional(),
});

const chooseScreen = z
  .strictObject({
    type: z.literal('choose'),
    slug,
    ...screenBase,
    /** A scored choose is one of the module's checks: single choice, one point. */
    scored: z.boolean(),
    mode: z.enum(['single', 'multi']),
    /** Shown above the prompt (the excerpts, the pull request). */
    body: blocks.optional(),
    prompt: text.optional(),
    options: z.array(chooseOption).min(2),
    /** Shown once the answer is checked. */
    after: blocks.optional(),
    /** The box panel beside the options: walls drawn as options are ticked. */
    box: z
      .strictObject({
        builder: z.strictObject({ title: text, subtitle: text.optional() }),
        walls: z.array(z.strictObject({ id: slug, label: text })).min(1),
        caption: template('up', 'total'),
      })
      .optional(),
    checkLabel: text.optional(),
    /** The button once checked; "Try again" if absent. */
    tryAgainLabel: text.optional(),
    side,
  })
  .superRefine((c, ctx) => {
    const right = c.options.filter((o) => o.right).length;
    if (c.mode === 'single' && right !== 1) ctx.addIssue({ code: 'custom', path: ['options'], message: `a single choice needs exactly one right option; it has ${right}` });
    if (c.mode === 'multi' && right === 0) ctx.addIssue({ code: 'custom', path: ['options'], message: 'a multiple choice needs at least one right option' });
    if (c.scored && c.mode !== 'single') ctx.addIssue({ code: 'custom', path: ['mode'], message: 'a scored choose is a check, so its mode is single' });
    if (c.box) uniqueIds(c.box.walls.map((w, i) => ({ id: w.id, path: ['box', 'walls', i] })), ctx, 'wall id');
    const walls = new Set(c.box?.walls.map((w) => w.id));
    c.options.forEach((o, i) => {
      if (o.wall === undefined) return;
      if (!c.box) ctx.addIssue({ code: 'custom', path: ['options', i, 'wall'], message: 'names a wall, but the screen has no box' });
      else if (!walls.has(o.wall)) ctx.addIssue({ code: 'custom', path: ['options', i, 'wall'], message: `"${o.wall}" is not one of box.walls` });
    });
  });

const matchScreen = z
  .strictObject({
    type: z.literal('match'),
    slug,
    ...screenBase,
    scored: z.boolean(),
    body: blocks.optional(),
    prompt: text.optional(),
    /** The shared answers every row picks from. */
    targets: z.array(z.strictObject({ id: slug, label: text })).min(2),
    /** Each row's `key` is the id of its right target; its feedback shows once checked. */
    rows: z.array(z.strictObject({ text, key: slug, feedback: text })).min(1),
    checkLabel: text.optional(),
    /** The button once checked; "Try again" if absent. */
    tryAgainLabel: text.optional(),
    side,
  })
  .superRefine((m, ctx) => {
    uniqueIds(idsOf(m.targets, 'targets', (t) => t.id), ctx, 'target id');
    const ids = new Set(m.targets.map((t) => t.id));
    m.rows.forEach((r, i) => {
      if (!ids.has(r.key)) ctx.addIssue({ code: 'custom', path: ['rows', i, 'key'], message: `"${r.key}" is not one of the targets` });
    });
  });

const orderScreen = z
  .strictObject({
    type: z.literal('order'),
    slug,
    ...screenBase,
    body: blocks.optional(),
    prompt: text.optional(),
    /** The cards in their correct order; a card's feedback shows when it is out of place. */
    cards: z.array(z.strictObject({ id: slug, label: text, feedback: text })).min(2),
    /** The order the cards start in: every card id once, never the correct order. */
    start: z.array(slug).min(2),
    checkLabel: text.optional(),
    /** The button once checked; "Try again" if absent. */
    tryAgainLabel: text.optional(),
    side,
  })
  .superRefine((o, ctx) => {
    uniqueIds(idsOf(o.cards, 'cards', (c) => c.id), ctx, 'card id');
    const correct = o.cards.map((c) => c.id);
    const sorted = (ids: string[]) => [...ids].sort().join(' ');
    if (sorted(o.start) !== sorted(correct)) ctx.addIssue({ code: 'custom', path: ['start'], message: `must list every card id exactly once: ${correct.join(', ')}` });
    else if (o.start.join(' ') === correct.join(' ')) ctx.addIssue({ code: 'custom', path: ['start'], message: 'starts in the correct order; the learner would have nothing to do' });
  });

const fridgeScreen = z.strictObject({
  type: z.literal('fridge'),
  ...screenBase,
  /** The fridge file's name: content/fridge/<fridge>.yaml. */
  fridge: slug,
  side,
});

const compareScreen = z.strictObject({
  type: z.literal('compare'),
  ...screenBase,
  /** Fridge file names, shown side by side. */
  left: slug,
  right: slug,
  /** What is different, row by row, and the wall that made the difference. */
  table: z.strictObject({
    heading: text.optional(),
    rows: z.array(z.strictObject({ aspect: text, left: text, right: text, wall: text })).min(1),
  }),
});

export const screen = z.discriminatedUnion('type', [
  sceneScreen,
  takeawayScreen,
  chatScreen,
  briefScreen,
  chooseScreen,
  matchScreen,
  orderScreen,
  fridgeScreen,
  compareScreen,
]);
export type Screen = z.infer<typeof screen>;
export type ScreenType = Screen['type'];
export type ScreenOf<T extends ScreenType> = Extract<Screen, { type: T }>;

/** content/modules/<nn>.yaml. The module's title, minutes and wall are in course.yaml. */
export const moduleFile = z
  .strictObject({
    /** Must match the module's slug in course.yaml. */
    slug: z.string(),
    screens: z.array(screen).min(1),
  })
  .superRefine((m, ctx) => {
    const last = m.screens.length - 1;
    m.screens.forEach((s, i) => {
      if (s.type === 'takeaway' && i !== last) ctx.addIssue({ code: 'custom', path: ['screens', i], message: 'the takeaway must be the last screen' });
    });
    if (m.screens[last].type !== 'takeaway') ctx.addIssue({ code: 'custom', path: ['screens', last], message: 'the last screen must be the takeaway' });
    const slugs = m.screens.flatMap((s, i) => ('slug' in s ? [{ id: s.slug, path: ['screens', i, 'slug'] }] : []));
    uniqueIds(slugs, ctx, 'slug');
    // A fridge's answers are kept under its name, beside the screens' slugs, so the two must differ.
    const taken = new Set(slugs.map((s) => s.id));
    m.screens.forEach((s, i) => {
      const fridges = s.type === 'fridge' ? { fridge: s.fridge } : s.type === 'compare' ? { left: s.left, right: s.right } : {};
      for (const [field, name] of Object.entries(fridges)) {
        if (taken.has(name)) ctx.addIssue({ code: 'custom', path: ['screens', i, field], message: `fridge "${name}" has the same name as a screen's slug; their answers would be kept as one` });
      }
    });
  });
export type ModuleFile = z.infer<typeof moduleFile>;

// ---------------------------------------------------------------------------------------------
// content/fridge/<name>.yaml (D17): one fridge component, driven by this file.

export const fridgeFile = z
  .strictObject({
    /** The panel's heading ("Module 03: what you accepted"). */
    title: text,
    /** The line under the panel. */
    caption: text,
    shelves: z.array(z.strictObject({ id: slug, name: text, subtitle: text.optional() })).min(2),
    items: z.array(z.strictObject({ id: slug, name: text, shelf: slug, reason: text.optional() })).min(1),
    /** On a wrong drop: return the item and show its reason, or flash and return it, saying only that it returned. */
    feedback: z.enum(['reason', 'flash']),
    /** Right first time out of the item count, or points added and taken away per drop. */
    score: z.discriminatedUnion('mode', [
      z.strictObject({ mode: z.literal('right-first-time') }),
      z.strictObject({ mode: z.literal('points'), right: z.number().int().positive(), wrong: z.number().int().max(0) }),
    ]),
    timer: z.union([z.literal('none'), z.strictObject({ seconds: z.number().int().positive(), message: text })], 'must be none, or seconds and a message'),
    /** Rows in rank order: fixed names and scores, and one `learner: true` row showing the learner's points. */
    leaderboard: z.union(
      [
        z.literal('none'),
        z
          .array(
            z.union(
              [z.strictObject({ name: text, score: z.number().int() }), z.strictObject({ name: text, learner: z.literal(true) })],
              'must be a name and a score, or a name and learner: true',
            ),
          )
          .min(1),
      ],
      'must be none, or a list of rows',
    ),
    confetti: z.boolean(),
    /** Shown when every item is placed. */
    finish: template('right', 'total', 'score'),
    /** Shown under the finish line when nothing was wrong (right-first-time only). */
    allRight: text.optional(),
    /** The button that starts a new play ("Try again", "Reset"). */
    resetLabel: text,
  })
  .superRefine((f, ctx) => {
    uniqueIds(idsOf(f.shelves, 'shelves', (s) => s.id), ctx, 'shelf id');
    uniqueIds(idsOf(f.items, 'items', (s) => s.id), ctx, 'item id');
    const shelves = new Set(f.shelves.map((s) => s.id));
    f.items.forEach((item, i) => {
      if (!shelves.has(item.shelf)) ctx.addIssue({ code: 'custom', path: ['items', i, 'shelf'], message: `"${item.shelf}" is not one of the shelves` });
      if (f.feedback === 'reason' && item.reason === undefined) ctx.addIssue({ code: 'custom', path: ['items', i, 'reason'], message: 'is required when feedback is reason' });
    });
    if (f.leaderboard !== 'none' && f.leaderboard.filter((row) => 'learner' in row).length !== 1) {
      ctx.addIssue({ code: 'custom', path: ['leaderboard'], message: 'needs exactly one learner: true row' });
    }
  });
export type Fridge = z.infer<typeof fridgeFile>;

// ---------------------------------------------------------------------------------------------
// content/course.yaml: the course, its course-level pages, and its modules in order.

const moduleEntry = z.strictObject({
  /** Two digits: the module's number in its activity id (D24) and its route. */
  slug: z.string().regex(/^\d\d$/, 'must be two digits, as 00'),
  title: text,
  minutes: z.number().int().positive(),
  wall: moduleWall,
  /** The wall line on the home page card ("the record"). */
  wallLabel: text,
  /** The line on the home page card. */
  blurb: text,
  /** The module's screens, relative to content/. */
  file: z.string().regex(/^modules\/[a-z0-9-]+\.yaml$/, 'must be modules/<name>.yaml'),
});
export type ModuleEntry = z.infer<typeof moduleEntry>;

export const courseFile = z
  .strictObject({
    /** The course activity id, the D24 root; ends with a slash. */
    id: z.string().regex(/^https:\/\/\S+\/$/, 'must be an https URL ending with a slash'),
    title: text,
    /** The course's description in tincan.xml. */
    description: text,
    /** The labels the box is drawn with, on the takeaways and the home page. */
    box: z.strictObject({
      centre: text,
      /** One label per wall of BOX_WALLS. */
      walls: z.strictObject({ record: text, gate: text, agents: text, evidence: text }),
      ring: text,
    }),
    /** The scenario page (D16): the first page of the course. */
    scenario: z.strictObject({
      label: text,
      role: text,
      heading: text,
      memo: z.strictObject({ from: text, date: text, subject: text, body: z.array(text).min(1) }),
      lines: z.array(z.strictObject({ title: text, text })).length(3),
      button: text,
      note: text,
    }),
    /** The home page: the thesis, the open box, the module cards. */
    home: z.strictObject({
      meta: text,
      leave: text,
      eyebrow: text,
      heading: text,
      quote: z.strictObject({ text, attribution: text }),
      line: text,
      start: text,
      scenarioLink: text,
      box: z.strictObject({ centre: text, caption: text }),
      modulesHeading: text,
    }),
    modules: z.array(moduleEntry).min(1),
  })
  .superRefine((c, ctx) => {
    uniqueIds(idsOf(c.modules, 'modules', (m) => m.slug), ctx, 'module slug');
    uniqueIds(idsOf(c.modules, 'modules', (m) => m.file), ctx, 'module file');
    const walls = c.modules.flatMap((m, i) => m.wall.map((id) => ({ id, path: ['modules', i, 'wall'] })));
    uniqueIds(walls, ctx, 'wall');
  });
export type CourseFile = z.infer<typeof courseFile>;

/** A module as the app sees it: its course.yaml entry with its screens. */
export type Module = ModuleEntry & { screens: Screen[] };

/** The validated course: course.yaml, its modules in order, and the fridges by name. */
export type Course = Omit<CourseFile, 'modules'> & {
  modules: Module[];
  fridges: Record<string, Fridge>;
};
