import { defineConfig, devices } from '@playwright/test'
import { PLAYWRIGHT_AUTH_SECRET } from './e2e/global-setup'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  globalSetup: './e2e/global-setup',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    // Always start a fresh server so AUTH_SECRET and PLAYWRIGHT_MOCK env vars apply.
    // Set PLAYWRIGHT_REUSE_SERVER=1 locally to skip this when iterating on tests.
    reuseExistingServer: !!process.env.PLAYWRIGHT_REUSE_SERVER,
    timeout: 120000,
    env: {
      AUTH_SECRET: PLAYWRIGHT_AUTH_SECRET,
      AUTH_URL: 'http://localhost:3000',
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
      NEXT_PUBLIC_CLUB_NAME: 'Test Cricket Club',
      NEXT_PUBLIC_CLUB_ID: 'test-club-id',
      NEXT_PUBLIC_API_URL: 'http://localhost:3000/api/mock',
      PLAYWRIGHT_MOCK: 'true',
    },
  },
})
