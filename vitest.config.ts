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
      // The 70% bar used on the backend (nexus-backend) isn't realistic here yet:
      // most Next.js route pages and shared components have no tests at all
      // (only the dashboard "*Manager" components built for M4.5 do). These
      // thresholds are set just under the actual current numbers (as of
      // 2026-09-18: ~42.8/39.4/34.7/44.2%) so CI reports real coverage instead
      // of silently claiming 70%, and fails only on a genuine regression below
      // today's baseline. Raise them incrementally as real tests are added —
      // closing this gap to 70% is tracked as backlog, not done in one pass.
      thresholds: {
        statements: 40,
        branches: 37,
        functions: 32,
        lines: 42,
      },
    },
  },
});
