# Code Quality Checklist
**Profolio Enterprise-Grade Development Standards**

**Version**: 3.0  
**Last Updated**: June 2025  
**Status**: ✅ Enhanced for Production, Security & Performance

---

## 📋 **Overview**

This checklist ensures all code changes maintain our enterprise-grade standards for security, performance, and maintainability. Use this document for **every file change, addition, or modification** to maintain consistency across the codebase.

**🚨 CRITICAL**: Special attention required for AI-generated code to prevent security vulnerabilities and deployment issues.

---

## 🛡️ **NEVER BUILD THESE YOURSELF** *(CRITICAL SECURITY PRINCIPLE)*

### 🚨 **Authentication Systems** *(USE EXISTING SOLUTIONS ONLY)*
- [ ] **NEVER build custom authentication** - Use proven solutions like Auth0, Supabase Auth, NextAuth.js, or Clerk
- [ ] **NEVER build custom password hashing** - Use bcrypt, scrypt, or Argon2 libraries only
- [ ] **NEVER build custom session management** - Use established session stores and libraries
- [ ] **NEVER build custom JWT handling** - Use well-maintained JWT libraries with proper validation
- [ ] **NEVER build custom OAuth flows** - Use official OAuth libraries and providers

**Why**: Authentication is extremely complex with countless edge cases. Even security experts get it wrong. Use battle-tested solutions.

### 🔐 **Encryption & Cryptography** *(USE EXISTING SOLUTIONS ONLY)*
- [ ] **NEVER build custom encryption algorithms** - Use AES-256-GCM, ChaCha20-Poly1305 via crypto libraries
- [ ] **NEVER build custom key derivation** - Use PBKDF2, scrypt, or Argon2 via established libraries
- [ ] **NEVER build custom random number generation** - Use crypto.randomBytes() or equivalent secure sources
- [ ] **NEVER build custom certificate handling** - Use TLS libraries and certificate authorities
- [ ] **NEVER build custom hashing functions** - Use SHA-256, SHA-3, or Blake2 via crypto libraries

**Why**: Cryptography is mathematically complex with subtle implementation details. Mistakes lead to complete security failures.

### 🔑 **Always Use These Instead**
- **Node.js**: Use built-in `crypto` module for all cryptographic operations
- **Authentication**: NextAuth.js, Auth0, Supabase Auth, Firebase Auth, Clerk
- **Encryption**: Use `crypto.createCipherGCM()`, never `crypto.createCipher()`
- **Hashing**: Use `bcrypt`, `scrypt`, or `argon2` libraries for passwords
- **Random**: Use `crypto.randomBytes()`, never `Math.random()` for security

---

## 🔧 **General Requirements** 
*Apply to ALL file changes*

### ✅ **Security Fundamentals** *(ENHANCED)*
- [ ] No hardcoded secrets, API keys, passwords, or tokens (scan with `git grep -E "(password|secret|key|token).*=.*['\"][^'\"]{8,}"`)
- [ ] All user inputs properly validated and sanitized (no direct database queries with user input)
- [ ] Authentication/authorization checks in place where needed
- [ ] No `eval()` or `dangerouslySetInnerHTML` without proper sanitization
- [ ] HTTPS-only external API calls (no `http://` in production code)
- [ ] Proper error handling that doesn't expose sensitive information (no stack traces to users)
- [ ] SQL injection prevention (parameterized queries only, no string concatenation)
- [ ] XSS prevention (proper input sanitization, Content Security Policy headers)
- [ ] **NEW**: No sensitive data logged to console (production console.log statements removed)
- [ ] **NEW**: All environment variables properly configured (no undefined checks missing)

### ✅ **Git & Deployment Safety** *(ENHANCED)*
- [ ] No environment-specific files tracked (`.env*`, `package-lock.json`, `node_modules`, build artifacts)
- [ ] `.gitignore` properly configured for all environment-specific files
- [ ] No temporary files, debug files, or development artifacts committed
- [ ] No large binary files or unnecessary assets committed
- [ ] Git history doesn't contain secrets (use `git log --all --grep="password\|secret\|key"`)
- [ ] Branch protection rules won't be bypassed by changes
- [ ] Changes won't break production deployment process
- [ ] **NEW**: All commits signed with GPG keys for authenticity
- [ ] **NEW**: No force pushes to main/production branches

