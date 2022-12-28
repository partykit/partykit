import * as esbuild from "esbuild";
import * as fs from "fs";

process.chdir(`${__dirname}/../`);

// clean build folder
fs.rmSync("dist", { recursive: true, force: true });

const minify = process.argv.includes("--minify");

// generate bin/index.js
esbuild.buildSync({
  entryPoints: ["src/bin.ts"],
  bundle: true,
  format: "cjs",
  outfile: "dist/bin.js",
  platform: "node",
  external: ["esbuild", "clipboardy", "@edge-runtime/primitives"],
  sourcemap: true,
  minify,
  define: {
    PARTYKIT_API_BASE: `"${process.env.PARTYKIT_API_BASE}"`,
  },
});

fs.chmodSync("dist/bin.js", 0o755);

// generate dist/client.js
esbuild.buildSync({
  entryPoints: ["src/client.ts"],
  bundle: true,
  format: "esm",
  outfile: "dist/client.js",
  sourcemap: true,
  minify,

  // platform: "browser", // ?neutral?
});

// generate dist/server.js
esbuild.buildSync({
  entryPoints: ["src/server.ts"],
  bundle: true,
  format: "esm",
  outfile: "dist/server.js",
  sourcemap: true,
  minify,
  // platform: "node", // ?neutral?
});

// generate a barrel file for the dist folder
// TODO: should probably add a log asking them to import
// from the individual files instead of the barrel file
fs.writeFileSync(
  "dist/index.js",
  `export * from './client.js'; export * from './server.js';`
);
