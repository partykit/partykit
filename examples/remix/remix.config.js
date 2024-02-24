/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  server: "./app/server.ts",
  serverConditions: ["partykit", "workerd", "worker", "browser"],
  serverMainFields: ["browser", "module", "main"],
  serverMinify: false,
  serverModuleFormat: "esm",
  serverPlatform: "neutral",
  assetsBuildDirectory: "public/dist",
  serverBuildPath: "dist/index.js",
  publicPath: "/dist/",
  dev: {
    port: 8002
  }
};