### ✅ **TypeScript Standards** *(ENHANCED)*
- [ ] Strict type definitions (no `any` types unless absolutely necessary with comment explaining why)
- [ ] Proper interface/type definitions for all data structures
- [ ] Generic types used appropriately
- [ ] Enum usage for constants when applicable
- [ ] Optional chaining (`?.`) used for potentially undefined properties
- [ ] Nullish coalescing (`??`) used appropriately
- [ ] **NEW**: All exports properly typed (no implicit any returns)
- [ ] **NEW**: No unused variables, imports, or functions (causes build failures)
- [ ] **NEW**: Union types preferred over `any` for flexible typing

### ✅ **Code Quality** *(ENHANCED)*
- [ ] ESLint rules pass without warnings
- [ ] Consistent naming conventions (camelCase for variables, PascalCase for components)
- [ ] Meaningful variable and function names (no single letters except loop counters)
- [ ] No unused imports or variables (critical for production builds)
- [ ] Proper file organization and structure
- [ ] Comments for complex logic (why, not what)
- [ ] Maximum function length: 50 lines (prefer smaller, focused functions)
- [ ] **NEW**: No debugging code in production (console.log, debugger statements)
- [ ] **NEW**: All React components have proper return statements
- [ ] **NEW**: Consistent error handling patterns across codebase

---

## ⚡ **Performance & Efficiency** *(NEW CRITICAL SECTION)*

### 🚀 **React Performance Optimization**
- [ ] **React.memo** used for components that re-render frequently with same props
- [ ] **useCallback** used for event handlers and functions passed to child components
- [ ] **useMemo** used for expensive calculations and object/array creation
- [ ] **Proper dependency arrays** in useEffect, useCallback, useMemo (no missing or unnecessary deps)
- [ ] **Component splitting** - Large components broken into smaller, focused components
- [ ] **Lazy loading** implemented for heavy components not immediately visible
- [ ] **Code splitting** using dynamic imports for large features/pages

### 📊 **Database & API Performance**
- [ ] **Database queries optimized** - No N+1 queries, proper indexing considered
- [ ] **API response caching** implemented where appropriate (Redis, HTTP caching)
- [ ] **Pagination** implemented for large data sets (no loading 1000+ records at once)
- [ ] **Database connection pooling** configured properly
- [ ] **Query timeout limits** set to prevent hanging requests
- [ ] **Rate limiting** implemented on API endpoints
- [ ] **Data compression** enabled for API responses (gzip/brotli)

### 🔄 **Resource Management**
- [ ] **Memory leaks prevented** - Event listeners, timers, and subscriptions properly cleaned up
- [ ] **File handles closed** - All file operations have proper cleanup
- [ ] **Connection cleanup** - Database connections, HTTP clients properly closed
- [ ] **AbortController used** for cancellable async operations
- [ ] **Image optimization** - Proper sizing, compression, WebP format where possible
- [ ] **Bundle size monitoring** - No unnecessary dependencies added to builds

### 📱 **Frontend Performance**
- [ ] **First Contentful Paint < 2 seconds** on 3G connection
- [ ] **Cumulative Layout Shift < 0.1** (no layout jumping)
- [ ] **Largest Contentful Paint < 2.5 seconds**
- [ ] **Time to Interactive < 3 seconds**
- [ ] **Bundle size analysis** - No unnecessary dependencies in production builds
- [ ] **Critical CSS inlined** for above-the-fold content
- [ ] **Non-critical resources deferred** or lazy-loaded

---

## 🧪 **Code Reviews & QA Testing** *(NEW CRITICAL SECTION)*

### 👥 **Code Review Requirements**
- [ ] **Security expert review** required for authentication, encryption, or payment code
- [ ] **Senior developer review** required for AI-generated code in critical paths
- [ ] **Architecture review** required for new features affecting multiple components
- [ ] **Performance review** required for database schema changes or heavy operations
- [ ] **Documentation review** required for public APIs or complex business logic

### 🔍 **Mandatory Review Checklist**
- [ ] **Business logic correctness** - Does the code solve the intended problem?
- [ ] **Error handling completeness** - All edge cases and failure modes covered
- [ ] **Security vulnerability scan** - No obvious security issues introduced
- [ ] **Performance impact assessment** - No significant performance regressions
- [ ] **Test coverage verification** - New code has appropriate test coverage
- [ ] **Documentation accuracy** - Comments and docs match implementation

### 🎯 **QA Testing Standards**
- [ ] **Unit tests** written for all business logic and utility functions
- [ ] **Integration tests** for API endpoints and database operations
- [ ] **End-to-end tests** for critical user flows (auth, payments, data entry)
- [ ] **Performance tests** for high-traffic endpoints and heavy operations
- [ ] **Security tests** for authentication, authorization, and input validation
- [ ] **Accessibility tests** for UI components and user interactions

