import * as esbuild from "esbuild";
import fs from "fs";

process.chdir(`${__dirname}/../`);

const minify = process.argv.includes("--minify");
const isProd = process.argv.includes("--production");

esbuild.buildSync({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  minify,
  sourcemap: true,
  banner: isProd
    ? { js: "#!/usr/bin/env node" }
    : { js: "#!/usr/bin/env node --enable-source-maps" },
  define: {
    "process.env.NODE_ENV": `"${isProd ? "production" : "development"}"`,
  },
  outfile: "dist/index.mjs",
});

fs.chmodSync("dist/index.mjs", 0o755);
