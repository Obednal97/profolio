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

- ~~Property money is read back in cents, so values display 100x too large~~ -
  did not reproduce during M2; see the status section at the bottom
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

## STATUS - resume here

_Last updated: 08-08-2026. Branch `feat/single-app`, based on `main` at
`abf4530`._

### Done

| Commit    | What                                                                                                                                                                                                                                                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `69e6a9d` | This design document                                                                                                                                                                                                                                                                                                   |
| `5506c78` | **M0 restructure.** Single Next.js app at the repo root; pnpm workspace deleted. 304 files moved with `git mv` so history follows. `prisma/` and all 17 migrations moved intact. `package.json` merged from three files, zero NestJS dependencies remaining. `vercel-build` runs `migrate deploy` before `next build`. |
| `053a973` | **M0 foundation.** `src/server/{db,money}.ts`, `http/{errors,handler}.ts`, `auth/session.ts`, `crypto/encryption.ts`.                                                                                                                                                                                                  |
| `29263bd` | **M1 auth.** 17 proxy routes replaced by real handlers over `src/server/modules/auth/*`. Signing moved to `server/auth/tokens.ts`, cookie issuing to `server/auth/cookie.ts`. `/api/auth/delete-account` added; `/api/auth/login` deleted as a duplicate of `signin`.                                                  |
| `2c34262` | **M2 assets, expenses, properties.** Eight proxy routes replaced, `/api/assets/[id]` added, three dead property routes deleted. Services in `src/server/modules/{assets,expenses,properties}`.                                                                                                                         |
| `HEAD`    | **M3-M5 market data, the remaining modules, backend deleted.** `backend/` is gone: ~8,700 lines of NestJS removed, replaced by `src/server/modules/{market-data,api-keys,notifications,billing,admin}`. 53 route handlers, no proxies left.                                                                            |

Every stage was verified end to end against a throwaway Postgres in Docker,
driven with curl, rather than by reading the code: **73 assertions for M1, 61
for M2, 57 for M3-M5, 0 failures.**

M1 covered registration, strict validation, cookie flags, session resolution,
profile, password change, the full TOTP and backup-code lifecycle, the OAuth
password setup flow, and account deletion with dependent rows present.
`withRoute` and `session.ts` are proven against real traffic, which was the
point of doing auth first.

M2 covered the money round trip in both directions for all three modules, the
Symbol foreign key, per-field PATCH, the summary and history calculations, and
cross-account isolation: another user's asset is a 404 on read, update and
delete, and does not appear in their list.

M3-M5 covered API keys (encrypted at rest, masked in responses, a re-submitted
mask ignored), the symbol catalogue, admin-only endpoints, notifications,
billing degrading without Stripe, and the cron entry point rejecting a missing
or wrong secret. The price arithmetic was then checked against a live quote:
3 shares of AAPL at $313.33 stored `current_value = 93999` and a PriceHistory
row of 31333, and creating an MSFT holding returned immediately with a null
valuation which the `waitUntil` fetch filled in as 2 x $499.99 = 99998.

Verified at that point: install resolves as one package, Prisma client
generates, **0 type errors, 0 lint errors**, `next build` compiles, dev server
boots on Next 16 + Turbopack.

Fixed while porting: `encryption.ts` silently generated a random key when
`API_ENCRYPTION_KEY` was absent, which on serverless means a different key per
cold start and permanently undecryptable 2FA secrets - it now refuses to start
in production. `prisma.config.ts` prefers `DIRECT_URL`, because Neon's pooled
endpoint runs PgBouncer in transaction mode and cannot execute DDL.

### Fixed during M1

- **OAuth password setup could never have worked.** The setup token was hashed
  with bcrypt and then looked up by equality. bcrypt salts every call, so
  hashing the same token twice gives a different string and the row was
  unfindable - every verification returned "Invalid token". Now SHA-256, which
  is deterministic and correct for a 256-bit random value.
- `/api/auth/delete-account` did not exist, so the settings page delete button
  hit the Next 404 page. Implemented, deleting dependent rows explicitly
  because most relations to `User` lack `onDelete: Cascade`.
- The `firebase-exchange` route set its own cookie: 30-day lifetime for a
  24-hour token, `secure` from `NODE_ENV`. Now uses the shared helper.
- Profile update accepted `emailVerified` and `provider` and spread the DTO
  into Prisma, so a user could mark their own account verified.
