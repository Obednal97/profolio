# 🧪 Profolio Test Suite

Comprehensive testing infrastructure for the Profolio portfolio management system.

## 📁 Test Organization

All tests are centrally organized in the `tests/` directory:

```
tests/
├── run-all-tests.sh          # Master test runner
├── README.md                 # This file
├── frontend/                 # Frontend tests
│   ├── vitest.config.ts      # Frontend unit test config
│   ├── unit/                 # Unit tests for React components, hooks, utils
│   └── e2e/                  # End-to-end tests (Playwright)
│       ├── playwright.config.ts
│       ├── auth.spec.ts      # Authentication & security tests
│       ├── performance.spec.ts # Performance & accessibility tests
│       └── portfolio.spec.ts # Portfolio management tests
├── backend/                  # Backend tests
│   ├── vitest.config.ts      # Backend unit test config
│   ├── unit/                 # Unit tests for services, controllers, utils
│   └── integration/          # Integration tests (API, database)
├── installer/                # Installer testing infrastructure
│   ├── run-all-tests.sh      # Installer test runner
│   ├── test-framework.sh     # Professional testing framework
│   ├── unit/                 # Individual module tests
│   ├── integration/          # Cross-module testing
│   ├── system/               # End-to-end workflows
│   ├── security/             # Security validation
│   └── performance/          # Performance benchmarks
└── system/                   # System integration tests
    └── test-installer-modules.sh # Full installer system test
```

## 🚀 Quick Start

### Run All Tests

```bash
# Run comprehensive test suite
./tests/run-all-tests.sh

# Run with coverage
./tests/run-all-tests.sh --coverage
```

### Run Specific Test Categories

```bash
# Frontend tests only
./tests/run-all-tests.sh --frontend-unit
./tests/run-all-tests.sh --frontend-e2e

# Backend tests only
./tests/run-all-tests.sh --backend-unit
./tests/run-all-tests.sh --backend-integration

# Infrastructure tests
./tests/run-all-tests.sh --installer
./tests/run-all-tests.sh --system
```

## 📊 Test Categories

### 🎨 Frontend Tests

#### Unit Tests (Vitest)

- **Location**: `tests/frontend/unit/`
- **Technology**: Vitest + React Testing Library
- **Coverage**: React components, custom hooks, utility functions
- **Run**: `cd frontend && pnpm run test:unit`

#### E2E Tests (Playwright)

- **Location**: `tests/frontend/e2e/`
- **Technology**: Playwright
- **Coverage**: Full user workflows, cross-browser testing
- **Security**: Tests tagged with `@security`
- **Performance**: Lighthouse CI integration
- **Run**: `cd frontend && pnpm run test:e2e`

### ⚙️ Backend Tests

#### Unit Tests (Vitest)

- **Location**: `tests/backend/unit/`
- **Technology**: Vitest + Supertest
- **Coverage**: Services, controllers, utilities, business logic
- **Run**: `cd backend && pnpm run test:unit`

#### Integration Tests (Vitest)

- **Location**: `tests/backend/integration/`
- **Technology**: Vitest with database integration
- **Coverage**: API endpoints, database operations, external services
- **Run**: `cd backend && pnpm run test:integration`

### 🔧 Installer Tests

#### Comprehensive Infrastructure

- **Location**: `tests/installer/`
- **Technology**: Professional bash testing framework
- **Categories**: Unit, Integration, System, Security, Performance
- **Coverage**: 14 modules across utils, core, features, platforms
- **Run**: `cd tests/installer && ./run-all-tests.sh`

### 🌐 System Tests

#### Integration Testing

- **Location**: `tests/system/`
- **Technology**: End-to-end system validation
- **Coverage**: Full system workflows, module interactions
- **Run**: `bash tests/system/test-installer-modules.sh`

## 🛠️ Test Development

### Adding Frontend Unit Tests

```typescript
// tests/frontend/unit/components/Button.test.tsx
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button Component", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });
});
```

### Adding Backend Unit Tests

