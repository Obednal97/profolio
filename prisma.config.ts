// Prisma 7 moved the Migrate connection string out of schema.prisma and into
// this file. The runtime client does not read it - that goes through the
// driver adapter in src/common/prisma.service.ts. This config is only used by
// CLI commands: migrate, db, studio.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    // Used by `migrate dev` and `migrate diff` to detect drift. Optional: when
    // unset Prisma creates a temporary shadow database automatically, which
    // requires the connection user to have CREATE DATABASE.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
});
