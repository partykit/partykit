import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["verbose"],
    threads: false,
    testTimeout: 1000,
    setupFiles: ["./vitest.setup.js"],
  },
});
