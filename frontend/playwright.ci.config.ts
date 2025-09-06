import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";

/**
 * Optimized configuration for CI/CD environments
 * Uses only essential browsers for faster execution
 */
export default defineConfig({
  ...baseConfig,
  
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

  /* Reasonable timeouts for CI */
  timeout: 30 * 1000,
  
  /* Allow one retry in CI for flaky tests */
  retries: 1,
  
  /* Limit test files to reduce scope - start with auth tests */
  testMatch: ['**/auth.spec.ts'],
  
  /* Use single worker for stability */
  workers: 1,
  
  /* Global test timeout */
  globalTimeout: 10 * 60 * 1000,
  
  /* Reporter configuration for CI */
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
});