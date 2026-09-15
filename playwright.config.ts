import { defineConfig } from '@playwright/test';

const baseURL = process.env.WEBMCP_E2E_BASE_URL || 'http://127.0.0.1:3010';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL,
    browserName: 'chromium',
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: process.env.WEBMCP_E2E_BASE_URL
    ? undefined
    : {
        command: 'next dev --port 3010',
        url: `${baseURL}/`,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
