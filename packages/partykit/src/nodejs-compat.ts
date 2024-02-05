import type { Plugin } from "esbuild";

// via https://developers.cloudflare.com/workers/runtime-apis/nodejs/
const supportedNodeBuiltins = [
  "assert",
  "async_hooks",
  "buffer",
  "diagnostics_channel",
  "events",
  "path",
  "process",
  "stream",
  "string_decoder",
  "util",
  "crypto"
];

const plugin: Plugin = {
  name: "nodejs-compat",
  setup(build) {
    // mark all cloudflare:* imports as external
    build.onResolve({ filter: /^cloudflare:/ }, (args) => {
      const cloudflareModuleName = args.path.split(":")[1];
      return {
        path: `partykit-exposed-cloudflare-${cloudflareModuleName}`,
        external: true
      };
    });

    build.onResolve({ filter: /^node:/ }, (args) => {
      const name = args.path.replace(/^node:/, "");
      if (supportedNodeBuiltins.includes(name)) {
        return { path: args.path, external: true };
      } else {
        throw new Error(`Unsupported node builtin: ${name}`);
      }
    });
    build.onResolve(
      { filter: new RegExp(`^(${supportedNodeBuiltins.join("|")})$`) },
      async (args) => {
        // TODO: we want to use import.meta.resolve here
        // but it's too early to use, and my experiments with
        // it always log node:process (instead of any existing package)
        // So let's land this and revisit if folks want differently
        return { path: `node:${args.path}`, external: true };
      }
    );
  }
};

export default plugin;
