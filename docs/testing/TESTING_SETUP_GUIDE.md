# 🧪 Comprehensive Testing & Validation Setup Guide

**Enterprise-Grade Testing for Profolio**

## 📋 Overview

This guide sets up a complete testing and validation framework that ensures your releases are secure, performant, and reliable. The system includes:

- **E2E Testing** with Playwright
- **Security Validation** with OWASP ZAP, Semgrep
- **Performance Testing** with Lighthouse, k6
- **Unit Testing** with Vitest
- **Pre-Release Validation** workflows
- **Automated Quality Gates**

## 🏗️ **Centralized Test Architecture**

**All tests are centralized in the `/tests/` directory for better organization:**

```bash
tests/
├── frontend/
│   ├── unit/                           # Component & logic tests
│   │   ├── components/
│   │   │   ├── insights/
│   │   │   │   └── FinancialInsights.test.tsx
│   │   │   └── ui/
│   │   │       └── button.test.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.test.ts
│   │   ├── api/auth/
│   │   │   └── profile.test.ts
│   │   └── example.test.tsx
│   ├── e2e/                            # End-to-end tests
│   │   ├── auth.spec.ts                # Authentication flows
│   │   ├── portfolio.spec.ts           # Portfolio management
│   │   ├── performance.spec.ts         # Performance & accessibility
│   │   └── playwright.config.ts        # E2E configuration
│   └── test-setup.ts                   # Centralized test setup
├── backend/
│   ├── unit/                           # API & service tests
│   │   ├── services/
│   │   │   └── market-data.service.test.ts
│   │   └── example.test.ts
│   └── integration/                    # Database & external API tests
│       └── api-endpoints.test.ts
├── installer/                          # Installer testing framework
│   ├── test-framework.sh               # Comprehensive installer tests
│   └── unit/                           # Modular installer unit tests
├── run-tests-simple.sh                 # Complete test runner
└── run-all-tests.sh                    # Advanced test runner with options
```

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Install frontend testing dependencies
cd frontend
pnpm install

# Install backend testing dependencies
cd ../backend
pnpm install

# Install Playwright browsers
cd ../frontend
pnpm dlx playwright install --with-deps
```

### 2. Verify Installation

```bash
# Run complete test suite
./tests/run-tests-simple.sh

# Test frontend setup
cd frontend
pnpm run test:e2e --dry-run

# Test backend setup
cd ../backend
pnpm run test
```

## 🧪 Testing Framework Overview

### **E2E Testing (Playwright)**

- **Location**: `tests/frontend/e2e/`
- **Configuration**: `tests/frontend/e2e/playwright.config.ts`
- **Command**: `pnpm run test:e2e`
- **Coverage**: Authentication, Portfolio Management, Performance, Accessibility

### **Unit Testing (Vitest)**

- **Frontend**: `tests/frontend/unit/`
- **Backend**: `tests/backend/unit/`
- **Integration**: `tests/backend/integration/`
- **Configuration**: Frontend & Backend `vitest.config.ts` files
- **Setup**: `tests/frontend/test-setup.ts`
- **Commands**: `pnpm run test`, `pnpm run test:watch`

### **Security Testing**

- **OWASP ZAP**: Automated vulnerability scanning
- **Semgrep**: Static security analysis
- **Authentication Tests**: Login security validation

### **Performance Testing**

- **Lighthouse**: Core Web Vitals, Performance scores
- **Load Testing**: k6 with realistic user scenarios
- **Bundle Analysis**: Size optimization verification

### **Installer Testing**

- **Location**: `tests/installer/`
- **Coverage**: Modular installer framework testing
- **Features**: 50+ test scenarios for installation reliability

## 📊 Available Test Commands

### Frontend Commands

```bash
# Unit tests
pnpm run test                    # Run all unit tests
pnpm run test:watch             # Watch mode
pnpm run test:ui                # Visual test interface

# E2E tests
pnpm run test:e2e               # All E2E tests
pnpm run test:e2e:ui            # Visual E2E interface
pnpm run test:e2e:debug         # Debug mode
pnpm run test:e2e:security      # Security-focused tests only

