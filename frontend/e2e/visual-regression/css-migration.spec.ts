import { test, expect } from "@playwright/test";

test.describe("CSS Migration Visual Regression", () => {
  const pages = [
    "/app/dashboard",
    "/app/assetManager",
    "/app/expenseManager",
    "/app/propertyManager",
    "/app/settings",
    "/design-styles",
  ];

  for (const page of pages) {
    test(`${page} visual comparison`, async ({ page: browserPage }) => {
      await browserPage.goto(page);
      await browserPage.waitForLoadState("networkidle");

      // Take screenshot and compare
      await expect(browserPage).toHaveScreenshot(
        `${page.replace(/\//g, "-")}.png`
      );
    });
  }
});
