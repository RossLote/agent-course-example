import { expect, type Locator, type Page } from '@playwright/test';
import { readContent } from '../../scripts/content.ts';
import { VERDICTS, type Verdict } from '../../src/screens/choose/labels.ts';

// The e2e specs' shared moves: the course id as course.yaml gives it, the home page's heading,
// the guard that keeps every request on the local server, the frame's Next, a pointer drag, and
// module 00 played as the ACCEPTANCE BAR's step 2 plays it (the launch spec plays it too).

/** The course as content/ gives it, read once. */
export const CONTENT = readContent();

/** course.yaml's id: the root of every module, check, interaction and fridge id (D24). */
export const COURSE_ID = CONTENT.id;

/** The home page's h1, which module 00's takeaway goes on to. */
export const HOME_HEADING = CONTENT.home.heading;

/**
 * Aborts and records every request that would leave `origin`. Register it before any narrower
 * route: Playwright tries the routes registered last first.
 */
export async function keepLocal(page: Page, origin: string): Promise<string[]> {
  const external: string[] = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (new URL(url).origin === origin) return route.continue();
    external.push(url);
    return route.abort();
  });
  return external;
}

/** The page's only h1: a screen's heading, or a takeaway's card. */
export const heading = (page: Page) => page.getByRole('heading', { level: 1 });

/**
 * Stops the page's clock (installed before the page loaded) a moment ahead, so timers move only
 * when the test runs them: the one-shot's countdown, the brief's fade and Thinking.
 */
export async function pauseClock(page: Page): Promise<void> {
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
}

/** Presses the frame's Next and waits for the next screen's heading. */
export async function next(page: Page, to: string | RegExp): Promise<void> {
  await page.getByRole('contentinfo').getByRole('button', { name: /^Next: / }).click();
  await expect(heading(page)).toHaveText(to);
}

/**
 * Drags `from` onto `to` with the mouse, in steps, as a learner would: both ends are brought on
 * screen first, then measured, since the page does not scroll during a drag.
 */
export async function drag(page: Page, from: Locator, to: Locator): Promise<void> {
  const height = page.viewportSize()?.height ?? 0;
  const centre = async (locator: Locator) => {
    const box = await locator.boundingBox();
    if (box === null) throw new Error(`${locator} is not on the page`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  // Scroll the midpoint between the two to the middle of the window.
  const [start, end] = [await centre(from), await centre(to)];
  await page.evaluate((by) => window.scrollBy(0, by), (start.y + end.y) / 2 - height / 2);
  const a = await centre(from);
  const b = await centre(to);
  for (const [locator, point] of [[from, a], [to, b]] as const) {
    if (point.y < 0 || point.y > height) throw new Error(`${locator} is off screen for the drag`);
  }
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 12 });
  await page.mouse.up();
}

/** A fridge on the page by its title, with its tray items, its shelves and its status line. */
export function fridge(page: Page, title: string) {
  const root = page.getByRole('region', { name: title });
  return {
    root,
    item: (name: string) => root.getByRole('group', { name: 'The tray' }).getByRole('button', { name, exact: true }),
    shelf: (id: string) => root.locator(`[data-drop-target="${id}"]`),
    onShelf: (id: string) => root.locator(`[data-drop-target="${id}"] .fridge-placed`),
    tray: root.getByRole('group', { name: 'The tray' }).getByRole('button'),
    status: root.locator('.fridge-status'),
    timer: root.getByRole('timer', { name: 'Time left' }),
  };
}

/** Picks a single-choice option and presses Check; the screen marks it with its feedback. */
export async function choose(page: Page, label: string): Promise<Locator> {
  await page.getByRole('radio', { name: label }).check();
  await page.getByRole('button', { name: 'Check my answer' }).click();
  return page.locator('.choice', { has: page.getByRole('radio', { name: label }) });
}

/** Ticks each multi-choice option and presses Check. */
async function tick(page: Page, labels: readonly string[]): Promise<void> {
  for (const label of labels) await page.getByRole('checkbox', { name: label }).check();
  await page.getByRole('button', { name: 'Check my answer' }).click();
}

/**
 * A checked multi choose, option by option: what the learner did with each (its data-state and
 * its pill's words), and the summary under the list, which is the screen's live region.
 */
async function verdicts(page: Page, expected: readonly Verdict[], summary: string): Promise<void> {
  const options = page.locator('.choice');
  await expect.poll(() => options.evaluateAll((rows) => rows.map((row) => row.getAttribute('data-state')))).toEqual(expected);
  await expect(options.locator('.choice-verdict')).toHaveText(expected.map((verdict) => VERDICTS[verdict].label));
  await expect(page.locator('.choice-summary')).toHaveText(summary);
  await expect(page.getByRole('status').filter({ hasText: summary })).toBeVisible();
}

/** The takeaway's box: the walls drawn solid. */
export const solidWalls = (page: Page) => page.locator('[data-wall][data-state="solid"]');

