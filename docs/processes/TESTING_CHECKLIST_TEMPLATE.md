# 🧪 Testing Checklist Template

**Use this checklist for every feature, bug fix, or significant code change**

---

## 📋 **Feature/Change Information**

- **Feature Name**: ****\*\*\*\*****\_****\*\*\*\*****
- **Type**: [ ] New Feature [ ] Bug Fix [ ] Enhancement [ ] Refactor
- **Files Modified**: ****\*\*\*\*****\_****\*\*\*\*****
- **Date**: **\*\***\_\_\_**\*\***
- **Developer**: **\*\***\_\_\_**\*\***

---

## 🔍 **Testing Requirements Analysis**

### **🚨 Mandatory Testing Categories** _(Check all that apply)_

- [ ] **🛡️ Authentication Changes** - Any auth flow, session management, user verification
- [ ] **💰 Financial Calculations** - Asset values, returns, portfolio calculations
- [ ] **🔐 Security Features** - Input validation, authorization, data access controls
- [ ] **📊 Critical Business Logic** - Portfolio management, asset operations, reporting
- [ ] **🔌 API Endpoints** - New REST endpoints, external integrations
- [ ] **💳 Payment/Transaction Logic** - Any financial transaction handling
- [ ] **🎨 User Interface Changes** - New components, forms, user interactions

---

## 🎯 **E2E Testing Requirements**

### **Data-TestID Attributes Added** _(MANDATORY for UI changes)_

- [ ] **All clickable elements** have data-testid attributes
- [ ] **All form inputs** have data-testid attributes
- [ ] **All navigation elements** have data-testid attributes
- [ ] **Descriptive naming** used (e.g., `data-testid="add-asset-button"`)

### **E2E Test Cases Added**

#### **Authentication Tests** (`frontend/e2e/auth.spec.ts`)

- [ ] **Login flow testing** - Valid/invalid credentials
- [ ] **Security testing** - SQL injection, XSS prevention
- [ ] **Rate limiting** - Multiple failed attempts
- [ ] **Session management** - Logout, session timeout
- [ ] **Route protection** - Unauthorized access prevention

#### **Portfolio Management Tests** (`frontend/e2e/portfolio.spec.ts`)

- [ ] **Asset CRUD operations** - Create, read, update, delete
- [ ] **Input validation** - Invalid data handling
- [ ] **Calculation accuracy** - Portfolio value calculations
- [ ] **Data persistence** - Changes saved correctly
- [ ] **Error handling** - Network failures, API errors

#### **Performance Tests** (`frontend/e2e/performance.spec.ts`)

- [ ] **Page load times** - Within performance budgets
- [ ] **API response times** - < 500ms for standard operations
- [ ] **Accessibility** - WCAG 2.1 AA compliance
- [ ] **Mobile performance** - Touch interactions, responsive design

---

## 🔒 **Security Testing**

### **Security Test Cases Added**

- [ ] **Input validation** - All user inputs tested for injection attacks
- [ ] **XSS prevention** - Script injection attempts blocked
- [ ] **SQL injection** - Database queries protected
- [ ] **Authentication bypass** - Unauthorized access attempts blocked
- [ ] **CSRF protection** - Cross-site request forgery prevention
- [ ] **Rate limiting** - API abuse prevention

### **Security Test Examples**

```typescript
// Input validation test
test("should prevent XSS in asset name", async ({ page }) => {
  const xssPayload = '<script>alert("XSS")</script>';
  await page.fill('[data-testid="asset-name-input"]', xssPayload);
  // Verify script is not executed
});

// SQL injection test
test("should prevent SQL injection in search", async ({ page }) => {
  const sqlPayload = "'; DROP TABLE assets; --";
  await page.fill('[data-testid="search-input"]', sqlPayload);
  // Verify database is protected
});
```

---

## 🧪 **Unit Testing**

### **Frontend Unit Tests Added**

- [ ] **Component rendering** - Components display correctly
- [ ] **User interactions** - Click handlers, form submissions
- [ ] **State management** - State updates work correctly
- [ ] **Error boundaries** - Error handling works properly
- [ ] **Utility functions** - Pure functions tested thoroughly

### **Backend Unit Tests Added**

- [ ] **Service methods** - Business logic tested
- [ ] **API endpoints** - Request/response handling
- [ ] **Database operations** - CRUD operations tested
- [ ] **Validation logic** - Input validation tested
- [ ] **Error handling** - Exception scenarios covered

### **Unit Test Examples**

