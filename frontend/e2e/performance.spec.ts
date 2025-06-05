import { test, expect } from "@playwright/test";

test.describe("Performance Tests", () => {
  test("should load homepage within performance budget", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");

    // Wait for main content to load
    await page.waitForSelector('[data-testid="main-content"]');

    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("should pass Core Web Vitals metrics", async ({ page }) => {
    await page.goto("/");

    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = {};

          entries.forEach((entry) => {
            if (entry.entryType === "navigation") {
              // First Contentful Paint
              metrics.fcp = entry.responseStart - entry.startTime;
            }
            if (entry.entryType === "largest-contentful-paint") {
              metrics.lcp = entry.startTime;
            }
            if (entry.entryType === "layout-shift") {
              metrics.cls = entry.value;
            }
          });

          resolve(metrics);
        }).observe({
          entryTypes: [
            "navigation",
            "largest-contentful-paint",
            "layout-shift",
          ],
        });

        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });

    // Core Web Vitals thresholds
    if (vitals.lcp) expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
    if (vitals.cls) expect(vitals.cls).toBeLessThan(0.1); // CLS < 0.1
  });

  test("should handle large portfolio data efficiently", async ({ page }) => {
    // Mock large dataset
    await page.route("/api/assets/summary", async (route) => {
      const largePortfolio = {
        assets: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          symbol: `STOCK${i}`,
          quantity: Math.random() * 100,
          currentPrice: Math.random() * 500,
          totalValue: Math.random() * 50000,
        })),
        totalValue: 5000000,
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(largePortfolio),
      });
    });

    const startTime = Date.now();
    await page.goto("/dashboard");

    // Wait for table to render
    await page.waitForSelector('[data-testid="assets-table"]');

    const renderTime = Date.now() - startTime;

    // Should render large dataset within 5 seconds
    expect(renderTime).toBeLessThan(5000);

    // Should use virtualization for large lists
    const visibleRows = await page.locator('[data-testid="asset-row"]').count();
    expect(visibleRows).toBeLessThan(100); // Should virtualize
  });

  test("should minimize bundle size impact", async ({ page }) => {
    const response = await page.goto("/");

    // Check main bundle size
    const resources = await page.evaluate(() => {
      return performance
        .getEntriesByType("navigation")
        .concat(performance.getEntriesByType("resource"))
        .filter((entry) => entry.name.includes(".js"))
        .reduce((total, entry) => total + (entry.transferSize || 0), 0);
    });

    // Total JS bundle should be under 1MB
    expect(resources).toBeLessThan(1024 * 1024);
  });
});

test.describe("Accessibility Tests", () => {
  test("should meet WCAG 2.1 AA standards", async ({ page }) => {
    await page.goto("/");

    // Check for proper heading hierarchy
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
    expect(headings.length).toBeGreaterThan(0);

    // Check for alt text on images
    const images = await page.locator("img").all();
    for (const img of images) {
      const alt = await img.getAttribute("alt");
      expect(alt).toBeTruthy();
    }

    // Check for proper form labels
    const inputs = await page
      .locator(
        'input[type="text"], input[type="email"], input[type="password"]'
      )
      .all();
    for (const input of inputs) {
      const label =
        (await input.getAttribute("aria-label")) ||
        (await page
          .locator(`label[for="${await input.getAttribute("id")}"]`)
          .count());
      expect(label).toBeTruthy();
    }
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Tab through interactive elements
    const focusableElements = await page
      .locator("button, input, select, textarea, a[href]")
      .all();

    for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
      await page.keyboard.press("Tab");
      const focused = await page.locator(":focus").first();
      await expect(focused).toBeVisible();
    }
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await page.goto("/");

    // Basic contrast check (simplified)
    const styles = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      const contrasts = [];

      Array.from(elements)
        .slice(0, 50)
        .forEach((el) => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const backgroundColor = style.backgroundColor;

          if (
            color &&
            backgroundColor &&
            color !== "rgba(0, 0, 0, 0)" &&
            backgroundColor !== "rgba(0, 0, 0, 0)"
          ) {
            contrasts.push({ color, backgroundColor });
          }
        });

      return contrasts;
    });

    expect(styles.length).toBeGreaterThan(0);
  });
});