# Performance tests
pnpm run test:performance       # Lighthouse audit
pnpm run test:all              # All tests combined
```

### Backend Commands

```bash
# Unit tests
pnpm run test                   # All unit tests
pnpm run test:watch            # Watch mode
pnpm run test:cov              # With coverage
pnpm run test:integration      # Integration tests
```

### Centralized Test Runner

```bash
# Simple test runner (recommended)
./tests/run-tests-simple.sh                    # All available tests
./tests/run-tests-simple.sh --dry-run          # Show what would run

# Advanced test runner
./tests/run-all-tests.sh                       # Complete test suite
./tests/run-all-tests.sh --frontend-only       # Frontend tests only
./tests/run-all-tests.sh --installer-only      # Installer tests only
```

## 🔄 GitHub Workflows

### **E2E Tests & Validation** (`.github/workflows/e2e-tests.yml`)

**Triggers**: PR, Push to main/develop
**Features**:

- Smart test selection based on file changes
- Multi-browser testing (Chrome, Firefox, Safari)
- Security, Performance, Accessibility validation
- Detailed reporting

### **Pre-Release Validation** (`.github/workflows/pre-release-validation.yml`)

**Triggers**: Manual (workflow_dispatch)
**Features**:

- Comprehensive security scanning
- Load testing (100 concurrent users)
- Cross-browser E2E validation
- Database performance testing
- Final go/no-go decision

## 🔒 Security Testing

### **What Gets Tested**

- SQL injection prevention
- XSS protection
- Authentication bypass attempts
- Rate limiting
- CSRF protection
- Dependency vulnerabilities

### **Security Test Example**

```typescript
// tests/frontend/e2e/auth.spec.ts
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
```

## ⚡ Performance Testing

### **Performance Budgets**

- **Homepage**: First Contentful Paint < 2s
- **Dashboard**: Largest Contentful Paint < 2.5s
- **API Responses**: 95th percentile < 500ms
- **Bundle Size**: Main bundle < 500KB gzipped

### **Load Testing Scenarios**

```javascript
// Realistic user journey
export default function () {
  // Homepage visit
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    "Homepage load time < 2s": (r) => r.timings.duration < 2000,
  });

  sleep(1);

  // API calls
  response = http.get(`${BASE_URL}/api/market-data/cached-price/AAPL`);
  check(response, {
    "API response < 500ms": (r) => r.timings.duration < 500,
  });
}
```

## 🎯 Running Tests Locally

### **Development Workflow**

```bash
# 1. Start your development environment
pnpm run dev:backend    # Terminal 1
pnpm run dev:frontend   # Terminal 2

# 2. Run tests in watch mode
pnpm run test:watch     # Terminal 3 (unit tests)
pnpm run test:e2e:ui    # Terminal 4 (E2E with UI)

# 3. Before committing
./tests/run-tests-simple.sh       # Run complete test suite
```

### **Pre-Release Testing**

```bash
# Manual pre-release validation
# 1. Trigger via GitHub Actions UI
# 2. Or run locally:

# Build production
cd backend && pnpm run build && pnpm run start:prod &
cd frontend && pnpm run build && pnpm start &