### 📋 **Test Requirements**
- [ ] **Minimum 80% code coverage** for new features
- [ ] **All tests pass** before merge to main branch
- [ ] **No flaky tests** - Tests must be reliable and deterministic
- [ ] **Test data isolation** - Tests don't interfere with each other
- [ ] **Realistic test scenarios** - Tests reflect actual usage patterns

---

## 🐛 **Bug Sweeps & Quality Assurance** *(NEW CRITICAL SECTION)*

### 🔍 **Pre-Release Bug Sweep**
- [ ] **Manual testing** of all modified features on multiple devices/browsers
- [ ] **Regression testing** of existing features that might be affected
- [ ] **Edge case testing** - Boundary values, empty inputs, maximum limits
- [ ] **Error scenario testing** - Network failures, invalid inputs, server errors
- [ ] **User journey testing** - Complete workflows from start to finish
- [ ] **Performance testing** under realistic load conditions

### 🚨 **Critical Bug Categories**
- [ ] **Security vulnerabilities** - Any auth bypass, XSS, injection, or data exposure
- [ ] **Data corruption** - Any code that could modify/delete data incorrectly
- [ ] **Financial errors** - Calculation mistakes, rounding errors, transaction failures
- [ ] **Authentication failures** - Login issues, session problems, permission errors
- [ ] **Performance regressions** - Significant slowdowns or increased resource usage
- [ ] **Accessibility violations** - Features unusable with keyboard or screen readers

### 🔧 **Bug Prevention Measures**
- [ ] **Static analysis tools** run on all code changes (ESLint, TypeScript, SonarQube)
- [ ] **Dependency vulnerability scanning** using npm audit or Snyk
- [ ] **Code complexity analysis** - Identify overly complex functions for refactoring
- [ ] **Dead code detection** - Remove unused code that could cause confusion
- [ ] **Type safety verification** - No TypeScript errors or `any` type usage
- [ ] **Integration testing** with realistic data volumes and user patterns

---

## 🤖 **AI-Generated Code Review** *(ENHANCED CRITICAL SECTION)*

### ✅ **Security Vulnerability Checks**
- [ ] **Authentication logic manually reviewed** (AI often implements insecure auth patterns)
- [ ] **Input validation manually verified** (AI may miss edge cases or allow bypasses)
- [ ] **SQL queries manually audited** (AI can generate injection-vulnerable queries)
- [ ] **Encryption implementation verified** (AI may use weak algorithms or improper key management)
- [ ] **CORS configuration reviewed** (AI often allows overly permissive origins)
- [ ] **Rate limiting implementation checked** (AI may implement ineffective rate limiting)
- [ ] **Session management audited** (AI can create session fixation vulnerabilities)

### ✅ **Logic & Pattern Verification**
- [ ] **Business logic manually tested** (AI may implement incorrect business rules)
- [ ] **Error handling manually verified** (AI often creates information disclosure vulnerabilities)
- [ ] **State management patterns reviewed** (AI can create race conditions or memory leaks)
- [ ] **API endpoint security manually checked** (authorization, input validation, rate limiting)
- [ ] **Database access patterns audited** (proper transactions, connection management)

### ✅ **Common AI Code Issues**
- [ ] **No overly complex nested conditions** (AI tends to create hard-to-audit code)
- [ ] **Proper error messages** (AI often creates verbose error messages exposing internals)
- [ ] **Resource cleanup verified** (AI often forgets to clean up connections, timers, listeners)
- [ ] **Dependency injection properly implemented** (AI can create tight coupling)
- [ ] **No hardcoded configuration** (AI often embeds configuration in code)

---

## 🛡️ **Enhanced Security Requirements** *(EXPANDED)*

### 🔐 **Authentication & Authorization** *(ENHANCED)*
- [ ] **Multi-factor authentication support** where applicable
- [ ] **Secure token storage** (httpOnly cookies preferred, no localStorage for sensitive tokens)
- [ ] **Proper session management** (secure session invalidation, timeout handling)
- [ ] **Rate limiting for auth endpoints** (account lockout, brute force protection)
- [ ] **CSRF protection** implemented correctly
- [ ] **Password strength validation** (minimum requirements enforced)
- [ ] **Account lockout mechanisms** (temporary lockouts after failed attempts)
- [ ] **NEW**: JWT tokens properly validated (signature, expiration, issuer verification)
- [ ] **NEW**: Refresh token rotation implemented securely
- [ ] **NEW**: No authentication bypass conditions (all paths properly protected)

