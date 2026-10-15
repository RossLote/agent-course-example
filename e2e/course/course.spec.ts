import { expect, test, type Page } from '@playwright/test';
import { choose, COURSE_ID, drag, fridge, heading, HOME_HEADING, keepLocal, next, playModule00, solidWalls, tick, verdicts } from './play.ts';

// The whole course in preview, played as the ACCEPTANCE BAR plays it (steps 1 to 12), and the
// statements drawer read at the end: every statement the play sent, oldest first, as D19 and
// the review additions list them (PLAN.md §6, "Statements").

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
  ...interacted('modules/00/interactions/what-went-wrong', 5),
  // Raw chicken right (+100), cheese wrong (-50); out of 100 for each of the 14 items. Sent at time-up.
  played('one-shot', 50, 1400),
  answered('modules/00/checks/1', false),
  answered('modules/00/checks/1', true),
  answered('modules/00/checks/2', true),
  completed('00'),
];

/** The whole play's statements, oldest first. */
const FULL_PLAY = [
  ...MODULE_00,
  // Five chip picks, then three for Your defaults; Send answers sends nothing.
  ...interacted('modules/01/interactions/fridge-brief', 8),
  ...checks('01'),
  completed('01'),
  ...interacted('modules/02/interactions/write-the-acceptance', 3),
  ...interacted('modules/02/interactions/epic-review'),
  ...checks('02'),
  completed('02'),
  ...interacted('modules/03/interactions/build-the-box', 4),
  ...checks('03'),
  completed('03'),
  // The verdict wrong, Try again, then right: one per Check press.
  ...interacted('modules/04/interactions/verdict', 2),
  ...interacted('modules/04/interactions/who-catches-it', 4),
  ...checks('04'),
  completed('04'),
  ...interacted('modules/05/interactions/merge-or-not'),
  // Raw chicken wrong first, the other seven right; the replay after Try again never ends.
  played('accepted', 7, 8),
  ...checks('05'),
  completed('05'),
  ...interacted('modules/06/interactions/what-would-you-change', 3),
  ...checks('06'),
  completed('06'),
  answered('modules/07/interactions/order-the-loop', true, 8, 8),
  answered('modules/07/interactions/name-the-wall', true, 6, 6),
  completed('07'),
  line('completed', 'course', `${score(28, 28)} · completion true`),
];

/** Opens the drawer, reads every statement as a line, oldest first, and closes it again. */
async function drawerLines(page: Page, count: number): Promise<string[]> {
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
  await expect(page.getByRole('banner')).toContainText(`${done} of 8 done`);
}

/** Picks a target on each row of a match screen, by the row's opening words. */
async function match(page: Page, rows: readonly [string, string][], check: string): Promise<void> {
  for (const [row, target] of rows) await page.getByRole('group', { name: row }).getByRole('radio', { name: target, exact: true }).check();
  await page.getByRole('button', { name: check }).click();
}

