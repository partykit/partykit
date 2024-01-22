import fs from "fs";

import * as esbuild from "esbuild";

process.chdir(`${__dirname}/../`);

const minify = process.argv.includes("--minify");
const isProd = process.argv.includes("--production");

const createRequireSnippet = `
import { createRequire as topLevelCreateRequire } from "node:module";
import { fileURLToPath as topLevelFileURLToPath, URL as topLevelURL } from "node:url";
const require = topLevelCreateRequire(import.meta.url);
const __filename = topLevelFileURLToPath(import.meta.url);
const __dirname = topLevelFileURLToPath(new topLevelURL(".", import.meta.url));
`;

esbuild.buildSync({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  platform: "node",
  format: "esm",
  external: ["react-devtools-core", "yoga-wasm-web"],
  minify,
  alias: {
    "react-devtools-core": "create-partykit/rdt-mock.js"
  },
  sourcemap: true,
  banner: isProd
    ? { js: "#!/usr/bin/env node" + createRequireSnippet }
    : { js: "#!/usr/bin/env node --enable-source-maps" + createRequireSnippet },
  define: {
    "process.env.NODE_ENV": `"${isProd ? "production" : "development"}"`
  },
  outfile: "dist/index.mjs"
});

fs.chmodSync("dist/index.mjs", 0o755);
