# Code Quality Checklist

**Profolio Enterprise-Grade Development Standards**

**Version**: 5.0  
**Last Updated**: January 2025  
**Status**: ✅ Enhanced for Security & Quality Excellence

---

## 📋 **Overview**

This checklist ensures all code changes maintain our enterprise-grade standards for security, performance, and maintainability. Use this document for **every file change, addition, or modification** to maintain consistency across the codebase.

**🚨 CRITICAL**: Special attention required for AI-generated code to prevent security vulnerabilities and deployment issues.

---

## 📦 **Package Manager Standards** _(MANDATORY)_

### 🚀 **pnpm Requirements**

- [ ] **Use pnpm for all package operations** - `pnpm install`, `pnpm add`, `pnpm run` (not npm)
- [ ] **Package.json includes packageManager** - `"packageManager": "pnpm@9.14.4"` specified
- [ ] **Lock file consistency** - Only `pnpm-lock.yaml` present (no `package-lock.json`)
- [ ] **Fast installs verified** - `pnpm install` completes without errors
- [ ] **Workspace configuration** - pnpm workspace settings properly configured if applicable
- [ ] **Cache efficiency** - No unnecessary cache clearing or rebuilding

### 💾 **Database & ORM Standards**

- [ ] **Prisma client generated** - `pnpm prisma generate` runs without errors
- [ ] **Database models accessible** - All Prisma models properly typed and accessible
- [ ] **Prisma output path configured** - Generator output set to `../node_modules/.prisma/client`
- [ ] **Type safety verified** - All Prisma models properly typed in TypeScript
- [ ] **Migration safety** - Database migrations tested locally before deployment
- [ ] **Connection management** - Proper connection pooling and cleanup

### 🚨 **Dependency Management**

- [ ] **Deprecation warnings addressed** - No deprecated packages
- [ ] **Security vulnerabilities resolved** - `pnpm audit` shows no high/critical issues
- [ ] **Phantom dependencies prevented** - pnpm's strict resolution enforced
- [ ] **Bundle size monitored** - No unnecessary dependencies added to production builds
- [ ] **License compliance** - All dependencies have compatible licenses
- [ ] **Peer dependency conflicts resolved** - No version mismatches

### 🔗 **API Architecture Standards**

- [ ] **No direct backend calls from frontend** - All API calls use Next.js proxy routes (`/api/*`)
- [ ] **Proxy routes properly configured** - Backend URL environment variable used (`BACKEND_URL`)
- [ ] **Authentication forwarded** - Authorization headers properly passed through proxies
- [ ] **Error handling in proxies** - Proper error responses and status codes
- [ ] **Security isolation maintained** - Frontend never exposes backend directly
- [ ] **CORS restrictions enforced** - No overly permissive CORS settings

---

## 🛡️ **NEVER BUILD THESE YOURSELF** _(CRITICAL SECURITY PRINCIPLE)_

### 🚨 **Authentication Systems** _(USE EXISTING SOLUTIONS ONLY)_

- [ ] **NEVER build custom authentication** - Use proven solutions like Auth0, Supabase Auth, NextAuth.js, or Clerk
- [ ] **NEVER build custom password hashing** - Use bcrypt, scrypt, or Argon2 libraries only
- [ ] **NEVER build custom session management** - Use established session stores and libraries
- [ ] **NEVER build custom JWT handling** - Use well-maintained JWT libraries with proper validation
- [ ] **NEVER build custom OAuth flows** - Use official OAuth libraries and providers

**Why**: Authentication is extremely complex with countless edge cases. Even security experts get it wrong. Use battle-tested solutions.

### 🔐 **Encryption & Cryptography** _(USE EXISTING SOLUTIONS ONLY)_

- [ ] **NEVER build custom encryption algorithms** - Use AES-256-GCM, ChaCha20-Poly1305 via crypto libraries
- [ ] **NEVER build custom key derivation** - Use PBKDF2, scrypt, or Argon2 via established libraries
- [ ] **NEVER build custom random number generation** - Use crypto.randomBytes() or equivalent secure sources
- [ ] **NEVER build custom certificate handling** - Use TLS libraries and certificate authorities
- [ ] **NEVER build custom hashing functions** - Use SHA-256, SHA-3, or Blake2 via crypto libraries

**Why**: Cryptography is mathematically complex with subtle implementation details. Mistakes lead to complete security failures.

### 🔑 **Always Use These Instead**

- **Node.js**: Use built-in `crypto` module for all cryptographic operations
- **Authentication**: NextAuth.js, Auth0, Supabase Auth, Firebase Auth, Clerk
- **Encryption**: Use `crypto.createCipherGCM()`, never deprecated methods
- **Hashing**: Use `bcrypt`, `scrypt`, or `argon2` libraries for passwords
- **Random**: Use `crypto.randomBytes()`, never `Math.random()` for security

---

## 🔧 **General Requirements**

### ✅ **Security Fundamentals**

- [ ] No hardcoded secrets, API keys, passwords, or tokens
- [ ] All user inputs properly validated and sanitized
- [ ] Authentication/authorization checks in place where needed
- [ ] No `eval()` or `dangerouslySetInnerHTML` without proper sanitization
- [ ] HTTPS-only external API calls (no `http://` in production code)
- [ ] Proper error handling that doesn't expose sensitive information
- [ ] SQL injection prevention (parameterized queries only)
- [ ] XSS prevention (proper input sanitization, Content Security Policy headers)
- [ ] No sensitive data logged to console
- [ ] All environment variables properly configured

