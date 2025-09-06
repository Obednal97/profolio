# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Profolio is a privacy-focused, self-hosted portfolio management system built with Next.js (frontend) and NestJS (backend), using PostgreSQL for data persistence.

**Current Version**: v1.13.1 (see [CHANGELOG.md](CHANGELOG.md) for full history)  
**Branch**: css-architecture-foundation  
**Status**: Production-ready with ongoing CSS architecture improvements

## Critical Warnings ⚠️

- **DO NOT** run `dev` or `build` commands unless explicitly requested
- **DO NOT** build custom authentication or cryptography (use existing solutions)
- **ALWAYS** use `pnpm` (not npm/yarn) for package management
- **ALWAYS** check existing patterns before creating new components
- **ALWAYS** use UK date formats (DD-MM-YYYY) and UK spelling
- **NEVER** make direct backend API calls from frontend (use Next.js proxy routes)

## Installation & Updates

The project includes a comprehensive installer script (`install.sh`) with advanced features:

```bash
# Quick install
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | sudo bash

# Advanced options
sudo ./install.sh --help                    # Show all options
sudo ./install.sh --advanced                # Advanced setup mode
sudo ./install.sh --version v1.13.1         # Install specific version
sudo ./install.sh --restore-backup          # Restore from backup
sudo ./install.sh --rollback                # Manual rollback

# Features
- Automatic container/Proxmox detection
- Rollback protection with automatic recovery
- Version control and selection
- Backup and restore functionality
- File optimization options
- LXC container creation wizard for Proxmox hosts
```

## Code Quality & Linting Strategy

### Error Handling Philosophy

- **Development**: Warnings don't block, focus on rapid iteration
- **Pre-commit**: Auto-fix issues, allow warnings
- **CI/CD**: Strict for critical errors, tolerant for style warnings
- **Production**: Full strict checking

## ⚠️ CRITICAL: Type Safety Requirements

### NEVER Use `any` Types

- **BANNED**: Direct use of `any` type
- **BANNED**: Type assertions with `as any`
- **BANNED**: Implicit any (missing type annotations)

### Instead, ALWAYS Use:

1. **Proper interfaces/types** - Define exact shape of data
2. **`unknown`** - For truly unknown types with type guards
3. **Generics** - For flexible, reusable types
4. **`SafeAny<"reason">`** - ONLY for documented temporary migration

### Type Safety Checklist for ALL Code:

- ✅ All function parameters have explicit types
- ✅ All API responses have defined interfaces
- ✅ No `any` types (use `unknown` + type guards)
- ✅ Express requests use `AuthenticatedRequest`
- ✅ Array operations have typed items
- ✅ Transform decorators use proper type checking

### Import Type Utilities:

```typescript
// Backend
import { SafeAny, AuthenticatedRequest, isObject } from "@/types/common";

// Frontend
import { ApiResponse, PropsWithClassName } from "@/types/common";
```

### Pre-commit Check:

The system will automatically check for `any` types and warn you.
Current limit: 43 (decreasing to 0)

### Quick Fixes

```bash
# Auto-fix all issues
pnpm fix:all              # Fix both frontend and backend

# Check without blocking
pnpm check:all            # Run all checks with warnings allowed

# Development type checking (loose)
cd frontend && pnpm type-check:dev
cd backend && pnpm type-check
```

### When to Run Checks

- **Before major changes**: Run `pnpm check:all`
- **Before commits**: Automatic via husky (non-blocking)
- **Before releases**: Run strict checks with `pnpm lint:strict`
- **During development**: Warnings are OK, fix critical errors only

## Development Commands

### Quick Start (from root directory)

```bash
# Production Mode - Run both frontend and backend in production
pnpm start            # Runs both services concurrently

# Development Mode - Run both frontend and backend with hot-reload
pnpm start:dev        # Runs both services with watch mode
pnpm dev              # Alias for start:dev

# Individual Services
pnpm start:backend    # Production backend only
pnpm start:frontend   # Production frontend only
pnpm dev:backend      # Development backend only
pnpm dev:frontend     # Development frontend only
```

### Frontend (Next.js)

```bash
cd frontend

# Development
pnpm start:dev        # Start dev server (http://localhost:3000)
pnpm dev              # Alias for start:dev
pnpm dev:https        # Start with HTTPS for PWA testing
pnpm dev:pwa          # Same as dev:https for PWA testing

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Testing - Comprehensive Suite
pnpm test:e2e         # Run all Playwright E2E tests
pnpm test:e2e:ui      # Run Playwright with visual UI
pnpm test:e2e:debug   # Debug mode with browser open
pnpm test:e2e --grep "@security"  # Security tests only
pnpm test:performance # Run Lighthouse performance tests
pnpm test:all         # Run all tests (unit + E2E + performance)

# Code Quality
pnpm lint             # Run ESLint (allows up to 50 warnings)
pnpm lint:fix         # Auto-fix ESLint issues
pnpm lint:strict      # Strict ESLint (no warnings)
pnpm type-check       # TypeScript type checking (strict)
pnpm type-check:dev   # TypeScript checking (development, loose)
pnpm audit            # Security vulnerability check
```

