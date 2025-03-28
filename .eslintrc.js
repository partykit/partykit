module.exports = {
  reportUnusedDisableDirectives: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    project: [true, "tsconfig.base.json"],
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react-hooks/recommended",
    "plugin:deprecation/recommended"
  ],
  ignorePatterns: [
    "node_modules",
    "dist",
    "lib",
    "coverage",
    ".eslintrc.js",
    "*.d.ts",
    "apps/site/dist",
    "apps/docs/dist",
    "apps/blog/dist",
    "packages/partykit/init/index.js",
    "packages/party.io/**/*.test.ts",
    "packages/partykit-ai/src/index.ts"
  ],
  rules: {
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/return-await": "error",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        // vars: "all",
        varsIgnorePattern: "^_",
        // args: "after-used",
        argsIgnorePattern: "^_"
      }
    ],

    // Todo: consider investigating, for each of these, whether they should be enabled
    "@typescript-eslint/no-misused-promises": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/restrict-plus-operands": "off",
    "@typescript-eslint/restrict-template-expressions": "off"
  },
  root: true
};
