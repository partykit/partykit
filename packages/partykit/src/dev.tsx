import type { Json, MiniflareOptions } from "miniflare";
import { Log, Miniflare, TypedEventTarget } from "miniflare";
import { fileURLToPath } from "url";
import { onExit } from "signal-exit";
import type { Config } from "./config";
import { getConfig } from "./config";
import fs from "fs";
import path from "path";
import { execaCommand } from "execa";
import esbuild from "esbuild";
import type { BuildContext, BuildOptions } from "esbuild";
import chalk from "chalk";
import chokidar from "chokidar";
import crypto from "crypto";
import type { Abortable } from "node:events";
import { Suspense, useEffect, useMemo, useState } from "react";
import React from "react";
import { render } from "ink";
import useInspector from "./inspect";
import { fetch } from "undici";
import { logger } from "./logger";
import type { StaticAssetsManifestType } from "./server";

const esbuildOptions: BuildOptions = {
  format: "esm",
  bundle: true,
  write: false,
  target: "esnext",
} as const;

interface ReloadedEventOptions {
  url: URL;
  // internalDurableObjects: CfDurableObject[];
}

class ReloadedEvent extends Event implements ReloadedEventOptions {
  readonly url: URL;
  // readonly internalDurableObjects: CfDurableObject[];

  constructor(type: "reloaded", options: ReloadedEventOptions) {
    super(type);
    this.url = options.url;
    // this.internalDurableObjects = options.internalDurableObjects;
  }
}

interface ErrorEventOptions {
  error: unknown;
}

class ErrorEvent extends Event implements ErrorEventOptions {
  readonly error: unknown;

  constructor(type: "error", options: ErrorEventOptions) {
    super(type);
    this.error = options.error;
  }
}

type MiniflareServerEventMap = {
  reloaded: ReloadedEvent;
  error: ErrorEvent;
};

function getLocalPersistencePath(
  persistTo: string | undefined,
  configPath: string | undefined
) {
  return persistTo
    ? // If path specified, always treat it as relative to cwd()
      path.resolve(process.cwd(), persistTo)
    : // Otherwise, treat it as relative to partykit.json,
      // if one can be found, otherwise cwd()
      path.resolve(
        configPath ? path.dirname(configPath) : process.cwd(),
        ".partykit/state"
      );
}

export class MiniflareServer extends TypedEventTarget<MiniflareServerEventMap> {
  #log = console.log;
  #mf?: Miniflare;

  async onBundleUpdate(
    options: MiniflareOptions,
    opts?: Abortable
  ): Promise<void> {
    if (opts?.signal?.aborted) return;
    try {
      if (opts?.signal?.aborted) return;
      if (this.#mf === undefined) {
        this.#mf = new Miniflare(options);
      } else {
        await this.#mf.setOptions(options);
      }
      const url = await this.#mf.ready;
      if (opts?.signal?.aborted) return;
      const event = new ReloadedEvent("reloaded", {
        url,
        // internalDurableObjects: internalObjects,
      });
      this.dispatchEvent(event);
    } catch (error: unknown) {
      this.dispatchEvent(new ErrorEvent("error", { error }));
    }
  }

  onDispose = async (): Promise<void> => {
    await this.#mf?.dispose();
    this.#mf = undefined;
  };
}

export async function devTest(props: DevProps) {
  return new Promise<{
    close: () => void;
  }>((resolve) => {
    const { unmount } = render(
      <Dev
        {...props}
        onReady={() => {
          resolve({
            close: () => {
              console.log("close");
              unmount();
            },
          });
        }}
      />
    );
  });
}

export type DevProps = {
  main?: string;
  port?: number;
  serve?: string;
  config?: string;
  persist?: boolean | string;
  vars?: Record<string, string>;
  verbose?: boolean;
  define?: Record<string, string>;
  onReady?: (host: string, port: number) => void;
  compatibilityDate?: string;
  compatibilityFlags?: string[] | undefined;
  minify?: boolean | undefined;
  enableInspector?: boolean | undefined;
};

export function Dev(props: DevProps) {
  return (
    <Suspense>
      <DevImpl {...props} />
    </Suspense>
  );
}

function DevImpl(props: DevProps) {
  const { inspectorUrl } = useDev(props);

  return props.enableInspector ?? true ? (
    <Inspector inspectorUrl={inspectorUrl} />
  ) : null;
}

function Inspector(props: { inspectorUrl: string | undefined }) {
  useInspector({
    port: 9230,
    inspectorUrl: props.inspectorUrl,
    logToTerminal: true,
    sourceMapPath: undefined,
    sourceMapMetadata: undefined,
  });
  return null;
}

