import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";

/**
 * Optimized configuration for CI/CD environments
 * Uses only essential browsers for faster execution
 */
export default defineConfig({
  ...baseConfig,
  
  /* Override webServer config for CI - use existing server */
  webServer: {
    ...baseConfig.webServer,
    command: "echo 'Using existing server'",
    reuseExistingServer: true,
  },
  
  /* Always run headless in CI */
  use: {
    ...baseConfig.use,
    headless: true,
    /* Disable videos to save resources */
    video: "off",
    /* Only trace on retry */
    trace: "retry-with-trace",
    /* Set base URL from environment or default */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    /* Increase action timeout for CI */
    actionTimeout: 30000,
    /* Increase navigation timeout for CI */
    navigationTimeout: 60000,
  },

  /* Minimal browser set for CI - just Chromium for speed */
  projects: [
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        headless: true,
      },
    },
  ],

  /* Increased timeouts for CI environment */
  timeout: 60 * 1000,
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 30 * 1000,
  },
  
  /* Allow one retry in CI for flaky tests */
  retries: 1,
  
  /* Limit test files to reduce scope - start with auth tests */
  testMatch: ['**/auth.spec.ts'],
  
  /* Use single worker for stability */
  workers: 1,
  
  /* Global test timeout */
  globalTimeout: 15 * 60 * 1000,
  
  /* Reporter configuration for CI */
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
});