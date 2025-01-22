import { builtinModules } from "node:module";
import nodePath from "node:path";

import dedent from "ts-dedent";
import { env, nodeless } from "unenv";

import {
  baseNodePreset,
  getBaseBuiltinPath,
  isBaseBuiltin
} from "./base-builtins";
import { getBasePath } from "./path";

import type { Plugin, PluginBuild } from "esbuild";

const REQUIRED_NODE_BUILT_IN_NAMESPACE = "node-built-in-modules";
const REQUIRED_UNENV_ALIAS_NAMESPACE = "required-unenv-alias";

/**
 * Creates a plugin for `workerd` compatibility with Node.js APIs.
 *
 * @see https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/deployment-bundle/esbuild-plugins/hybrid-nodejs-compat.ts
 * @returns The plugin.
 */
export const createNodeHybridPlugin: () => Plugin = () => {
  const { alias, inject, external } = env(nodeless, baseNodePreset);
  return {
    name: "nodejs-compat",
    setup(build) {
      errorOnServiceWorkerFormat(build);
      handleRequireCallsToNodeJSBuiltins(build);
      handleBaseBuiltins(build);
      handleCloudflarePackages(build);
      handleUnenvAliasedPackages(build, alias, external);
      handleNodeJSGlobals(build, inject);
    }
  };
};

const NODEJS_MODULES_RE = new RegExp(`^(node:)?(${builtinModules.join("|")})$`);

/**
 * If we are bundling a "Service Worker" formatted Worker, imports of external modules,
 * which won't be inlined/bundled by esbuild, are invalid.
 *
 * This `onResolve()` handler will error if it identifies node.js external imports.
 */
function errorOnServiceWorkerFormat(build: PluginBuild) {
  const paths = new Set();
  build.onStart(() => paths.clear());
  build.onResolve({ filter: NODEJS_MODULES_RE }, (args) => {
    paths.add(args.path);
    return null;
  });
  build.onEnd(() => {
    if (build.initialOptions.format === "iife" && paths.size > 0) {
      const pathList = new Intl.ListFormat("en-US").format(
        Array.from(paths.keys())
          .map((p) => `"${p}"`)
          .sort()
      );
      return {
        errors: [
          {
            text: dedent`
							Unexpected external import of ${pathList}.
							Your worker has no default export, which means it is assumed to be a Service Worker format Worker.
							Did you mean to create a ES Module format Worker?
							If so, try adding \`export default { ... }\` in your entry-point.
							See https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/.
						`
          }
        ]
      };
    }
  });
}

/**
 * We must convert `require()` calls for Node.js modules to a virtual ES Module that can be imported avoiding the require calls.
 * We do this by creating a special virtual ES module that re-exports the library in an onLoad handler.
 * The onLoad handler is triggered by matching the "namespace" added to the resolve.
 */
function handleRequireCallsToNodeJSBuiltins(build: PluginBuild) {
  build.onResolve({ filter: NODEJS_MODULES_RE }, (args) => {
    if (args.kind === "require-call") {
      return {
        path: args.path,
        namespace: REQUIRED_NODE_BUILT_IN_NAMESPACE
      };
    }
  });

  build.onLoad(
    { filter: /.*/, namespace: REQUIRED_NODE_BUILT_IN_NAMESPACE },
    ({ path }) => {
      // Re-route to base builtins if needed.
      if (isBaseBuiltin(path)) {
        return {
          path: getBaseBuiltinPath(path),
          external: true
        };
      }
      return {
        contents: dedent`
					import libDefault from '${path}';
					module.exports = libDefault;`,
        loader: "js"
      };
    }
  );
}

/**
 * Handles all import paths that match a base builtin.
 *
 * We support and prioritize the list of default supported built-in Node.js APIs in the Workerd environment, **except** process (which is substituted by the matching `unenv` polyfill).
 * @see https://developers.cloudflare.com/workers/runtime-apis/nodejs/
 *
 * `unenv`'s `process` polyfill is preferred over the default, because it offers more functionality (like `process.cwd()`).
 */
function handleBaseBuiltins(build: PluginBuild) {
  const EXPOSED_PRESET_ALIAS_RE = new RegExp(
    `^(${Object.keys(baseNodePreset.alias!).join("|")})$`
  );
  build.onResolve({ filter: EXPOSED_PRESET_ALIAS_RE }, (args) => {
    return {
      path: getBaseBuiltinPath(args.path),
      external: true
    };
  });
}

/**
 * Handles Cloudflare package import paths, like `cloudflare:sockets`.
 */
function handleCloudflarePackages(build: PluginBuild) {
  build.onResolve({ filter: /^cloudflare:/ }, (args) => {
    const cloudflareModuleName = args.path.split(":")[1];
    return {
      path: `partykit-exposed-cloudflare-${cloudflareModuleName}`,
      external: true
    };
  });
}
/**
 * Handle all import paths that match an unenv polyfill. This excludes all import paths covered by handleBaseBuiltins().
 */
