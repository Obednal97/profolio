import { test, expect } from "@playwright/test";

test.describe("Authentication @security", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto("/");
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

  test("should protect authenticated routes @security", async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto("/dashboard");

    // Should redirect to login or show unauthorized
    await expect(page).toHaveURL(/.*\/(login|auth|$)/);
  });
});
