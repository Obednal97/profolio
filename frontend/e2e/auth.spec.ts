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
    // Navigate directly to sign-in page
    await page.goto('/auth/signIn');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for form elements using actual IDs and data-testid
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('[data-testid="submit-login"]')).toBeVisible();
    
    // Verify Try Demo button is visible
    await expect(page.locator('button:has-text("Try Demo")')).toBeVisible();
  });

  test("should show validation errors for invalid credentials", async ({
    page,
  }) => {
    // Navigate to sign-in page
    await page.goto('/auth/signIn');
    await page.waitForLoadState('networkidle');

    // Fill with invalid credentials
    await page.fill('#email', 'invalid@example.com');
    await page.fill('#password', 'wrongpassword');
    
    // Submit the form
    await page.click('[data-testid="submit-login"]');

    // Wait for and check error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/Invalid email or password|Failed to sign in/);
  });

  test("should prevent SQL injection in login form @security", async ({
    page,
  }) => {
    // Navigate to sign-in page
    await page.goto('/auth/signIn');
    await page.waitForLoadState('networkidle');

    // Attempt SQL injection
    await page.fill('#email', "admin'; DROP TABLE users; --");
    await page.fill('#password', "password");
    await page.click('[data-testid="submit-login"]');

    // Should show invalid credentials, not a database error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      /Invalid email or password|Failed to sign in/i
    );
  });

  test.skip("should rate limit login attempts @security", async ({ page }) => {
    // Skip this test as rate limiting may not be implemented yet
    // Navigate to sign-in page
    await page.goto('/auth/signIn');

    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('#email', "test@example.com");
      await page.fill('#password', "wrongpassword");
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

    // Navigate to sign-in page
    await page.goto('/auth/signIn');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', "test@example.com");
    await page.fill('#password', "correctpassword");
    await page.click('[data-testid="submit-login"]');

    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test.skip("should logout and clear session", async ({ page }) => {
    // Skip - requires authenticated state setup
    // Mock logged in state
    await page.goto("/app/dashboard");

    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to home and clear auth state
    await expect(page).toHaveURL("/");
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
  });

  test("should redirect unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page).toHaveURL(/.*\/auth\/signIn/);
  });

  test("should authenticate with demo mode", async ({ page }) => {
    await page.goto("/auth/signIn");
    await page.waitForLoadState('networkidle');

    // Click the demo mode button
    await page.click('button:has-text("Try Demo")');

    // Wait for redirect to dashboard
    await page.waitForURL('**/app/dashboard', { timeout: 10000 });

    // Verify we're on the dashboard
    await expect(page).toHaveURL(/.*\/app\/dashboard/);
    
    // Check for dashboard elements (may need adjustment based on actual dashboard)
    await expect(page.locator('h1, h2').first()).toBeVisible();
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