- Two JWT implementations, one signing with `JWT_SECRET ||
"dev-jwt-secret-fallback"`. One signer now, and a secret under 32 characters
  is refused.
- Sign-in minted a token before checking whether 2FA was required, and timed
  differently for known and unknown emails.
- A Firebase sign-in overwrote `provider` for an account that already had a
  password; it is now `dual`.
- `encryption.ts` derived its key in the constructor, so importing the module
  threw when `API_ENCRYPTION_KEY` was absent - and `next build` imports every
  route module, so the application could not be built without the key. Derived
  lazily now; the envelope format is untouched.
- `localAuth.fetchUserProfile` read `profile.id`/`profile.name` off a
  `{ success, user }` envelope, so it always fell back to the email local part.
- `TwoFactorVerification` copied the session token into `localStorage`,
  undoing the point of the httpOnly cookie.

### Fixed during M2

- `/api/assets/[id]` had no handler at all, so `useAssets`, `useUpdateAsset`,
  `useDeleteAsset` and the asset manager's edit and delete buttons all received
  the Next 404 page.
- The asset form sends lowercase type names ("stock"); the database enum is
  upper case and `@IsEnum` rejected them, so no asset could be created from the
  UI. Both cases are accepted and normalised now.
- `generateMockHistory()` fed the performance chart a sine wave plus
  `Math.random()` around a hardcoded $10,000 - invented financial data
  presented as the user's own history. Replaced with a series computed from
  recorded prices, which is empty when nothing has been priced.
- `UpdateExpenseDto` was a copy of the create DTO rather than a PartialType, so
  a PATCH changing one field failed for missing the other three.
- Property money used `value ? Math.round(value * 100) : undefined`, so a
  legitimate zero became "not provided": no mortgage, no HOA and no rental
  income could not be recorded, and an edit meant to clear a field left the old
  value in place. The same truthiness test on read turned a stored zero into
  null.
- The expense form sends `parseFloat(x) * 100`, which for £19.99 is
  1998.9999999999998 - not an integer, and the column is one. Rounded on
  arrival.
- Asset and property forms posted `id` and `userId`; with strict validation
  that is a 400, and `userId` from a request body is never trusted anyway.
  Stripped client-side.
- The asset manager deleted via `DELETE /api/assets` with the id in the body,
  and edited with `PUT`. Now `DELETE` and `PATCH` on `/api/assets/{id}`.
- Editing an asset looked up `assetTypeFields["STOCK"]` against lowercase keys
  and rendered an empty type-specific section.
- Server-side demo mode checked `ENABLE_DEMO_MODE`, which nothing sets; the
  deployment sets `NEXT_PUBLIC_ENABLE_DEMO_MODE`. Demo mode was therefore off
  in production however it was configured.
- `/api/properties/{create,update,delete}` deleted - three POST-only variants
  of the REST routes with no callers.

**Not reproduced:** the inventory listed "property money converted to cents on
write but read back in cents, so values display 100x too large". The NestJS
service did convert on read (`convertCentsToDollars`), and a round trip through
the ported code returns dollars - verified with a £450,000 property reading
back as 450000 from a stored 45000000. The claim appears to have been wrong.

### Fixed during M3, M4 and M5

- **Price sync repriced every holding to a hundredth of its unit price.** It
  ran `updateMany({ data: { current_value: priceData.price } })`, and
  `current_value` is integer CENTS holding a POSITION TOTAL while `price` is a
  unit price in DOLLARS. A $313.33 share wrote 313, meaning $3.13, and the
  quantity was ignored entirely. Each asset is updated individually with
  `quantity x price` now. Verified against a live quote: 3 shares of AAPL at
  $313.33 stored 93999 cents.
- **Price sync never wrote PriceHistory**, so the portfolio chart had nothing
  to draw even when prices were being fetched. One row per asset per sync now.
- **The Vercel cron did nothing.** `syncAllPrices` returned early unless
  `startupCompleted`, set by a 30-second constructor timer that a cold start
  never reaches. That flag, `isRunning` and `lastSuccessfulSync` were all
  per-process state on a platform with no process between requests; the rewrite
  keeps none of it, and the 30-second pause between symbols is gone with them.
- `searchSymbols` returned `Symbol.current_price` raw while the module's other
  two readers converted from cents, so search results were a hundred times too
  large.
- The API-key encryption secret fell back to
  `"default-secret-key-change-in-production-this-must-be-32-bytes"`, a string
  committed to this repository. A deployment that forgot the variable encrypted
  every user's provider keys under a publicly known key and reported success.
