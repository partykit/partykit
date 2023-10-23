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
import { Text, Box, render, useApp, useInput, useStdin } from "ink";
import useInspector from "./inspect";
import { fetch } from "undici";
import { logger } from "./logger";
import getPort from "get-port";
import asyncCache from "./async-cache";
import open from "open";
import type { StaticAssetsManifestType } from "./server";
import nodejsCompatPlugin from "./nodejs-compat";

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

const portCache = asyncCache();

function getPortForServer(name: string, preferred?: number) {
  return portCache(name, () => getPort({ port: preferred })) as Awaited<
    ReturnType<typeof getPort>
  >;
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
              unmount();
            },
          });
        }}
      />
    );
  });
}

/**
 * An extremely simple wrapper around the open command.
 * Specifically, it adds an 'error' event handler so that when this function
 * is called in environments where we can't open the browser (e.g. GitHub Codespaces,
 * StackBlitz, remote servers), it doesn't just crash the process.
 *
 * @param url the URL to point the browser at
 */
export async function openInBrowser(url: string): Promise<void> {
  // updateStatus("Opening browser");
  const childProcess = await open(url);
  childProcess.on("error", () => {
    logger.warn("Failed to open browser");
  });
}

function useHotkeys(props: {
  // inspectorPort: number;
  // inspect: boolean;
  localProtocol: "http" | "https";
  // worker: string | undefined;
  host: string;
  port: number;
}) {
  const {
    // inspectorPort, inspect,
    localProtocol,
  } = props;
  // UGH, we should put port in context instead
  // const [toggles, setToggles] = useState({});
  const { exit } = useApp();

  useInput(async (input, key) => {
    if (key.return) {
      console.log("");
      return;
    }
    switch (input.toLowerCase()) {
      // clear console
      case "c":
        console.clear();
        // This console.log causes Ink to re-render the `DevSession` component.
        // Couldn't find a better way to tell it to do so...
        console.log();
        break;
      // open browser
      case "b": {
        await openInBrowser(`${localProtocol}://${props.host}:${props.port}`);
        break;
      }
      // toggle inspector
      // case "d": {
      // 	if (inspect) {
      // 		await openInspector(inspectorPort, props.worker);
      // 	}
      // 	break;
      // }

      // shut down
      case "q":
      case "x":
        exit();
        break;
      default:
        // nothing?
        break;
    }
  });
  // return toggles;
}

export type DevProps = {
  main?: string;
  ip?: string;
  port?: number;
  serve?: string;
  config?: string;
  persist?: boolean | string;
  vars?: Record<string, string>;
  verbose?: boolean;
  unstable_outdir?: string;
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
  const { inspectorUrl, portForServer } = useDev(props);
  // only load the UI if we're running in a supported environment
  const { isRawModeSupported } = useStdin();

  return (
    <>
      {props.enableInspector ?? true ? (
        <Inspector inspectorUrl={inspectorUrl} />
      ) : null}
      {isRawModeSupported ? <HotKeys portForServer={portForServer} /> : null}
    </>
  );
}

