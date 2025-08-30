module.exports = {
  ci: {
    collect: {
      staticDistDir: "./.next",
      url: [
        "http://localhost:3000/app/dashboard",
        "http://localhost:3000/app/assetManager",
        "http://localhost:3000/app/expenseManager",
        "http://localhost:3000/app/propertyManager",
        "http://localhost:3000/app/settings",
        "http://localhost:3000/design-styles",
      ],
      numberOfRuns: 3,
    },
    assert: {
      preset: "lighthouse:no-pwa",
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "speed-index": ["warn", { maxNumericValue: 3000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