/** The box's walls drawn dashed: the open box on the home page, and module 00's takeaway. */
export const dashedWalls = (page: Page) => page.locator('[data-wall][data-state="dashed"]');

/**
 * Module 00 from the home page to its takeaway and back home, as the bar's step 2 plays it: the
 * chat, the hand-holder's page and what came back, the three right options ticked, the one-shot
 * (its timer at 0:15; raw chicken on the lower middle stays, cheese on the bottom returns, then
 * the clock runs the fifteen seconds out through the last five's warning), both checks right.
 * The page's clock must be installed before it loaded; it is paused for the countdown and runs
 * on again after it.
 */
export async function playModule00(page: Page): Promise<void> {
  await page.getByRole('region', { name: 'The modules' }).getByRole('link', { name: /^00 · / }).click();
  await expect(heading(page)).toHaveText('The request');

  await next(page, 'Just ask');
  const chat = page.getByRole('list', { name: 'The conversation' });
  await expect(chat).toContainText('Build a drag-and-drop fridge activity for the food hygiene course.');
  await expect(chat).toContainText("Done! I've built a fridge activity.");

  // The page-long ask, and the agent's reply: exactly the page, mistakes and all, and no suggestion.
  await next(page, 'Hold its hand');
  const main = page.getByRole('main');
  await expect(main.locator('.block-list', { hasText: 'Your page' }).locator('.block-list-item')).toHaveCount(7);
  const reply = main.locator('.block-quote', { hasText: 'The agent' });
  await expect(reply).toContainText('Wrong, try again');
  await expect(reply).toContainText('Cooked chicken goes on the bottom shelf with the raw chicken');
  await expect(reply).not.toContainText('?');
  await expect(reply).not.toContainText(/want me to|suggest/i);

  await next(page, 'Tick everything that went wrong here.');
  await tick(page, ['It built things nobody asked for', 'It invented the rules.', 'It checked its own work.']);
  await verdicts(page, ['right-tick', 'right-tick', 'right-tick', 'right-leave', 'right-leave'], '5 of 5 right.');
  await expect(page.locator('.choice-feedback')).toHaveCount(5);
  const happened = main.locator('.block-cards', { hasText: 'What just happened' });
  await expect(happened).toBeVisible();
  await expect(happened.locator('.block-card')).toHaveCount(5);

  await next(page, 'Try what it built');
  await expect(main).toContainText('Optional, fifteen seconds.');
  const oneShot = fridge(page, 'Module 00: "Build me a fridge activity"');
  await expect(oneShot.timer).toHaveText('0:15');
  // No switching the timer off.
  await expect(oneShot.root.getByRole('button', { name: /timer/i })).toHaveCount(0);
  // The page's clock stands still from here, so the countdown moves only when the test runs it.
  await pauseClock(page);
  await drag(page, oneShot.item('Raw chicken'), oneShot.shelf('lower-middle'));
  await expect(oneShot.onShelf('lower-middle')).toHaveText(['Raw chicken']);
  await drag(page, oneShot.item('Cheese'), oneShot.shelf('bottom'));
  await expect(oneShot.status).toHaveText('Cheese returned to the tray.');
  await expect(oneShot.item('Cheese')).toBeVisible();
  await expect(oneShot.onShelf('bottom')).toHaveCount(0);
  await expect(oneShot.timer).toHaveText('0:15');
  await expect(oneShot.root).not.toHaveAttribute('data-warning');
  // Ten seconds on, the last five warn: the timer red and pulsing, the fridge outlined red.
  await page.clock.runFor(10_000);
  await expect(oneShot.timer).toHaveText('0:05');
  await expect(oneShot.timer).toHaveAttribute('data-pulse', 'true');
  await expect(oneShot.root).toHaveAttribute('data-warning', 'true');
  // At 0:00 the tray gives way to the file's message and one Reset.
  await page.clock.runFor(5_000);
  await expect(oneShot.timer).toHaveText('0:00');
  await expect(oneShot.root.locator('.fridge-timeup')).toContainText("Time's up! Better luck next time.");
  await expect(oneShot.tray).toHaveCount(0);
  await expect(oneShot.root.getByRole('button', { name: 'Reset' })).toHaveCount(1);
  await page.clock.resume();

  await next(page, 'Your agent built a feature you never mentioned. What most likely happened?');
  await expect(await choose(page, 'It filled a gap in your ask with a guess.')).toHaveAttribute('data-state', 'right');

  await next(page, 'The agent says "I tested it myself and it all works." What is that worth?');
  await expect(await choose(page, 'Something, but not a sign-off')).toHaveAttribute('data-state', 'right');

  await next(page, /^The builder is the worst judge of its own work\./);
  await expect(dashedWalls(page)).toHaveCount(4);
  await expect(solidWalls(page)).toHaveCount(0);
  await next(page, HOME_HEADING);
}
