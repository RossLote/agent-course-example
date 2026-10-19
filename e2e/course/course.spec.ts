import { expect, test, type Locator, type Page } from '@playwright/test';
import { FADE_MS, THINKING_MS } from '../../src/screens/brief/labels.ts';
import { choose, CONTENT, COURSE_ID, dashedWalls, drag, fridge, heading, HOME_HEADING, keepLocal, next, pauseClock, playModule00, solidWalls } from './play.ts';

// The whole course in preview, played as the ACCEPTANCE BAR plays it (steps 1 to 6, with the run
// record's changes), then a reload, and the statements drawer read along the way: every
// statement the play sent, oldest first, as D19 and the review additions list them (PLAN.md §6,
// "Statements").

// One drawer line per statement: its verb and object (a path under course.yaml's id, or
// "course" for the course itself), then its success, score and completion when it has them.
const line = (verb: string, object: string, result = '') => `${verb} ${object}${result}`;
const score = (raw: number, max: number) => ` · score ${raw} of ${max} (min 0, scaled ${raw / max})`;
const interacted = (path: string, times = 1) => Array.from({ length: times }, () => line('interacted', path));
const answered = (path: string, right: boolean, raw = right ? 1 : 0, max = 1) => line('answered', path, ` · success ${right}${score(raw, max)}`);
const played = (fridgeName: string, raw: number, max: number) => line('completed', `fridge/${fridgeName}`, `${score(raw, max)} · completion true`);
const completed = (slug: string) => line('completed', `modules/${slug}`);
/** Both checks of a module answered right first time. */
const checks = (slug: string) => [answered(`modules/${slug}/checks/1`, true), answered(`modules/${slug}/checks/2`, true)];

/** What the drawer lists after the bar's module 00: initialized, then the module's own. */
const MODULE_00 = [
  line('initialized', 'course'),
  // One per option ticked, on Check.
  ...interacted('modules/00/interactions/what-went-wrong', 3),
  // Raw chicken right (+100), cheese wrong (-50); out of 100 for each of the 14 items. Sent at time-up.
  played('one-shot', 50, 1400),
  ...checks('00'),
  completed('00'),
];

/** The whole play's statements, oldest first: five modules, ten checks, the course at 10 of 10. */
const FULL_PLAY = [
  ...MODULE_00,
  // Five chip picks, then three for Your defaults; Send answers sends nothing.
  ...interacted('modules/01/interactions/fridge-brief', 8),
  ...checks('01'),
  completed('01'),
  ...interacted('modules/02/interactions/say-go'),
  ...checks('02'),
  completed('02'),
  ...interacted('modules/03/interactions/merge-or-not'),
  // Raw chicken wrong first, the other seven right; the replay after Try again never ends.
  played('accepted', 7, 8),
  ...checks('03'),
  completed('03'),
  ...interacted('modules/04/interactions/your-process'),
  ...checks('04'),
  completed('04'),
  line('completed', 'course', `${score(10, 10)} · completion true`),
];

/**
 * Opens the drawer, reads every statement as a line, oldest first, runs `whileOpen` on the
 * drawer's entries (newest first), and closes it again.
 */
async function drawerLines(page: Page, count: number, whileOpen?: (items: Locator) => Promise<void>): Promise<string[]> {
  await page.getByRole('banner').getByRole('button', { name: `Statements (${count})` }).click();
  const drawer = page.getByRole('dialog', { name: `Statements sent (${count})` });
  const items = drawer.locator('li.statement');
  await expect(items).toHaveCount(count);
  const lines = await items.evaluateAll((els, courseId) =>
    els.map((el) => {
      const id = el.getAttribute('data-object') ?? '';
      const object = id === courseId ? 'course' : id.startsWith(courseId) ? id.slice(courseId.length) : id;
      const result = Object.fromEntries([...el.querySelectorAll('.statement-result dt')].map((dt) => [dt.textContent, dt.nextElementSibling?.textContent]));
      const parts = [['Success', 'success'], ['Score', 'score'], ['Completion', 'completion']].flatMap(([term, word]) =>
        result[term] === undefined ? [] : [` · ${word} ${result[term]}`],
      );
      return `${el.getAttribute('data-verb')} ${object}${parts.join('')}`;
    }),
  COURSE_ID);
  await whileOpen?.(items);
  await drawer.getByRole('button', { name: 'Close' }).click();
  // The drawer lists newest first.
  return lines.reverse();
}

