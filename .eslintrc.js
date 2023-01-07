const fs = require("fs");
const path = require("path");

function* walkTsConfigs(root) {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules") continue; // Ignore `node_modules`s
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walkTsConfigs(entryPath);
    } else if (entry.name === "tsconfig.json") {
      yield entryPath;
    }
  }
}

module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    project: ["tsconfig.base.json", ...Array.from(walkTsConfigs(__dirname))],
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: [
    "node_modules",
    "dist",
    "lib",
    "coverage",
    ".eslintrc.js",
    "vendor",
    "*.d.ts",
  ],
  rules: {
    "@typescript-eslint/consistent-type-imports": ["error"],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/return-await": "error",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        // vars: "all",
        varsIgnorePattern: "^_",
        // args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
  },
  root: true,
};