### Backend (NestJS)

```bash
cd backend

# Development
pnpm start:dev        # Start with hot-reload (http://localhost:3001)
pnpm dev              # Alias for start:dev

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run database migrations

# Code Quality
pnpm lint             # Run ESLint (allows up to 50 warnings)
pnpm lint:fix         # Auto-fix ESLint issues
pnpm lint:strict      # Strict ESLint (no warnings)
pnpm format           # Format with Prettier
```

### Root Level Commands

```bash
# Development (from root)
pnpm dev:frontend     # Start frontend dev server
pnpm dev:backend      # Start backend dev server

# Building (from root)
pnpm build:frontend   # Build frontend
pnpm build:backend    # Build backend
```

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, TailwindCSS v4, TanStack Query
- **Backend**: NestJS, Prisma ORM, PostgreSQL, JWT authentication
- **UI Components**: Radix UI primitives (NOT Shadcn/ui), custom glass design system
- **State Management**: TanStack Query for server state, React Context for client state
- **Authentication**: Dual mode - Firebase (cloud) or local JWT (self-hosted)

### Project Structure

```
profolio/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App router pages and API routes
│   │   │   ├── api/         # API route handlers
│   │   │   └── app/         # Protected app pages
│   │   ├── components/      # React components
│   │   │   ├── cards/       # Card components with glass design
│   │   │   ├── modals/      # Modal components
│   │   │   ├── common/      # Reusable components (StatsGrid, ChartContainer, etc.)
│   │   │   └── ui/          # Base UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and services
│   │   └── styles/          # Modular CSS architecture
│   │       ├── foundation/  # Reset, tokens, typography
│   │       ├── components/  # Component-specific styles
│   │       ├── themes/      # Light/dark themes
│   │       └── main.css     # Main entry point
│   └── public/              # Static assets
├── backend/                  # NestJS application
│   ├── src/
│   │   ├── app/api/         # API modules (assets, auth, expenses, etc.)
│   │   ├── common/          # Shared services and guards
│   │   └── main.ts          # Application entry
│   └── prisma/
│       └── schema.prisma    # Database schema
└── docs/                    # Documentation

```

### Key Design Patterns

#### Frontend Architecture

- **App Router**: Using Next.js 15 app directory structure
- **Server Components**: Default to server components, use client components only when needed
- **API Routes**: Next.js API routes proxy to backend NestJS services
- **Glass Design System**: Custom Apple-style liquid glass components with performance-optimized rendering
- **Modular CSS**: Component-scoped styles with CSS modules, avoiding inline styles

#### Backend Architecture

- **Module-based**: Each feature is a NestJS module (auth, assets, expenses, properties)
- **Service Layer**: Business logic in services, controllers handle HTTP
- **DTOs**: Data validation using class-validator
- **Guards**: JWT authentication guard for protected routes
- **Prisma ORM**: Type-safe database queries with PostgreSQL

#### Authentication Flow

1. Frontend uses `useAuth()` hook for auth state
2. Local mode: JWT tokens stored securely, backend validates
3. Firebase mode: Firebase SDK handles auth, backend validates Firebase tokens
4. All API calls include auth headers automatically via `apiClient`

#### Data Fetching Pattern

```typescript
// Using TanStack Query for data fetching
const { data, isLoading } = useQuery({
  queryKey: ["assets"],
  queryFn: () => apiClient.get("/api/assets"),
});
```

## Important Conventions

### Component Creation

- Check existing components first (especially in `components/common/`)
- Use Radix UI primitives, NOT Shadcn/ui
- Follow glass design system patterns from `components/cards/GlassCard.tsx`
- Create component-specific CSS in `styles/components/`
- **MANDATORY**: Add `data-testid` attributes to all interactive elements

### State Management

- Server state: TanStack Query (NOT SWR)
- Client state: React Context or local state
- Form state: Controlled components with React state
- Demo mode: 24-hour sessions with `DemoSessionManager`

### Styling - Glass Design System

- Use TailwindCSS v4 with PostCSS
- Glass design tokens in `styles/foundation/tokens.css`
- Liquid glass variants: `.liquid-glass-subtle`, `.liquid-glass-standard`, `.liquid-glass-prominent`
- Performance-based tinting: `.liquid-glass-performance-positive` (green), `.liquid-glass-performance-negative` (red)
- Mobile-first responsive design with safe area handling
- Avoid inline styles, use modular CSS architecture

### Testing Requirements