function Inspector(props: { inspectorUrl: string | undefined }) {
  const portForInspector = getPortForServer("inspector", 9229);
  useInspector({
    port: portForInspector,
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
function* findAllFiles(
  root: string,
  { ignore: _ignore }: { ignore?: string[] } = {}
) {
  const dirs = [root];
  while (dirs.length > 0) {
    const dir = dirs.pop()!;
    const files = fs.readdirSync(dir);
    // TODO: handle ignore arg
    for (const file of files) {
      if (file.startsWith(".")) {
        continue;
      }

      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (file === "node_modules") {
          continue;
        }
        dirs.push(filePath);
      } else {
        yield path.relative(root, filePath).replace(/\\/g, "/"); // windows;
      }
    }
  }
}

function useAssetServer(
  options: Config["serve"],
  defines: Record<string, string>,
  ipForAssetsServer: string
) {
  const theOptions: Config["serve"] =
    typeof options === "string" ? { path: options } : options || {};

  const portForAssetsServer = getPortForServer("assets");
  // ^ no preferred port for the assets server, since we don't expect
  // it to be used by the user directly

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
      external: assetsBuild?.external,
      define: {
        ...defines,
        ...assetsBuild?.define,
      },
      loader: assetsBuild?.loader,
    }),
    [assetsBuild, assetsPath, defines]
  );

  const unsupportedKeys = (["include", "exclude"] as const).filter(
    (key) => theOptions[key] !== undefined
  );
  if (unsupportedKeys.length > 0) {
    throw new Error(
      `Not implemented keys in config.serve: ${unsupportedKeys.join(", ")}`
    );
  }

  const [assetsMap, setAssetsMap] = useState<StaticAssetsManifestType>(() => {
    const assetsMap: StaticAssetsManifestType = {
      devServer: `http://${ipForAssetsServer}:${portForAssetsServer}`,
      browserTTL: theOptions.browserTTL,
      edgeTTL: theOptions.edgeTTL,
      singlePageApp: theOptions.singlePageApp,
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
    // update the assets map anytime any files under assetsPath change
    if (!assetsPath) return;
    const watcher = chokidar.watch(assetsPath, {
      ignoreInitial: true,
      ignored: ["**/node_modules/**", "**/.git/**"],
    });

    watcher.on("all", () => {
      setAssetsMap((assetsMap: StaticAssetsManifestType) => {
        const newFiles = [...findAllFiles(assetsPath)];
        // compare the new files with the old ones
        const oldFiles = Object.keys(assetsMap.assets);
        const added = newFiles.filter((f) => !oldFiles.includes(f));
        const removed = oldFiles.filter((f) => !newFiles.includes(f));

        // don't do anything if nothing changed
        if (added.length === 0 && removed.length === 0) return assetsMap;

        assetsMap.assets = {};
        for (const file of newFiles) {
          // in dev it's just the same file
          assetsMap.assets[file] = file;
        }
        return { ...assetsMap };
      });
    });
    return () => {
      watcher.close().catch((err) => {
        console.error("Failed to close the asset folder watcher", err);
      });
    };
  }, [assetsPath, setAssetsMap]);

  useEffect(() => {
    if (!assetsPath) return;
    let ctx: BuildContext | undefined;

    async function startServer() {
      // run esbuild's dev server
      ctx = await esbuild.context(esbuildAssetOptions);

      await ctx.serve({
        port: portForAssetsServer,
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
  }, [assetsPath, portForAssetsServer, esbuildAssetOptions]);

  return {
    assetsMap,
    portForAssetsServer,
  };
}

function useDev(options: DevProps): {
  inspectorUrl: string | undefined;
  portForServer: number;
} {
  const [config] = useState<Config>(() =>
    getConfig(
      options.config,
      {
        main: options.main,
        vars: options.vars,
        define: options.define,
        serve: options.serve,
        ip: options.ip,
        port: options.port,
        persist: options.persist,
        compatibilityDate: options.compatibilityDate,
        compatibilityFlags: options.compatibilityFlags,
      },
      { readEnvLocal: true }
    )
  );

  const portForServer = config.port ?? getPortForServer("dev", 1999);
  const ipForServer = config.ip ?? "127.0.0.1";

  const portForRuntimeInspector = getPortForServer("runtime-inspector");
  // ^ no preferred port for the runtime inspector, in fact it's better if
  // it's a different port every time so that it doesn't clash with multiple devs

  const [server] = useState(() => new MiniflareServer());

  const [inspectorUrl, setInspectorUrl] = useState<string | undefined>(
    undefined
  );

  const assetDefines = useMemo(
    () => ({
      PARTYKIT_HOST: `"${ipForServer}:${portForServer}"`,
      ...config.define,
    }),
    [config.define, portForServer, ipForServer]
  );

  const { assetsMap } = useAssetServer(config.serve, assetDefines, ipForServer);

  if (!config.main) {
    throw new Error(
      'Missing entry point, please specify "main" in your config'
    );
  }

  useEffect(() => {
    const currentUTCDate = new Date().toISOString().split("T", 1)[0];

    if (!config.compatibilityDate) {
      logger.warn(
        `No compatibilityDate specified in configuration, defaulting to ${currentUTCDate}
    You can silence this warning by adding this to your partykit.json file: 
      "compatibilityDate": "${currentUTCDate}"
    or by passing it in via the CLI
      --compatibility-date ${currentUTCDate}`
      );
    }

    let compatibilityDate: string;
    if (config.compatibilityDate) {
      const minDate = new Date(
        Math.min(
          new Date(config.compatibilityDate).getTime(),
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          new Date(require("workerd").compatibilityDate).getTime()
        )
      );
      compatibilityDate = minDate.toISOString().split("T", 1)[0];
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      compatibilityDate = require("workerd").compatibilityDate;
    }

    let customBuildFolderWatcher: ReturnType<typeof chokidar.watch> | undefined;
    let ctx: BuildContext | undefined;
    const abortController = new AbortController();
    async function runBuild() {
      let isFirstBuild = true;

      let wasmModules: Record<string, string> = {};

      const workerFacade = fs.readFileSync(
        fileURLToPath(
          path.join(path.dirname(import.meta.url), "../dist/generated.js")
        ),
        "utf8"
      );

      const absoluteScriptPath = path.join(process.cwd(), config.main!).replace(
        /\\/g, // windows
        "/"
      );

      ctx = await esbuild.context({
        stdin: {
          contents: workerFacade
            .replace("__WORKER__", absoluteScriptPath)
            .replace(
              "__PARTIES__",
              Object.entries(config.parties || {})
                .map(
                  ([name, party]) =>
                    `
import ${name} from '${party}'; 
export const ${name}DO = createDurable(${name}, { name: "${name}" });
Workers["${name}"] = ${name};
`
                )
                .join("\n")
            ),
          resolveDir: process.cwd(),
          // TODO: setting a sourcefile name crashes the whole thing???
          // sourcefile: "./" + path.relative(process.cwd(), scriptPath),
        },
        ...esbuildOptions,
        minify: config.minify,
        format: "esm",
        sourcemap: true,
        external: ["__STATIC_ASSETS_MANIFEST__"],
        metafile: true,
        define: {
          PARTYKIT_HOST: `"${ipForServer}:${portForServer}"`,
          ...esbuildOptions.define,
          ...config.define,
        },
        plugins: [
          nodejsCompatPlugin,
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

                if (options.unstable_outdir) {
                  const outdir = path.join(
                    process.cwd(),
                    options.unstable_outdir
                  );

                  fs.mkdirSync(outdir, { recursive: true });
                  fs.writeFileSync(
                    path.join(
                      outdir,
                      `${path.basename(
                        absoluteScriptPath,
                        path.extname(absoluteScriptPath)
                      )}.js`
                    ),
                    code
                  );
                }

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

                  void server.onBundleUpdate(
                    {
                      log: new Log(5, { prefix: "pk" }),
                      verbose: options.verbose,
                      inspectorPort: portForRuntimeInspector,

                      compatibilityDate,
                      compatibilityFlags: [
                        "nodejs_compat",
                        ...(config.compatibilityFlags || []),
                      ],
                      host: ipForServer,
                      port: portForServer,
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
                          path: path.join(
                            path.dirname(absoluteScriptPath),
                            name
                          ),
                          contents: fs.readFileSync(p),
                        })),
                      ],
                      modulesRoot: process.cwd(),
                      script: code,
                    },
                    { signal: abortController.signal }
                  );
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

        customBuildFolderWatcher = chokidar
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

    return () => {
      abortController.abort();
      customBuildFolderWatcher?.close().catch((err) => {
        console.error("Failed to close the custom build folder watcher", err);
      });
      ctx?.dispose().catch((err) => {
        console.error("Failed to dispose the build server", err);
      });
    };
  }, [
    config,
    server,
    assetsMap,
    ipForServer,
    portForServer,
    portForRuntimeInspector,
    options.config,
    options.verbose,
    options.unstable_outdir,
  ]);

  const { onReady } = options;

  useEffect(() => {
    async function serverReloadedListener(event: ReloadedEvent) {
      // await maybeRegisterLocalWorker(event, props.name);
      onReady?.(event.url.hostname, parseInt(event.url.port));

      // let inspectorUrl: string | undefined;

      try {
        // Fetch the inspector JSON response from the DevTools Inspector protocol
        const jsonUrl = `http://127.0.0.1:${portForRuntimeInspector}/json`;
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
    }

    function serverErrorListener(event: ErrorEvent) {
      console.error("Error reloading local server:", event.error);
      // reject(event.error);
    }

    server.addEventListener("reloaded", serverReloadedListener);
    server.addEventListener("error", serverErrorListener);

    return () => {
      server.removeEventListener("reloaded", serverReloadedListener);
      server.removeEventListener("error", serverErrorListener);
    };

    // const abortController = new AbortController();
  }, [onReady, server, portForRuntimeInspector]);

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
    portForServer,
  };
}

function HotKeys({
  portForServer,
}: {
  portForServer: number;
  // inspectorPort: number;
  // inspect: boolean;
}) {
  useHotkeys({
    // inspectorPort: portForRuntimeInspector,
    // inspect: options.enableInspector,
    localProtocol: "http",
    // worker: undefined,
    host: `localhost`,
    port: portForServer,
  });

  return (
    <Box borderStyle="round" paddingLeft={1} paddingRight={1}>
      <Text bold={true}>[b]</Text>
      <Text> open a browser, </Text>
      <Text bold={true}>[c]</Text>
      <Text> clear console, </Text>
      <Text bold={true}>[x]</Text>
      <Text> to exit</Text>
    </Box>
  );
}
