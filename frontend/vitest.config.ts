import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "coverage/",
        "playwright-report/",
        "test-results/",
        "**/*.d.ts",
        "**/*.config.*",
        "next.config.js",
        "tailwind.config.ts",
        "postcss.config.mjs",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/components": resolve(__dirname, "./src/components"),
      "@/lib": resolve(__dirname, "./src/lib"),
      "@/hooks": resolve(__dirname, "./src/hooks"),
      "@/types": resolve(__dirname, "./src/types"),
      "@/app": resolve(__dirname, "./src/app"),
      "@/styles": resolve(__dirname, "./src/styles"),
      "@/config": resolve(__dirname, "./src/config"),
      "@/providers": resolve(__dirname, "./src/providers"),
    },
  },
});