test('the whole course in preview sends every statement, in order, and comes back done', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const external = await keepLocal(page, new URL(baseURL!).origin);
  // The one-shot's fifteen seconds and the brief's Thinking run on the page's clock, not the test's.
  await page.clock.install();

  // 1. The scenario, in preview: the badge, and initialized in the drawer.
  await page.goto('/');
  await expect(page.getByText('Your role: learning designer')).toBeVisible();
  await expect(page.getByText('One more thing for the food-hygiene course')).toBeVisible();
  await expect(page.getByRole('main').getByRole('list').first().getByRole('listitem')).toHaveCount(3);
  await expect(page.getByRole('banner').getByText('PREVIEW', { exact: true })).toBeVisible();
  expect(await drawerLines(page, 1)).toEqual([line('initialized', 'course')]);

  // 2. Take the job: the thesis, the open box and eight modules not started.
  await page.getByRole('link', { name: 'Take the job' }).click();
  await expect(heading(page)).toHaveText(HOME_HEADING);
  await expect(page.getByRole('blockquote')).toContainText('have agents look at what the agents have done');
  await expect(page.locator('[data-wall][data-state="dashed"]')).toHaveCount(5);
  const cards = page.getByRole('region', { name: 'The modules' }).getByRole('link');
  const pills = cards.locator('.module-card-status');
  await expect(cards).toHaveCount(8);
  await expect(pills).toHaveText(Array.from({ length: 8 }, () => 'Not started'));

  // 3 and 4. Module 00, then the drawer so far.
  await playModule00(page);
  await expect(page.getByRole('banner')).toContainText('1 of 8 done');
  // The done card's pill says so, and the card is marked done (its green border).
  await expect(pills).toHaveText(['Done', ...Array.from({ length: 7 }, () => 'Not started')]);
  await expect(cards.first()).toHaveAttribute('data-status', 'done');
  await expect(cards.nth(1)).toHaveAttribute('data-status', 'not-started');
  expect(await drawerLines(page, MODULE_00.length)).toEqual(MODULE_00);

  // 5. Module 01: the brief one round at a time, round one by its first chips and Send
  // answers, round two by "Your defaults"; the page's clock runs the fade and the Thinking.
  await open(page, '01', 'Where did the timer come from?');
  await next(page, 'How a brief goes');
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
  for (const question of [
    '1. Who does this, and where?',
    '2. Which shelves, which items, and whose rules?',
    '3. What happens on a wrong drop?',
    '4. How does it end, and is there a score?',
    '5. Keyboard and touch?',
  ]) {
    await page.getByRole('group', { name: question }).getByRole('button').first().click();
  }
  await expect(page.getByText('5 of 8 decisions.')).toBeVisible();
  await expect(decisions).toHaveCount(5);
  await expect(send).not.toHaveAttribute('aria-disabled');
  // The clock stands still, so the round's fade and the agent's Thinking move only when run.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await send.click();
  // The round fades out, then the learner's line takes its place and the agent thinks.
  await expect(page.locator('.brief-chat')).toHaveAttribute('data-phase', 'leaving');
  await page.clock.runFor(400);
  await expect(learner).toHaveCount(2);
  await expect(learner.last()).toHaveText('My answers to 1 to 5.');
  await expect(chat).toContainText('Thinking…');
  await expect(page.getByRole('group', { name: '1. Who does this, and where?' })).toHaveCount(0);
  await page.clock.runFor(1500);
  // Round two in the same place, focus on its message; the learner line stays above it.
  await expect(page.locator('[data-message="round-1"]')).toBeFocused();
  await expect(chat).toContainText('Took your answers as D1 to D5 on the right.');
  await expect(learner.last()).toHaveText('My answers to 1 to 5.');
  await expect(chat).not.toContainText('Thinking…');
  await expect(page.getByRole('group', { name: '6. A timer?' })).toBeVisible();
  await expect(send).toHaveAttribute('aria-disabled', 'true');
  await defaults.click();
  await expect(page.getByText('8 of 8 decisions.')).toBeVisible();
  await expect(decisions).toHaveCount(8);
  await page.clock.runFor(400);
  await expect(learner).toHaveCount(2);
  await expect(learner.last()).toHaveText('Your defaults.');
  await expect(chat).toContainText('Thinking…');
  await page.clock.runFor(1500);
  await expect(page.locator('[data-message="closing"]')).toBeFocused();
  await page.clock.resume();
  await expect(page.getByText("That's the brief.")).toBeVisible();
  await expect(page.getByText("Compare this with module 00's one-line ask.")).toBeVisible();
  await next(page, 'What the record is for');
  await next(page, 'The agent asks five questions. You have time to answer two. What do you do?');
  await expect(await choose(page, 'for the ones you disagree with.')).toHaveAttribute('data-state', 'right');
  await next(page, /^Halfway through round two/);
  await expect(await choose(page, 'Decide, and have the reason recorded with it.')).toHaveAttribute('data-state', 'right');
  await next(page, /^The agent asks, you decide/);
  await expect(solidWalls(page)).toHaveCount(1);
  await expect(page.locator('[data-wall="record"]')).toHaveAttribute('data-state', 'solid');
  await home(page, 2);

  // 6. Module 02: the five beads and the demo script; three checkable lines; the epic review.
  await open(page, '02', 'Who builds what, and how do you know it is done?');
  await next(page, 'A bead is not a ticket');
  await next(page, 'The fridge activity, cut into pieces');
  await expect(page.locator('.block-card')).toHaveCount(5);
  await expect(page.locator('.frame-side .block-list-item')).toHaveCount(6);
  await next(page, 'Bead .3 has no acceptance yet. Pick the three lines a reviewer could check.');
  await tick(page, ['Pressing Enter on the focused tomatoes', 'The screen reader says', 'Pressing Escape while an item is picked up']);
  await verdicts(page, ['right-tick', 'right-leave', 'right-tick', 'right-leave', 'right-tick', 'right-leave'], '6 of 6 right.');
  await next(page, 'The epic review');
  await expect(await choose(page, 'Fix the epic now')).toHaveAttribute('data-state', 'right');
  await next(page, 'Which of these is acceptance a reviewer can check?');
  await expect(await choose(page, 'Dropping yoghurt on the bottom shelf returns it')).toHaveAttribute('data-state', 'right');
  await next(page, 'Two beads are set to run at the same time. What has to be true?');
  await expect(await choose(page, 'They touch different files')).toHaveAttribute('data-state', 'right');
  await next(page, /^Done is defined before the build starts/);
  await expect(solidWalls(page)).toHaveCount(2);
  await home(page, 3);

  // 7. Module 03: one option per wall ticked draws the box; the gate output.
  await open(page, '03', 'The wandering worker');
  await next(page, 'The walls');
  await next(page, 'Build the box');
  await tick(
    page,
    ['A unit test that every item has exactly one right shelf', 'Its own working area', 'Done means', "The gate's own output pasted"],
    'Check my box',
  );
  // The demo script left unticked: a wall missed.
  await verdicts(page, ['right-tick', 'right-leave', 'missed', 'right-tick', 'right-leave', 'right-tick', 'right-tick'], '6 of 7 right: one missed.');
  await expect(page.locator('.choose-box-wall[data-state="up"]')).toHaveCount(4);
  await expect(page.locator('.choose-box-caption')).toHaveText(/^4 of 4 walls up\./);
  await next(page, 'The same bead, twice');
  await expect(page.locator('.block-mono')).toContainText('gate: lint ok · typecheck ok · unit 14/14');
  await next(page, 'The gate is red. What happens?');
  await expect(await choose(page, 'The builder fixes it and runs the gate again')).toHaveAttribute('data-state', 'right');
  await next(page, /^The builder's report says/);
  await expect(await choose(page, 'Treat it as not done until')).toHaveAttribute('data-state', 'right');
  await next(page, /^A builder needs walls, not advice\./);
  await expect(solidWalls(page)).toHaveCount(3);
  await home(page, 4);

  // 8. Module 04: the numbers, the finding, the verdict wrong then right, who catches it.
  await open(page, '04', 'The build was green');
  await expect(page.locator('.block-stat-value')).toHaveText(['16', '16', '50', '39']);
  await next(page, 'Three layers, three kinds of mistake');
  await next(page, 'Follow one finding');
  await expect(page.getByRole('main').locator('.block-card')).toHaveText([/^1\s*The finder\./, /^2\s*The deduper\./]);
  await next(page, 'You are the skeptic');
  const refuted = await choose(page, 'Refuted: there is a test for wrong drops (C).', 'Check my verdict');
  await expect(refuted).toHaveAttribute('data-state', 'wrong');
  await expect(refuted).toContainText('Not a refutation.');
  await page.getByRole('button', { name: 'Try another verdict' }).click();
  await expect(await choose(page, 'Confirmed, citing A.', 'Check my verdict')).toHaveAttribute('data-state', 'right');
  await expect(page.getByText('The fix', { exact: true })).toBeVisible();
  await next(page, 'Who catches it?');
  await match(
    page,
    [
      ['Three copies of the', 'Simplify'],
      ['The message for yoghurt says', 'Review'],
      ['A drop during a message is silently lost.', 'Adversarial review'],
      ['A 60-second timer was built', 'None of the reviews: the epic'],
    ],
    'Check my matches',
  );
  await expect(page.locator('.match-row[data-state="right"]')).toHaveCount(4);
  await next(page, /^A skeptic writes:/);
  await expect(await choose(page, 'Uncertain; the finding stays alive.')).toHaveAttribute('data-state', 'right');
  await next(page, /^Simplify's reviewer proposes/);
  await expect(await choose(page, 'Reverted; simplify tidies')).toHaveAttribute('data-state', 'right');
  await next(page, /^The same kind of agent that guessed in module 00/);
  await expect(solidWalls(page)).toHaveCount(4);
  await home(page, 5);

  // 9. Module 05: the pull request, sent back; the accepted fridge, by mouse then by keyboard.
  await open(page, '05', 'It finished at two in the morning');
  await next(page, 'The first three lines');
  await next(page, 'The rest of the page');
  await next(page, 'Merge or not?');
  for (const top of ['Two-way door.', 'Before merging:', 'Undo:']) await expect(page.getByRole('main').getByText(top).first()).toBeVisible();
  await expect(page.locator('.block-list-marker', { hasText: /^ch \d$/ })).toHaveCount(6);
  await next(page, 'What do you do?');
  await expect(await choose(page, 'Send it back as one piece of work')).toHaveAttribute('data-state', 'right');
  await next(page, 'The two fridges');
  const accepted = fridge(page, 'Module 05: what you accepted');
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
  await expect(solidWalls(page)).toHaveCount(5);
  await home(page, 6);

  // 10. Module 06: the story's five steps; three right changes; the ring.
  await open(page, '06', 'The client tries it');
  await next(page, 'Rounds');
  await next(page, 'The check that missed');
  await expect(page.locator('.block-card')).toHaveCount(5);
  await next(page, 'What would you change?');
  await tick(page, ['Add a lens to the finders', 'Look back over the last few runs', 'Add a test for the exact case']);
  await verdicts(page, ['right-leave', 'right-tick', 'right-leave', 'right-tick', 'right-tick'], '5 of 5 right.');
  await next(page, 'The client asks for two things that were not in the brief. What does that mean?');
  await expect(await choose(page, 'Round two: a short brief')).toHaveAttribute('data-state', 'right');
  await next(page, 'A review missed a bug that a person caught. What is the useful question?');
  await expect(await choose(page, 'Which check, if it had existed')).toHaveAttribute('data-state', 'right');
  await next(page, /^Expect a second round\./);
  await expect(page.locator('svg.box-drawing')).toHaveAttribute('data-ring', 'true');
  await home(page, 7);

  // 11. Module 07: the order by keyboard, the walls named, the score, the end.
  await open(page, '07', 'A new request');
  await next(page, 'Order the loop');
  await page.getByRole('button', { name: /^Retro, over several runs/ }).focus();
  await page.keyboard.press('Enter');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('.order-status')).toHaveText('Retro dropped at position 8 of 8');
  await page.getByRole('button', { name: 'Check the order' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'in the right place' })).toHaveText('8 of 8 in the right place');
  await next(page, 'Name the wall');
  await match(
    page,
    [
      ['The builder added a "hint streak"', 'the record'],
      ['The builder says the hint is done', 'done'],
      ['While adding the hint it changed', 'the gate'],
      ['The gate is green, and the hint code', 'other agents'],
      ['It is nine in the morning', 'evidence'],
      ['A colleague found that the hint shows', 'the arrow'],
    ],
    'Check my answers',
  );
  await expect(page.getByRole('status').filter({ hasText: 'right' })).toHaveText('6 out of 6 right');
  await next(page, 'Your score');
  await expect(page.locator('.block-stat-value')).toHaveText('14 out of 14');
  await next(page, 'Try this tomorrow');
  await expect(page.locator('.block-card')).toHaveCount(4);
  await next(page, /^Lay out the loop for a new request\./);
  await expect(solidWalls(page)).toHaveCount(5);
  await expect(page.locator('svg.box-drawing')).toHaveAttribute('data-ring', 'true');
  await expect(page.getByText('This course was built the way it describes')).toBeVisible();

  // Every statement the play sent, in order, and the count exact.
  expect(await drawerLines(page, FULL_PLAY.length)).toEqual(FULL_PLAY);
  expect(FULL_PLAY).toHaveLength(60);

  // 12. A reload keeps it all: eight done, and module 04's verdict as it was left.
  await page.goto('/');
  await page.getByRole('link', { name: 'Take the job' }).click();
  await expect(heading(page)).toHaveText(HOME_HEADING);
  await expect(page.getByRole('banner')).toContainText('8 of 8 done');
  await expect(pills).toHaveText(Array.from({ length: 8 }, () => 'Done'));
  for (const card of await cards.all()) await expect(card).toHaveAttribute('data-status', 'done');
  await open(page, '04', 'The build was green');
  await next(page, 'Three layers, three kinds of mistake');
  await next(page, 'Follow one finding');
  await next(page, 'You are the skeptic');
  const verdict = page.locator('.choice', { has: page.getByRole('radio', { name: 'Confirmed, citing A.' }) });
  await expect(page.getByRole('radio', { name: 'Confirmed, citing A.' })).toBeChecked();
  await expect(verdict).toHaveAttribute('data-state', 'right');
  await expect(verdict).toContainText('Yes. Line 41 returns before anything happens');

  expect(external).toEqual([]);
});