- `/api/integrations/product-search/search` resolved **any** failed
  authentication to a demo identity, verified tokens with
  `JWT_SECRET || 'fallback-secret'`, and returned a shape
  (`data[0].offer.price`) that the endpoint it proxied never produced. Deleted;
  the asset form uses the symbol search.
- The market-data proxy answered `price: 0` when it could not reach the
  backend, which the asset form multiplied by quantity and displayed as a
  valuation.
- The asset manager manufactured chart data twice: a flat line from today's
  total when history came back empty, and again on any error.
- Admin user creation had no validators and wrote the password in plain text;
  admin listings returned whole `User` rows including the bcrypt hash and the
  Stripe ids.
- Two market-data endpoints documented as admin-only carried no role check.
- `/api/user/api-keys` kept a `demoTokens` Map in module scope that nothing
  ever wrote to, and verified the JWT itself. So did both Trading212 routes.
  All three use `session.ts` now, which was one of the stated reasons for
  merging in the first place.
- Billing returned 500 when Stripe was unconfigured; it reports 503, and a
  subscription read falls back to the local columns when Stripe is unreachable
  rather than reporting "no subscription".
- The Stripe webhook is deliberately outside `withRoute`: the signature covers
  the exact bytes Stripe sent, so the body is read with `request.text()` and
  passed through unparsed.
- `/api/health` did not exist in the merged app, and the Docker healthcheck was
  already pointed at it.

**Deleted rather than ported:** `src/updates/**` (drove git, npm and systemctl
through `child_process` against the host), `src/setup/**`, the rate-limit
service and middleware (matched rules against `/auth/signin` while `req.path`
carried the `/api` prefix, so nothing ever matched), the nine 0-byte admin
stubs, the Settings module (nothing reads its table - the settings page uses
the profile endpoint), and every catch-all proxy. `/api/updates/check` and
`/api/updates/status` remain, answering "disabled" rather than 404.

### Remaining

The port is done. What is left is the cutover:

1. Create the Vercel project against a **Neon branch**, not production.
2. Set `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `API_ENCRYPTION_KEY`,
   `API_KEY_ENCRYPTION_SECRET` and `CRON_SECRET`; optionally the `STRIPE_*`
   and `FIREBASE_*` sets.
3. Work through the manual checklist below against that deployment.
4. Promote by domain reassignment. `profolio-frontend` and `profolio-backend`
   stay live until then, and rollback is pointing the domain back.

Known gaps, none of them regressions: email delivery is still unimplemented, so
OAuth password setup refuses in production rather than pretending to send; rate
limiting does not exist and should be rebuilt on `@upstash/ratelimit` per route
rather than ported; and the demo token the client generates does not match the
format `session.ts` recognises, so a demo session still does not survive a
reload.

### Facts worth not rediscovering

- `backend/` is deleted. A local checkout may still hold untracked build
  output, `.vercel` links and `.env` files under `backend/` and `frontend/`;
  both stay excluded from tsconfig and eslint, and neither is read.
- Dead on arrival, do not port: nine 0-byte files (`groups`, `permissions`,
  `invitations`), `src/lib/*`, `src/config/configuration.ts`,
  `AllExceptionsFilter` (never registered), `auth/guards/auth.guard.ts` (third,
  unused guard), `StripeWebhookDto`. `RbacService.changeUserRole` and
  `initializeDefaultAdmin` have no callers and no route.
- `src/updates/**` and `src/setup/**` are deleted, not ported.
- In-memory state that does not survive serverless and must not be ported
  as-is: circuit breakers in `PrismaService` and `YahooFinanceService`,
  `RateLimitService.rulesCache`, `PriceSyncService.startupCompleted`
  (a 30s constructor `setTimeout` a cold start never clears),
  `UpdatesService` caches.
- Rate limiting has never worked: rules are matched by exact string against
  keys like `/auth/signin`, but `req.path` carries the `api` global prefix, so
  nothing matches. Rebuild it with `@upstash/ratelimit` per route rather than
  porting the middleware.
- Stripe webhooks need the raw body: `await request.text()` before any parsing.
- `assets.service.ts` fires `updateAssetPrice()` un-awaited; serverless freezes
  after the response, so this needs `waitUntil()`.
- The live database is empty, so secret rotation is currently free. It will not
  be once there is real data.

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
