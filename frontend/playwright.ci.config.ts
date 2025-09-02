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

  /* Faster timeouts for CI */
  timeout: 10 * 1000,
  
  /* No retries in CI to fail fast */
  retries: 0,
  
  /* Limit test files to reduce scope */
  testMatch: ['**/auth.spec.ts'],
  
  /* Use single worker for stability */
  workers: 1,
});