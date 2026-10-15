import { expect, type Locator, type Page } from '@playwright/test';
import { readContent } from '../../scripts/content.ts';

// The e2e specs' shared moves: the course id as course.yaml gives it, the home page's heading,
// the guard that keeps every request on the local server, the frame's Next, a pointer drag, and
// module 00 played as the ACCEPTANCE BAR's steps 3 and 4 play it (the launch spec plays it too).

/** course.yaml's id: the root of every module, check, interaction and fridge id (D24). */
export const COURSE_ID = readContent().id;

/** The home page's h1, which module 00's takeaway goes on to. */
export const HOME_HEADING = 'Agents are better at reviewing than building.';

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
export async function choose(page: Page, label: string, check = 'Check my answer'): Promise<Locator> {
  await page.getByRole('radio', { name: label }).check();
  await page.getByRole('button', { name: check }).click();
  return page.locator('.choice', { has: page.getByRole('radio', { name: label }) });
}

/** Ticks each multi-choice option and presses Check. */
export async function tick(page: Page, labels: readonly string[], check = 'Check my answer'): Promise<void> {
  for (const label of labels) await page.getByRole('checkbox', { name: label }).check();
  await page.getByRole('button', { name: check }).click();
}

/** The marked options of a checked choose screen. */
export const marked = (page: Page, state: 'right' | 'wrong') => page.locator(`.choice[data-state="${state}"]`);

/** The takeaway's box: the walls drawn solid. */
export const solidWalls = (page: Page) => page.locator('[data-wall][data-state="solid"]');

/**
 * Module 00 from the home page to its takeaway and back home, as the bar's steps 3 and 4 play
 * it: the chat, all five ticked, the one-shot (raw chicken on the lower middle stays, cheese
 * on the bottom returns, then the clock runs the timer out), check 1 wrong then right, check 2
 * right. The page's clock must be installed before it loaded.
 */
export async function playModule00(page: Page): Promise<void> {
  await page.getByRole('region', { name: 'The modules' }).getByRole('link', { name: /^00 · / }).click();
  await expect(heading(page)).toHaveText('The request');

  await next(page, 'Just ask');
  const chat = page.getByRole('list', { name: 'The conversation' });
  await expect(chat).toContainText('Build a drag-and-drop fridge activity for the food hygiene course.');
  await expect(chat).toContainText("Done! I've built a fridge activity.");

  await next(page, 'Tick everything that went wrong here.');
  await tick(page, [
    'It built things nobody asked for',
    'It invented the rules.',
    'It checked its own work.',
    'It should have said no.',
    'It was too slow.',
  ]);
  await expect(marked(page, 'right')).toHaveCount(3);
  await expect(marked(page, 'wrong')).toHaveCount(2);
  await expect(page.locator('.choice-feedback')).toHaveCount(5);
  await expect(page.getByText('What just happened')).toBeVisible();
  await expect(page.locator('.block-card')).toHaveCount(4);

  await next(page, 'Try what it built');
  const oneShot = fridge(page, 'Module 00: "Build me a fridge activity"');
  await expect(oneShot.timer).toHaveText('1:00');
  await drag(page, oneShot.item('Raw chicken'), oneShot.shelf('lower-middle'));
  await expect(oneShot.onShelf('lower-middle')).toHaveText(['Raw chicken']);
  await drag(page, oneShot.item('Cheese'), oneShot.shelf('bottom'));
  await expect(oneShot.status).toHaveText('Cheese returned to the tray.');
  await expect(oneShot.item('Cheese')).toBeVisible();
  await expect(oneShot.onShelf('bottom')).toHaveCount(0);
  // The countdown ticks once a second; run the page's clock through the minute.
  await page.clock.runFor(60_000);
  await expect(oneShot.timer).toHaveText('0:00');
  await expect(oneShot.root).toContainText("Time's up!");

  await next(page, 'Your agent built a feature you never mentioned. What most likely happened?');
  const misread = await choose(page, 'It misread your message.');
  await expect(misread).toHaveAttribute('data-state', 'wrong');
  await expect(misread).toContainText('Not usually. It read what you wrote');
  await page.getByRole('button', { name: 'Try again' }).click();
  const gap = await choose(page, 'It filled a gap in your ask with a guess.');
  await expect(gap).toHaveAttribute('data-state', 'right');

  await next(page, 'The agent says "I tested it myself and it all works." What is that worth?');
  await expect(await choose(page, 'Something, but not a sign-off')).toHaveAttribute('data-state', 'right');

  await next(page, /^The builder is the worst judge of its own work\./);
  await expect(page.locator('[data-wall][data-state="dashed"]')).toHaveCount(5);
  await next(page, HOME_HEADING);
}
