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
  // Each card's status is a pill in its top row, beside the number.
  await expect(cards.locator('.module-card-head .module-card-status')).toHaveText(Array.from({ length: 8 }, () => 'Not started'));
  await expect(page.locator('[data-wall][data-state="dashed"]')).toHaveCount(5);

  expect(external).toEqual([]);
});

/**
 * Controls exempt from the 44 by 44 px target size, by the name the spec gives them: only an
 * inline text link inside a sentence, which WCAG 2.5.8's inline exception covers and the spec
 * confirms. None on the home page today.
 */
const INLINE_LINKS: readonly string[] = [];

test('every control on the home page is reached by Tab, shows a focus ring and is a 44 by 44 px target', async ({ page }) => {
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
      // In a sentence: an inline link with text of its own beside it in the same parent.
      const inSentence =
        el.tagName === 'A' &&
        style.display === 'inline' &&
        [...(el.parentElement?.childNodes ?? [])].some((node) => node !== el && node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      return {
        name: `${el.getAttribute('href')} ${el.textContent}`,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        width: box.width,
        height: box.height,
        inSentence,
      };
    });
    reached.add(focused.name);
    expect(focused.outlineStyle, focused.name).toBe('solid');
    expect(focused.outlineWidth, focused.name).toBe('3px');
    if (INLINE_LINKS.includes(focused.name)) {
      expect(focused.inSentence, `${focused.name} is exempt as an inline link in a sentence`).toBe(true);
      continue;
    }
    const size = `${focused.name}: ${focused.width} by ${focused.height} px`;
    expect(focused.width, size).toBeGreaterThanOrEqual(44);
    expect(focused.height, size).toBeGreaterThanOrEqual(44);
  }
  expect(reached.size).toBe(controls);
});
