import { expect, test } from '@playwright/test';
import { heading, HOME_HEADING, keepLocal } from '../course/play.ts';

const SCENARIO_HEADING = "A client wants something the authoring tool can't do. You have an AI agent. You've never used one for this.";

test('the app opens on the scenario, takes the job to the home page, and fetches nothing beyond the local server', async ({
  page,
  baseURL,
}) => {
  const external = await keepLocal(page, new URL(baseURL!).origin);

  await page.goto('/?registration=smoke');
  await expect(heading(page)).toHaveText(SCENARIO_HEADING);
  await expect(page.getByText('Your role: learning designer')).toBeVisible();
  await expect(page.getByRole('banner').getByRole('link', { name: 'Getting the most out of agents' })).toBeVisible();

  // The fonts are bundled and served by the local server.
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
  for (const family of ['Manrope Variable', 'Atkinson Hyperlegible']) expect(loaded).toContain(family);

  await page.getByRole('link', { name: 'Take the job' }).click();
  await expect(heading(page)).toHaveText(HOME_HEADING);
  expect(new URL(page.url()).search).toBe('?registration=smoke');
  expect(new URL(page.url()).hash).toBe('#/home');
  const cards = page.getByRole('region', { name: 'The modules' }).getByRole('link');
  await expect(cards).toHaveCount(8);
  for (const card of await cards.all()) await expect(card).toContainText('Not started');
  await expect(page.locator('[data-wall][data-state="dashed"]')).toHaveCount(5);

  expect(external).toEqual([]);
});

test('every control on the home page is reached by Tab and shows a focus ring', async ({ page }) => {
  await page.goto('/#/home');
  await expect(heading(page)).toHaveText(HOME_HEADING);
  const controls = await page.locator('a[href], button').count();

  const reached = new Set<string>();
  for (let i = 0; i < controls; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return { name: `${el.getAttribute('href')} ${el.textContent}`, outline: style.outlineStyle, width: style.outlineWidth, height: box.height };
    });
    reached.add(focused.name);
    expect(focused.outline, focused.name).toBe('solid');
    expect(focused.width, focused.name).toBe('3px');
    expect(focused.height, focused.name).toBeGreaterThanOrEqual(44);
  }
  expect(reached.size).toBe(controls);
});
