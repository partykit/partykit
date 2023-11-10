import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["verbose"],
    threads: false,
    testTimeout: 5000,
    setupFiles: ["./vitest.setup.js"],
    exclude: ["./packages/party.io/**", "**/node_modules/**"],
  },
});
