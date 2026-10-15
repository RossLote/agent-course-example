import { defineConfig, devices } from '@playwright/test';

// E2E_PORT lets several workers run specs at once without sharing a server. The default is
// not the presentation repo's (5180), so both suites can run on this machine at once.
const port = Number(process.env.E2E_PORT ?? 5280);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './e2e',
  // The walkthrough has its own config (playwright.walkthrough.config.ts) and is not part of e2e.
  testIgnore: ['walkthrough/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