### ✅ **Git & Deployment Safety**

- [ ] No environment-specific files tracked
- [ ] `.gitignore` properly configured for all environment-specific files
- [ ] **pnpm lock file only** - `pnpm-lock.yaml` present, no `package-lock.json`
- [ ] **Package manager consistency** - `"packageManager": "pnpm@9.14.4"` in package.json
- [ ] No temporary files, debug files, or development artifacts committed
- [ ] No large binary files or unnecessary assets committed
- [ ] Git history doesn't contain secrets
- [ ] Branch protection rules won't be bypassed by changes
- [ ] Changes won't break production deployment process
- [ ] All commits signed with GPG keys for authenticity
- [ ] No force pushes to main/production branches
- [ ] Prisma client generation verified post-checkout
- [ ] API proxy routes tested and working

### ✅ **TypeScript Standards**

- [ ] Strict type definitions (no `any` types unless absolutely necessary with comment)
- [ ] Proper interface/type definitions for all data structures
- [ ] Generic types used appropriately
- [ ] Enum usage for constants when applicable
- [ ] Optional chaining (`?.`) used for potentially undefined properties
- [ ] Nullish coalescing (`??`) used appropriately
- [ ] All exports properly typed (no implicit any returns)
- [ ] No unused variables, imports, or functions
- [ ] Union types preferred over `any` for flexible typing

### ✅ **Code Quality**

- [ ] ESLint rules pass without warnings
- [ ] Consistent naming conventions (camelCase for variables, PascalCase for components)
- [ ] Meaningful variable and function names
- [ ] No unused imports or variables
- [ ] Proper file organization and structure
- [ ] Comments for complex logic (why, not what)
- [ ] Maximum function length: 50 lines
- [ ] No debugging code in production
- [ ] All React components have proper return statements
- [ ] Consistent error handling patterns across codebase

---

## ⚡ **Performance & Efficiency**

### 🚀 **React Performance Optimization**

- [ ] **React.memo** used for components that re-render frequently with same props
- [ ] **useCallback** used for event handlers and functions passed to child components
- [ ] **useMemo** used for expensive calculations and object/array creation
- [ ] **Proper dependency arrays** in useEffect, useCallback, useMemo
- [ ] **Component splitting** - Large components broken into smaller, focused components
- [ ] **Lazy loading** implemented for heavy components not immediately visible
- [ ] **Code splitting** using dynamic imports for large features/pages

### 📊 **Database & API Performance**

- [ ] **Database queries optimized** - No N+1 queries, proper indexing considered
- [ ] **API response caching** implemented where appropriate
- [ ] **Pagination** implemented for large data sets
- [ ] **Database connection pooling** configured properly
- [ ] **Query timeout limits** set to prevent hanging requests
- [ ] **Rate limiting** implemented on API endpoints
- [ ] **Data compression** enabled for API responses

### 🔄 **Resource Management**

- [ ] **Memory leaks prevented** - Event listeners, timers, and subscriptions properly cleaned up
- [ ] **File handles closed** - All file operations have proper cleanup
- [ ] **Connection cleanup** - Database connections, HTTP clients properly closed
- [ ] **AbortController used** for cancellable async operations
- [ ] **Image optimization** - Proper sizing, compression, format optimization
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

## 🧪 **Code Reviews & QA Testing**

### 👥 **Code Review Requirements**

- [ ] **Security expert review** required for authentication, encryption, or payment code
- [ ] **Senior developer review** required for AI-generated code in critical paths
- [ ] **Architecture review** required for new features affecting multiple components
- [ ] **Performance review** required for database schema changes or heavy operations
- [ ] **Documentation review** required for public APIs or complex business logic

### 🔍 **Mandatory Review Checklist**

- [ ] **Business logic correctness** - Does the code solve the intended problem?
- [ ] **Error handling completeness** - All edge cases and failure modes covered
- [ ] **Security assessment** - No obvious security issues introduced
- [ ] **Performance impact assessment** - No significant performance regressions
- [ ] **Test coverage verification** - New code has appropriate test coverage
- [ ] **Documentation accuracy** - Comments and docs match implementation

### 🎯 **QA Testing Standards**

- [ ] **Unit tests** written for all business logic and utility functions
- [ ] **Integration tests** for API endpoints and database operations
- [ ] **End-to-end tests** for critical user flows
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

## 🐛 **Bug Prevention & Quality Assurance**

### 🔍 **Pre-Release Quality Checks**

- [ ] **Manual testing** of all modified features on multiple devices/browsers
- [ ] **Regression testing** of existing features that might be affected
- [ ] **Edge case testing** - Boundary values, empty inputs, maximum limits
- [ ] **Error scenario testing** - Network failures, invalid inputs, server errors
- [ ] **User journey testing** - Complete workflows from start to finish
- [ ] **Performance testing** under realistic load conditions

### 🚨 **Critical Quality Categories**

- [ ] **Security vulnerabilities** - Any auth bypass, injection, or data exposure issues
- [ ] **Data integrity** - Any code that could modify/delete data incorrectly
- [ ] **Financial accuracy** - Calculation correctness, rounding precision
- [ ] **Authentication reliability** - Login functionality, session management
- [ ] **Performance regressions** - Significant slowdowns or increased resource usage
- [ ] **Accessibility compliance** - Features usable with keyboard and screen readers

