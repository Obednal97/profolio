# Profolio Modernisation Sweep - Design

_Date: 08-08-2026_
_Status: Approved for implementation_

## Executive Summary

Profolio has been dormant since 10-09-2025 (last commit) and is currently offline.
A fresh install **cannot start**: the Prisma migration chain fails on its first
migration, and four tables plus the Stripe columns exist only in `schema.prisma`
with no migration behind them.

This spec covers a full modernisation sweep that keeps every existing feature:
repair the blockers, patch security, containerise, take every major version bump,
restore broken runtime behaviour, and re-establish tests and docs.

**Decisions taken:**

- Target: full modernisation sweep, every major version.
- Scope: keep all features (Firebase + local auth, Stripe, RBAC/admin,
  invitations, bash installer, PWA, 2FA). Nothing is deleted for scope reasons.
- Cadence: checkpoint after each phase.
- TypeScript 7: included as a first-class part of the sweep.

## Current State Analysis

### Verified blockers

Each of the following was reproduced, not inferred.

**B1. Migration chain fails on a fresh database.**
`20250106_add_two_factor_auth` sorts lexicographically before
`20250503061900_init`. Prisma applies migrations in folder-name order, so it runs
first and immediately references a table that does not exist yet. Reproduced
against a scratch database:

```
Applying migration `20250106_add_two_factor_auth`
Error: P3018 - ERROR: relation "User" does not exist
```

The folder was hand-created, which `CLAUDE.md` explicitly prohibits.

**B2. Schema/migration drift.**
`prisma migrate diff` (run with the ordering temporarily corrected) reports these
exist in `schema.prisma` with no migration:

- Tables: `RateLimitRule`, `RateLimitEvent`, `BotDetectionEvent`,
  `PasswordSetupToken`
- `User` columns: `stripeCustomerId`, `subscriptionId`, `subscriptionStatus`,
  `subscriptionTier`, `subscriptionEndDate`, `trialEndDate`

Rate limiting runs as global middleware on every request, so on a fresh database
every request would fail. Last migration is dated 11-06-2025; code continued to
land until 10-09-2025.

**B3. Market data provider is dead.**
`query1` and `query2` Yahoo endpoints were tested live with the application's
exact headers, with and without a cookie jar. Every attempt returned
`HTTP 429 Too Many Requests` on the first request. Yahoo now requires
crumb/cookie authentication that the hand-rolled scraper does not perform.

**B4. Frontend does not type-check.**
`usePagePreloader.ts` has duplicate object keys at lines 99 and 120, from an
uncommitted find/replace of `/app/portfolio` to `/app/assetManager`. Production
builds run strict checking, so this fails the build.

**B5. Redis is a hard boot dependency.**
`RedisService.onModuleInit` rethrows on connection failure, taking the entire
backend down when Redis is unavailable.

**B6. Browser calls the backend directly.**
`useNotifications.ts` and `useUpdates.ts` construct `http://localhost:3001` or
`https://<host>:3001` and fetch from the client. This violates the project's own
proxy rule and breaks behind any reverse proxy. The proxy routes
(`/api/notifications`, `/api/notifications/unread-count`) already exist and are
unused.

### Security

- 236 advisories: 10 critical, 115 high.
- Production-relevant: Next.js RCE in the React flight protocol (on 15.5.2, fixed
  in 15.5.7), `next-auth` critical (fixed in 4.24.15), `jws` HMAC signature
  verification bypass (in the auth path), `multer` DoS, `validator`,
  `path-to-regexp`.
- `PrismaService` sets `log: ["query", "error", "info", "warn"]` unconditionally,
  writing every SQL statement and its parameters (emails, transaction amounts) to
  logs in production.
- Root `.env` contains a commented-out `NEXT_PUBLIC_STRIPE_SECRET_KEY`. That
  prefix would expose a secret key to the browser if ever uncommented. Env files
  are correctly gitignored and were never committed (history verified).

### Dead and half-built code

- `mockApi.ts` and `mockData.ts`: zero consumers.
- `usePagePreloader` preloads paths that have never existed
  (`/_next/static/css/charts.css`, `/_next/static/chunks/recharts.js`), producing
  404s on every navigation.
- `marketDataWidget` fabricates random prices as a fallback outside demo mode.
- Admin: complete backend (users, groups, permissions, invitations, rate-limit)
  and e2e tests, but the page is a 46-line "Coming Soon" stub.
- Email sending never implemented (password setup, payment failure).
- `redis` package installed but unused; only `ioredis` is imported.
  `@types/redis` is flagged deprecated by npm.
- Backend lint: 1 error (`no-useless-catch`, `auth.controller.ts:281`), 102
  warnings.

### Upgrade blast radius (measured)

Frontend legacy surface is small: 1 `forwardRef`, 0 `defaultProps`, 0
`propTypes`, and async `params` already use the Next 15 `Promise` signature.

