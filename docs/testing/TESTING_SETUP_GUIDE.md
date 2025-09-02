# 🧪 Testing & Validation Guide

**Testing Framework for Profolio**

## 📋 Overview

This guide covers the testing framework for Profolio, including E2E tests, security validation, and performance testing.

## 🏗️ Test Structure

```bash
frontend/
├── e2e/                                # End-to-end tests
│   ├── auth.spec.ts                    # Authentication flows
│   ├── portfolio.spec.ts               # Portfolio management
│   ├── performance.spec.ts             # Performance tests
│   └── visual-regression/              # Visual regression tests
│       └── css-migration.spec.ts
├── playwright.config.ts                # Playwright configuration
└── playwright-report/                  # Test reports
```

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
pnpm install

# Install Playwright browsers
pnpm dlx playwright install --with-deps
```

### 2. Verify Installation

```bash
# Run E2E tests
cd frontend
pnpm run test:e2e

# Run with UI
pnpm run test:e2e:ui

# Debug mode
pnpm run test:e2e:debug
```

## 🧪 Available Test Commands

### Frontend Testing

```bash
# E2E tests
pnpm run test                    # Run Playwright tests
pnpm run test:e2e                # Same as above
pnpm run test:e2e:ui             # Visual test interface
pnpm run test:e2e:debug          # Debug mode
pnpm run test:e2e:security       # Security-focused tests (@security tag)

# Performance tests
pnpm run test:performance        # Lighthouse audit
pnpm run test:security           # Security audit + E2E security tests
pnpm run test:all               # All tests combined
```

### Backend Testing

```bash
cd backend
pnpm run type-check             # TypeScript validation
pnpm run lint                   # ESLint checks
```

## 🔒 Security Testing

### What Gets Tested

- SQL injection prevention
- XSS protection
- Authentication security
- Rate limiting
- Input validation

### Security Test Example

```typescript
test("should prevent SQL injection @security", async ({ page }) => {
  await page.goto("/auth/signIn");
  
  // Attempt SQL injection
  await page.fill('input[type="email"]', "admin'; DROP TABLE users; --");
  await page.fill('input[type="password"]', "password");
  await page.click('[data-testid="submit-login"]');
  
  // Should show invalid credentials, not database error
  await expect(page.locator('[data-testid="error-message"]')).toContainText(
    /invalid.*credentials/i
  );
});
```

## ⚡ Performance Testing

### Performance Budgets

- **First Contentful Paint**: < 2s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

### Running Performance Tests

```bash
# Ensure app is running
pnpm run dev

# Run Lighthouse
pnpm run test:performance
```

## 🔄 CI/CD Integration

### GitHub Actions Workflows

Tests run automatically on:
- Pull requests to main/develop
- Pushes to main branch
- Manual workflow dispatch

### CI Test Suites

1. **Frontend Tests** (`.github/workflows/ci.yml`)
   - TypeScript compilation
   - ESLint validation
   - Build verification

2. **Security Scanning**
   - Dependency audit
   - CodeQL analysis
   - Trivy vulnerability scanning

## 🎯 Running Tests Locally

### Development Workflow

```bash
# Terminal 1: Run backend
cd backend
pnpm run dev

# Terminal 2: Run frontend
cd frontend
pnpm run dev

# Terminal 3: Run tests
cd frontend
pnpm run test:e2e:ui
```

### Before Committing

```bash
# Run all checks
cd frontend
pnpm run type-check
pnpm run lint
pnpm run test:e2e

cd ../backend
pnpm run type-check
pnpm run lint
```

## 📊 Test Configuration

### Playwright Config (`frontend/playwright.config.ts`)

- **Browsers**: Chromium, Firefox, WebKit
- **Viewports**: Desktop and mobile
- **Screenshots**: On failure
- **Retry**: 2 times on failure
- **Parallel**: 1 worker (configurable)

## 🚨 Troubleshooting

### Common Issues

#### Playwright Browser Installation

```bash
cd frontend
pnpm dlx playwright install --with-deps chromium firefox webkit
```

#### Port Conflicts

```bash
# Kill processes on test ports
lsof -ti:3000,3001 | xargs kill -9
```

#### Test Timeouts

Increase timeout in playwright.config.ts:
```typescript
export default defineConfig({
  timeout: 60000, // 60 seconds
  // ...
});
```

## 📈 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data-testid**: Use data-testid attributes for reliable element selection
3. **Security First**: Include security tests for all user inputs
4. **Performance Monitoring**: Regular Lighthouse audits
5. **Visual Regression**: Test UI changes with screenshots

## 📞 Support

- **Test Examples**: See `frontend/e2e/` for examples
- **Playwright Docs**: https://playwright.dev
- **Lighthouse Docs**: https://developers.google.com/web/tools/lighthouse

---

**Note**: This testing framework ensures quality, security, and performance for every release.