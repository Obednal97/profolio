# TypeScript Type Safety Guide

## 🎯 Goal: Zero `any` Types

This guide helps migrate away from `any` types to achieve full type safety in the Profolio codebase.

## 📊 Current Status

- **Total `any` types**: 43 (as of latest count)
- **Target**: 0
- **Files affected**: 12
- **Most problematic**: `notifications.controller.ts` (11), `create-asset.dto.ts` (8)

## 🚫 What NOT to Do

```typescript
// ❌ BAD: Using any
function processData(data: any) {
  return data.value;
}

// ❌ BAD: Type assertion to any
const result = someValue as any;

// ❌ BAD: Implicit any
function calculate(a, b) {
  // Parameters implicitly 'any'
  return a + b;
}
```

## ✅ What to Do Instead

### 1. Use Proper Types

```typescript
// ✅ GOOD: Define interfaces
interface UserData {
  id: string;
  name: string;
  email: string;
}

function processData(data: UserData) {
  return data.email;
}
```

### 2. Use `unknown` for Truly Unknown Types

```typescript
// ✅ GOOD: Use unknown with type guards
function processUnknown(data: unknown) {
  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as { value: string }).value;
  }
  throw new Error("Invalid data structure");
}
```

### 3. Use Generics for Flexible Types

```typescript
// ✅ GOOD: Generic functions
function processArray<T>(items: T[]): T[] {
  return items.filter(Boolean);
}
```

### 4. Use Utility Types from `types/common.ts`

```typescript
import { SafeAny, UnknownObject, isObject } from "@/types/common";

// During migration - document why any is needed
let tempData: SafeAny<"TODO: Define API response type after backend update">;

// For objects needing validation
function handleObject(obj: UnknownObject) {
  if (isObject(obj) && "id" in obj) {
    // Now TypeScript knows obj has an 'id' property
  }
}
```

## 📝 Common Patterns and Solutions

### Express Request Types

```typescript
// ❌ BAD
async createUser(@Request() req: any) {
  const userId = req.user.id;
}

// ✅ GOOD
import { AuthenticatedRequest } from '@/types/common';

async createUser(@Request() req: AuthenticatedRequest) {
  const userId = req.user?.id;
}
```

### Array Mapping

```typescript
// ❌ BAD
const names = users.map((user: any) => user.name);

// ✅ GOOD
interface User {
  name: string;
  // other properties
}
const names = users.map((user: User) => user.name);
```

### API Responses

```typescript
// ❌ BAD
const response: any = await fetch("/api/data");

// ✅ GOOD
import { ApiResponse } from "@/types/common";

interface DataResponse {
  items: string[];
  total: number;
}

const response: ApiResponse<DataResponse> = await fetch("/api/data");
```

### Transform Decorators

```typescript
// ❌ BAD
@Transform(({ value }: { value: any }) => value.trim())

// ✅ GOOD
@Transform(({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value
)
```

### Prisma Queries

```typescript
// ❌ BAD
const users = (await prisma.user.findMany()) as any;

// ✅ GOOD
import { User } from "@prisma/client";

const users: User[] = await prisma.user.findMany();
```

## 🔧 Migration Strategy

### Phase 1: Critical Security Files (Week 1)

- [ ] Auth controllers and services
- [ ] Payment/billing modules
- [ ] User data handlers

### Phase 2: High-Usage Files (Week 2)

- [ ] Main controllers
- [ ] Core services
- [ ] API routes

### Phase 3: Remaining Files (Week 3)

- [ ] DTOs and validators
- [ ] Utility functions
- [ ] Test files

## 🛠️ Tools and Commands

### Check for any types

```bash
# Run type safety check
node scripts/check-any-types.js

# Check only staged files (pre-commit)
node scripts/check-any-types.js --pre-commit

# Strict mode (fails on any 'any')
node scripts/check-any-types.js --strict
```

### ESLint Commands

```bash
# Check with standard rules
pnpm lint

# Check with strict type rules
pnpm eslint --config .eslintrc.strict.json src/

# Auto-fix where possible
pnpm lint:fix
```

### TypeScript Commands

```bash
# Strict type checking
pnpm type-check

# Development mode (looser)
pnpm type-check:dev
```

## 📋 Checklist for New Code

Before committing:

- [ ] No new `any` types added
- [ ] All function parameters have types
- [ ] All function return types are explicit or inferable
- [ ] API responses have defined interfaces
- [ ] Used `unknown` instead of `any` for uncertain types
- [ ] Added type guards for runtime validation
- [ ] Used utility types from `types/common.ts`

## 🚨 CI/CD Integration

The CI/CD pipeline enforces:

1. No new `any` types in new files
2. Gradual reduction of existing `any` types
3. Strict type checking for production builds
4. Type coverage reports in PR comments

## 💡 Tips

1. **Start with interfaces**: Define data structures first
2. **Use IDE help**: VS Code's "Quick Fix" often suggests correct types
3. **Incremental migration**: Fix one file at a time
4. **Test after changes**: Ensure runtime behavior isn't affected
5. **Document complex types**: Add JSDoc comments for clarity

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Prisma TypeScript Types](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/use-custom-types)

## 🎉 Benefits of Type Safety

- **Catch bugs early**: At compile time, not runtime
- **Better IDE support**: Autocomplete and refactoring
- **Self-documenting code**: Types serve as inline documentation
- **Easier refactoring**: Change types and find all affected code
- **Improved confidence**: Know your code is type-safe

Remember: **Every `any` removed makes the codebase more maintainable!**