### 🔧 **Quality Prevention Measures**

- [ ] **Static analysis tools** run on all code changes
- [ ] **Dependency vulnerability scanning** regularly performed
- [ ] **Code complexity analysis** - Identify overly complex functions for refactoring
- [ ] **Dead code detection** - Remove unused code that could cause confusion
- [ ] **Type safety verification** - No TypeScript errors
- [ ] **Integration testing** with realistic data volumes and user patterns

---

## 🤖 **AI-Generated Code Review**

### ✅ **Enhanced Verification for AI Code**

- [ ] **Authentication logic manually reviewed** - AI patterns often need security hardening
- [ ] **Input validation manually verified** - AI may miss edge cases
- [ ] **Database queries manually audited** - Ensure proper parameterization
- [ ] **Encryption implementation verified** - AI may use weak algorithms or improper key management
- [ ] **Error handling manually verified** - Prevent information disclosure
- [ ] **Business logic manually tested** - AI may implement incorrect business rules
- [ ] **Resource cleanup verified** - AI often forgets cleanup functions

### ✅ **Common AI Code Issues to Check**

- [ ] **No overly complex nested conditions** - Keep code auditable
- [ ] **Proper error messages** - Generic messages that don't expose internals
- [ ] **Resource cleanup verified** - Connections, timers, listeners properly managed
- [ ] **Dependency patterns** - Avoid tight coupling created by AI
- [ ] **Configuration externalized** - No hardcoded values in AI-generated code

---

## 🛡️ **Enterprise Security Standards**

### 🔐 **Authentication & Authorization**

- [ ] **Multi-factor authentication support** where applicable
- [ ] **Secure token storage** - httpOnly cookies preferred for sensitive data
- [ ] **Proper session management** - Secure invalidation, timeout handling
- [ ] **Rate limiting for auth endpoints** - Brute force protection
- [ ] **CSRF protection** implemented correctly
- [ ] **Password strength validation** - Minimum requirements enforced
- [ ] **Account lockout mechanisms** - Temporary lockouts after failed attempts
- [ ] **JWT tokens properly validated** - Signature, expiration, issuer verification
- [ ] **Refresh token rotation** implemented securely
- [ ] **No authentication bypass conditions** - All paths properly protected

### 🔒 **Encryption & Data Protection**

- [ ] **AES-256-GCM minimum** for symmetric encryption
- [ ] **RSA-4096 or ECDSA-P256** minimum for asymmetric encryption
- [ ] **bcrypt/scrypt/Argon2** for password hashing
- [ ] **Secure random number generation** - crypto.randomBytes only
- [ ] **Proper key management** - Keys rotated, not hardcoded, properly stored
- [ ] **TLS 1.3 minimum** for all external communications
- [ ] **Certificate pinning** where applicable
- [ ] **Data encryption at rest** for sensitive information
- [ ] **Secure key derivation** - PBKDF2, scrypt, or Argon2 with proper parameters

### 🌐 **API Security**

- [ ] **Input validation on all endpoints** - Whitelist validation, proper sanitization
- [ ] **Authentication middleware applied** to all protected routes
- [ ] **Authorization checks for resource access** - Proper permission verification
- [ ] **Request rate limiting** - Per-IP and per-user limits
- [ ] **SQL injection prevention** - Parameterized queries only
- [ ] **XSS prevention in responses** - Proper output encoding
- [ ] **Proper error responses** - No sensitive data leakage
- [ ] **CORS configured restrictively** - Specific origins, no wildcards in production
- [ ] **Request size limits enforced** - Prevent DoS attacks
- [ ] **API versioning implemented** securely
- [ ] **No debug endpoints in production code**

### 🔍 **Input Validation & Sanitization**

- [ ] **All user inputs validated** - Type, length, format, range checking
- [ ] **Path traversal prevention** - File path validation
- [ ] **JSON input validation** - Schema validation, size limits
- [ ] **File upload security** - Type validation, size limits
- [ ] **Email validation** - Proper regex, disposable email detection
- [ ] **URL validation** - Protocol restrictions, domain whitelisting
- [ ] **Phone number validation** - Format checking, length limits

---

## 🏛️ **Enterprise Compliance & Auditing**

### 🔍 **Security Audit Requirements**

- [ ] **Comprehensive security review** completed before production deployment
- [ ] **Authentication security audit** - All auth flows tested and verified
- [ ] **API security assessment** - All endpoints tested for vulnerabilities
- [ ] **Database security review** - Access controls and data protection verified
- [ ] **Input validation audit** - All user inputs tested for proper handling
- [ ] **Error handling security review** - No sensitive information disclosed
- [ ] **Logging security audit** - No sensitive data logged, proper sanitization

### 🔐 **Comprehensive Encryption Audit**

- [ ] **Algorithm assessment** - Only approved encryption algorithms used
- [ ] **Key management review** - Proper key generation, storage, rotation, and destruction
- [ ] **Data-at-rest encryption** - All sensitive data encrypted in database and file storage
- [ ] **Data-in-transit encryption** - TLS 1.3 minimum for all communications
- [ ] **Password hashing audit** - bcrypt/scrypt/Argon2 with proper parameters
- [ ] **JWT security review** - Proper signing, validation, and expiration handling
- [ ] **API key security** - Secure generation, storage, and transmission
- [ ] **Certificate management** - Proper SSL/TLS certificate configuration and renewal
- [ ] **Cryptographic randomness** - crypto.randomBytes() used for all security-critical random values
- [ ] **No custom crypto implementations** - All cryptography uses established libraries

