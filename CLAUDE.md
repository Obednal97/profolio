# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## Project Overview

Profolio is a privacy-focused portfolio management system: assets, expenses,
properties, market data. Next.js 16 (App Router, React 19), Prisma 7 on
PostgreSQL.

**Version**: 1.18.0 · **Default branch**: `main`

## ⚠️ Read this first: the repository is mid-migration

The app is being collapsed from two services (a Next.js frontend plus a
separate NestJS backend) into **one Next.js application**. Which structure you
are looking at depends on the branch.

| Branch            | Structure                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `main`            | Two packages: `frontend/` and `backend/`, pnpm workspace. This is what is deployed.              |
| `feat/single-app` | Single app at the repo root. `backend/` is **reference-only** and excluded from tsconfig/eslint. |

Design and rationale: `docs/superpowers/specs/2026-08-08-single-app-migration-design.md`.
Migration status is at the bottom of that file — **read it before continuing the
port**.

On `feat/single-app`, `backend/src` still exists purely as the source to port
from. Its dependencies are not installed, so it cannot compile. Do not try to
fix its type errors; read it, port the logic to `src/server/`, and it gets
deleted at the end.

## Critical warnings

- **ALWAYS** use `pnpm`, never npm or yarn.
- **DO NOT** run `dev` or `build` unless asked, or the task needs verification.
- **NEVER** build custom authentication or cryptography — and specifically, do
  not change the encryption envelope format or key derivation in
  `src/server/crypto/encryption.ts`: existing rows become unreadable and there
  is no re-encrypt path.
- **ALWAYS** use UK date formats (DD-MM-YYYY) and UK spelling.
- **NEVER** add Claude attribution or co-authoring to commits or PRs.
- **Only commit files you changed.** No `git add -A`, no `git commit -a`,
  unless explicitly asked.

## Commands

On `feat/single-app`, everything runs from the repo root:

```bash
pnpm dev                 # dev server (Next 16 + Turbopack)
pnpm build               # production build
pnpm type-check          # tsc --noEmit
pnpm lint                # eslint (max 80 warnings)
pnpm test                # playwright e2e
pnpm prisma:generate
pnpm prisma:migrate      # migrate dev
```

`vercel-build` runs `prisma generate && prisma migrate deploy && next build`,
so a failed migration halts the deploy and the previous version keeps serving.

Full stack locally (Postgres + Redis + app):

```bash
cp .env.docker.example .env.docker   # set JWT_SECRET and API_ENCRYPTION_KEY
docker compose --env-file .env.docker up --build
```

## Architecture

```
prisma/                  schema + 17 migrations
prisma.config.ts         DIRECT_URL for migrations (not the pooled URL)
src/
  app/                   pages and route handlers
  server/                server-only code. Every file starts `import "server-only"`.
    db.ts                the single Prisma client
    auth/session.ts      getSession / requireUser / requireAdmin
    http/errors.ts       AppError hierarchy, assertOwned
    http/handler.ts      withRoute(): validation + auth + error mapping
    money.ts             MoneyUtils
    crypto/encryption.ts AES-256-GCM for 2FA secrets
    modules/<name>/      ported domain services
  components/ hooks/ lib/
```

### Route handlers

Handlers are thin. Wrap them in `withRoute` and put the logic in
`src/server/modules/`:

```ts
export const POST = withRoute({
  body: CreateAssetSchema, // zod, .strict()
  handler: ({ body }) => createAsset(body),
});
```

`withRoute` replaces NestJS's ValidationPipe, guards and exception filter.
Validation is **strict** — an unknown property is a 400, matching the old
`forbidNonWhitelisted: true`. Always use `.strict()` on object schemas; zod
strips silently otherwise.

### Authorisation

**Authorisation lives in the service layer, never in `proxy.ts`.** Next's docs
state proxy may be CDN-deployed and must not be relied on for authz, and a
page-level check does not protect a Server Action defined in that page.

Every service function calls `requireUser()` itself and asserts ownership.
A forgotten check is an unauthenticated endpoint with **no compiler error** —
that is exactly how the `portfolio-history` IDOR happened. Never trust a user
id from a path, query or body; take it from the session.

## Conventions that have caused real bugs

Each of these has produced a live defect. Treat them as load-bearing.

- **Money is integer cents at rest.** Convert only at the service boundary:
  `toCents` on write, `fromCents` on read. Interest rates are basis points.
- **`current_value` on an asset is the TOTAL position value, not a unit
  price.** Price sync writes `quantity * price` into it. Multiplying by
  quantity again double-counts.
- **Market-data prices arrive in dollars.** Do not pass them through
  `fromCents`; that divided every synced valuation by 100.
- **`Asset.symbol` is a foreign key to `Symbol.symbol`.** Upsert the symbol
  before creating or updating an asset, or every holding with a ticker fails
  with a foreign key violation.
- **The auth cookie is `auth-token`,** defined once in `src/lib/authCookie.ts`.
  Never write the name inline. `secure` is derived from the request, not
  `NODE_ENV`, because a Secure cookie is rejected over plain HTTP and
  self-hosted installs run on plain HTTP LAN addresses.
- **Demo mode is signalled by a `demo-mode` cookie,** not localStorage. Server
  code cannot see localStorage.
- **Never fabricate financial data.** No mock prices, no invented trends, no
  placeholder portfolio values. If data is unavailable, say so. Fabricated
  numbers in a portfolio tracker are worse than an error.

## Type safety

- **BANNED**: `any`, `as any`, implicit any. Pre-commit enforces a limit of
  **0**; use `unknown` plus a type guard, or a proper interface.
- All function parameters and API responses are explicitly typed.
- Add `data-testid` to interactive elements.

## Testing reality

Be honest about the safety net: there is almost none. Two backend jest specs
(27 tests, Redis and Prisma mocked) and Playwright e2e that is largely skipped
or written against UI that was never built. **Every recent repair was verified
by hand.** After any significant change, verify by running the thing, not by
reading it — and say plainly what you ran.

The manual checklist that matters is in the migration spec.

## Deployment

Two Vercel projects on team `obednal97s-projects` (never the Fanvue team):

| Project             | URL                                |
| ------------------- | ---------------------------------- |
| `profolio-frontend` | profolio-frontend-three.vercel.app |
| `profolio-backend`  | profolio-backend-mu.vercel.app     |

Neon Postgres (London) and Upstash Redis are attached to the backend. Secrets
were set `--sensitive`, so their values **cannot be read back** — plan for
recreation rather than retrieval. Rotating `JWT_SECRET` signs everyone out;
rotating `API_ENCRYPTION_KEY` makes stored secrets undecryptable.

The migration cuts over to a **new project against a Neon branch**, leaving
both existing projects live until it is proven.

`install.sh`, `profolio.sh` and `docker-compose.yml` support self-hosting and
remain supported. The self-update feature is permanently disabled.

## Documentation

- Migration design and status: `docs/superpowers/specs/2026-08-08-single-app-migration-design.md`
- Modernisation sweep: `docs/superpowers/specs/2026-08-08-modernisation-design.md`
- Changelog: `CHANGELOG.md`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
