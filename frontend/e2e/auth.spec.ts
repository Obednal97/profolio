import { test, expect } from "@playwright/test";

test.describe("Authentication @security", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session storage and auth state
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test("should display login form", async ({ page }) => {
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should show validation errors for invalid credentials", async ({
    page,
  }) => {
    await page.click('[data-testid="login-button"]');

    // Try to submit with empty fields
    await page.click('[data-testid="submit-login"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test("should prevent SQL injection in login form @security", async ({
    page,
  }) => {
    await page.click('[data-testid="login-button"]');

    // Attempt SQL injection
    await page.fill('input[type="email"]', "admin'; DROP TABLE users; --");
    await page.fill('input[type="password"]', "password");
    await page.click('[data-testid="submit-login"]');

    // Should show invalid credentials, not a database error
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      /invalid.*credentials/i
    );
  });

  test("should rate limit login attempts @security", async ({ page }) => {
    await page.click('[data-testid="login-button"]');

    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="email"]', "test@example.com");
      await page.fill('input[type="password"]', "wrongpassword");
      await page.click('[data-testid="submit-login"]');
      await page.waitForTimeout(1000);
    }

    // Should show rate limiting message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      /too many.*attempts/i
    );
  });

  test("should redirect to dashboard after successful login", async ({
    page,
  }) => {
    // Mock successful login response
    await page.route("/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          user: { id: "1", email: "test@example.com" },
        }),
      });
    });

    await page.click('[data-testid="login-button"]');
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "correctpassword");
    await page.click('[data-testid="submit-login"]');

    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test("should logout and clear session", async ({ page }) => {
    // Mock logged in state
    await page.goto("/dashboard");

    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to home and clear auth state
    await expect(page).toHaveURL("/");
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test("should redirect unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page).toHaveURL(/.*\/auth\/signIn/);
  });

  test("should authenticate with demo mode", async ({ page }) => {
    await page.goto("/auth/signIn");

    // Click the demo mode button
    await page.click('button:has-text("Try Demo")');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/app\/dashboard/);

    // Should show the dashboard content
    await expect(
      page.locator('[data-testid="portfolio-summary"]')
    ).toBeVisible();
  });

  test("should only preload after authentication, not on every dashboard visit @performance", async ({
    page,
  }) => {
    // Enable console logging to monitor preloading
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      if (
        msg.text().includes("preload") ||
        msg.text().includes("🚀") ||
        msg.text().includes("🎯") ||
        msg.text().includes("⏭️")
      ) {
        consoleMessages.push(msg.text());
      }
    });

    // Step 1: Sign in with demo mode (should trigger preloading)
    await page.goto("/auth/signIn");
    await page.click('button:has-text("Try Demo")');

    // Wait for dashboard to load and preloading to potentially start
    await expect(page).toHaveURL(/.*\/app\/dashboard/);
    await page.waitForTimeout(3000); // Wait for preloading delay

    // Check that preloading was triggered after authentication
    const authPreloadMessages = consoleMessages.filter(
      (msg) =>
        msg.includes("Starting intelligent preload") || msg.includes("🎯")
    );
    expect(authPreloadMessages.length).toBeGreaterThan(0);

    // Clear console messages for next test
    consoleMessages.length = 0;

    // Step 2: Navigate away and back to dashboard (should NOT trigger preloading)
    await page.goto("/app/assetManager");
    await page.waitForLoadState("networkidle");

    // Navigate back to dashboard
    await page.goto("/app/dashboard");
    await page.waitForTimeout(3000); // Wait for potential preloading delay

    // Check that preloading was NOT triggered on subsequent visit
    const subsequentPreloadMessages = consoleMessages.filter(
      (msg) =>
        msg.includes("Starting intelligent preload") || msg.includes("🎯")
    );
    expect(subsequentPreloadMessages.length).toBe(0);

    // Should see "skipping preload" messages instead
    const skipMessages = consoleMessages.filter(
      (msg) => msg.includes("Skipping preload") || msg.includes("⏭️")
    );
    expect(skipMessages.length).toBeGreaterThan(0);
  });

  test("should track preloading completion in session storage", async ({
    page,
  }) => {
    // Sign in with demo mode
    await page.goto("/auth/signIn");
    await page.click('button:has-text("Try Demo")');

    // Wait for dashboard and preloading
    await expect(page).toHaveURL(/.*\/app\/dashboard/);
    await page.waitForTimeout(3000);

    // Check that session storage tracks preloading completion
    const sessionValue = await page.evaluate(() => {
      return sessionStorage.getItem("preload-completed-app-pages");
    });

    expect(sessionValue).toBe("true");
  });

  test("should support manual preload cache clearing", async ({ page }) => {
    // Enable console logging
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("preload") || msg.text().includes("🧹")) {
        consoleMessages.push(msg.text());
      }
    });

    await page.goto("/auth/signIn");
    await page.click('button:has-text("Try Demo")');
    await expect(page).toHaveURL(/.*\/app\/dashboard/);

    // Clear session cache programmatically
    await page.evaluate(() => {
      sessionStorage.removeItem("preload-completed-app-pages");
    });

    // Navigate away and back to trigger preloading again
    await page.goto("/app/assetManager");
    await page.goto("/app/dashboard?auth-action=signing-in"); // Simulate post-auth
    await page.waitForTimeout(3000);

    // Should trigger preloading again after cache clear
    const preloadMessages = consoleMessages.filter(
      (msg) =>
        msg.includes("Starting intelligent preload") || msg.includes("🎯")
    );
    expect(preloadMessages.length).toBeGreaterThan(0);
  });

  test("should protect authenticated routes @security", async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto("/dashboard");

    // Should redirect to login or show unauthorized
    await expect(page).toHaveURL(/.*\/(login|auth|$)/);
  });
});