/** Opens a module from the home page by its number. */
async function open(page: Page, slug: string, first: string): Promise<void> {
  await page.getByRole('region', { name: 'The modules' }).getByRole('link', { name: new RegExp(`^${slug} · `) }).click();
  await expect(heading(page)).toHaveText(first);
}

/** The takeaway's Next goes home, where the top bar counts the modules done. */
async function home(page: Page, done: number): Promise<void> {
  await next(page, HOME_HEADING);
  await expect(page.getByRole('banner')).toContainText(`${done} of 5 done`);
}

test('the whole course in preview sends every statement, in order, and comes back done', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const external = await keepLocal(page, new URL(baseURL!).origin);
  // The one-shot's fifteen seconds and the brief's Thinking run on the page's clock, not the test's.
  await page.clock.install();
  const banner = page.getByRole('banner');
  const main = page.getByRole('main');

  // 1. The scenario, in preview: the badge, the note, and initialized in the drawer.
  await page.goto('/');
  await expect(page.getByText('Your role: learning designer')).toBeVisible();
  await expect(page.getByText('One more thing for the food-hygiene course')).toBeVisible();
  const lines = main.getByRole('list').first().getByRole('listitem');
  await expect(lines).toHaveCount(3);
  await expect(lines.nth(1)).toContainText('answer its questions, say go to its plan, judge what comes back');
  await expect(lines.nth(1)).not.toContainText('decide what done means');
  await expect(page.getByText(/^Five short modules, about 30 minutes\./)).toBeVisible();
  await expect(banner.getByText('PREVIEW', { exact: true })).toBeVisible();
  expect(await drawerLines(page, 1)).toEqual([line('initialized', 'course')]);

  // Take the job: the home page, five modules not started, and the open box's four walls.
  await page.getByRole('link', { name: 'Take the job' }).click();
  await expect(heading(page)).toHaveText(HOME_HEADING);
  await expect(banner).toContainText('Five modules · about 30 minutes');
  await expect(page.getByRole('blockquote')).toContainText('have agents look at what the agents have done');
  await expect(dashedWalls(page)).toHaveCount(4);
  await expect(page.locator('[data-wall] text')).toHaveText(['01 the record', '02 the gate', '02 the reviews', '03 evidence']);
  const cards = page.getByRole('region', { name: 'The modules' }).getByRole('link');
  const pills = cards.locator('.module-card-status');
  await expect(cards).toHaveCount(5);
  await expect(cards.locator('h3')).toHaveText([
    "What works and what doesn't",
    'The brief',
    "While you're away",
    'What comes back',
    'Round again, and make it yours',
  ]);
  await expect(cards.locator('.module-card-number')).toHaveText([/^00 · /, /^01 · /, /^02 · /, /^03 · /, /^04 · /]);
  await expect(pills).toHaveText(Array.from({ length: 5 }, () => 'Not started'));

  // 2. Module 00, then the drawer so far.
  await playModule00(page);
  await expect(banner).toContainText('1 of 5 done');
  // The done card's pill says so, and the card is marked done (its green border).
  await expect(pills).toHaveText(['Done', ...Array.from({ length: 4 }, () => 'Not started')]);
  await expect(cards.first()).toHaveAttribute('data-status', 'done');
  await expect(cards.nth(1)).toHaveAttribute('data-status', 'not-started');
  expect(await drawerLines(page, MODULE_00.length)).toEqual(MODULE_00);

  // 3. Module 01: the forum and Ross's quote; the brief one round at a time, round one by its
  // first chips and Send answers, round two by "Your defaults"; the page's clock runs the fade
  // and the Thinking.
  await open(page, '01', 'Where did the timer come from?');
  await next(page, 'How a brief goes');
  await expect(main.locator('.block-cards').first().locator('.block-card')).toHaveCount(5);
  const ross = main.locator('.block-quote', { hasText: 'Ross' });
  await expect(ross).toContainText('extension of your creativity');
  await expect(ross.locator('figcaption')).toHaveText('Ross');
  await next(page, 'The fridge brief');
  const decisions = page.locator('.brief-decision[data-filled]');
  const chat = page.getByRole('list', { name: 'The conversation' });
  const send = page.getByRole('button', { name: 'Send answers' });
  const defaults = page.getByRole('button', { name: 'Your defaults' });
  // The learner's messages' bubbles: the opening, then the latest line under it.
  const learner = chat.locator('[data-who="learner"] .chat-bubble');
  // Round one alone: Send answers off until every question is answered, and no Your defaults.
  await expect(send).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByText('Answer every question, then send.')).toBeVisible();
  await expect(defaults).toHaveCount(0);
  await expect(page.getByRole('group', { name: '6. A timer?' })).toHaveCount(0);
  const roundOne = [
    '1. Who does this, and where?',
    '2. Which shelves, which items, and whose rules?',
    '3. What happens on a wrong drop?',
    '4. How does it end, and is there a score?',
    '5. Keyboard and touch?',
  ];
  for (const question of roundOne) await page.getByRole('group', { name: question }).getByRole('button').first().click();
  await expect(page.getByText('5 of 8 decisions.')).toBeVisible();
  await expect(decisions).toHaveCount(5);
  await expect(send).not.toHaveAttribute('aria-disabled');
  // The clock stands still, so the round's fade and the agent's Thinking move only when run.
  await pauseClock(page);
  await send.click();
  // The round fades out, then the learner's line takes its place and the agent thinks.
  await expect(page.locator('.brief-chat')).toHaveAttribute('data-phase', 'leaving');
  await page.clock.runFor(FADE_MS);
  await expect(learner).toHaveCount(2);
  await expect(learner.last()).toHaveText('My answers to 1 to 5.');
  await expect(chat).toContainText('Thinking…');
  await expect(page.getByRole('group', { name: roundOne[0] })).toHaveCount(0);
  await page.clock.runFor(THINKING_MS);
  // Round two in the same place, focus on its message; the learner line stays above it.
  await expect(page.locator('[data-message="round-1"]')).toBeFocused();
  // Its message exactly, so no count of the questions left can follow it (brief SKILL.md:48, C23).
  await expect(page.locator('[data-message="round-1"] .chat-bubble > p').first()).toHaveText('Took your answers as D1 to D5 on the right.');
  await expect(learner.last()).toHaveText('My answers to 1 to 5.');
  await expect(chat).not.toContainText('Thinking…');
  // Its three questions, the third the agent's own idea.
  await expect(page.getByRole('group', { name: /^\d\. / })).toHaveCount(3);
  await expect(page.getByRole('group', { name: '6. A timer?' })).toBeVisible();
  await expect(page.getByRole('group', { name: '8. Label each shelf with what goes there?' })).toBeVisible();
  await expect(send).toHaveAttribute('aria-disabled', 'true');
  await defaults.click();
  await expect(page.getByText('8 of 8 decisions.')).toBeVisible();
  await expect(decisions).toHaveCount(8);
  await expect(decisions.last().locator('.brief-decision-id')).toHaveText('D8');
  await expect(decisions.last().locator('.brief-decision-text')).toHaveText(
    'Each shelf carries a short label of what goes there, so the fridge teaches the rule as well as testing it.',
  );
  await page.clock.runFor(FADE_MS);
  await expect(learner).toHaveCount(2);
  await expect(learner.last()).toHaveText('Your defaults.');
  await expect(chat).toContainText('Thinking…');
  await page.clock.runFor(THINKING_MS);
  await expect(page.locator('[data-message="closing"]')).toBeFocused();
  await page.clock.resume();
  await expect(page.getByText("That's the brief.")).toBeVisible();
  await expect(page.getByText("Compare this with module 00's one-line ask.")).toBeVisible();
  await next(page, 'What the record is for');
  await next(page, /^You have written two pages/);
  await expect(await choose(page, 'Exactly that: your blind spots built in')).toHaveAttribute('data-state', 'right');
  await next(page, /^Halfway through round two/);
  await expect(await choose(page, 'Decide, and have the reason recorded with it.')).toHaveAttribute('data-state', 'right');
  await next(page, /^The agent asks, you decide/);
  await expect(solidWalls(page)).toHaveCount(1);
  await expect(page.locator('[data-wall="record"]')).toHaveAttribute('data-state', 'solid');
  await expect(page.locator('[data-wall="record"] text')).toHaveText('01 the record');
  await home(page, 2);

  // 4. Module 02: the plan and its demo script; go, or ask; the box; the same piece twice; the
  // reviewers' numbers.
  await open(page, '02', 'You press go and leave');
  await next(page, 'The plan');
  await expect(main.locator('.block-card')).toHaveCount(5);
  const script = page.locator('.frame-side .block-list', { hasText: 'The demo script' });
  await expect(script.locator('.block-list-marker')).toHaveText(['1', '2', '3', '4', '5']);
  await expect(script).not.toContainText(/keyboard/i);
  await next(page, 'Go, or ask?');
  const ask = await choose(page, 'Ask for a step');
  await expect(ask).toHaveAttribute('data-state', 'right');
  await expect(ask).toContainText('twelve and thirty');
  await next(page, 'The box');
  await next(page, 'The same piece, twice');
  const boxed = main.locator('.block-column', { hasText: 'Boxed' });
  await expect(boxed.locator('.block-list-item[data-tone="wrong"]', { hasText: 'goes red' })).toHaveCount(1);
  await expect(boxed.locator('.block-list-item', { hasText: 'three files changed against a list of two' })).toContainText('sends the piece back');
  // Its report hands the screen-reader wording to another piece, and confirms nothing it could not.
  await expect(boxed).toContainText("The screen-reader wording is the keyboard piece's work");
  await expect(boxed).not.toContainText(/could not confirm/i);
  await expect(page.locator('body')).not.toContainText(/rejected/i);
  await next(page, 'The reviewers');
  await expect(main.locator('.block-table td')).toHaveText(['16', '16', '50', '39']);
  await next(page, /^The builder's report says it tested everything/);
  await expect(await choose(page, 'Treat it as not done until')).toHaveAttribute('data-state', 'right');
  await next(page, /^A reviewer writes "Not a bug/);
  await expect(await choose(page, 'Uncertain, and the finding stays alive.')).toHaveAttribute('data-state', 'right');
  await next(page, /^You were not there, and nothing depended on anyone's word\./);
  await expect(solidWalls(page)).toHaveCount(3);
  await expect(page.locator('[data-wall="evidence"]')).toHaveAttribute('data-state', 'dashed');
  await home(page, 3);

  // 5. Module 03: the pull request condensed, sent back; the two fridges, the accepted one by
  // mouse as the demo script runs it, then by keyboard.
  await open(page, '03', 'It finished at two in the morning');
  await next(page, 'The first three lines');
  await next(page, 'The rest of the page');
  await next(page, 'The pull request, condensed');
  for (const top of ['Two-way door.', 'Before merging:', 'Undo:']) await expect(main.getByText(top).first()).toBeVisible();
  const chapters = main.locator('.block-list-item', { has: page.locator('.block-list-marker', { hasText: /^ch \d$/ }) });
  await expect(chapters).toHaveCount(6);
  await expect(chapters.nth(3)).toContainText('"Lettuce placed. Correct."');
  // Chapter 4 alone has no evidence: no tick, where the other five have one.
  await expect.poll(() => chapters.evaluateAll((items) => items.map((item) => item.getAttribute('data-tone')))).toEqual(['right', 'right', 'right', 'neutral', 'right', 'right']);
  await expect(chapters.getByRole('img', { name: 'right' })).toHaveCount(5);
  await expect(chapters.nth(3).locator('.block-list-tone')).toBeEmpty();
  const choices = main.locator('.block-paragraph', { hasText: 'Choices made for you' });
  await expect(choices).toContainText('stays on screen until the next move');
  await expect(choices).not.toContainText('2.5');
  await next(page, 'What do you do?');
  await expect(await choose(page, 'Send it back as one piece of work')).toHaveAttribute('data-state', 'right');
  await next(page, 'The two fridges');
  const left = fridge(page, 'Module 00: "Build me a fridge activity"');
  const accepted = fridge(page, 'Module 03: what you accepted');
  await expect(left.timer).toHaveText('0:15');
  await expect(accepted.timer).toHaveCount(0);
  await expect(main.getByRole('row', { name: /^Time/ }).getByRole('cell').first()).toHaveText(/^Fifteen seconds/);
  await drag(page, accepted.item('Raw chicken'), accepted.shelf('top'));
  await expect(accepted.status).toHaveText("Raw chicken returned to the tray. Raw meat and fish go on the bottom shelf so they can't drip onto other food.");
  await expect(accepted.item('Raw chicken')).toBeVisible();
  for (const [item, shelf] of [
    ['Raw chicken', 'bottom'],
    ['Cheese', 'top'],
    ['Yoghurt', 'top'],
    ['Cooked chicken', 'middle'],
    ['Leftover lasagne (sealed)', 'middle'],
    ['Raw salmon', 'bottom'],
    ['Lettuce', 'salad-drawer'],
    ['Tomatoes', 'salad-drawer'],
  ]) {
    await drag(page, accepted.item(item), accepted.shelf(shelf));
    // It stays.
    await expect(accepted.onShelf(shelf).filter({ hasText: item })).toHaveCount(1);
  }
  await expect(accepted.root.locator('.fridge-score')).toContainText('7 out of 8 right first time');
  await expect(accepted.root.locator('.fridge-wrong')).toHaveText("Raw chicken: Raw meat and fish go on the bottom shelf so they can't drip onto other food.");
  await accepted.root.getByRole('button', { name: 'Try again' }).click();
  await expect(accepted.tray).toHaveCount(8);
  await expect(accepted.root.locator('.fridge-placed')).toHaveCount(0);
  const lettuce = accepted.item('Lettuce');
  for (let i = 0; i < 12 && !(await lettuce.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(lettuce).toBeFocused();
  await page.keyboard.press('Enter');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(accepted.status).toHaveText('Lettuce placed in the salad drawer. Correct.');
  await expect(accepted.onShelf('salad-drawer')).toHaveText(['Lettuce']);
  await next(page, /^A pull request's door line says/);
  await expect(await choose(page, 'The door is wrong')).toHaveAttribute('data-state', 'right');
  await next(page, /^The walkthrough has five chapters/);
  await expect(await choose(page, 'One step has no evidence')).toHaveAttribute('data-state', 'right');
  await next(page, /^You still sign off\./);
  await expect(solidWalls(page)).toHaveCount(4);
  await home(page, 4);

  // 6. Module 04: the check that missed, make it yours, your process, try this tomorrow, the end.
  await open(page, '04', 'The client tries it');
  await next(page, 'Rounds');
  await next(page, 'The check that missed');
  await expect(main.locator('.block-card')).toHaveCount(3);
  await expect(main.locator('.block-cards')).not.toContainText('cite');
  // The cards count no findings and no rounds, in digits or in words.
  const missed = main.locator('.block-card > p');
  await expect(missed).toHaveCount(3);
  for (const text of await missed.allInnerTexts()) {
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(/\b(findings?|rounds?)\b/i);
  }
  await next(page, 'Make it yours');
  const makeASkill = main.locator('.block-quote', { hasText: 'Ross' });
  await expect(makeASkill).toContainText('make a skill');
  await expect(makeASkill.locator('figcaption')).toHaveText('Ross');
  await next(page, 'You have a process. What do you do with it?');
  await expect(await choose(page, 'have it made into a skill')).toHaveAttribute('data-state', 'right');
  await next(page, 'The client asks for two things that were not in the brief. What does that mean?');
  await expect(await choose(page, 'Round two: a short brief')).toHaveAttribute('data-state', 'right');
  await next(page, 'A review missed a bug that a person caught. What is the useful question?');
  await expect(await choose(page, 'Which check, if it had existed')).toHaveAttribute('data-state', 'right');
  await next(page, 'Try this tomorrow');
  await expect(main.locator('.block-card')).toHaveCount(5);
  await expect(main.locator('.block-card').nth(4)).toContainText('skill');
  await next(page, /^Expect a second round\./);
  await expect(solidWalls(page)).toHaveCount(4);
  await expect(page.locator('svg.box-drawing')).toHaveAttribute('data-ring', 'true');
  const end = page.locator('.takeaway-end');
  await expect(end).toContainText('a recorded walkthrough someone judged');
  await expect(end).not.toContainText('pull request');
  await home(page, 5);
  await expect(main.getByRole('link', { name: 'Review from module 00' })).toBeVisible();

  // Every statement the play sent, in order, and the count exact; the drawer's top entry, the
  // newest, is the course completed at 10 of 10.
  expect(await drawerLines(page, FULL_PLAY.length, async (items) => {
    const top = items.first();
    await expect(top.locator('.statement-line')).toHaveText(`completed ${CONTENT.title}`);
    await expect(top.locator('.statement-result')).toContainText('10 of 10');
  })).toEqual(FULL_PLAY);

  // A reload keeps it all: five done, and module 04's choice as it was left.
  await page.goto('/');
  await page.getByRole('link', { name: 'Take the job' }).click();
  await expect(heading(page)).toHaveText(HOME_HEADING);
  await expect(banner).toContainText('5 of 5 done');
  await expect(pills).toHaveText(Array.from({ length: 5 }, () => 'Done'));
  await expect(page.locator('.module-card[data-status="done"]')).toHaveCount(5);
  await open(page, '04', 'The client tries it');
  await next(page, 'Rounds');
  await next(page, 'The check that missed');
  await next(page, 'Make it yours');
  await next(page, 'You have a process. What do you do with it?');
  const skill = page.getByRole('radio', { name: 'have it made into a skill' });
  await expect(skill).toBeChecked();
  await expect(page.locator('.choice', { has: skill })).toHaveAttribute('data-state', 'right');

  expect(external).toEqual([]);
});