| Package         | Current | Latest  | Files affected      |
| --------------- | ------- | ------- | ------------------- |
| next            | 15.5.2  | 16.3.0  | app-wide            |
| react/react-dom | 18.3.1  | 19.2.8  | app-wide            |
| framer-motion   | 12.23   | 13.0.0  | 49                  |
| lucide-react    | 0.507   | 1.30.0  | 15                  |
| recharts        | 2.15    | 3.10.1  | 3                   |
| firebase        | 11.10   | 12.17.1 | 2                   |
| react-dropzone  | 14.3    | 20.0.0  | 1                   |
| @prisma/client  | 6.15    | 7.9.1   | 19 import sites     |
| ioredis         | 5.7     | 6.0.0   | 1 service           |
| bcrypt          | 5.1     | 6.0.0   | auth services       |
| typescript      | 5.9.2   | 7.0.2   | config only (below) |

### TypeScript 7 probe (measured)

TypeScript 7.0.2 is GA (`latest` on npm). It was installed in isolation and run
against both packages.

- **Backend application code: 0 errors.** The full NestJS codebase compiles clean
  with `experimentalDecorators` and `emitDecoratorMetadata`. This was the single
  largest unknown and it is resolved.
- **Frontend: 3 errors.** Two are the B4 duplicate-key bug. One is new:
  TS 7 requires a declaration for the side-effect CSS import in `layout.tsx`.
- **Config changes required:** `baseUrl` removed (both packages),
  `moduleResolution: node10` removed (backend), paths must be relative.

The compiler is therefore low-risk. The genuine risk is the surrounding tooling:
`ts-jest`, `@nestjs/cli` (invokes tsc), `typescript-eslint`, `ts-node` (Prisma
seed). TS 7 is sequenced accordingly - early enough to find tooling breakage with
a working baseline, not last.

## Design

### Sequencing principle

**Stabilise, then upgrade.** The application cannot start today, so there is no
baseline against which to verify an upgrade. Taking the majors first would mean
debugging framework breakage and a broken migration chain simultaneously with no
way to attribute a failure to either. Every phase ends at a runnable state.

### Phase 0 - Make it start

Goal: a fresh database migrates cleanly and both services boot.

1. Renumber `20250106_add_two_factor_auth` to sort after `init`, preserving its
   contents. Document the rename for anyone holding an existing database, whose
   `_prisma_migrations` table records the old name.
2. Generate the missing migration for the four drifted tables and the Stripe
   columns using `prisma migrate dev`. Never hand-author the SQL.
3. Fix the duplicate keys in `usePagePreloader.ts`, restoring the two distinct
   route entries that the find/replace collapsed.
4. Make `RedisService` degrade gracefully: log and continue, with rate limiting
   failing open rather than taking the process down.
5. Gate Prisma query logging on `NODE_ENV`.
6. Fix the `no-useless-catch` lint error.

**Exit criteria:** `prisma migrate deploy` succeeds against an empty database;
`tsc --noEmit` passes in both packages; backend and frontend both boot.

### Phase 1 - Security, no majors

In-range bumps only, deliberately separated from Phase 3 so the critical fixes
land even if the majors prove messy.

- `next` to 15.5.10 (closes the RCE and the two DoS advisories).
- `next-auth` to 4.24.15.
- Transitive resolution for `jws`, `multer`, `validator`, `path-to-regexp`.
- Re-run `pnpm audit` and record the remaining count.

**Exit criteria:** zero critical advisories in production dependency paths;
application still boots and type-checks.

### Phase 2 - Docker Compose

Postgres, Redis, backend, frontend. This is the tool that makes Phase 3 safe: a
clean, reproducible environment in which each upgrade wave can be verified from
scratch. The existing bash installer stays untouched and supported; Compose is an
addition, not a replacement.

**Exit criteria:** `docker compose up` from a clean checkout reaches a working
login screen.

### Phase 3 - Majors, in dependency-ordered waves

Each wave is independently verifiable and independently revertible.

- **A. Backend low-risk.** NestJS patch bumps, `helmet`, `bcrypt` 5 to 6,
  `ioredis` 5 to 6. Remove the unused `redis` package and deprecated
  `@types/redis`.
- **B. TypeScript 7.** `baseUrl` removal and relative paths in both tsconfigs,
  `moduleResolution` update, the `declare module '*.css'` declaration, and jest
  types wiring. Then verify the toolchain: `ts-jest`, `nest build`, `ts-node`
  seed, `typescript-eslint`. Placed here so tooling breakage surfaces against a
  known-good baseline.
- **C. Prisma 6 to 7.** The largest single migration. The `prisma-client-js`
  generator is replaced by `prisma-client`; generated output moves out of
  `node_modules` to a project path; `@prisma/adapter-pg` becomes a required
  driver adapter. Requires a `PrismaService` rewrite and updating 19 import
  sites.
- **D. React 19 and Next 16 together.** Next 16 requires React 19, so they move
  as one. `@next/codemod upgrade latest` plus the async request APIs codemod.
  Turbopack config moves from `experimental.turbopack` to top level. Note the
  custom webpack `splitChunks` config in `next.config.js` is ignored by
  Turbopack and needs a decision: port it or drop it.
