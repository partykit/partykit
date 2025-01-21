import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["verbose"],
    pool: "forks",
    testTimeout: 5000,
    setupFiles: [
      "./vitest.setup.js",
      "./packages/partykit/src/tests/vitest.setup.ts"
    ],
    exclude: ["./packages/party.io/**", "**/node_modules/**"],
    sequence: {
      concurrent: false
    }
  }
});
