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

  /* Reduced browser set for faster CI runs */
  projects: [
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        headless: true,
      },
    },
    {
      name: "firefox",
      use: { 
        ...devices["Desktop Firefox"],
        headless: true,
      },
    },
    /* Mobile Chrome for responsive testing */
    {
      name: "Mobile Chrome",
      use: { 
        ...devices["Pixel 5"],
        headless: true,
      },
    },
  ],

  /* Faster timeouts for CI */
  timeout: 30 * 1000,
  
  /* No retries in CI to fail fast */
  retries: 0,
  
  /* Use single worker for stability */
  workers: 1,
});