import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/index.ts",
        "**/*.css",
        "src/assets/**",
      ],
      thresholds: {
        statements: 78,
        branches: 70,
        functions: 82,
        lines: 79,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
      // tauri-pty has no "main" field, only "module" — resolve explicitly for vitest
      "tauri-pty": path.resolve(__dirname, "node_modules/tauri-pty/dist/index.es.js"),
    },
  },
});