### ⚖️ **Privacy & Data Protection Compliance**

- [ ] **Data mapping completed** - All personal data processing documented
- [ ] **Lawful basis established** - Legal justification for data processing
- [ ] **Privacy policy implemented** - Clear, accessible privacy notice
- [ ] **Consent mechanisms** - Granular consent options implemented
- [ ] **User rights supported** - Access, rectification, erasure, portability
- [ ] **Data retention policies** - Clear retention periods and automatic deletion
- [ ] **Data breach procedures** - Incident response plan in place
- [ ] **Data protection by design** - Privacy considerations built into system architecture
- [ ] **International transfers** - Proper safeguards for data transfers outside EU/UK
- [ ] **Data processor agreements** - Contracts with third-party services handling personal data
- [ ] **Regular compliance audits** - Periodic reviews of compliance measures

### 🚨 **API Rate Limiting & DoS Protection**

- [ ] **Global rate limiting** implemented (requests per IP per time window)
- [ ] **Per-user rate limiting** implemented (requests per authenticated user)
- [ ] **Endpoint-specific limits** configured (different limits for different API endpoints)
- [ ] **Authentication endpoint protection** - Strict rate limiting for login/signup
- [ ] **Burst protection** - Handle sudden traffic spikes gracefully
- [ ] **Rate limit headers** - Proper HTTP headers returned to clients
- [ ] **Rate limit monitoring** - Alerting when limits are exceeded
- [ ] **Request size limits** - Maximum payload size enforced
- [ ] **Connection limits** - Maximum concurrent connections per IP
- [ ] **Bot detection** - Automated traffic detection and mitigation

### 🔒 **Advanced Security Hardening**

- [ ] **Security headers implemented** - HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- [ ] **Subresource Integrity (SRI)** - Verification of third-party resources
- [ ] **DNS security** - DNSSEC implementation and monitoring
- [ ] **Email security** - SPF, DKIM, DMARC records configured
- [ ] **Software composition analysis** - Third-party dependency vulnerability monitoring
- [ ] **Container security** - Docker image scanning and runtime protection
- [ ] **Secrets management** - Dedicated secrets management system
- [ ] **Multi-factor authentication** - MFA required for all administrative access
- [ ] **Privileged access management** - Least privilege principle enforced

### 🎯 **Vulnerability Assessment & Penetration Testing**

- [ ] **Automated vulnerability scanning** - OWASP ZAP, Nessus, or similar tools run regularly
- [ ] **Manual penetration testing** - Qualified security professional conducts manual tests
- [ ] **Authentication bypass testing** - Attempts to circumvent authentication mechanisms
- [ ] **Authorization testing** - Verification of proper access controls and privilege escalation prevention
- [ ] **Input validation testing** - Fuzzing and injection testing on all input fields
- [ ] **Session management testing** - Session fixation, hijacking, and timeout testing
- [ ] **Business logic testing** - Application-specific workflow and logic vulnerability testing
- [ ] **API security testing** - REST/GraphQL endpoint security assessment
- [ ] **Infrastructure testing** - Network, server, and database security assessment
- [ ] **Social engineering testing** - Phishing and human factor security assessment
- [ ] **Physical security assessment** - Server room, workstation, and device security
- [ ] **Remediation verification** - Re-testing after vulnerability fixes
- [ ] **Compliance testing** - Verification against security standards (ISO 27001, SOC 2, etc.)
- [ ] **Red team exercises** - Comprehensive adversarial security testing

---

## 🔄 **MANDATORY RUNTIME TESTING**

_These checks MUST be performed on running code, not just static analysis_

### ✅ **React Performance Validation** _(MANDATORY)_

- [ ] **useEffect dependency arrays verified** - No objects/arrays causing infinite loops
- [ ] **Component re-render testing** - Open React DevTools Profiler during interaction
- [ ] **Console monitoring** - Check browser console for errors, warnings, or spam
- [ ] **Network tab verification** - Ensure no excessive/unexpected requests
- [ ] **Memory leak detection** - Profile memory usage during component lifecycle
- [ ] **Performance timeline analysis** - No blocking operations or infinite loops

### ✅ **Live Application Testing** _(MANDATORY)_

- [ ] **Component mounting/unmounting** - Test full lifecycle in browser
- [ ] **State management verification** - Ensure state updates don't cause cascading re-renders
- [ ] **Event handler testing** - All user interactions work as expected
- [ ] **Error boundary testing** - Verify graceful error handling
- [ ] **Cross-component integration** - Test how changes affect other components
- [ ] **Mobile/desktop testing** - Verify responsive behavior

### ✅ **Browser Performance Monitoring** _(MANDATORY)_

- [ ] **Console.log output review** - No excessive logging or error messages
- [ ] **Network request analysis** - Verify expected vs actual network activity
- [ ] **Lighthouse performance audit** - Score must not regress significantly
- [ ] **React DevTools Profiler** - No unexpected component re-renders
- [ ] **Memory usage monitoring** - No memory leaks or excessive consumption
- [ ] **CPU usage tracking** - No infinite loops or blocking operations

### ✅ **Critical React Anti-Patterns** _(MANDATORY CHECKS)_

#### **🚨 useEffect Infinite Loop Detection**

