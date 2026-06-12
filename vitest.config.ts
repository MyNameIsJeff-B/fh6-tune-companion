import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    exclude: ["automation/**/*.test.mjs", "node_modules/**", "dist/**"],
  },
});
