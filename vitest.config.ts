import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["verbose"],
    pool: "forks",
    testTimeout: 5000,
    setupFiles: ["./vitest.setup.js"],
    exclude: ["./packages/party.io/**", "**/node_modules/**"],
    sequence: {
      concurrent: false
    }
  }
});
