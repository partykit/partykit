import type { MiniflareOptions } from "miniflare";
import { Log, Miniflare, TypedEventTarget } from "miniflare";
import { fileURLToPath } from "url";
import onExit from "signal-exit";
import type { Config } from "./config";
import { getConfig } from "./config";
import fs from "fs";
import path from "path";
import { execaCommand } from "execa";
import esbuild from "esbuild";
import type { BuildOptions } from "esbuild";
import chalk from "chalk";
import chokidar from "chokidar";
import crypto from "crypto";
import type { Abortable } from "node:events";
import { Suspense, useEffect, useState } from "react";
import React from "react";
import { render } from "ink";
import useInspector from "./inspect";
import { fetch } from "undici";

const esbuildOptions: BuildOptions = {
  format: "esm",
  bundle: true,
  write: false,
  target: "esnext",
  minify: true, // TODO: remove this once https://github.com/vercel/edge-runtime/issues/243 is fixed
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
    : // Otherwise, treat it as relative to wrangler.toml,
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
  assets?: string;
  config?: string;
  persist?: boolean | string;
  vars?: Record<string, string>;
  define?: Record<string, string>;
  onReady?: (host: string, port: number) => void;
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

  useInspector({
    port: 9230,
    inspectorUrl,
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

function useDev(options: DevProps): { inspectorUrl: string | undefined } {
  const [config] = useState<Config>(() =>
    getConfig(
      options.config,
      {
        main: options.main,
        vars: options.vars,
        define: options.define,
        assets: options.assets,
        port: options.port,
        persist: options.persist,
      },
      { readEnvLocal: true }
    )
  );
  const [server] = useState(() => new MiniflareServer());

  const [inspectorUrl, setInspectorUrl] = useState<string | undefined>(
    undefined
  );

  if (!config.main) {
    throw new Error(
      'Missing entry point, please specify "main" in your config'
    );
  }

  useEffect(() => {
    if (config.assets) {
      console.warn("Warning: serving assets are not yet supported in dev mode");
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

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
        format: "esm",
        sourcemap: true,
        define: {
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
                  console.error(chalk.red("Build failed: no result"));
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

                  console.log(config.persist, options.persist);

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
                    // verbose: true,
                    inspectorPort: 9229,

                    compatibilityDate: "2021-05-26",
                    compatibilityFlags: ["nodejs_compat"],
                    port: config.port || 1999,
                    bindings: {
                      PARTYKIT_VARS: config.vars,
                    },
                    durableObjects: {
                      MAIN_DO: "MainDO",
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
  }, [config, server, options.config, options.persist]);

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
