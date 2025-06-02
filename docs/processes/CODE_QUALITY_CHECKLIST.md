# Code Quality Checklist
**Profolio Enterprise-Grade Development Standards**

**Version**: 1.0  
**Last Updated**: June 2025  
**Status**: ✅ Production Ready Standards

---

## 📋 **Overview**

This checklist ensures all code changes maintain our enterprise-grade standards for security, performance, and maintainability. Use this document for **every file change, addition, or modification** to maintain consistency across the codebase.

---

## 🔧 **General Requirements** 
*Apply to ALL file changes*

### ✅ **Security Fundamentals**
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] All user inputs properly validated and sanitized
- [ ] Authentication/authorization checks in place where needed
- [ ] No `eval()` or `dangerouslySetInnerHTML` without proper sanitization
- [ ] HTTPS-only external API calls
- [ ] Proper error handling that doesn't expose sensitive information
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (proper input sanitization)

### ✅ **TypeScript Standards**
- [ ] Strict type definitions (no `any` types unless absolutely necessary)
- [ ] Proper interface/type definitions for all data structures
- [ ] Generic types used appropriately
- [ ] Enum usage for constants when applicable
- [ ] Optional chaining (`?.`) used for potentially undefined properties
- [ ] Nullish coalescing (`??`) used appropriately

### ✅ **Code Quality**
- [ ] ESLint rules pass without warnings
- [ ] Consistent naming conventions (camelCase for variables, PascalCase for components)
- [ ] Meaningful variable and function names
- [ ] No unused imports or variables
- [ ] Proper file organization and structure
- [ ] Comments for complex logic (why, not what)
- [ ] Maximum function length: 50 lines (prefer smaller, focused functions)

---

## 🎯 **Component-Specific Requirements**

### 🖼️ **React Components**

#### ✅ **Performance Requirements**
- [ ] `useMemo` for expensive calculations or object/array creations
- [ ] `useCallback` for functions passed as props or used in dependencies
- [ ] `React.memo` for components that receive stable props
- [ ] Proper dependency arrays in `useEffect` hooks
- [ ] No object/function creation in JSX (move to `useMemo`/`useCallback`)
- [ ] Lazy loading for heavy components (`React.lazy`)

#### ✅ **State Management**
- [ ] State as close to usage as possible (avoid prop drilling)
- [ ] Complex state uses `useReducer` instead of multiple `useState`
- [ ] Memoized derived state calculations
- [ ] Proper state initialization (avoid recreating initial values)

#### ✅ **Error Handling**
- [ ] Error boundaries for error isolation
- [ ] Graceful degradation for failed operations
- [ ] Loading and error states properly managed
- [ ] User-friendly error messages

### 🔗 **API & Data Fetching Components**

#### ✅ **AbortController Patterns** *(CRITICAL)*
- [ ] `useRef` to track AbortController instances
- [ ] Cleanup function cancels ongoing requests
- [ ] New AbortController created for each request
- [ ] `signal` passed to all fetch calls
- [ ] AbortError handling in try-catch blocks
- [ ] Cleanup on component unmount
- [ ] Multiple AbortControllers for different request types when needed

```tsx
// ✅ REQUIRED PATTERN
const abortControllerRef = useRef<AbortController | null>(null);

const cleanup = useCallback(() => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }
}, []);

const fetchData = useCallback(async () => {
  cleanup(); // Cancel previous request
  
  const controller = new AbortController();
  abortControllerRef.current = controller;
  
  try {
    const response = await fetch('/api/data', {
      signal: controller.signal,
    });
    
    if (controller.signal.aborted) return;
    // ... handle response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return; // Expected cancellation
    }
    // Handle actual errors
  }
}, [cleanup]);

useEffect(() => {
  return cleanup; // Cleanup on unmount
}, [cleanup]);
```

#### ✅ **Data Handling**
- [ ] Proper loading states during API calls
- [ ] Error states with retry mechanisms
- [ ] Race condition prevention
- [ ] Request deduplication where applicable
- [ ] Optimistic updates for better UX
- [ ] Proper cache invalidation

### 🎭 **Modal Components**

