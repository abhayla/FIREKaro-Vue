import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration for FIREKaro E2E Tests
 * - Uses Chrome browser in headed mode for visual debugging
 * - Screenshots on failure for verification
 * - Configured for Vite dev server on port 5173
 * - Global setup handles authentication
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],

  // Global setup for authentication
  globalSetup: './e2e/global-setup.ts',

  // Global timeout settings
  timeout: 60000,
  expect: {
    timeout: 15000,
  },

  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:5173',

    // Use Chrome browser
    browserName: 'chromium',
    channel: 'chrome',

    // Run in headed mode for visual debugging
    headless: false,

    // Full screen viewport (null uses maximized window size)
    viewport: null,

    // Launch browser maximized
    launchOptions: {
      args: ['--start-maximized'],
    },

    // Capture evidence on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Action settings (increased for reliability)
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Use authenticated storage state
    storageState: 'e2e/.auth/user.json',
  },

  // Projects configuration
  projects: [
    {
      name: 'chrome',
      use: {
        // Don't use devices spread to avoid deviceScaleFactor conflict with viewport: null
        channel: 'chrome',
        viewport: null, // Full screen - uses maximized window size
      },
    },
  ],

  // Auto-start dev server before tests
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 120000,
  },

  // Output directories
  outputDir: 'e2e/test-results',
})
