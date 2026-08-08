# Single-App Migration - Design

_Date: 08-08-2026_
_Status: Approved for implementation_

## Goal

Collapse the separate NestJS backend into the Next.js application so there is
one deployable, one auth path, and one set of types.

## Why

The two-service split is the direct cause of a class of defect, not an
incidental cost. Measured evidence from this codebase:

- 45 frontend route files, 4,523 lines. **18 are pure proxies** whose entire
  job is to forward a request to the other service.
- **Three separate JWT verifications** in the frontend, two of which were
  broken (one used a hardcoded `'fallback-secret'`, one never verified at all).
- The Phase 4 defects - 12 routes missing the `/api` prefix, a cookie named
  `token` that 30 routes read as `auth-token`, browser code calling
  `localhost:3001`, unreachable sub-path handlers - are all boundary artefacts.
- Rate limiting has never worked: rules are matched by exact string against
  keys like `/auth/signin`, but `req.path` carries the `/api` global prefix, so
  nothing matches and every request is allowed.

Merging removes the category rather than fixing instances.

## Decisions taken

| Question   | Decision                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Structure  | Single Next.js app at repo root. No workspace, no Turborepo.                                                                 |
| Behaviour  | **Fix bugs as encountered**, not strict parity.                                                                              |
| Validation | **Strict** - unknown properties rejected, matching the current `forbidNonWhitelisted: true`.                                 |
| Cutover    | **New Vercel project against a Neon branch.** The existing two projects stay live and untouched until the new one is proven. |

### Why not Turborepo

Turborepo's value is a task graph across multiple buildable units. With one
deployable, `turbo run build` is `next build` with a config file in front of
it, and Vercel already caches that. Concretely harmful here: Prisma 7 is
ESM-only with a **required** `generator.output`, and a cross-package generated
client is exactly what breaks under Turbopack module resolution. Revisit only
when a second buildable thing exists; Turborepo supports single-package
workspaces, so it is not a rewrite later.

## Target structure

```
prisma/                      schema + 17 migrations, moved unchanged
prisma.config.ts             DIRECT_URL for migrate
src/
  app/                       pages + route handlers (real logic, not proxies)
  server/
    db.ts                    pg.Pool + attachDatabasePool + globalThis singleton
    auth/session.ts          requireUser() / requireAdmin(), React cache()
    http/errors.ts           AppError hierarchy -> HTTP status
    http/handler.ts          withRoute(): auth + zod + error mapping
    http/rate-limit.ts       @upstash/ratelimit
    modules/<name>/          service.ts + schema.ts, one per NestJS module
  components/ hooks/ lib/    unchanged
```

`src/server/modules/*` maps 1:1 onto the existing NestJS modules, so the port
is mechanical rather than inventive.

## Load-bearing design rules

**Authorisation lives in the service layer, never in `proxy.ts`.** Next's docs
state proxy may be CDN-deployed and must not be relied on for authz, and a
page-level check does not protect a Server Action defined in that page. Every
service function performs its own `requireUser()` plus an ownership check.
A missing guard produces no compiler error - that is exactly how the
`portfolio-history` IDOR happened - so ownership checks are a review item.

**Route Handlers stay; Server Actions are additive only.** Server Actions are
queued and serialise, so they are wrong for reads. The existing `app/api/*`
tree already mirrors the backend modules; those files stop proxying and start
implementing. TanStack Query needs no rewrite.

**One Prisma client, `globalThis`-cached, `max: 1-3`.** Without this each route
module gets its own client and pool per instance, which is the connection
exhaustion fixed in Phase 0, except Neon's ceiling is hit first.

**Migrations run in the build**, via `vercel-build`, so a failed migration
halts the deploy and the previous version keeps serving. Nothing currently runs
`migrate deploy` on Vercel - the live database was migrated by hand.

## Things that must not regress

Carried from the modernisation sweep, none of which has a test:

- httpOnly `auth-token` cookie, `secure` derived from the request not `NODE_ENV`
- Migration chain ordering and the drift migration
- `Symbol` FK upsert, without which no asset with a ticker can be created
- MoneyUtils cents-at-rest; `current_value` is a **total**, not a unit price
- yahoo-finance2 with no fabricated-price fallback
- Redis failing open, and `ADMIN_USER_SELECT` not leaking password hashes
- The six auth fixes in `cd414a0`

## Bugs to fix during the port

Found during inventory; all currently live:

- Property money is converted dollars->cents on write but **read back in cents**,
  so values display 100x too large
- `UpdateExpenseDto` is not `PartialType`, so a single-field PATCH fails
- A legitimate `0` becomes `undefined` via `@Transform` on property money fields
- `/api/assets/:id` has **no route handler**; `useAssets` and the asset manager
  404 today
- `/api/auth/delete-account` is called by settings and does not exist
- `PerformanceDashboard` GETs two POST-only routes
- Billing returns 500 rather than degrading when Stripe is unconfigured
- `AllExceptionsFilter` was never registered, so invalid money input is a 500
  rather than a 400
- Frontend/backend type disagreements: `snake_case` vs `camelCase`, lowercase vs
  `SCREAMING_CASE` enums, `Expense` fields that do not exist on the DTO

## Deleted rather than ported

- `src/updates/**` - self-update is permanently disabled; filesystem and
  `child_process` bound
- `src/setup/**` - writes `.env`, unauthenticated by design, filesystem-flag
  driven. Already gated off in production.
- Nine 0-byte files (`groups`, `permissions`, `invitations`), `src/lib/*`,
  `src/config/configuration.ts`, `AllExceptionsFilter`, `auth/guards/auth.guard.ts`
- All NestJS ceremony: modules, DI, decorators, Swagger annotations

## Sequence

0. Foundation: restructure, Prisma client, `withRoute`, session helpers
1. Auth (gates everything, carries the most defects)
2. Assets, Expenses, Properties
3. Market data
4. Notifications, Settings, API keys, Billing, Admin
5. Delete `backend/`, cut over

Each stage ends type-checking, linting and building.

## Cutover

- New Vercel project `profolio` against a **Neon branch**, never production.
- `profolio-frontend` and `profolio-backend` stay deployed throughout.
- Promote by domain reassignment once verified; rollback is pointing back.
- Secrets are recreated on the new project. Safe to rotate now because the
  database is empty - it will not be later, since rotating `API_ENCRYPTION_KEY`
  makes stored API keys undecryptable with no re-encrypt path.

## Verification

There are 27 mocked tests and one health check for 14,000 lines. The manual
checklist is the real gate, run against the new deployment before cutover:

1. Sign up, sign in, reload, sign out. `document.cookie` empty throughout.
2. Protected route returns 200 on the cookie alone, 401 without it.
3. Create a STOCK asset with a ticker - the Symbol FK path.
4. Synced valuation reads in dollars, not cents; property values likewise.
5. Empty account reads $0 across the dashboard.
6. Price sync writes a real quote, never a random one.
7. Redis unreachable - API still serves.
8. Non-admin gets 403 on admin routes; users cannot read each other's data.
