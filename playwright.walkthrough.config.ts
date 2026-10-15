import { defineConfig, devices } from '@playwright/test';

// `npm run walkthrough`: the acceptance-bar walkthrough, recorded slowed down with video on,
// from the throwaway spec the orchestrator writes in e2e/walkthrough/ (untracked, deleted once
// the PR is open; e2e/walkthrough/recorder.ts is its step helper and is committed). Output goes
// to docs/demos/<DEMO_ID>/ (gitignored), the epic's folder.
const demoId = process.env.DEMO_ID ?? 'walkthrough';
const port = Number(process.env.E2E_PORT ?? 5290);
const baseURL = `http://localhost:${port}`;
// The window a learner is likely to have; the brief may change it.
const size = { width: 1280, height: 800 };

export default defineConfig({
  testDir: './e2e/walkthrough',
  testMatch: '*.spec.ts',
  outputDir: `docs/demos/${demoId}`,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 30 * 60_000,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    viewport: size,
    deviceScaleFactor: 1,
    video: { mode: 'on', size },
    launchOptions: { slowMo: Number(process.env.SLOW_MO ?? 250) },
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: `npx vite --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