```typescript
// Frontend component test
describe("AssetCard", () => {
  it("displays asset information correctly", () => {
    const asset = { name: "Apple Stock", symbol: "AAPL", value: 1500 };
    render(<AssetCard asset={asset} />);
    expect(screen.getByText("Apple Stock")).toBeInTheDocument();
  });
});

// Backend service test
describe("PortfolioService", () => {
  it("should calculate portfolio return correctly", () => {
    const result = service.calculateReturn(11000, 10000);
    expect(result.percentReturn).toBeCloseTo(0.1);
  });
});
```

---

## ⚡ **Performance Testing**

### **Performance Requirements Met**

- [ ] **Page load time** < 2 seconds (3G connection)
- [ ] **Time to interactive** < 3 seconds
- [ ] **Bundle size impact** < 10% increase
- [ ] **API response time** < 500ms (95th percentile)
- [ ] **Memory usage** - No memory leaks detected
- [ ] **Lighthouse score** - No significant regression (> 10%)

### **Performance Test Commands Used**

```bash
# Lighthouse audit
pnpm run test:performance

# Bundle size analysis
pnpm run build:analyze

# Load testing
pnpm run test:load
```

---

## 🔄 **GitHub Workflows Integration**

### **CI/CD Pipeline Tests**

- [ ] **All unit tests pass** locally
- [ ] **E2E tests pass** locally
- [ ] **Security scans pass** - No new vulnerabilities
- [ ] **Performance tests pass** - No regressions
- [ ] **Build succeeds** without errors
- [ ] **Type checking passes** without errors

### **Quality Gates Met**

- [ ] **Code coverage** ≥ 80% for new code
- [ ] **Security coverage** - All user inputs tested
- [ ] **Performance budgets** - No budget exceeded
- [ ] **Accessibility compliance** - WCAG 2.1 AA met

---

## 📊 **Test Coverage Analysis**

### **Coverage Metrics**

- **Overall Coverage**: \_\_\_\_% (Target: ≥ 80%)
- **Critical Path Coverage**: \_\_\_\_% (Target: 100%)
- **Security Test Coverage**: \_\_\_\_% (Target: 100% for user inputs)
- **Financial Logic Coverage**: \_\_\_\_% (Target: 100%)

### **Coverage Report Commands**

```bash
# Frontend coverage
cd frontend && pnpm run test:coverage

# Backend coverage
cd backend && pnpm run test:coverage

# E2E coverage
cd frontend && pnpm run test:e2e:coverage
```

---

## 🚨 **Critical Validation**

### **Runtime Testing Completed** _(MANDATORY)_

- [ ] **Browser testing** - App actually works in browser
- [ ] **DevTools console** - No errors or warnings
- [ ] **Network monitoring** - Expected request patterns
- [ ] **Performance profiling** - No infinite loops or blocking operations
- [ ] **Memory leak detection** - No growing memory usage
- [ ] **Mobile testing** - Responsive design and touch interactions

### **Security Validation**

- [ ] **Authentication flows** tested manually
- [ ] **Authorization checks** verified
- [ ] **Input sanitization** tested with malicious inputs
- [ ] **Error messages** don't reveal sensitive information
- [ ] **HTTPS enforcement** verified for external calls

---

## ✅ **Final Checklist**

### **Pre-Commit Requirements**

- [ ] All tests pass locally
- [ ] No console.log statements in production code
- [ ] TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Security tests pass
- [ ] Performance budgets met

### **Documentation Updated**

- [ ] **Test documentation** updated if new patterns added
- [ ] **API documentation** updated for new endpoints
- [ ] **README** updated if setup changed
- [ ] **CHANGELOG** updated for significant changes

### **Deployment Readiness**

- [ ] **Feature flags** implemented for risky changes
- [ ] **Rollback plan** documented
- [ ] **Monitoring** configured for new features
- [ ] **Error tracking** set up for new code paths

---

## 📝 **Notes & Additional Testing**

### **Special Considerations**

```
Add any special testing considerations, edge cases, or manual testing steps required:

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

### **Follow-up Testing Required**

```
List any additional testing that should be done post-deployment:

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## 🎯 **Approval & Sign-off**

### **Testing Complete**

- [ ] **All mandatory tests** completed
- [ ] **Security validation** passed
- [ ] **Performance validation** passed
- [ ] **Quality gates** met
- [ ] **Ready for code review**
- [ ] **Ready for deployment**

**Tested by**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\***\_**\*\***  
**Reviewed by**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\***\_**\*\***

---

## 🔗 **Related Documentation**

- **Testing Setup Guide**: `docs/testing/TESTING_SETUP_GUIDE.md`
- **Testing Rules**: `.cursor/rules/testing.mdc`
- **Code Quality Checklist**: `docs/processes/CODE_QUALITY_CHECKLIST.md`
- **Security Guidelines**: `.cursor/rules/code-quality.mdc`

---

**🚨 REMEMBER**: Testing is not optional. Every change that affects user functionality, security, or financial calculations MUST have appropriate tests.
