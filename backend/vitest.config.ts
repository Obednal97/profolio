import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Look for tests in the centralized tests directory
    include: [
      "../tests/backend/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}",
      "../tests/backend/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
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
      "@/guards": resolve(__dirname, "./src/guards"),
      "@/decorators": resolve(__dirname, "./src/decorators"),
      "@/interceptors": resolve(__dirname, "./src/interceptors"),
      "@/pipes": resolve(__dirname, "./src/pipes"),
    },
  },
});