```typescript
// ❌ DANGER: Object/array dependencies cause infinite loops
useEffect(() => {
  // modifies object/array
}, [objectDependency]); // Creates new reference each render

// ✅ SAFE: Primitive dependencies or stable references
useEffect(() => {
  // safe logic
}, [objectDependency.specificProperty, stableRef.current]);
```

#### **🚨 Excessive Network Request Detection**

```typescript
// ❌ DANGER: Real HTTP requests in component render cycle
const preloadContent = async () => {
  await fetch(url); // Can cause request storms
};

// ✅ SAFE: Use Next.js optimized prefetching
const preloadContent = async () => {
  await router.prefetch(route); // Optimized by framework
};
```

#### **🚨 State Update Cascades Detection**

```typescript
// ❌ DANGER: State updates triggering more state updates
useEffect(() => {
  if (condition) {
    setState1(newValue);
    setState2(anotherValue); // Can cause cascading updates
  }
}, [state1, state2]); // Dependencies include states being modified

// ✅ SAFE: Separate effects or single state update
useEffect(() => {
  if (condition) {
    setBatchedState({ state1: newValue, state2: anotherValue });
  }
}, [condition]); // Stable dependency
```

---

## 🧪 **Enhanced Testing Protocols**

### ✅ **Pre-Deployment Testing Checklist** _(MANDATORY)_

- [ ] **Load app in browser** - Verify it actually works
- [ ] **Open DevTools Console** - Check for errors, warnings, or spam
- [ ] **Monitor Network tab** - Verify expected request patterns
- [ ] **Test user flows** - All critical paths work as expected
- [ ] **Check React DevTools** - No unexpected re-renders or memory leaks
- [ ] **Mobile testing** - Responsive design and touch interactions
- [ ] **Performance monitoring** - No blocking operations or infinite loops

### ✅ **Component Integration Testing** _(MANDATORY)_

- [ ] **Component mount/unmount cycles** - No memory leaks or orphaned listeners
- [ ] **Props change handling** - Component responds correctly to prop updates
- [ ] **Context changes** - Proper re-rendering when context values change
- [ ] **Error boundary integration** - Errors are caught and handled gracefully
- [ ] **Route navigation testing** - Components work correctly during navigation
- [ ] **State persistence** - Local/session storage integration works properly

### ✅ **Performance Regression Testing** _(MANDATORY)_

- [ ] **Before/after Lighthouse scores** - Performance must not regress > 10%
- [ ] **Bundle size analysis** - No unexpected increases in build output
- [ ] **Runtime performance** - No new blocking operations or slow renders
- [ ] **Memory usage comparison** - No memory leaks or excessive consumption
- [ ] **Network request auditing** - No new excessive or redundant requests

---

## 🔧 **Development Workflow Integration**

### ✅ **Pre-Commit Testing Protocol** _(MANDATORY)_

```bash
# 1. Build verification
pnpm run build

# 2. Prisma client validation (for database changes)
pnpm prisma generate

# 3. Start dev server and verify app loads
pnpm run dev
# → Open browser, check console, verify basic functionality

# 4. Component-specific testing
# → Navigate to changed components
# → Open React DevTools Profiler
# → Interact with component
# → Verify no excessive re-renders or network requests

# 5. API proxy testing
# → Test /api/auth/profile responds correctly
# → Test /api/market-data/cached-price/AAPL responds
# → Verify no direct backend calls (localhost:3001)

# 6. Performance verification
pnpm run build:analyze  # Check bundle size changes
lighthouse http://localhost:3000 --only-categories=performance
```

### ✅ **React-Specific Review Checklist**

- [ ] **Hook dependencies reviewed** - All dependencies stable and necessary
- [ ] **Component memoization verified** - React.memo, useMemo, useCallback used appropriately
- [ ] **Context usage optimized** - No unnecessary context subscriptions
- [ ] **Event handler optimization** - Handlers memoized to prevent child re-renders
- [ ] **Ref usage verified** - useRef used for mutable values, not triggering re-renders
- [ ] **Effect cleanup verified** - All effects have proper cleanup functions

---

## 📊 **Runtime Performance Metrics**

### ✅ **Performance Thresholds** _(MUST NOT EXCEED)_

- **Console messages**: < 1 per 5 seconds (no spam)
- **Network requests**: < 20% increase from baseline
- **Component re-renders**: < 5 per user interaction
- **Memory usage**: < 50MB increase per session
- **Bundle size**: < 10% increase per feature
- **Lighthouse Performance**: > 90 (no regression > 10%)

### ✅ **Monitoring Commands** _(USE DURING REVIEW)_

```bash
# Monitor console output
console.clear(); /* interact with component */; console.count('messages');

# Monitor network requests
// In Network tab: Check request count before/after interaction

# Monitor component re-renders
// React DevTools → Profiler → Record interaction → Check render count

# Monitor memory usage
// DevTools → Memory tab → Take heap snapshot before/after

# Performance timeline
// DevTools → Performance tab → Record user interaction
```

---

## 🚨 **Critical Failure Indicators** _(IMMEDIATE STOP CRITERIA)_

If ANY of these occur during testing, **STOP DEPLOYMENT IMMEDIATELY**:

1. **Console spam** - More than 5 messages per second
2. **Infinite loops** - Component continuously re-rendering
3. **Network storms** - Excessive HTTP requests (> 10 per interaction)
4. **Memory leaks** - Memory usage continuously increasing
5. **Blocking operations** - UI freezing or becoming unresponsive
6. **Error cascades** - One error triggering multiple others
7. **Resource loading failures** - Images/fonts/styles not loading

