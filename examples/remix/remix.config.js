/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  server: "./app/server.ts",
  serverConditions: ["partykit", "workerd", "worker", "browser"],
  serverMainFields: ["browser", "module", "main"],
  serverMinify: false,
  serverModuleFormat: "esm",
  serverPlatform: "neutral",
  // appDirectory: "app",
  assetsBuildDirectory: "public/dist",
  serverBuildPath: "dist/index.js",
  publicPath: "/dist/",
  future: {
    v2_dev: true,
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
};
