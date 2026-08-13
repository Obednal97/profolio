# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## Project Overview

Profolio is a privacy-focused portfolio management system: assets, expenses,
properties, market data. Next.js 16 (App Router, React 19), Prisma 7 on
PostgreSQL.

**Version**: 2.0.0 · **Default branch**: `main`

## ⚠️ Read this first: two branches, two structures

The separate NestJS backend has been merged into the Next.js application. What
you are looking at depends on the branch.

| Branch            | Structure                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `main`            | Two packages, `frontend/` and `backend/`, in a pnpm workspace. Still what is deployed today. |
| `feat/single-app` | **One application at the repo root.** `backend/` is gone. 53 route handlers, no proxies.     |

Design, rationale and a per-stage record of what was fixed:
`docs/superpowers/specs/2026-08-08-single-app-migration-design.md`.

`backend/` and `frontend/` may still exist in a local checkout as untracked
build output, `.vercel` links and `.env` files. Both are excluded from tsconfig
and eslint. Nothing reads them; they are safe to delete.

What remains before `feat/single-app` can replace `main`: create the Vercel
project against a Neon branch, set the environment variables, and work through
the manual checklist in the migration spec.

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

Everything runs from the repo root:

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
    demo.ts              demo-mode detection, shared with session.ts
    modules/<name>/      domain services: one per former NestJS module
  components/ hooks/ lib/
```

`src/server/modules/` holds auth, assets, expenses, properties, market-data,
notifications, api-keys, billing and admin. Each is `service.ts` plus
`schemas.ts`, and the route handlers under `src/app/api/` are thin wrappers.

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
- **Price sync writes `quantity * price`, per asset.** It cannot use
  `updateMany`, because the quantity differs per holding. Writing the unit
  price straight into `current_value` repriced every synced holding to a
  hundredth of its unit price, and that is exactly what it used to do.
- **Third-party API keys use a different encryption envelope** from 2FA
  secrets: `server/modules/api-keys/crypto.ts` versus
  `server/crypto/encryption.ts`. They are not interchangeable, and both derive
  their key lazily so that importing a route module cannot throw.
- **Expense amounts are cents on the wire**, unlike assets and properties which
  use dollars. The expense form converts in both directions; the others do not.
- **Never fabricate financial data.** No mock prices, no invented trends, no
  placeholder portfolio values. If data is unavailable, say so. Fabricated
  numbers in a portfolio tracker are worse than an error. Three separate places
  did this - a sine wave for the performance chart, a flat line for the asset
  manager, and `price: 0` when the market-data proxy failed - and all three are
  gone.

## Type safety

- **BANNED**: `any`, `as any`, implicit any. Pre-commit enforces a limit of
  **0**; use `unknown` plus a type guard, or a proper interface.
- All function parameters and API responses are explicitly typed.
- Add `data-testid` to interactive elements.

## Testing reality

Be honest about the safety net: there is almost none. The backend jest specs
went with the backend, and the Playwright e2e is largely skipped or written
against UI that was never built. **Every repair in this migration was verified
by hand**, against a throwaway Postgres in Docker driven with curl — 191
assertions across the four stages, and each one found something. After any
significant change, verify by running the thing, not by reading it, and say
plainly what you ran.

The manual checklist that matters is in the migration spec.

## Deployment

Two Vercel projects on team `obednal97s-projects` (never the Fanvue team):

| Project             | URL                                |
| ------------------- | ---------------------------------- |
| `profolio-frontend` | profolio-frontend-three.vercel.app |
| `profolio-backend`  | profolio-backend-mu.vercel.app     |

Both serve `main`. `feat/single-app` needs **one** project, and cutover means
creating a new one against a Neon branch and leaving these two running until it
is proven.

Neon Postgres (London) and Upstash Redis are attached to the backend project.
Secrets were set `--sensitive`, so their values **cannot be read back** — plan
for recreation rather than retrieval. Rotating `JWT_SECRET` signs everyone out;
rotating `API_ENCRYPTION_KEY` makes stored 2FA secrets undecryptable, and
`API_KEY_ENCRYPTION_SECRET` does the same for stored provider keys.

Environment variables the merged app needs: `DATABASE_URL`, `DIRECT_URL`,
`JWT_SECRET` (32+ characters, enforced), `API_ENCRYPTION_KEY`,
`API_KEY_ENCRYPTION_SECRET`, `CRON_SECRET`. Optional: the `STRIPE_*` set, the
`FIREBASE_*` set, `NEXT_PUBLIC_ENABLE_DEMO_MODE`. Everything optional degrades
to a 503 rather than a crash.

`NEXT_PUBLIC_DEPLOYMENT_MODE` is `cloud` or unset. It decides whether the app
calls itself self-hosted and whether the landing page shows, and it is separate
from `NEXT_PUBLIC_AUTH_MODE`, which only chooses between local and Firebase
sign-in. Conflating the two made a hosted deployment announce itself as
self-hosted and skip its own landing page.

**Rate limiting is inert until Redis is attached.** `src/server/http/rate-limit.ts`
enforces only when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are
set, or the `KV_REST_API_URL`/`KV_REST_API_TOKEN` pair that Vercel's Upstash
integration injects. With neither it allows every request and logs one warning.
It also fails **open** on a Redis error: locking people out of their accounts
because a cache is unreachable is worse than the abuse it prevents. Attach
Upstash through the Marketplace to switch it on; nothing else needs changing.

`vercel.json` registers the six-hourly price sync against
`/api/cron/sync-prices`, which is the only scheduled work.

`install.sh`, `profolio.sh` and `docker-compose.yml` support self-hosting and
remain supported; compose is now one application container plus Postgres and
Redis. The self-update feature is permanently disabled — `/api/updates/*`
answers "disabled" rather than 404.

## Documentation

- Migration design and status: `docs/superpowers/specs/2026-08-08-single-app-migration-design.md`
- Modernisation sweep: `docs/superpowers/specs/2026-08-08-modernisation-design.md`
- Changelog: `CHANGELOG.md`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
