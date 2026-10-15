import { expect, test } from '@playwright/test';

test('the app opens on the course title and fetches nothing beyond the local server', async ({
  page,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin;
  const external: string[] = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (new URL(url).origin === origin) return route.continue();
    external.push(url);
    return route.abort();
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Getting the most out of agents');
  expect(external).toEqual([]);
});