- **E. Frontend libraries.** recharts 2 to 3, framer-motion 12 to 13,
  lucide-react, react-dropzone 14 to 20, firebase 11 to 12, Tailwind 4.1 to 4.3.
- **F. Tooling.** ESLint 9 to 10, and migrate `next lint` to the ESLint CLI,
  which Next 16 requires.

**Exit criteria per wave:** type-check, lint, and boot all pass before the next
wave starts.

### Phase 4 - Restore function

1. Replace the hand-rolled Yahoo scraper with `yahoo-finance2` (v4.0.1, published
   07-08-2026, actively maintained; it performs the crumb/cookie authentication
   that is currently failing). Put it behind a provider interface so a paid
   provider can be substituted without touching call sites. Keep the existing
   circuit breaker and backoff.
2. Repoint `useNotifications` and `useUpdates` at the existing proxy routes;
   remove the direct-to-backend URL construction.
3. Build the admin UI against the backend that already exists, satisfying the
   `admin-dashboard.spec.ts` tests already written.
4. Delete `mockApi.ts` and `mockData.ts`.
5. Remove the phantom preload paths from `usePagePreloader`.
6. Confine `marketDataWidget`'s fabricated prices to demo mode only.
7. Implement email sending for password setup and payment failure.
8. **Fix token storage in production builds.** Found while verifying Phase 2.
   `setSecureToken` (`frontend/src/lib/localAuth.ts:37`) writes a cookie only
   when `NODE_ENV === "development"`; in production it logs a warning and
   stores nothing. Demo sign-in therefore stores no token and the `/app/*`
   guard bounces straight back to sign-in - reproduced in the container, and
   it fails the same way in any production build.
   `getSecureToken` compounds this by gating reads on
   `window.isSecureContext`, which is true on `localhost` but false on a
   plain-HTTP LAN address such as `http://192.168.1.54:3000` - precisely how
   a home-server deployment is reached. The three API routes that do set the
   cookie server-side (`auth/login`, `auth/signin`, `auth/firebase-exchange`)
   all set `secure: NODE_ENV === "production"`, which a browser rejects over
   plain HTTP.
   Net effect: self-hosting over plain HTTP cannot hold a session. Either the
   token must always be set server-side as an httpOnly cookie, or the
   deployment must be documented as HTTPS-only. This needs deciding before
   the home-server deployment is trusted.

### Phase 5a - React Compiler lint debt

Added during Phase 3D. eslint-config-next 16 ships a new React Compiler rule
family as errors, flagging 51 pre-existing violations:

| Rule                                      | Count |
| ----------------------------------------- | ----- |
| `react-hooks/set-state-in-effect`         | 29    |
| `react-hooks/purity`                      | 9     |
| `react-hooks/static-components`           | 4     |
| `react-hooks/preserve-manual-memoization` | 3     |
| `react-hooks/set-state-in-render`         | 2     |
| `react-hooks/immutability`                | 2     |
| `react-hooks/refs`                        | 2     |

These are real problems - setState inside effects causes cascading renders,
impure render breaks memoisation, unstable component identity remounts
subtrees. Several of them are plausible contributors to the "1-4 second page
delays" already recorded as a known issue.

They are demoted to warnings in `eslint.config.mjs` so the upgrade could land
without a large refactor riding along. Work through them by rule, raising each
back to `error` as it reaches zero. `set-state-in-effect` is the bulk and the
most likely performance win.

### Phase 5 - Tests and docs

1. Unit coverage on financial calculations first (`financial.ts`,
   `transactionClassifier.ts`), where correctness matters most and coverage is
   currently zero.
2. Consolidate the two Playwright test directories (`frontend/e2e` and
   `frontend/tests/e2e`).
3. Re-align `CLAUDE.md` and `README.md` with reality: version is 1.18.0 on
   `main`, not 1.13.1 on `css-architecture-foundation`; state actual test
   coverage rather than the aspirational 80/100 percent figures.
4. Prune the three `backup-*` branches and the stale local branches.

## Risks

| Risk                                         | Mitigation                                                            |
| -------------------------------------------- | --------------------------------------------------------------------- |
| Prisma 7 adapter migration is invasive       | Own wave, after TS 7 is settled; revertible in isolation              |
| Next 16 Turbopack drops custom splitChunks   | Decide explicitly during wave D; measure bundle before and after      |
| framer-motion 13 touches 49 files            | Mechanical; type-check catches API changes                            |
| Existing databases record old migration name | Document the `_prisma_migrations` rename; provide a resolve step      |
| yahoo-finance2 is also unofficial            | Provider interface means swapping to a paid API is a contained change |

## Success Criteria

- `docker compose up` from a clean checkout reaches a working login screen.
- `prisma migrate deploy` succeeds against an empty database.
- Zero critical advisories in production dependency paths.
- Type-check and lint pass in both packages.
- Live market data returns real prices.
- Notifications and updates work behind a reverse proxy.
- Admin UI is functional rather than a stub.
- Docs describe the system as it actually is.
