# Quick Reference Guide
**Enterprise-Grade Development Patterns**

---

## 🚨 **Critical Patterns** *(Must Use)*

### 🔄 **AbortController Pattern** 
*For ALL API calls*

```tsx
const abortControllerRef = useRef<AbortController | null>(null);

const cleanup = useCallback(() => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }
}, []);

const fetchData = useCallback(async () => {
  cleanup();
  const controller = new AbortController();
  abortControllerRef.current = controller;
  
  try {
    const response = await fetch('/api/data', {
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;
    // Handle response...
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return;
    // Handle error...
  }
}, [cleanup]);

useEffect(() => cleanup, [cleanup]); // Cleanup on unmount
```

### 💰 **Financial Calculations**
*No floating-point math on money*

```tsx
import { FinancialCalculator } from '@/lib/financial';

// ✅ DO THIS
const total = FinancialCalculator.add(amount1, amount2);
const formatted = FinancialCalculator.formatCurrency(total);

// ❌ NEVER DO THIS
const total = amount1 + amount2; // Precision loss!
```

### ⚡ **Performance Optimization**

```tsx
// ✅ Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ Memoize functions
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);

// ✅ Memoize initial data
const initialFormData = useMemo(() => ({
  name: data?.name || '',
  email: data?.email || ''
}), [data?.name, data?.email]);
```

---

## ⚠️ **Never Do This**

❌ `const total = price * quantity` (financial calculations)  
❌ `useEffect(() => fetch(...), [])` (no cleanup)  
❌ `const handler = () => {...}` (in JSX or component body)  
❌ `const obj = { prop: value }` (in JSX or component body)  
❌ `localStorage.setItem('apiKey', key)` (security risk)  
❌ `eval(userInput)` (security vulnerability)  
❌ `setTimeout(() => {...}, 1000)` (without cleanup)

---

## ✅ **Always Do This**

✅ Use `AbortController` for all fetch calls  
✅ Use `FinancialCalculator` for money operations  
✅ Use `useCallback` for functions in dependencies  
✅ Use `useMemo` for expensive calculations  
✅ Use `cleanup` functions for timers/listeners  
✅ Use TypeScript strict mode  
✅ Use proper error boundaries  

---

## 📋 **Pre-Commit Quick Check**

```bash
# Build check
npm run build
npm run type-check
npm run lint

# Critical questions:
# 1. Any API calls? → AbortController added?
# 2. Any money math? → FinancialCalculator used?
# 3. Any timers/intervals? → Cleanup added?
# 4. Any useEffect? → Dependencies optimized?
# 5. Any hardcoded secrets? → Environment variables used?
```

---

## 🔗 **Common Patterns by File Type**

### 🎭 **Modal Component**
- [ ] AbortController for API calls
- [ ] `useMemo` for initial form data  
- [ ] `useCallback` for handlers
- [ ] Keyboard navigation (Enter/Escape)
- [ ] Focus management

### 📄 **Page Component** 
- [ ] AbortController for data fetching
- [ ] Skeleton loading states
- [ ] Error boundaries
- [ ] SEO meta tags
- [ ] Responsive design

### 🎣 **Custom Hook**
- [ ] AbortController for API calls
- [ ] Timer cleanup
- [ ] Event listener cleanup  
- [ ] `useCallback` for returned functions
- [ ] Stable dependencies

### 🔗 **API Route**
- [ ] Input validation
- [ ] Authentication checks
- [ ] Rate limiting
- [ ] Error handling (no sensitive data)
- [ ] CORS configuration

---

## 🆘 **Emergency Fixes**

### 🩸 **Memory Leak**
```tsx
// Add this to any component with intervals
useEffect(() => {
  const interval = setInterval(() => {
    // logic
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

### 🔒 **Security Issue**
```tsx
// Remove hardcoded secrets immediately
const apiKey = process.env.NEXT_PUBLIC_API_KEY; // ✅
const apiKey = 'sk-12345...'; // ❌ Remove this!
```

### 💸 **Precision Issue**
```tsx
// Replace floating-point math
const total = FinancialCalculator.add(price, tax); // ✅
const total = price + tax; // ❌ Replace this!
```

---

## 📚 **Reference Examples**

- **AbortController**: `useNotifications.ts`, `AssetModal.tsx`
- **Financial Calculations**: `financial.ts`, any money component
- **Performance Optimization**: `AssetManager.tsx`, `PerformanceDashboard.tsx`
- **Modal Patterns**: `PropertyModal.tsx`, `AssetApiConfigModal.tsx`
- **Hook Patterns**: `useUpdates.ts`, `useNotifications.ts`

---

**Need Help?** Check the full [Code Quality Checklist](./CODE_QUALITY_CHECKLIST.md) for detailed requirements. 