---

## 🔄 **Pre-Commit Checklist**

### ✅ **Build & Verification** _(MANDATORY)_

- [ ] **`pnpm run build` succeeds without errors** _(MANDATORY - blocks production)_
- [ ] **`pnpm run type-check` passes** _(MANDATORY - prevents runtime errors)_
- [ ] **`pnpm run lint` passes without warnings** _(MANDATORY - ensures code quality)_
- [ ] **All tests pass** (`pnpm run test`) _(MANDATORY where tests exist)_
- [ ] **Prisma client generated** (`pnpm prisma generate`) _(MANDATORY for database changes)_
- [ ] **No console errors in development**
- [ ] **Frontend builds successfully in production mode**
- [ ] **No TypeScript `any` types introduced without justification**
- [ ] **Performance benchmarks pass** - No significant regressions
- [ ] **Database models accessible** and properly typed
- [ ] **API proxy routes responding**

### ✅ **Security Verification**

- [ ] **No secrets committed** - Scan for hardcoded credentials
- [ ] **All new endpoints authenticated** and authorized properly
- [ ] **Input validation added** for all new user inputs
- [ ] **Error handling reviewed** for information disclosure
- [ ] **Dependencies scanned** for vulnerabilities
- [ ] **HTTPS enforced** for all external API calls
- [ ] **CORS configured** restrictively
- [ ] **No custom auth/encryption implementations**
- [ ] **Authorization headers properly forwarded** in API proxies

### ✅ **Production Deployment Safety**

- [ ] **No environment-specific files** added to git
- [ ] **pnpm lock file properly tracked**
- [ ] **Database migrations tested** locally if applicable
- [ ] **Rollback plan documented** for significant changes
- [ ] **Feature flags implemented** for risky changes
- [ ] **Performance impact assessed**
- [ ] **Memory leak prevention** verified
- [ ] **Load testing completed** for high-traffic features
- [ ] **Monitoring and alerting configured** for new features

---

## 🚨 **Enhanced Critical Violations**

_Issues that MUST be fixed before merge_

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
11. **Test coverage below 80%** for new features
12. **Performance benchmarks failing** (>20% regression)
13. **Unhandled error scenarios** in critical paths
14. **Package manager violations** (npm commands used instead of pnpm)
15. **Lock file conflicts** (package-lock.json present with pnpm-lock.yaml)
16. **Prisma client generation failures** (database models not accessible)
17. **Direct backend calls from frontend** (bypassing API proxies)
18. **Deprecated package warnings** not addressed
19. **Database migration safety violations** (untested migrations)
20. **Runtime testing failures** (infinite loops, memory leaks, console spam)

---

## 🔧 **Automated Tools Integration**

### ✅ **Pre-commit Hooks Setup**

```bash
# Install comprehensive development tools
pnpm add --save-dev husky lint-staged prettier eslint @typescript-eslint/eslint-plugin

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && pnpm run type-check && pnpm run test && pnpm run build",
      "pre-push": "pnpm run test:e2e && pnpm audit"
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

### ✅ **Security Scanning**

- [ ] **pnpm audit** run and vulnerabilities addressed
- [ ] **Snyk scan** for dependency vulnerabilities
- [ ] **SonarQube** static analysis for security issues
- [ ] **Git secrets** scanning for committed secrets
- [ ] **CodeQL analysis** for security vulnerabilities
- [ ] **Dependency licensing compliance** check
- [ ] **Performance monitoring** integration
- [ ] **Prisma schema validation** (`pnpm prisma validate`)
- [ ] **API proxy security testing** (no direct backend exposure)

### ✅ **Quality Gates**

- [ ] **Code coverage minimum 80%** enforced in CI/CD
- [ ] **Performance benchmarks** must pass before deployment
- [ ] **Security scan results** must have zero high/critical issues
- [ ] **Accessibility audit** must pass WCAG 2.1 AA standards
- [ ] **Bundle size limits** enforced (no unlimited growth)
- [ ] **Load testing** required for high-traffic features

---

## 📊 **Quality Metrics Tracking**

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

## 🔍 **Post-Incident Analysis Protocol**

When runtime issues are discovered:

### ✅ **Root Cause Analysis** _(MANDATORY)_

- [ ] **Identify missed checks** - Which quality checks would have caught this?
- [ ] **Review methodology** - Was testing thorough enough?
- [ ] **Update checklists** - Add new checks to prevent recurrence
- [ ] **Tool enhancement** - Are better monitoring tools needed?
- [ ] **Process improvement** - How can the review process be strengthened?

### ✅ **Prevention Measures** _(MANDATORY)_

- [ ] **Add automated tests** - Prevent regression of the same issue
- [ ] **Enhance monitoring** - Add runtime performance monitoring
- [ ] **Update documentation** - Include lessons learned
- [ ] **Team knowledge sharing** - Ensure team awareness of the issue pattern

---

## 📞 **Enhanced Getting Help**

- **Security Questions**: Review authentication patterns, consult security team for encryption
- **Performance Questions**: Use React DevTools Profiler and lighthouse audits
- **Financial Precision**: Review financial.ts library usage (mandatory for financial calculations)
- **Component Patterns**: Review optimized modal components
- **Hook Patterns**: Review existing hook implementations
- **AI Code Review**: Pair with senior developer for security-critical AI-generated code
- **Deployment Issues**: Test in staging environment before production
- **Git Issues**: Use `git status` and `git diff` before commits
- **Testing Questions**: Review existing test patterns in `__tests__` directories
- **Architecture Decisions**: Consult team lead for significant architectural changes
- **pnpm Migration Issues**: See package manager migration documentation
- **Prisma Problems**: Check client generation with `pnpm prisma generate`
- **API Proxy Issues**: Verify routes in `frontend/src/app/api/` directory
- **Database Model Access**: Ensure PrismaService extends PrismaClient properly
- **Deprecation Warnings**: Remove @types packages when main package has built-in types

---

## 📊 **Quality Metrics & Standards**

### 🎯 **Code Quality Targets**

- **Test Coverage**: Minimum 80% for new features
- **Type Coverage**: 100% TypeScript, no `any` types without justification
- **Build Time**: Frontend builds under 2 minutes
- **Bundle Size**: No unnecessary dependencies in production
- **Performance**: No regressions > 10% in critical paths

### 📈 **Performance Standards**

- **Page Load**: First Contentful Paint < 2 seconds
- **API Response**: 95th percentile < 500ms for standard endpoints
- **Database**: No queries > 100ms without optimization review
- **Memory**: No memory leaks, proper cleanup verification
- **Bundle**: Critical path bundles < 250KB gzipped

### 🔒 **Security Benchmarks**

- **Vulnerability Scans**: Zero high/critical vulnerabilities
- **Authentication**: MFA supported, secure session management
- **Data Protection**: Encryption at rest and in transit
- **Access Control**: Principle of least privilege enforced
- **Monitoring**: Real-time security event detection

---

**🚨 CRITICAL LESSON**: Static code analysis is NOT sufficient. Runtime testing in a browser with DevTools monitoring is MANDATORY for all React component changes.

**⚠️ REMINDER**: A component that compiles and lints correctly can still cause infinite loops, network storms, and performance degradation. Always test runtime behavior.

**Remember**: These standards ensure enterprise-grade security, performance, and maintainability. Every standard exists to prevent real-world issues and maintain our high-quality codebase.

**For Questions**: Consult the specific Cursor rules in `.cursor/rules/` for implementation details and examples.

---

## 📋 **STANDARDIZED QUALITY REPORT FORMAT** _(MANDATORY)_

**All code quality reviews MUST use this exact format for consistency and accountability:**

### **Report Template**

```markdown
## 📊 Code Quality Checklist Report