#### ✅ **Required Patterns**
- [ ] AbortController cleanup for all API calls
- [ ] `useMemo` for initial form data to prevent recreation
- [ ] `useCallback` for all form handlers and async functions
- [ ] Proper keyboard navigation (Enter/Escape handling)
- [ ] Focus management (trap focus, restore on close)
- [ ] Backdrop click handling
- [ ] Body scroll prevention when open
- [ ] ARIA attributes for accessibility

#### ✅ **Form Optimization**
- [ ] Debounced input validation
- [ ] Memoized form validation functions
- [ ] Optimized re-render prevention
- [ ] Proper form state management

### 🎣 **Custom Hooks**

#### ✅ **Resource Management**
- [ ] All timers (`setTimeout`, `setInterval`) properly cleaned up
- [ ] AbortController patterns for API calls
- [ ] Event listeners removed on unmount
- [ ] Subscriptions/observers cleaned up
- [ ] Refs used to prevent stale closures

#### ✅ **Dependencies**
- [ ] Minimal, stable dependency arrays
- [ ] `useCallback` for returned functions
- [ ] `useMemo` for returned objects/arrays
- [ ] Proper ESLint exhaustive-deps compliance

### 📄 **Page Components**

#### ✅ **Performance Requirements**
- [ ] Lazy loading for heavy content
- [ ] Skeleton loading states
- [ ] Memoized expensive calculations
- [ ] Optimized list rendering (virtualization for large lists)
- [ ] Image optimization (next/image with proper sizing)

#### ✅ **Data Management**
- [ ] AbortController patterns for data fetching
- [ ] Proper error boundaries
- [ ] SEO optimization (meta tags, structured data)
- [ ] Loading state management

---

## 💰 **Financial Data Handling**
*For components dealing with monetary values*

### ✅ **Precision Requirements** *(CRITICAL)*
- [ ] `Decimal.js` used for all financial calculations
- [ ] No floating-point arithmetic for money
- [ ] Banker's rounding for currency operations
- [ ] Overflow protection for large amounts
- [ ] Proper currency formatting with locale support
- [ ] Input validation for monetary values

```tsx
// ✅ REQUIRED PATTERN
import { FinancialCalculator } from '@/lib/financial';

// Use FinancialCalculator methods instead of raw math
const total = FinancialCalculator.add(amount1, amount2);
const formatted = FinancialCalculator.formatCurrency(total);
```

---

## 🎨 **Styling & UI**

### ✅ **CSS/Styling Standards**
- [ ] Tailwind CSS classes used consistently
- [ ] No inline styles (use CSS variables for dynamic values)
- [ ] Responsive design (mobile-first approach)
- [ ] Dark mode support where applicable
- [ ] Accessibility compliance (color contrast, focus indicators)
- [ ] Animation performance (CSS transforms over position changes)

### ✅ **Component Library Usage**
- [ ] Use existing UI components from `/components/ui/`
- [ ] Consistent spacing using Tailwind spacing scale
- [ ] Proper loading states (skeletons, spinners)
- [ ] Error states with clear messaging

---

## 🔒 **Security-Specific Checks**
*Additional security requirements by component type*

### 🔐 **Authentication Components**
- [ ] Secure token storage (httpOnly cookies preferred)
- [ ] Proper session management
- [ ] Rate limiting for auth endpoints
- [ ] CSRF protection
- [ ] Password strength validation
- [ ] Account lockout mechanisms

### 🛡️ **API Route Security**
- [ ] Input validation on all endpoints
- [ ] Authentication middleware applied
- [ ] Authorization checks for resource access
- [ ] Request rate limiting
- [ ] SQL injection prevention
- [ ] XSS prevention in responses
- [ ] Proper error responses (no sensitive data leakage)

### 🎭 **Demo Mode Handling**
- [ ] Demo data isolated from production data
- [ ] Demo session validation
- [ ] Temporary data cleanup
- [ ] No sensitive operations in demo mode
- [ ] Clear demo mode indicators in UI

---

## 🚀 **Performance-Specific Checks**

### ⚡ **Bundle Optimization**
- [ ] No unnecessary dependencies imported
- [ ] Tree-shaking friendly imports (`import { specific } from 'library'`)
- [ ] Code splitting for large components
- [ ] Dynamic imports for conditional features
- [ ] Webpack bundle analyzer results reviewed

