/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run the real app in a browser. Today the app keeps its data in the
 * browser (the mock store), so each test gets a fresh browser context and needs no backend.
 * The Supabase backend is off here (no VITE_AUTH_MODE), so e2e never touches a real project.
 *
 * Locally, to use an installed Chrome instead of downloading Playwright's browser:
 *   PW_CHROME_PATH=/usr/bin/google-chrome npm run test:e2e
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PW_CHROME_PATH ? { launchOptions: { executablePath: process.env.PW_CHROME_PATH } } : {}),
      },
    },
  ],
  webServer: {
    command: 'npx vite --port 3100 --host 127.0.0.1',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Always the in-browser demo, even when .env.local turns real auth on: these tests
    // use the demo code and data, and must never write to a real Supabase project.
    // (Variables set here win over .env files.)
    env: { VITE_AUTH_MODE: 'demo', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
  },
});
