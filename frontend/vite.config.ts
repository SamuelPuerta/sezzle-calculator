/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // In dev, forward /api to the Go server so the browser sees one origin (no CORS).
    proxy: { "/api": "http://localhost:8080" },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/main.tsx", "src/setupTests.ts", "src/**/*.test.*"],
      reporter: ["text", "html"],
    },
  },
});
