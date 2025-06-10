import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "../tests/backend/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "coverage/",
        "**/*.d.ts",
        "**/*.config.*",
        "prisma/migrations/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/modules": resolve(__dirname, "./src/modules"),
      "@/common": resolve(__dirname, "./src/common"),
      "@/config": resolve(__dirname, "./src/config"),
    },
  },
});