// https://chromedevtools.github.io/devtools-protocol/#endpoints
interface InspectorWebSocketTarget {
  id: string;
  title: string;
  type: "node";
  description: string;
  webSocketDebuggerUrl: string;
  devtoolsFrontendUrl: string;
  devtoolsFrontendUrlCompat: string;
  faviconUrl: string;
  url: string;
}

// duplicate cli.tsx
function* findAllFiles(root: string) {
  const dirs = [root];
  while (dirs.length > 0) {
    const dir = dirs.pop()!;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        dirs.push(filePath);
      } else {
        yield path.relative(root, filePath);
      }
    }
  }
}

function useAssetServer(
  options: Config["serve"],
  defines: Record<string, string> | undefined
) {
  const theOptions: Config["serve"] =
    typeof options === "string" ? { path: options } : options || {};

  const assetsServerPort = 3141; // TODO: just find a free port

  const assetsPath = !options
    ? undefined
    : typeof options === "string"
    ? options
    : options.path;

  const assetsBuild = useMemo(
    () =>
      typeof theOptions.build === "string"
        ? { entry: theOptions.build }
        : theOptions.build,
    [theOptions.build]
  );

  const esbuildAssetOptions: esbuild.BuildOptions = useMemo(
    () => ({
      entryPoints:
        typeof assetsBuild?.entry === "string"
          ? [assetsBuild.entry]
          : assetsBuild?.entry,
      outdir:
        assetsBuild?.outdir ||
        (assetsPath ? path.join(assetsPath, "dist") : undefined),
      bundle: assetsBuild?.bundle ?? true,
      splitting: assetsBuild?.splitting ?? true,
      minify: assetsBuild?.minify,
      format: assetsBuild?.format ?? "esm",
      sourcemap: assetsBuild?.sourcemap ?? true,
      define: {
        "process.env.PARTYKIT_HOST": `"127.0.0.1:1999"`,
        ...defines,
        ...assetsBuild?.define,
      },
      loader: assetsBuild?.loader,
    }),
    [assetsBuild, assetsPath, defines]
  );

  const unsupportedKeys = (
    ["include", "exclude", "serveSinglePageApp"] as const
  ).filter((key) => theOptions[key] !== undefined);
  if (unsupportedKeys.length > 0) {
    throw new Error(
      `Not implemented keys in config.serve: ${unsupportedKeys.join(", ")}`
    );
  }

  const [assetsMap] = useState<{ assets: Record<string, string> }>(() => {
    const assetsMap: StaticAssetsManifestType = {
      devServer: `http://127.0.0.1:${assetsServerPort}`,
      browserTTL: theOptions.browserTTL,
      edgeTTL: theOptions.edgeTTL,
      serveSinglePageApp: theOptions.serveSinglePageApp,
      assets: {},
    };
    if (!assetsPath) return assetsMap;

    if (assetsBuild?.entry) {
      // do an initial build
      esbuild.buildSync(esbuildAssetOptions);
    }

    for (const file of findAllFiles(assetsPath)) {
      // in dev it's just the same file
      assetsMap.assets[file] = file;
    }
    return assetsMap;
  });

  useEffect(() => {
    if (!assetsPath) return;
    let ctx: BuildContext | undefined;

    async function startServer() {
      // run esbuild's dev server
      ctx = await esbuild.context(esbuildAssetOptions);

      await ctx.serve({
        port: assetsServerPort,
        servedir: assetsPath,
      });
    }

    startServer().catch((err) => {
      console.error("Failed to start the assets build server", err);
    });

    return () => {
      ctx?.dispose().catch((err) => {
        console.error("Failed to dispose the assets build server", err);
      });
    };
  }, [assetsBuild, assetsPath, assetsServerPort, esbuildAssetOptions]);

  return {
    assetsMap,
    assetsServerPort,
  };
}