**Date**: [YYYY-MM-DD]  
**Reviewer**: [Name/AI Assistant]  
**Review Type**: [New Feature/Bug Fix/Enhancement/Refactor]  
**Runtime Testing**: [✅ Completed / ❌ Not Performed]

---

### **📁 Files Reviewed**

- `path/to/file1.tsx` - ✅ PASSED / 🚨 ISSUES FOUND / ❌ FAILED
- `path/to/file2.ts` - ✅ PASSED / 🚨 ISSUES FOUND / ❌ FAILED
- `path/to/file3.tsx` - ✅ PASSED / 🚨 ISSUES FOUND / ❌ FAILED

**Total Files**: X | **Passed**: X | **Issues**: X | **Failed**: X

---

### **🔍 Quality Assessment by Category**

#### **🛡️ Security Fundamentals**

- [ ] No hardcoded secrets (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Input validation (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Auth/authorization checks (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Error handling security (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED

**Security Score**: X/Y checks passed

#### **🏛️ Enterprise Security Auditing**

- [ ] Comprehensive security audit completed - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Encryption audit passed - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Privacy compliance verified - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Penetration testing completed - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] API rate limiting implemented - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Security monitoring configured - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Security hardening applied - ✅ PASSED / 🚨 ISSUES / ❌ FAILED

**Enterprise Security Score**: X/Y checks passed

#### **⚡ Performance & Efficiency**

- [ ] React performance optimization (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Database/API performance (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Resource management (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Bundle size impact - ✅ PASSED / 🚨 ISSUES / ❌ FAILED

**Performance Score**: X/Y checks passed

#### **🔄 Mandatory Runtime Testing**

- [ ] Component re-render testing - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Console monitoring - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Network request analysis - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Memory leak detection - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Browser performance validation - ✅ PASSED / 🚨 ISSUES / ❌ FAILED

**Runtime Testing Score**: X/Y checks passed

#### **📝 Code Quality**

- [ ] TypeScript standards (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] ESLint compliance (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Code patterns (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Documentation (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED

**Code Quality Score**: X/Y checks passed

#### **♿ Accessibility**

- [ ] WCAG compliance (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Keyboard navigation (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Screen reader support (X/X files) - ✅ PASSED / 🚨 ISSUES / ❌ FAILED

**Accessibility Score**: X/Y checks passed

#### **🧪 Testing & QA**

- [ ] Build verification - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Integration testing - ✅ PASSED / 🚨 ISSUES / ❌ FAILED
- [ ] Error scenario testing - ✅ PASSED / 🚨 ISSUES / ❌ FAILED

**Testing Score**: X/Y checks passed

---

### **🚨 Critical Issues Found** _(If Any)_

1. **[Issue Type]**: Description of issue

   - **Impact**: High/Medium/Low
   - **File**: `path/to/file.tsx:lineNumber`
   - **Fix Required**: Yes/No
   - **Blocks Deployment**: Yes/No

2. **[Issue Type]**: Description of issue
   - **Impact**: High/Medium/Low
   - **File**: `path/to/file.tsx:lineNumber`
   - **Fix Required**: Yes/No
   - **Blocks Deployment**: Yes/No

---

### **📊 Overall Assessment**

| Category                | Score     | Status                            |
| ----------------------- | --------- | --------------------------------- |
| **Security**            | X/Y (XX%) | ✅ PASSED / 🚨 ISSUES / ❌ FAILED |
| **Enterprise Security** | X/Y (XX%) | ✅ PASSED / 🚨 ISSUES / ❌ FAILED |
| **Performance**         | X/Y (XX%) | ✅ PASSED / 🚨 ISSUES / ❌ FAILED |
| **Runtime Testing**     | X/Y (XX%) | ✅ PASSED / 🚨 ISSUES / ❌ FAILED |
| **Code Quality**        | X/Y (XX%) | ✅ PASSED / 🚨 ISSUES / ❌ FAILED |
| **Accessibility**       | X/Y (XX%) | ✅ PASSED / 🚨 ISSUES / ❌ FAILED |
| **Testing**             | X/Y (XX%) | ✅ PASSED / 🚨 ISSUES / ❌ FAILED |

**Overall Score**: XX/YY (XX%)

---

### **🎯 Final Recommendation**

**Deployment Status**:

- ✅ **APPROVED** - Ready for immediate deployment
- 🚨 **CONDITIONAL** - Minor issues, deploy with monitoring
- ❌ **BLOCKED** - Critical issues must be fixed before deployment

**Enterprise Security Status**:

- ✅ **SECURITY APPROVED** - All enterprise security requirements met
- 🚨 **SECURITY CONDITIONAL** - Minor security gaps, deploy with enhanced monitoring
- ❌ **SECURITY BLOCKED** - Critical security issues must be resolved immediately

**Rationale**: [Specific reasoning for the recommendation]

**Action Items** _(If Any)_:

1. [ ] Fix critical issue in `file.tsx`
2. [ ] Complete security audit for authentication changes
3. [ ] Implement missing compliance controls
4. [ ] Address penetration testing findings
5. [ ] Monitor performance metrics post-deployment

**Next Steps**:

- [ ] Address action items above
- [ ] Re-run quality check if critical issues found
- [ ] Complete enterprise security validation if required
- [ ] Deploy with specified monitoring if conditionally approved

---

**🚨 ENTERPRISE SECURITY REQUIREMENT**: Any changes affecting authentication, encryption, data privacy, or external APIs MUST pass enterprise security auditing before deployment.
```

### **📏 Assessment Criteria**

#### **✅ PASSED Criteria**

- **Security**: All security checks passed, no vulnerabilities
- **Performance**: No regressions, meets performance thresholds
- **Runtime Testing**: All browser tests passed, no infinite loops/memory leaks
- **Code Quality**: ESLint clean, TypeScript strict, good patterns
- **Accessibility**: WCAG 2.1 AA compliant
- **Testing**: Build succeeds, integration tests pass

#### **🚨 ISSUES Criteria**

- **Minor issues** found but not deployment-blocking
- **Performance concerns** but within acceptable thresholds
- **Style/pattern issues** that should be addressed
- **Non-critical accessibility** improvements needed

#### **❌ FAILED Criteria**

- **Security vulnerabilities** present
- **Performance regressions** > 20% or infinite loops
- **Build failures** or TypeScript errors
- **Critical accessibility** violations
- **Runtime testing** reveals breaking issues

### **🎯 Deployment Decision Matrix**

| Overall Score | Runtime Testing | Critical Issues | Recommendation     |
| ------------- | --------------- | --------------- | ------------------ |
| > 90%         | ✅ PASSED       | None            | ✅ **APPROVED**    |
| 80-90%        | ✅ PASSED       | Minor only      | 🚨 **CONDITIONAL** |
| 70-80%        | ✅ PASSED       | Some issues     | 🚨 **CONDITIONAL** |
| < 70%         | Any status      | Any             | ❌ **BLOCKED**     |
| Any score     | ❌ FAILED       | Any             | ❌ **BLOCKED**     |
| Any score     | Any status      | Critical        | ❌ **BLOCKED**     |

### **🔍 Report Usage Guidelines**

#### **For Reviewers**

- **MUST use this exact format** for all quality reviews
- **Fill in ALL sections** - no skipping allowed
- **Provide specific line numbers** for issues found
- **Include actual test results** - not assumptions
- **Be honest about confidence level** and completeness

#### **For Recipients**

- **Check runtime testing status** - reviews without browser testing are incomplete
- **Focus on failed/critical items first** - these block deployment
- **Verify issue descriptions** - ensure they match actual problems
- **Question unclear assessments** - demand specifics for vague evaluations

---

**📌 REMEMBER**: This format is designed to prevent subjective "feels good" assessments and ensure every review includes the critical runtime testing that catches real-world issues.

---

**⚠️ SPECIAL NOTE FOR AI-GENERATED CODE**: Always have a human security expert review AI-generated authentication, encryption, input validation, and database access code. AI can introduce subtle vulnerabilities that are not immediately obvious.

**🚨 CRITICAL SECURITY PRINCIPLE**: Never build custom authentication or encryption systems. Use proven, battle-tested libraries and services. Even security experts get these wrong.

**Version Control**: Update this checklist when new patterns or requirements are established.
