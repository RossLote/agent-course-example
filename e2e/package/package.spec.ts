import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, extname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { unzipSync } from 'fflate';
import { readContent } from '../../scripts/content.ts';
import { heading, keepLocal } from '../course/play.ts';

// The zip `npm run package` writes, run as the LMS runs it: unzipped into a sub-folder and
// served by a plain static server, not the dev server. The package is built into a temporary
// folder, never dist/, so a real build there is left alone.

const root = fileURLToPath(new URL('../../', import.meta.url));
const SUB_FOLDER = 'some/sub/folder';
const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.xml': 'application/xml',
  '.json': 'application/json',
};

/** Serves the files under `dir` on a free port; records every path it has no file for. */
async function serve(dir: string): Promise<{ server: Server; origin: string; missing: string[] }> {
  const missing: string[] = [];
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const file = join(dir, path);
    try {
      if (!file.startsWith(dir + sep)) throw new Error('outside the folder');
      const body = readFileSync(file);
      response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      missing.push(path);
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, origin: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, missing };
}

let tmp: string;
let site: Awaited<ReturnType<typeof serve>>;

test.beforeAll(async () => {
  test.setTimeout(180_000);
  tmp = mkdtempSync(join(tmpdir(), 'agent-course-package-'));
  const out = join(tmp, 'build');
  execFileSync(process.execPath, [join(root, 'scripts/package/package.ts'), '--out', out], { cwd: root, stdio: 'pipe' });

  const served = join(tmp, 'site');
  for (const [path, bytes] of Object.entries(unzipSync(readFileSync(join(out, 'agent-course.zip'))))) {
    const file = join(served, SUB_FOLDER, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, bytes);
  }
  site = await serve(served);
});

test.afterAll(async () => {
  if (site) await new Promise((resolve) => site.server.close(resolve));
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

test('the unzipped package runs from a sub-folder of a static server, fetching nothing beyond it', async ({ page }) => {
  const external = await keepLocal(page, site.origin);

  await page.goto(`${site.origin}/${SUB_FOLDER}/index.html`);
  await expect(heading(page)).toHaveText(readContent().scenario.heading);
  await expect(page.getByRole('banner').getByText('PREVIEW', { exact: true })).toBeVisible();

  // The fonts are in the package and load from the sub-folder.
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
  for (const family of ['Manrope Variable', 'Atkinson Hyperlegible']) expect(loaded).toContain(family);

  expect(site.missing).toEqual([]);
  expect(external).toEqual([]);
});
