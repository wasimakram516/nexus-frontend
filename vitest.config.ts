// Run every test in a browser zone (UTC-7/-8) that differs from the campus zones the
// attendance tests use (Asia/Karachi), so campus-local handling is proven, not coincidental.
process.env.TZ = "America/Los_Angeles";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
    exclude: ["node_modules", ".next", "e2e"],
    // Default 5s is too tight for jsdom + MUI render/interaction tests under
    // parallel-worker CPU contention; raised to cut spurious CI flakiness.
    testTimeout: 20000,
    // Keep jsdom/MUI workers bounded so full-suite resource pressure is reproducible.
    pool: "threads",
    maxWorkers: 1,
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000",
      NEXT_PUBLIC_API_VERSION: "v1",
      NEXT_PUBLIC_NEXUS_URL: "http://localhost:3000",
      NEXT_PUBLIC_WISEMENSOFT_URL: "https://wisemensoft.com",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportOnFailure: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/test/**"],
      // Preserve the agreed engineering gate. Missing coverage must fail CI
      // until verified behavior tests meet it; do not lower the target.
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