function handleUnenvAliasedPackages(
  build: PluginBuild,
  alias: Record<string, string>,
  external: string[]
) {
  // esbuild expects alias paths to be absolute
  const aliasAbsolute: Record<string, string> = {};

  for (const [module, unresolvedAlias] of Object.entries(alias)) {
    if (isBaseBuiltin(module)) continue;
    try {
      aliasAbsolute[module] = require
        .resolve(unresolvedAlias)
        .replace(/\.cjs$/, ".mjs");
    } catch (e) {
      // this is an alias for package that is not installed in the current app => ignore
    }
  }
  const UNENV_ALIAS_RE = new RegExp(
    `^(${Object.keys(aliasAbsolute).join("|")})$`
  );

  build.onResolve({ filter: UNENV_ALIAS_RE }, (args) => {
    const unresolvedAlias = alias[args.path];
    // Convert `require()` calls for NPM packages to a virtual ES Module that can be imported avoiding the require calls.
    // Note: Does not apply to Node.js packages that are handled in `handleRequireCallsToNodeJSBuiltins`

    if (
      args.kind === "require-call" &&
      (unresolvedAlias.startsWith("unenv/runtime/npm/") ||
        unresolvedAlias.startsWith("unenv/runtime/mock/"))
    ) {
      return {
        path: args.path,
        namespace: REQUIRED_UNENV_ALIAS_NAMESPACE
      };
    }
    // Resolve the alias to its absolute path and potentially mark it as external
    return {
      path: aliasAbsolute[args.path],
      external: external.includes(unresolvedAlias)
    };
  });

  build.initialOptions.banner = { js: "", ...build.initialOptions.banner };
  build.initialOptions.banner.js += dedent`
		function __cf_cjs(esm) {
		  const cjs = 'default' in esm ? esm.default : {};
			for (const [k, v] of Object.entries(esm)) {
				if (k !== 'default') {
					Object.defineProperty(cjs, k, {
						enumerable: true,
						value: v,
					});
				}
			}
			return cjs;
		}
		`;

  // Called when an absolute alias matches /unenv/runtime/npm/ or /unenv/runtime/mock/
  build.onLoad(
    { filter: /.*/, namespace: REQUIRED_UNENV_ALIAS_NAMESPACE },
    ({ path }) => {
      return {
        contents: dedent`
					import * as esm from '${path}';
					module.exports = __cf_cjs(esm);
				`,
        loader: "js"
      };
    }
  );
}

/**
 * Inject node globals defined in unenv's `inject` config via virtual modules
 */
function handleNodeJSGlobals(
  build: PluginBuild,
  inject: Record<string, string | string[]>
) {
  const UNENV_GLOBALS_RE = /_virtual_unenv_global_polyfill-([^.]+)\.js$/;
  const prefix = nodePath.resolve(
    getBasePath(),
    "_virtual_unenv_global_polyfill-"
  );
  build.initialOptions.inject = [
    ...(build.initialOptions.inject ?? []),
    //convert unenv's inject keys to absolute specifiers of custom virtual modules that will be provided via a custom onLoad
    ...Object.keys(inject).map(
      (globalName) => `${prefix}${encodeToLowerCase(globalName)}.js`
    )
  ];

  build.onResolve({ filter: UNENV_GLOBALS_RE }, ({ path }) => ({ path }));

  build.onLoad({ filter: UNENV_GLOBALS_RE }, ({ path }) => {
    const globalName = decodeFromLowerCase(path.match(UNENV_GLOBALS_RE)![1]);
    const { importStatement, exportName } = getGlobalInject(inject[globalName]);
    return {
      contents: dedent`
        ${importStatement}
        globalThis.${globalName} = ${exportName}
			`
    };
  });
}

/**
 * Get the import statement and export name to be used for the given global inject setting.
 */
function getGlobalInject(globalInject: string | string[]) {
  if (typeof globalInject === "string") {
    // the mapping is a simple string, indicating a default export, so the string is just the module specifier.
    return {
      importStatement: `import * as globalVar from "${globalInject}";`,
      exportName: "globalVar"
    };
  }
  // the mapping is a 2 item tuple, indicating a named export, made up of a module specifier and an export name.
  const [moduleSpecifier, exportName] = globalInject;
  return {
    importStatement: `import { ${exportName} } from "${moduleSpecifier}";`,
    exportName
  };
}

/**
 * Encodes a case sensitive string to lowercase string.
 *
 * - Escape $ with another $ ("$" -> "$$")
 * - Escape uppercase letters with $ and turn them into lowercase letters ("L" -> "$L")
 *
 * This function exists because ESBuild requires that all resolved paths are case insensitive.
 * Without this transformation, ESBuild will clobber /foo/bar.js with /foo/Bar.js
 */
export function encodeToLowerCase(str: string): string {
  return str.replace(/[A-Z$]/g, (escape) => `$${escape.toLowerCase()}`);
}

/**
 * Decodes a string lowercased using `encodeToLowerCase` to the original strings
 */
export function decodeFromLowerCase(str: string): string {
  return str.replace(/\$[a-z$]/g, (escaped) => escaped[1].toUpperCase());
}

const nodeHybridPlugin = createNodeHybridPlugin();
export default nodeHybridPlugin;