### 🔒 **Encryption & Data Protection** *(ENHANCED)*
- [ ] **AES-256-GCM minimum** for symmetric encryption (no weaker algorithms)
- [ ] **RSA-4096 or ECDSA-P256** minimum for asymmetric encryption
- [ ] **bcrypt/scrypt/Argon2** for password hashing (no MD5, SHA1, or plain SHA256)
- [ ] **Secure random number generation** (crypto.randomBytes, not Math.random)
- [ ] **Proper key management** (keys rotated, not hardcoded, proper storage)
- [ ] **TLS 1.3 minimum** for all external communications
- [ ] **Certificate pinning** where applicable
- [ ] **Data encryption at rest** for sensitive information
- [ ] **Secure key derivation** (PBKDF2, scrypt, or Argon2 with proper parameters)

### 🌐 **API Security** *(ENHANCED)*
- [ ] **Input validation on all endpoints** (whitelist validation, proper sanitization)
- [ ] **Authentication middleware applied** to all protected routes
- [ ] **Authorization checks for resource access** (proper permission verification)
- [ ] **Request rate limiting** (per-IP and per-user limits)
- [ ] **SQL injection prevention** (parameterized queries only)
- [ ] **XSS prevention in responses** (proper output encoding)
- [ ] **Proper error responses** (no sensitive data leakage, generic error messages)
- [ ] **NEW**: CORS configured restrictively (specific origins, no wildcards in production)
- [ ] **NEW**: Request size limits enforced (prevent DoS attacks)
- [ ] **NEW**: API versioning implemented securely
- [ ] **NEW**: No debug endpoints in production code

### 🔍 **Input Validation & Sanitization** *(ENHANCED)*
- [ ] **All user inputs validated** (type, length, format, range checking)
- [ ] **SQL injection prevention** (parameterized queries, ORM usage)
- [ ] **XSS prevention** (output encoding, CSP headers)
- [ ] **Path traversal prevention** (file path validation)
- [ ] **JSON input validation** (schema validation, size limits)
- [ ] **File upload security** (type validation, size limits, virus scanning)
- [ ] **Email validation** (proper regex, disposable email detection)
- [ ] **URL validation** (protocol restrictions, domain whitelisting)
- [ ] **Phone number validation** (format checking, length limits)

---

## 🔄 **Enhanced Pre-Commit Checklist** *(ENHANCED)*

### ✅ **Build & Verification** *(ENHANCED)*
- [ ] **`npm run build` succeeds without errors** *(MANDATORY - blocks production)*
- [ ] **`npm run type-check` passes** *(MANDATORY - prevents runtime errors)*
- [ ] **`npm run lint` passes without warnings** *(MANDATORY - ensures code quality)*
- [ ] **All tests pass** (`npm run test`) *(MANDATORY where tests exist)*
- [ ] **No console errors in development** *(check browser console)*
- [ ] **NEW**: Frontend builds successfully in production mode (`NODE_ENV=production npm run build`)
- [ ] **NEW**: No TypeScript `any` types introduced without justification
- [ ] **NEW**: No ESLint rule disables without proper comment explaining why
- [ ] **NEW**: Performance benchmarks pass (no significant regressions)

### ✅ **Security Verification** *(ENHANCED)*
- [ ] **No secrets committed** (run `git diff HEAD~1 | grep -E "(password|secret|key|token)"`)
- [ ] **All new endpoints authenticated** and authorized properly
- [ ] **Input validation added** for all new user inputs
- [ ] **Error handling reviewed** for information disclosure
- [ ] **Dependencies scanned** for vulnerabilities (`npm audit`)
- [ ] **HTTPS enforced** for all external API calls
- [ ] **CORS configured** restrictively
- [ ] **NEW**: No custom auth/encryption implementations (use proven libraries)
- [ ] **NEW**: All crypto operations use established libraries

### ✅ **Production Deployment Safety** *(ENHANCED)*
- [ ] **No environment-specific files** added to git (`package-lock.json`, `.env*`, etc.)
- [ ] **Database migrations tested** locally if applicable
- [ ] **Rollback plan documented** for significant changes
- [ ] **Feature flags implemented** for risky changes
- [ ] **Performance impact assessed** (no blocking operations added)
- [ ] **Memory leak prevention** verified (cleanup functions implemented)
- [ ] **NEW**: Load testing completed for high-traffic features
- [ ] **NEW**: Monitoring and alerting configured for new features

---

## 🚨 **Enhanced Critical Violations** *(UPDATED)*
*Issues that MUST be fixed before merge*

