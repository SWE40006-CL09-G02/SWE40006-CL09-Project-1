// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for the SWE40006 end-to-end (E2E) acceptance tests.
 *
 * These tests exercise the deployed web application through a real browser,
 * covering the full Create / View / Update / Delete user journeys. They are
 * designed to run against the deployed Staging environment as a pipeline job
 * after the staging deployment (Level 3 / Level 4), but can also be pointed at
 * any running instance.
 *
 * Target URL resolution (first match wins):
 *   1. STAGING_URL  - set by the e2e-staging CI workflow after staging deploy
 *   2. BASE_URL     - generic override for local or ad-hoc runs
 *   3. http://127.0.0.1:3000 - a locally running instance
 */
const baseURL =
  process.env.STAGING_URL ||
  process.env.BASE_URL ||
  'http://127.0.0.1:3000';

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.spec.js',

  // Fail fast on a forgotten test.only in CI.
  forbidOnly: !!process.env.CI,

  // Retry once on CI to absorb transient network/deploy warm-up flakiness.
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  timeout: 30 * 1000,
  expect: { timeout: 10 * 1000 },

  // Readable output locally plus machine-readable artifacts for the pipeline.
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }]
  ],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