### 🧠 **Memory Management**
- [ ] No memory leaks from uncleaned timers
- [ ] Event listeners properly removed
- [ ] Large objects properly disposed
- [ ] WeakMap/WeakSet used for temporary references
- [ ] Blob URLs revoked after use

### 📊 **Runtime Performance**
- [ ] Expensive operations debounced/throttled
- [ ] Virtual scrolling for large lists (>100 items)
- [ ] Image lazy loading implemented
- [ ] API calls optimized (minimal requests, proper caching)
- [ ] Component render optimization (minimal re-renders)

---

## 🧪 **Testing Requirements**

### ✅ **Unit Testing** 
*For critical business logic*
- [ ] Utility functions have unit tests
- [ ] Financial calculations thoroughly tested
- [ ] Custom hooks tested with React Testing Library
- [ ] Edge cases and error conditions covered
- [ ] Mock external dependencies properly

### ✅ **Integration Testing**
*For user-facing features*
- [ ] Critical user flows tested end-to-end
- [ ] API integration points tested
- [ ] Authentication flows verified
- [ ] Form submissions tested
- [ ] Error scenarios tested

---

## 📝 **Documentation Requirements**

### ✅ **Code Documentation**
- [ ] Complex functions have JSDoc comments
- [ ] Type definitions properly documented
- [ ] README updates for new features/processes
- [ ] API documentation updated
- [ ] Migration guides for breaking changes

### ✅ **Component Documentation**
- [ ] Props interface properly documented
- [ ] Usage examples provided for complex components
- [ ] Storybook stories for UI components
- [ ] Accessibility features documented

---

## 🔄 **Pre-Commit Checklist**

### ✅ **Build & Verification**
- [ ] `npm run build` succeeds without errors
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes without warnings
- [ ] All tests pass (`npm run test`)
- [ ] No console errors in development

### ✅ **Code Review**
- [ ] Code follows existing patterns and conventions
- [ ] No copy-paste code without refactoring
- [ ] Performance implications considered
- [ ] Security implications reviewed
- [ ] Breaking changes documented

### ✅ **Deployment Readiness**
- [ ] Environment variables properly configured
- [ ] Database migrations included if needed
- [ ] Feature flags implemented for gradual rollout
- [ ] Rollback plan documented for significant changes

---

## 📋 **File Type Quick Reference**

### 🎯 **New Component**
```
□ General Requirements
□ React Component Requirements  
□ Performance Requirements
□ AbortController (if API calls)
□ Styling Standards
□ Documentation
□ Testing
```

### 🔗 **API Integration**
```
□ General Requirements
□ Security Fundamentals
□ AbortController Patterns
□ Data Handling
□ Error Handling
□ Performance Requirements
```

### 🎣 **Custom Hook**
```
□ General Requirements
□ Resource Management
□ Dependencies Optimization
□ Custom Hook Requirements
□ Testing
```

### 💰 **Financial Component**
```
□ General Requirements
□ React Component Requirements
□ Financial Precision Requirements
□ Security Requirements
□ Testing (critical)
```

---

## 🚨 **Critical Violations**
*Issues that MUST be fixed before merge*

1. **Security vulnerabilities** (hardcoded secrets, XSS, injection)
2. **Memory leaks** (uncleaned timers, event listeners, AbortController)
3. **Performance regressions** (blocking operations, unnecessary re-renders)
4. **Financial precision errors** (floating-point arithmetic on money)
5. **Accessibility violations** (keyboard navigation, screen readers)
6. **Build failures** (TypeScript errors, linting failures)

---

## 📞 **Getting Help**

- **Performance Questions**: Review PerformanceDashboard.tsx, AssetManager.tsx patterns
- **Security Questions**: Review authentication patterns, API security
- **Financial Precision**: Review financial.ts library usage
- **Component Patterns**: Review optimized modal components (AssetModal.tsx, PropertyModal.tsx)
- **Hook Patterns**: Review useNotifications.ts, useUpdates.ts

---

**Remember**: These standards ensure our enterprise-grade quality. Every checkbox represents lessons learned from our comprehensive optimization phase. When in doubt, follow existing optimized patterns in the codebase.

**Version Control**: Update this checklist when new patterns or requirements are established. 