function useDev(options: DevProps): { inspectorUrl: string | undefined } {
  const [config] = useState<Config>(() =>
    getConfig(
      options.config,
      {
        main: options.main,
        vars: options.vars,
        define: options.define,
        serve: options.serve,
        port: options.port,
        persist: options.persist,
        compatibilityDate: options.compatibilityDate,
        compatibilityFlags: options.compatibilityFlags,
      },
      { readEnvLocal: true }
    )
  );
  const [server] = useState(() => new MiniflareServer());

  const [inspectorUrl, setInspectorUrl] = useState<string | undefined>(
    undefined
  );

  const { assetsMap } = useAssetServer(config.serve, config.define);

  if (!config.main) {
    throw new Error(
      'Missing entry point, please specify "main" in your config'
    );
  }

  useEffect(() => {
    if (config.serve) {
      logger.warn(
        "Serving static assets in dev mode is experimental and may change any time"
      );
    }

    async function runBuild() {
      let isFirstBuild = true;

      let wasmModules: Record<string, string> = {};

      const workerFacade = fs.readFileSync(
        fileURLToPath(
          path.join(path.dirname(import.meta.url), "../facade/generated.js")
        ),
        "utf8"
      );

      const absoluteScriptPath = path.join(process.cwd(), config.main!).replace(
        /\\/g, // windows
        "/"
      );

      const ctx = await esbuild.context({
        stdin: {
          contents: workerFacade
            .replace("__WORKER__", absoluteScriptPath)
            .replace(
              "__PARTIES__",
              Object.entries(config.parties || {})
                .map(
                  ([name, party]) =>
                    `import ${name} from '${party}'; export const ${name}DO = createDurable(${name});`
                )
                .join("\n")
            ),
          resolveDir: process.cwd(),
          // TODO: setting a sourcefile name crashes the whole thing???
          // sourcefile: "./" + path.relative(process.cwd(), scriptPath),
        },
        ...esbuildOptions,
        minify: options.minify,
        format: "esm",
        sourcemap: true,
        external: ["__STATIC_ASSETS_MANIFEST__"],
        define: {
          "process.env.PARTYKIT_HOST": `"127.0.0.1:1999"`,
          ...esbuildOptions.define,
          ...config.define,
        },
        plugins: [
          {
            name: "partykit",
            setup(build) {
              build.onEnd(async (result) => {
                if (result.errors.length > 0) return;
                if (!result || !result.outputFiles) {
                  logger.error("Build failed: no result");
                  return;
                }

                if (isFirstBuild) {
                  isFirstBuild = false;
                  console.log(
                    chalk.green("Build succeeded, starting server...")
                  );
                } else {
                  console.log(
                    chalk.green("Build succeeded, starting server...")
                  );
                }

                const code = result.outputFiles[0].text;

                return new Promise<void>((resolve) => {
                  server.addEventListener("reloaded", () => resolve(), {
                    once: true,
                  });

                  const localPersistencePath =
                    config.persist === "true"
                      ? undefined
                      : config.persist === true
                      ? undefined
                      : config.persist === "false"
                      ? false
                      : config.persist === false
                      ? false
                      : config.persist;
                  const persistencePath =
                    localPersistencePath !== false
                      ? getLocalPersistencePath(
                          localPersistencePath,
                          options.config
                        )
                      : undefined;

                  void server.onBundleUpdate({
                    log: new Log(5, { prefix: "pk" }),
                    verbose: options.verbose,
                    inspectorPort: 9229,

                    compatibilityDate: config.compatibilityDate || "2023-04-11",
                    compatibilityFlags: [
                      "nodejs_compat",
                      ...(config.compatibilityFlags || []),
                    ],
                    port: config.port || 1999,
                    bindings: {
                      ...(config.vars
                        ? { PARTYKIT_VARS: config.vars as Json }
                        : {}),
                    },
                    durableObjects: {
                      PARTYKIT_DURABLE: "PartyKitDurable",
                      ...Object.entries(config.parties || {}).reduce<
                        Record<string, string>
                      >((obj, [name, _]) => {
                        obj[name] = `${name}DO`;
                        return obj;
                      }, {}),
                    },
                    ...(persistencePath && {
                      cachePersist: path.join(persistencePath, "cache"),
                      durableObjectsPersist: path.join(
                        persistencePath,
                        "party"
                      ),
                      kvPersist: path.join(persistencePath, "kv"),
                      r2Persist: path.join(persistencePath, "r2"),
                      d1Persist: path.join(persistencePath, "d1"),
                    }),
                    // @ts-expect-error miniflare's types are wrong
                    modules: [
                      {
                        type: "ESModule",
                        path: absoluteScriptPath,
                        contents: code,
                      },
                      {
                        type: "ESModule",
                        path: path.join(
                          path.dirname(absoluteScriptPath),
                          "__STATIC_ASSETS_MANIFEST__"
                        ),
                        contents: `export default ${JSON.stringify(
                          assetsMap
                        )};`,
                      },
                      ...Object.entries(wasmModules).map(([name, p]) => ({
                        type: "CompiledWasm",
                        path: name,
                        contents: fs.readFileSync(p),
                      })),
                    ],
                    modulesRoot: process.cwd(),
                    script: code,
                  });
                });
              });
            },
          },
          {
            name: "partykit-wasm-dev",
            setup(build) {
              build.onStart(() => {
                wasmModules = {};
              });

              build.onResolve({ filter: /\.wasm(\?module)?$/ }, (args) => {
                const filePath = path.join(
                  args.resolveDir,
                  args.path.replace(/\?module$/, "")
                );
                const fileContent = fs.readFileSync(filePath);
                const fileHash = crypto
                  .createHash("sha1")
                  .update(fileContent)
                  .digest("hex");
                const fileName = `./${fileHash}-${path
                  .basename(args.path)
                  .replace(/\?module$/, "")}`;

                wasmModules[fileName] = filePath;

                return {
                  path: fileName, // change the reference to the changed module
                  external: true, // not an external in dev, we swap it with an identifier
                  namespace: `partykit-module-wasm-dev`, // just a tag, this isn't strictly necessary
                  watchFiles: [filePath], // we also add the file to esbuild's watch list
                };
              });
            },
          },
        ],
      });

      if (config.build?.command) {
        const buildCommand = config.build.command;
        const buildCwd = config.build.cwd;
        // run a build
        // start a watcher
        // on change, run a build

        await execaCommand(buildCommand, {
          shell: true,
          // we keep these two as "inherit" so that
          // logs are still visible.
          stdout: "inherit",
          stderr: "inherit",
          ...(buildCwd && { cwd: buildCwd }),
        });

        const _watcher = chokidar
          .watch(config.build.watch || path.join(process.cwd(), "./src"), {
            persistent: true,
            ignoreInitial: true,
          })
          .on("all", async (_event, _path) => {
            execaCommand(buildCommand, {
              shell: true,
              // we keep these two as "inherit" so that
              // logs are still visible.
              stdout: "inherit",
              stderr: "inherit",
              ...(buildCwd && { cwd: buildCwd }),
            }).catch((err) => {
              console.error(chalk.red("Custom build failed"), err);
            });
          });
      }

      // should we call watcher.close() on exit?

      await ctx.watch(); // turn on watch mode
    }
    runBuild().catch((error) => {
      console.error(error);
      process.exit(1);
    });
  }, [
    config,
    server,
    options.config,
    options.persist,
    options.minify,
    options.verbose,
    assetsMap,
  ]);

  useEffect(() => {
    server.addEventListener("reloaded", async (event) => {
      // await maybeRegisterLocalWorker(event, props.name);
      options.onReady?.(event.url.hostname, parseInt(event.url.port));

      // let inspectorUrl: string | undefined;

      try {
        // Fetch the inspector JSON response from the DevTools Inspector protocol
        const jsonUrl = `http://127.0.0.1:9229/json`;
        const res = await fetch(jsonUrl);
        const body = (await res.json()) as InspectorWebSocketTarget[];
        const debuggerUrl = body?.find(({ id }) =>
          id.startsWith("core:user")
        )?.webSocketDebuggerUrl;
        if (debuggerUrl === undefined) {
          setInspectorUrl(undefined);
        } else {
          const url = new URL(debuggerUrl);
          // Force inspector URL to be different on each reload so `useEffect`
          // in `useInspector` is re-run to connect to newly restarted
          // `workerd` server when updating options. Can't use a query param
          // here as that seems to cause an infinite connection loop, can't
          // use a hash as those are forbidden by `ws`, so username it is.
          url.username = `${Date.now()}-${Math.floor(
            Math.random() * Number.MAX_SAFE_INTEGER
          )}`;
          // console.log("⎔ Debugger URL:", url.toString());
          setInspectorUrl(url.toString());
        }
      } catch (error: unknown) {
        console.error("Error attempting to retrieve debugger URL:", error);
      }

      // resolve({
      //   inspectorUrl,
      //   close: () => {
      //     abortController.abort();
      //     console.log("⎔ Shutting down local server...");
      //     // Initialisation errors are also thrown asynchronously by dispose().
      //     // The `addEventListener("error")` above should've caught them though.
      //     server.onDispose().catch(() => {
      //       // Ignore errors
      //     });
      //     removeMiniflareServerExitListener();
      //   },
      // });
    });
    server.addEventListener("error", ({ error }) => {
      console.error("Error reloading local server:", error);
      // reject(error);
    });

    // const abortController = new AbortController();
  }, [inspectorUrl, options, server]);

  useEffect(() => {
    return () => {
      const removeMiniflareServerExitListener = onExit(() => {
        console.log(chalk.dim("⎔ Shutting down local server..."));
        void server.onDispose();
      });

      server
        .onDispose()
        .then(() => {
          console.log(chalk.dim("⎔ Local server shut down...."));
        })
        .catch((err) => {
          console.error("Error disposing local server:", err);
          //       // Ignore errors
        });
      removeMiniflareServerExitListener();
    };
  }, [server]);

  return {
    inspectorUrl,
  };
}
