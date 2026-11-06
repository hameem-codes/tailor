import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 5174);
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

/**
 * Tailor end-to-end suite.
 *
 * Covers every screen at every required viewport, iPhone Safari (WebKit) and
 * Android Chrome device emulation, plus the full functional flow.
 *
 * Run with:  npm run test:e2e
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  outputDir: './test-results',

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Full Chromium build (headless shell is not shipped in this environment)
        channel: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'iphone-safari',
      testMatch: /.*(responsive|a11y|flow)\.spec\.ts/,
      use: {
        ...devices['iPhone 13'],
        browserName: 'webkit',
      },
    },
    {
      name: 'android-chrome',
      testMatch: /.*(responsive|a11y|flow)\.spec\.ts/,
      use: {
        ...devices['Pixel 7'],
        channel: 'chromium',
      },
    },
  ],

  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
