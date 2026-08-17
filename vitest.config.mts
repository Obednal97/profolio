import { defineConfig } from "vitest/config";

/**
 * Unit tests only. Anything needing a browser or a database stays in
 * Playwright; this runs in plain Node so it is fast enough to run on every
 * change.
 *
 * `resolve.tsconfigPaths` is Vite's own reading of the `@/*` mapping in
 * tsconfig.json. The `vite-tsconfig-paths` plugin the Next.js guide reaches
 * for is no longer needed for it.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