# Run comprehensive tests
cd frontend && pnpm run test:e2e
cd frontend && pnpm run test:performance
```

## 🔧 Configuration Files

### **Playwright Config** (`tests/frontend/e2e/playwright.config.ts`)

- Multi-browser testing
- Mobile/desktop viewports
- Screenshot on failure
- Video recording
- Automatic retry on failure

### **Vitest Config** (`frontend/vitest.config.ts`, `backend/vitest.config.ts`)

- Coverage thresholds (80%)
- Path aliases
- Mock configurations
- Test environment setup
- **Centralized test discovery** - Points to `/tests/` directory

### **Test Setup** (`tests/frontend/test-setup.ts`)

- Global test mocks
- Environment configuration
- Testing library setup
- Mock implementations for browser APIs

## 📊 Quality Gates

### **Merge Protection Rules**

Tests that MUST pass before merge:

- ✅ All unit tests
- ✅ E2E critical path tests
- ✅ Security vulnerability scan
- ✅ Performance regression check

### **Release Validation Requirements**

Tests that MUST pass before release:

- ✅ Comprehensive security scan
- ✅ Cross-browser E2E tests
- ✅ Load testing (100 users)
- ✅ Performance audit (Lighthouse)
- ✅ Database performance validation
- ✅ Installer testing framework validation

## 🧩 Test Architecture Benefits

### **Centralized Organization**

- **Single Source of Truth**: All tests in `/tests/` directory
- **Clear Separation**: Frontend/Backend/E2E/Installer tests organized
- **Easy Discovery**: Simple structure for finding specific tests
- **Consistent Setup**: Shared configuration and utilities

### **Professional Structure**

- **Enterprise Standards**: Follows enterprise testing best practices
- **Scalable Architecture**: Easy to add new test categories
- **Maintainable**: Clear ownership and responsibility
- **Comprehensive Coverage**: Unit, Integration, E2E, Security, Performance

## 🚨 Troubleshooting

### **Common Issues**

#### **Playwright Browser Installation**

```bash
# If browsers fail to install
cd frontend
pnpm dlx playwright install --with-deps chromium firefox webkit
```

#### **Test Database Issues**

```bash
# Reset test database
cd backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/profolio_test pnpm prisma db push --force-reset
```

#### **Port Conflicts**

```bash
# Kill processes on test ports
lsof -ti:3000,3001 | xargs kill -9
```

#### **Centralized Test Issues**

```bash
# Verify test structure
find tests -name "*.test.*" -o -name "*.spec.*" | head -10

# Check vitest configuration
cd frontend && pnpm run test --reporter=verbose
cd backend && pnpm run test --reporter=verbose
```

### **Performance Issues**

- Ensure dev server is running for E2E tests
- Check that test database is properly seeded
- Verify network connectivity for external API mocks

## 📈 Advanced Usage

### **Custom Test Scenarios**

Create custom E2E tests for your specific use cases:

```typescript
// tests/frontend/e2e/custom-workflow.spec.ts
test("custom portfolio workflow", async ({ page }) => {
  // Your specific business logic tests
});
```

### **Performance Benchmarking**

```bash
# Run performance tests with custom thresholds
cd frontend
PERFORMANCE_BUDGET=strict pnpm run test:performance
```

### **Security Testing Extensions**

```bash
# Run additional security tools
cd frontend
pnpm dlx playwright test --grep="@security"
```

## 🎯 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Realistic Data**: Use production-like test data
3. **Security First**: Include security tests for all user inputs
4. **Performance Monitoring**: Set and monitor performance budgets
5. **Regular Updates**: Keep testing dependencies updated
6. **Centralized Organization**: Keep all tests in `/tests/` directory
7. **Consistent Naming**: Use clear, descriptive test names
8. **Comprehensive Coverage**: Test all critical user paths

## 📞 Support

- **Documentation**: Check `.cursor/rules/testing.mdc`
- **Examples**: See `tests/frontend/e2e/` for test examples
- **Performance**: Monitor with Lighthouse CI
- **Security**: Review OWASP ZAP reports
- **Test Runner**: Use `./tests/run-tests-simple.sh` for complete testing

## 🎉 **Test Framework Achievements**

### **📊 Current Status**

- **52 total test cases** across 7 categories
- **Centralized architecture** with `/tests/` directory
- **90% installer code reduction** through modular testing
- **Enterprise-grade coverage** including security and performance
- **CI/CD integration** with quality gates

### **🚀 Recent Improvements**

- ✅ **Complete test centralization** - All tests moved to `/tests/`
- ✅ **Modular installer testing** - Comprehensive framework validation
- ✅ **Unified test runner** - Simple and advanced options available
- ✅ **Professional structure** - Follows enterprise testing standards
- ✅ **Quality assurance** - Security, performance, and reliability testing

---

**🚀 You're now equipped with enterprise-grade testing that ensures every release is secure, performant, and reliable!**