1. **Security vulnerabilities** (hardcoded secrets, XSS, injection, weak encryption)
2. **Custom auth/encryption implementations** (use proven libraries only)
3. **Memory leaks** (uncleaned timers, event listeners, AbortController)
4. **Performance regressions** (blocking operations, unnecessary re-renders)
5. **Financial precision errors** (floating-point arithmetic on money)
6. **Accessibility violations** (keyboard navigation, screen readers)
7. **Build failures** (TypeScript errors, linting failures)
8. **Git file tracking violations** (environment files, build artifacts tracked)
9. **Authentication/authorization bypasses**
10. **Input validation failures** (SQL injection, XSS vulnerabilities)
11. **NEW**: Test coverage below 80% for new features
12. **NEW**: Performance benchmarks failing (>20% regression)
13. **NEW**: Unhandled error scenarios in critical paths

---

## 🔧 **Automated Tools Integration** *(ENHANCED)*

### ✅ **Pre-commit Hooks** *(Enhanced Setup)*
```bash
# Install comprehensive development tools
npm install --save-dev husky lint-staged prettier eslint @typescript-eslint/eslint-plugin

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run type-check && npm run test && npm run build",
      "pre-push": "npm run test:e2e && npm audit"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix", 
      "prettier --write",
      "jest --findRelatedTests --passWithNoTests"
    ],
    "*.{json,md}": ["prettier --write"],
    "*.{css,scss}": ["prettier --write", "stylelint --fix"]
  }
}
```

### ✅ **Security Scanning** *(Enhanced)*
- [ ] **npm audit** run and vulnerabilities addressed
- [ ] **Snyk scan** for dependency vulnerabilities
- [ ] **SonarQube** static analysis for security issues
- [ ] **Git secrets** scanning for committed secrets
- [ ] **OWASP ZAP** for API security testing
- [ ] **NEW**: CodeQL analysis for security vulnerabilities
- [ ] **NEW**: Dependency licensing compliance check
- [ ] **NEW**: Performance monitoring integration

### ✅ **Quality Gates** *(NEW)*
- [ ] **Code coverage minimum 80%** enforced in CI/CD
- [ ] **Performance benchmarks** must pass before deployment
- [ ] **Security scan results** must have zero high/critical issues
- [ ] **Accessibility audit** must pass WCAG 2.1 AA standards
- [ ] **Bundle size limits** enforced (no unlimited growth)
- [ ] **Load testing** required for high-traffic features

---

## 📞 **Enhanced Getting Help** *(UPDATED)*

- **Security Questions**: Review authentication patterns, consult security team for encryption
- **Performance Questions**: Review PerformanceDashboard.tsx, AssetManager.tsx patterns
- **Financial Precision**: Review financial.ts library usage (mandatory for financial calculations)
- **Component Patterns**: Review optimized modal components (AssetModal.tsx, PropertyModal.tsx)
- **Hook Patterns**: Review useNotifications.ts, useUpdates.ts
- **AI Code Review**: Pair with senior developer for security-critical AI-generated code
- **Deployment Issues**: Test in staging environment before production
- **Git Issues**: Use `git status` and `git diff` before commits
- **NEW**: **Performance Issues**: Use React DevTools Profiler and lighthouse audits
- **NEW**: **Testing Questions**: Review existing test patterns in `__tests__` directories
- **NEW**: **Architecture Decisions**: Consult team lead for significant architectural changes

---

## 📊 **Quality Metrics Tracking** *(NEW SECTION)*

### 📈 **Code Quality Metrics**
- **Code Coverage**: Minimum 80% for new features, track trend over time
- **Technical Debt**: Measured by SonarQube debt ratio, target <5%
- **Cyclomatic Complexity**: Maximum 10 per function, average <6
- **Duplication**: Less than 3% code duplication across codebase
- **Documentation Coverage**: All public APIs documented

### ⚡ **Performance Metrics**
- **First Contentful Paint**: <2 seconds on 3G
- **Time to Interactive**: <3 seconds on 3G
- **Bundle Size**: Frontend <500KB gzipped, track growth
- **API Response Time**: P95 <500ms for read operations
- **Database Query Time**: P95 <100ms for simple queries

### 🐛 **Bug Tracking Metrics**
- **Bug Escape Rate**: <5% of bugs reach production
- **Mean Time to Resolution**: <24 hours for critical bugs
- **Regression Rate**: <2% of releases introduce regressions
- **Customer-Reported Bugs**: <1 per 1000 users per month

---

**⚠️ SPECIAL NOTE FOR AI-GENERATED CODE**: Always have a human security expert review AI-generated authentication, encryption, input validation, and database access code. AI can introduce subtle vulnerabilities that are not immediately obvious.

**🚨 CRITICAL SECURITY PRINCIPLE**: Never build custom authentication or encryption systems. Use proven, battle-tested libraries and services. Even security experts get these wrong.

**Version Control**: Update this checklist when new patterns or requirements are established. 