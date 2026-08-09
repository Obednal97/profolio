import "server-only";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * The application's single Prisma client.
 *
 * Two failure modes this guards against, both previously hit in this project:
 *
 * 1. Client-per-module. Under NestJS, PrismaService was declared in 15 modules'
 *    providers arrays, so Nest built 15 clients each opening its own pool -
 *    375 potential connections against a default ceiling of 100. App Router has
 *    no DI container to make that mistake for us, but module-scoped
 *    instantiation would reproduce it per route file. Hence one module-level
 *    instance, cached on globalThis so dev hot-reload reuses it rather than
 *    leaking a client per recompile.
 *
 * 2. Pool sizing. Under Prisma 6 the configured size was decorative; Prisma 7
 *    delegates pooling to pg, so the number genuinely applies. Serverless
 *    scales instances horizontally, so the effective total is
 *    `max * instance count` - keep max small and let Neon's pooler absorb
 *    concurrency. 100 here would exhaust a stock Postgres from one instance.
 *
 * DATABASE_URL must be the POOLED Neon endpoint. Migrations use DIRECT_URL,
 * configured separately in prisma.config.ts.
 */

const globalForPrisma = globalThis as unknown as {
  prismaPool?: Pool;
  prisma?: PrismaClient;
};

const POOL_SIZE = Number(process.env.DATABASE_POOL_SIZE ?? 2);

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: POOL_SIZE,
    // Release idle clients quickly: a serverless instance may be frozen at any
    // moment, and a held-open connection counts against the database until it
    // times out server-side.
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
}

const pool = globalForPrisma.prismaPool ?? createPool();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
    // Query logging prints every statement and its parameters - emails,
    // transaction amounts - so it stays out of production logs.
    log:
      process.env.NODE_ENV === "production"
        ? ["error", "warn"]
        : ["error", "warn"],
    errorFormat: "colorless",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaPool = pool;
  globalForPrisma.prisma = prisma;
}