```typescript
// tests/backend/unit/services/auth.service.test.ts
import { AuthService } from "@/modules/auth/auth.service";

describe("AuthService", () => {
  it("should validate JWT tokens", () => {
    const authService = new AuthService();
    // Test implementation
  });
});
```

### Adding E2E Tests

```typescript
// tests/frontend/e2e/portfolio.spec.ts
import { test, expect } from "@playwright/test";

test("user can create new portfolio", async ({ page }) => {
  await page.goto("/dashboard");
  await page.click('[data-testid="create-portfolio-button"]');
  // Test implementation
});
```

## 📈 Coverage Requirements

### Minimum Coverage Standards

- **Frontend Unit Tests**: 80% code coverage
- **Backend Unit Tests**: 80% code coverage
- **E2E Tests**: Cover all critical user paths
- **Security Tests**: All authentication and authorization flows
- **Performance Tests**: Key user interactions under 2 seconds

### Critical Testing Areas

- 🛡️ **Authentication flows** - Security and bypass testing
- 💰 **Financial calculations** - Accuracy and precision testing
- 🔐 **Security features** - Input validation and injection testing
- 📊 **Critical business logic** - Portfolio operations
- 🔌 **API endpoints** - Integration and security testing

## 🔍 Test Quality Standards

### Required Test Organization

- **Unit Tests**: Colocated with source files when possible
- **Integration Tests**: Separate directory structure
- **E2E Tests**: Feature-based organization
- **Security Tests**: Tagged with `@security`
- **Performance Tests**: Lighthouse CI integration

### Data-TestID Requirements

All interactive components must have `data-testid` attributes:

```tsx
<button data-testid="add-asset-button">Add Asset</button>
```

## 🚨 CI/CD Integration

### Pre-commit Hooks

```bash
# Install development tools
pnpm add --save-dev husky lint-staged

# Test commands run automatically
pnpm run test:all
```

### GitHub Actions

- **Unit Tests**: Run on every push
- **E2E Tests**: Run on PR to main
- **Security Tests**: Run nightly
- **Performance Tests**: Run on release candidates

## 📚 Testing Tools & Technologies

### Frontend

- **Vitest**: Fast unit test runner
- **React Testing Library**: Component testing utilities
- **Playwright**: Cross-browser E2E testing
- **Lighthouse CI**: Performance testing

### Backend

- **Vitest**: Node.js unit test runner
- **Supertest**: HTTP assertion library
- **Prisma**: Database testing utilities

### Infrastructure

- **Bash Testing Framework**: Professional installer testing
- **Security Scanners**: Vulnerability detection
- **Performance Benchmarks**: Load testing with defined thresholds

## 🎯 Best Practices

### Test Naming

- Descriptive test names that explain the expected behavior
- Group related tests with `describe` blocks
- Use `it` or `test` for individual test cases

### Test Structure

- **Arrange**: Set up test data and conditions
- **Act**: Execute the code under test
- **Assert**: Verify the expected outcomes

### Mock Strategy

- Mock external dependencies
- Use real implementations for integration tests
- Avoid mocking business logic

### Data Management

- Use test-specific data that doesn't affect other tests
- Clean up test data after each test
- Use factories or fixtures for complex test data

## 🔧 Troubleshooting

### Common Issues

- **Tests not found**: Check file naming conventions (`.test.` or `.spec.`)
- **Import errors**: Verify path aliases in vitest configs
- **Playwright failures**: Ensure frontend server is running
- **Database tests**: Check test database configuration

### Debug Commands

```bash
# Verbose test output
./tests/run-all-tests.sh --verbose

# Run specific test file
cd frontend && pnpm run test Button.test.tsx

# Debug E2E tests
cd frontend && pnpm run test:e2e:debug
```

## 📞 Getting Help

- **Test Patterns**: Review existing tests for implementation examples
- **Framework Issues**: Check vitest/playwright documentation
- **CI/CD Problems**: Review GitHub Actions workflow files
- **Coverage Questions**: Use coverage reports for guidance

---

**Remember**: High-quality tests are essential for maintaining a reliable and secure portfolio management system. Every feature should have comprehensive test coverage across all applicable test categories.