- **E2E tests**: Playwright with multi-browser support (Chrome, Firefox, Safari, Edge, Mobile)
- **Security tests**: Tag with `@security` for SQL injection, XSS, rate limiting
- **Performance tests**: Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- **Accessibility tests**: WCAG 2.1 AA compliance
- **Component tests**: All interactive elements must have `data-testid` attributes
- **Coverage**: Minimum 80% for new features, 100% for financial calculations

### Security Principles

- **NEVER** build custom authentication (use NextAuth, Auth0, Firebase Auth)
- **NEVER** build custom encryption (use Node.js crypto module)
- **NEVER** make direct backend calls from frontend (use API proxy routes)
- Use `pnpm audit` to check for vulnerabilities
- Validate all user inputs with DTOs in backend
- Encrypt sensitive data at rest (AES-256-GCM)

## Environment Variables

### Frontend (.env.local)

```
NEXT_PUBLIC_AUTH_MODE=local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_CONFIG={}  # Firebase config JSON if using Firebase auth
```

### Backend (.env)

```
DATABASE_URL=postgresql://user:pass@localhost:5432/profolio
JWT_SECRET=your-secret-key
API_ENCRYPTION_KEY=your-encryption-key
PORT=3001
```

## Common Tasks

### Adding a New Feature

1. Create backend module in `backend/src/app/api/`
2. Add Prisma schema if needed, run migrations
3. Create frontend pages in `frontend/src/app/app/`
4. Add API route handlers in `frontend/src/app/api/`
5. Create React components following glass design patterns
6. Add E2E tests for critical flows

### Modifying Database Schema

1. Edit `backend/prisma/schema.prisma`
2. Run `pnpm prisma migrate dev --name <migration_name>` in backend to generate proper migration files
3. **IMPORTANT**: Never manually create migration SQL files - always use Prisma CLI
4. Run `pnpm prisma:generate` to update Prisma Client
5. Update DTOs in backend module
6. Update TypeScript types in frontend

### CSS Architecture Guidelines

- Foundation styles (reset, tokens) go in `styles/foundation/`
- Component styles in `styles/components/`
- Use CSS custom properties for theming
- Follow BEM naming for complex components
- Keep specificity low, avoid !important

## Package Management

- **MANDATORY**: Use pnpm for all operations (not npm/yarn)
- Workspace configured at root level
- Always use `pnpm add` for adding dependencies
- Include `"packageManager": "pnpm@9.14.4"` in package.json
- Use `pnpm audit` for security vulnerability checks
- Lock file: Only `pnpm-lock.yaml` (no `package-lock.json`)

## Current Development Priorities

### 🔴 High Priority Issues (from todo.md)

- Google auth users cannot set password for email auth
- Add proper 2FA using otplib
- Implement failed password rate limiting
- NextAuth migration from Firebase + custom backend
- Expense modal positioning issues
- Page transition performance issues

### 🟢 Ongoing Features

- Apple Liquid Glass Design Language (in progress at `/design-styles`)
- Component architecture improvements (93% file size reduction planned)
- CSS modular architecture migration
- Performance optimizations for 1-4 second page delays

### ✅ Recently Completed (Reference)

- Fixed mock API preventing real backend usage
- Created all missing API proxy routes
- Fixed Google auth with PWA
- Enhanced preloading strategy
- Duplicate API call prevention

## Development Workflow

### Git Commit Format

```bash
# CRITICAL: NEVER add Claude attribution or co-authoring
# NEVER add "🤖 Generated with Claude Code"
# NEVER add "Co-Authored-By: Claude <noreply@anthropic.com>"
git commit -m "feat: Add new feature"
```

### Creating Pull Requests

```bash
# Use GitHub CLI
# IMPORTANT: Do NOT add any Claude attribution in PR body
gh pr create --title "feat: Title" --body "$(cat <<'EOF'
## Summary
- Change 1
- Change 2

## Test plan
- [ ] E2E tests pass
- [ ] Security tests pass
- [ ] Performance metrics met
EOF
)"
```

## Demo Mode

### Demo Session Management

- 24-hour time-limited sessions
- Real Yahoo Finance market data (not mock)
- Automatic session cleanup after expiry
- Isolated demo data that doesn't persist
- Demo token: `demo-token-secure-123`

## Useful References

### Project Documentation

- **Cursor Rules**: `.cursor/rules/index.mdc` - Development conventions
- **Testing Guide**: `docs/testing/TESTING_SETUP_GUIDE.md`
- **Security Policy**: `SECURITY.md` - Security best practices
- **Code Quality**: `docs/processes/CODE_QUALITY_CHECKLIST.md`
- **Release Process**: `docs/processes/RELEASE_PROCESS_GUIDE.md`

### Key Files to Review

- **Current Tasks**: `todo.md` and `todo.csv`
- **Recent Changes**: `CHANGELOG.md`
- **Architecture Specs**: `docs/architecture/`
- **Feature Documentation**: `docs/features/`
