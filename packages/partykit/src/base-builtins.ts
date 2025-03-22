import type { Preset } from "unenv";

/**
 * We support and prioritize the list of default supported built-in Node.js APIs in the Workerd environment, **except** process (which is substituted by the matching `unenv` polyfill).
 * @see https://developers.cloudflare.com/workers/runtime-apis/nodejs/
 *
 * This list will be merged with `unenv`'s polyfills. The modules specified here will be preferred over unenv's polyfills.
 *
 * `process` is intentionally omitted from this list, because it exposes more functionality such as `process.cwd()`, which is not available in the builtin.
 */
export const baseNodeBuiltins = [
  "assert",
  "async_hooks",
  "buffer",
  "diagnostics_channel",
  "events",
  "path",
  "stream",
  "string_decoder",
  "util",
  "crypto"
];

/**
 * The names of the base Node.js APIs (APIs provided directly by Workers runtime, excluding `process`), as a set.
 * @see https://developers.cloudflare.com/workers/runtime-apis/nodejs/
 */
export const baseNodeBuiltinsSet = new Set(baseNodeBuiltins);

/**
 * An `unenv`-compatible preset containing the base builtins. This preset will override the `unenv` polyfills in case of conflict.
 *
 * The base built-ins are the default supported built-in Node.js APIs in the Workerd environment, **except** process (which is substituted by the matching `unenv` polyfill).
 * @see https://developers.cloudflare.com/workers/runtime-apis/nodejs/
 *
 * `unenv`'s `process` polyfill is preferred over the default, because it offers more functionality (like `process.cwd()`).
 */
export const baseNodePreset: Preset = {
  alias: baseNodeBuiltins.reduce((acc, module) => {
    return {
      ...acc,
      [module]: `partykit-exposed-node-${module}`,
      [`node:${module}`]: `partykit-exposed-node-${module}`
    };
  }, {}),
  inject: {
    Buffer: "node:buffer"
  },
  polyfill: [],
  external: baseNodeBuiltins.map((builtin) => `node:${builtin}`)
};

/**
 * Checks if intercepted import path matches a base builtin.
 * @param path - The import path intercepted by the `nodejs-compat` plugin.
 * @returns True if the provided path matches a base builtin, False otherwise.
 */
export function isBaseBuiltin(path: string) {
  // Use path.split() to only grab the portion of the path before first slash.
  // This is to avoid false negatives when intercepting an import path like 'node:stream/promises'.
  return baseNodeBuiltinsSet.has(path.split("/")[0].replace(/^node:/, ""));
}

/**
 * Gets the target base builtin's path. For instance, `stream` will resolve to `partykit-exposed-node-stream`.
 * @param path - The import path intercepted by the `nodejs-compat` plugin.
 * @returns The target base builtin's path.
 */
export function getBaseBuiltinPath(path: string) {
  return (
    baseNodePreset.alias?.[path] ??
    `partykit-exposed-node-${path.replace(/^node:/, "")}` // This is to cover cases like 'node:stream/promises', which lack a matching key in baseNodePreset.alias.
  );
}
