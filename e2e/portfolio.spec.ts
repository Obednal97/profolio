import { test, expect } from "@playwright/test";

test.describe("Portfolio Management", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto("/");
    // Simulate logged in state
    await page.evaluate(() => {
      localStorage.setItem("authToken", "mock-token");
    });
    await page.goto("/dashboard");
  });

  test("should display portfolio dashboard", async ({ page }) => {
    await expect(
      page.locator('[data-testid="portfolio-summary"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="total-value"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="asset-allocation"]')
    ).toBeVisible();
  });

  test("should add new asset", async ({ page }) => {
    await page.click('[data-testid="add-asset-button"]');

    // Fill asset form
    await page.fill('[data-testid="asset-symbol"]', "AAPL");
    await page.fill('[data-testid="asset-quantity"]', "10");
    await page.fill('[data-testid="asset-price"]', "150.00");

    await page.click('[data-testid="save-asset"]');

    // Verify asset appears in portfolio
    await expect(page.locator('[data-testid="asset-AAPL"]')).toBeVisible();
    await expect(page.locator('[data-testid="asset-AAPL"]')).toContainText(
      "AAPL"
    );
  });

  test("should validate asset input", async ({ page }) => {
    await page.click('[data-testid="add-asset-button"]');

    // Try to save with invalid data
    await page.fill('[data-testid="asset-symbol"]', "");
    await page.fill('[data-testid="asset-quantity"]', "-5");
    await page.click('[data-testid="save-asset"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
  });

  test("should edit existing asset", async ({ page }) => {
    // Assume AAPL asset exists
    await page.click('[data-testid="asset-AAPL-edit"]');

    await page.fill('[data-testid="asset-quantity"]', "15");
    await page.click('[data-testid="save-asset"]');

    // Verify updated quantity
    await expect(
      page.locator('[data-testid="asset-AAPL-quantity"]')
    ).toContainText("15");
  });

  test("should delete asset", async ({ page }) => {
    await page.click('[data-testid="asset-AAPL-delete"]');
    await page.click('[data-testid="confirm-delete"]');

    await expect(page.locator('[data-testid="asset-AAPL"]')).not.toBeVisible();
  });

  test("should display performance metrics", async ({ page }) => {
    await expect(page.locator('[data-testid="total-return"]')).toBeVisible();
    await expect(page.locator('[data-testid="daily-change"]')).toBeVisible();
    await expect(page.locator('[data-testid="portfolio-chart"]')).toBeVisible();
  });

  test("should handle real-time price updates", async ({ page }) => {
    // Mock WebSocket or API response for price updates
    await page.route("/api/market-data/cached-price/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          price: 155.5,
          change: 2.5,
          changePercent: 1.64,
        }),
      });
    });

    await page.reload();

    // Verify price update
    await expect(
      page.locator('[data-testid="asset-AAPL-price"]')
    ).toContainText("155.50");
  });
});
