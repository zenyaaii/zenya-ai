import { defineConfig, devices } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import path from 'path'

// Load env the same way Next does: .env.local first, then let .env.test
// OVERRIDE it (so Stripe test keys replace the live keys for the test run).
loadEnv({ path: path.resolve(__dirname, '.env.local') })
loadEnv({ path: path.resolve(__dirname, '.env.test'), override: true })

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  // Money/registrar flows must never race each other.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // The app is Arabic/RTL — pin locale so assertions are deterministic.
    locale: 'ar',
    // Generous: on a cold `next dev` server each route compiles on first hit,
    // which can take 15-25s. Prevents first-request flakes.
    actionTimeout: 30_000,
  },

  projects: [
    // 1. Create + sign in a throwaway test user, save its session.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // 2. Public surface — no auth needed.
    {
      name: 'public',
      testMatch: /public\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Pure logic checks — no browser, no server, no auth.
    { name: 'entitlements', testMatch: /entitlements\/.*\.spec\.ts/ },
    { name: 'unit', testMatch: /unit\/.*\.spec\.ts/ },

    // 3. Authenticated flows — reuse the saved session.
    {
      name: 'authed',
      testMatch: /authed\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
    },
  ],

  // Reuse the dev server the developer already has running on :3000.
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
