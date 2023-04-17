import { parse } from "url";
import path from "path";
import assert from "assert";
import * as fs from "fs";
import chalk from "chalk";
import { fetchResult } from "./fetchResult";
import { serialize, deserialize } from "v8";
import { File, FormData } from "undici";
import type { PartyKitStorage } from "./server";
import type { Server as HttpServer } from "http";
import type { BuildOptions, OnLoadArgs } from "esbuild";
import * as crypto from "crypto";
import WebSocket from "ws";
import type { RawData } from "ws";
import onExit from "signal-exit";
import { version as packageVersion } from "../package.json";

import {
  fetchUserConfig,
  getConfig,
  getConfigPath,
  getUserConfig,
  // validateUserConfig,
} from "./config";
import type { TailFilterMessage } from "./tail/filters";
import { translateCLICommandToFilterMessage } from "./tail/filters";
import { jsonPrintLogs, prettyPrintLogs } from "./tail/printing";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_KEYS = 128;
const MAX_KEY_SIZE = 2048; /* 2KiB */
const MAX_VALUE_SIZE = 128 * 1024; /* 128KiB */
// As V8 serialisation adds some tagging information, Workers actually allows
// values to be 32 bytes greater than the advertised limit. This allows 128KiB
// byte arrays to be stored for example.
const ENFORCED_MAX_VALUE_SIZE = MAX_VALUE_SIZE + 32;

async function getUser() {
  let userConfig;
  try {
    userConfig = getUserConfig();
    // this isn't super useful since we're validating on the server
    // if (!(await validateUserConfig(userConfig))) {
    //   console.log("failed");
    //   throw new Error("Invalid user config");
    // }
  } catch (e) {
    console.log("could not get user details, attempting to login");
    await fetchUserConfig();
    userConfig = getUserConfig();
  }
  return userConfig;
}

function assertKeySize(key: string, many = false) {
  if (Buffer.byteLength(key) <= MAX_KEY_SIZE) return;
  if (many) {
    throw new RangeError(
      `Key "${key}" is larger than the limit of ${MAX_KEY_SIZE} bytes.`
    );
  }
  throw new RangeError(`Keys cannot be larger than ${MAX_KEY_SIZE} bytes.`);
}

function assertValueSize(value: Buffer, key?: string) {
  if (value.byteLength <= ENFORCED_MAX_VALUE_SIZE) return;
  if (key !== undefined) {
    throw new RangeError(
      `Value for key "${key}" is above the limit of ${MAX_VALUE_SIZE} bytes.`
    );
  }
  throw new RangeError(`Values cannot be larger than ${MAX_VALUE_SIZE} bytes.`);
}

// TODO: this should probably persist across hot reloads
export class RoomStorage implements PartyKitStorage {
  storage = new Map<string, Buffer>();

  async get<T = unknown>(key: string): Promise<T | undefined>;
  async get<T = unknown>(keys: string[]): Promise<Map<string, T>>;
  async get<T = unknown>(
    key: string | string[]
  ): Promise<T | undefined | Map<string, T>> {
    if (typeof key === "string") {
      assertKeySize(key);
      return deserialize(this.storage.get(key) ?? serialize(undefined)) as
        | T
        | undefined;
    } else {
      if (key.length > MAX_KEYS) {
        throw new RangeError(`Maximum number of keys is ${MAX_KEYS}.`);
      }
      const result = new Map<string, T>();
      for (const k of key) {
        assertKeySize(k, true);
        result.set(
          k,
          deserialize(this.storage.get(k) ?? serialize(undefined)) as T
        );
      }
      return result;
    }
  }

  async list<T = unknown>(options?: {
    start?: string;
    startAfter?: string;
    end?: string;
    prefix?: string;
    reverse?: boolean;
    limit?: number;
  }): Promise<Map<string, T>> {
    const result = new Map<string, T>();

    const keys = Array.from(this.storage.keys());
    keys.sort();
    if (options?.reverse) keys.reverse();

    for (const key of keys) {
      if (options?.prefix && !key.startsWith(options.prefix)) continue;
      if (options?.start && key < options.start) continue;
      if (options?.startAfter && key <= options.startAfter) continue;
      if (options?.end && key > options.end) continue;
      const rawValue = this.storage.get(key);
      assert(rawValue, "missing value for key");
      result.set(key, deserialize(rawValue) as T);
      if (options?.limit && result.size >= options.limit) break;
    }

    return result;
  }

  async put<T>(key: string, value: T): Promise<void>;
  async put<T>(entries: Record<string, T>): Promise<void>;
  async put<T>(key: string | Record<string, T>, value?: T): Promise<void> {
    if (typeof key === "string") {
      assertKeySize(key);
      const serialised = serialize(value);
      assertValueSize(serialised, key);
      this.storage.set(key, serialised);
    } else {
      if (Object.keys(key).length > MAX_KEYS) {
        throw new RangeError(`Maximum number of pairs is ${MAX_KEYS}.`);
      }
      for (const [k, v] of Object.entries(key)) {
        assertKeySize(k, true);
        const serialised = serialize(v);
        assertValueSize(serialised, k);
        this.storage.set(k, serialised);
      }
    }
  }

  async delete(key: string): Promise<boolean>;
  async delete(keys: string[]): Promise<number>;
  async delete(key: string | string[]): Promise<boolean | number> {
    if (typeof key === "string") {
      assertKeySize(key);
      return this.storage.delete(key);
    } else {
      if (key.length > MAX_KEYS) {
        throw new RangeError(`Maximum number of pairs is ${MAX_KEYS}.`);
      }
      let count = 0;
      for (const k of key) {
        assertKeySize(k, true);
        if (this.storage.delete(k)) count++;
      }
      return count;
    }
  }

  async deleteAll(): Promise<void> {
    this.storage.clear();
    return;
  }
  // getAlarm(): Promise<number | null>;
  // setAlarm(scheduledTime: number | Date): Promise<void>;
  // deleteAlarm(): Promise<void>;
}

// A "room" is a server that is running a script,
// as well as a websocket server distinct to the room.
type Room = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  http: Awaited<ReturnType<typeof import("edge-runtime").runServer>> & {
    // This... might not even be necessary??
    __server: HttpServer;
  };
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  ws: import("ws").WebSocketServer;
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  runtime: import("edge-runtime").EdgeRuntime;
};

const esbuildOptions: BuildOptions = {
  format: "esm",
  bundle: true,
  write: false,
  target: "esnext",
  minify: true, // TODO: remove this once https://github.com/vercel/edge-runtime/issues/243 is fixed
} as const;

// A map of room names to room servers.
type Rooms = Map<string, Room>;

export async function dev(options: {
  main?: string | undefined; // The path to the script that will be run in the room.
  port?: number | undefined;
  // assets: string | undefined;
  config?: string | undefined;
  vars?: Record<string, string> | undefined;
  define?: Record<string, string> | undefined;
}): Promise<{ close: () => Promise<void> }> {
  const config = getConfig(
    options.config,
    {
      main: options.main,
      vars: options.vars,
      define: options.define,
    },
    { readEnvLocal: true }
  );

  if (!config.main) {
    throw new Error(
      'Missing entry point, please specify "main" in your config'
    );
  }

  // A map of room names to room servers.
  const rooms: Rooms = new Map();

  // This is the function that gets/creates a room server.
  async function getRoom(roomId: string): Promise<Room> {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      assert(room, "room is missing");
      return room;
    }

    const { WebSocketServer } = await import("ws");

    const wss = new WebSocketServer({ noServer: true });

    const partyRoom: {
      id: string;
      connections: Map<string, { id: string; socket: WebSocket }>;
      env: Record<string, unknown>;
      storage: RoomStorage;
    } = {
      id: roomId,
      connections: new Map(),
      env: config.vars || {},
      storage: new RoomStorage(),
    };

    const { runServer, EdgeRuntime } = await import("edge-runtime");

    const runtime = new EdgeRuntime({
      initialCode: code,
      extend: (context) =>
        Object.assign(context, {
          wss,
          partyRoom,
          ...wasmModules,
        }),
    });

    const roomHttpServer = (await runServer({ runtime })) as Room["http"];

    const room = { http: roomHttpServer, ws: wss, runtime };
    rooms.set(roomId, room);
    return room;
  }

  const absoluteScriptPath = path.join(process.cwd(), config.main);
  let code = `
    addEventListener("fetch", (event) => {
      console.warn('Server not built yet');
      event.respondWith(new Response('Server not built yet', { status: 500 }));
    })
  `;

  const esbuild = await import("esbuild");

  let isFirstBuild = true;

  let wasmModules: Record<string, WebAssembly.Module> = {};

  const workerFacade = fs.readFileSync(
    path.join(__dirname, "../facade/generated.js"),
    "utf8"
  );

  const ctx = await esbuild.context({
    stdin: {
      contents: workerFacade.replace("__WORKER__", absoluteScriptPath),
      resolveDir: process.cwd(),
      // TODO: setting a sourcefile name crashes the whole thing???
      // sourcefile: "./" + path.relative(process.cwd(), scriptPath),
    },
    ...esbuildOptions,
    format: "cjs",
    sourcemap: true,
    define: {
      ...esbuildOptions.define,
      ...config.define,
    },
    plugins: [
      {
        name: "partykit",
        setup(build) {
          build.onEnd((result) => {
            if (result.errors.length > 0) return;
            if (!result || !result.outputFiles) {
              console.error(chalk.red("Build failed: no result"));
              return;
            }

            if (isFirstBuild) {
              isFirstBuild = false;
              console.log(chalk.green("Build succeeded, starting rooms..."));
            } else {
              console.log(chalk.green("Build succeeded, restarting rooms..."));
            }
            code = result.outputFiles[0].text;
            const closed = [...rooms.keys()];
            rooms.forEach((room) => {
              // TODO: wait for all .close() calls to finish
              room.http.__server.close();
              room.ws.clients.forEach((client) => client.close());
              room.ws.close();
            });
            rooms.clear();
            closed.forEach((roomId) => {
              getRoom(roomId).catch((err) => {
                console.error(`could not get room ${roomId}`, err);
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

          build.onResolve({ filter: /\.wasm$/ }, (args) => {
            throw new Error(
              `Cannot import .wasm files directly. Use import "${args.path}?module" instead.`
            );
          });

          build.onResolve({ filter: /\.wasm\?module$/ }, (args) => {
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

            wasmModules[fileName.replace(/[^a-zA-Z0-9_$]/g, "_")] =
              new WebAssembly.Module(fs.readFileSync(filePath));

            return {
              path: fileName, // change the reference to the changed module
              external: false, // not an external in dev, we swap it with an identifier
              namespace: `partykit-module-wasm-dev`, // just a tag, this isn't strictly necessary
              watchFiles: [filePath], // we also add the file to esbuild's watch list
            };
          });

          build.onLoad({ filter: /\.wasm$/ }, async (args: OnLoadArgs) => {
            return {
              // We replace the the module with an identifier
              // that we'll separately add to the form upload
              // as part of [wasm_modules]/[text_blobs]/[data_blobs]. This identifier has to be a valid
              // JS identifier, so we replace all non alphanumeric characters
              // with an underscore.
              contents: `export default ${args.path.replace(
                /[^a-zA-Z0-9_$]/g,
                "_"
              )};`,
            };
          });
        },
      },
    ],
  });

  await ctx.watch(); // turn on watch mode

  const express = await import("express");
  const httpProxy = await import("http-proxy");

  const app = express.default();

  // if (options.assets) {
  //   app.use(express.static(options.assets));
  // }

  // what we use to proxy requests to the room server
  const proxy = httpProxy.default.createProxyServer();

  // TODO: maybe we can just use urlpattern here
  app.all("/party/:roomId", async (req, res) => {
    const room = await getRoom(req.params.roomId);

    proxy.web(req, res, {
      target: room.http.url,
    });
  });

  const port = options.port ?? config.port ?? 1999;

  const server = app.listen(port);
  await new Promise((resolve) => server.once("listening", resolve));

  server.on("upgrade", async function upgrade(request, socket, head) {
    assert(request.url, "request url is missing");
    const url = parse(request.url, true);
    assert(url.pathname, "pathname is missing!");

    // TODO: maybe we can just use urlpattern here
    // TODO: this doesn't send an error code, we should do that
    if (url.pathname.startsWith("/party/")) {
      if (!url.query._pk) {
        request.destroy(new Error("oh no missing _pk"));
        return;
      }
      const roomId = url.pathname.split("/")[2];
      const room = await getRoom(roomId);

      const initialRes = await room.runtime.dispatchFetch(
        `http://${request.headers.host}${request.url}`,
        // @ts-expect-error TODO: fix this, set-cookies may be a string[]
        { headers: request.headers }
      );

      if (initialRes.status === 401) {
        socket.destroy();
      } else if (initialRes.status === 200) {
        request.headers["x-pk-initial"] = await initialRes.text();
      }

      socket.pause();

      room.ws.handleUpgrade(request, socket, head, function done(ws) {
        room.ws.emit("onConnect", ws, request, (err?: Error) => {
          if (err) {
            console.error(err);
            socket.destroy();
          } else {
            socket.resume();
          }
        });
      });
    } else {
      socket.destroy();
    }
  });

  console.log(`Listening on http://localhost:${port}...`);

  return {
    async close() {
      // cleanup
      const ctr = rooms.size * 2 + 1;
      return new Promise((resolve, reject) => {
        let count = 0;
        function done(err?: Error) {
          if (err) {
            reject(err);
            return;
          }
          count++;
          if (count === ctr) {
            resolve(undefined);
          }
        }
        // proxy.close(done);
        server.close(done);
        rooms.forEach((room) => {
          // TODO: bleh we should fix server.close() signature upstream
          room.http.__server.close(done);
          room.ws.close(done);
        });
      });
    },
  };
}

export async function deploy(options: {
  main: string | undefined;
  name: string;
  config: string | undefined;
  vars: Record<string, string> | undefined;
  define: Record<string, string> | undefined;
  preview: string | undefined;
  withVars: boolean | undefined;
}): Promise<void> {
  const config = getConfig(options.config, options);

  if (!config.main) {
    throw new Error(
      'Missing entry point, please specify "main" in your config'
    );
  }

  const configName = config.name;
  assert(
    configName,
    'Missing project name, please specify "name" in your config'
  );

  const absoluteScriptPath = path.join(process.cwd(), config.main);

  // get user details
  const user = await getUser();

  const wasmModules: Record<string, Buffer> = {};

  const esbuild = await import("esbuild");
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const code = (
    await esbuild.build({
      entryPoints: [absoluteScriptPath],
      ...esbuildOptions,
      define: {
        ...esbuildOptions.define,
        ...config.define,
      },
      plugins: [
        {
          name: "partykit-wasm-publish",
          setup(build) {
            build.onResolve({ filter: /\.wasm$/ }, (args) => {
              throw new Error(
                `Cannot import .wasm files directly. Use import "${args.path}?module" instead.`
              );
            });

            build.onResolve({ filter: /\.wasm\?module$/ }, (args) => {
              const filePath = path.join(
                args.resolveDir,
                args.path.replace(/\?module$/, "")
              );
              const fileContent = fs.readFileSync(filePath);
              const fileHash = crypto
                .createHash("sha1")
                .update(fileContent)
                .digest("hex");
              const fileName = `${fileHash}-${path.basename(
                args.path,
                ".wasm?module"
              )}`;

              wasmModules[fileName] = fs.readFileSync(filePath);

              return {
                path: fileName, // change the reference to the changed module
                external: true, // mark it as external in the bundle
                namespace: "partykit-module-wasm-publish", // just a tag, this isn't strictly necessary
              };
            });
          },
        },
      ],
    })
  ).outputFiles![0].text;
  const form = new FormData();
  form.set("code", code);

  const vars = options.withVars
    ? config.vars
    : // only set vars passed in via cli with --var,
      // not from .env/partykit.json/etc
      options.vars;
  if (vars && Object.keys(vars).length > 0) {
    // TODO: need some good messaging here to explain what's going on
    form.set("vars", JSON.stringify(vars));
  }

  for (const [fileName, buffer] of Object.entries(wasmModules)) {
    form.set(
      `upload/${fileName}`,
      new File([buffer], `upload/${fileName}`, { type: "application/wasm" })
    );
  }

  const urlSearchParams = new URLSearchParams();
  if (options.preview) {
    urlSearchParams.set("preview", options.preview);
  }

  await fetchResult(
    `/parties/${user.login}/${config.name}${
      options.preview ? `?${urlSearchParams.toString()}` : ""
    }`,
    {
      method: "POST",
      body: form,
      headers: {
        Authorization: `Bearer ${user.access_token}`,
        "X-PartyKit-User-Type": user.type,
      },
    }
  );

  console.log(
    `Deployed ${config.main} as ${config.name}.${user.login}.partykit.dev`
  );
}

export async function _delete(options: {
  name: string | undefined;
  config: string | undefined;
  preview: string | undefined;
}) {
  const config = getConfig(options.config, options);
  if (!config.name) {
    throw new Error("project name is missing");
  }
  // get user details
  const user = await getUser();

  const urlSearchParams = new URLSearchParams();
  if (options.preview) {
    urlSearchParams.set("preview", options.preview);
  }

  await fetchResult(
    `/parties/${user.login}/${config.name}${
      options.preview ? `?${urlSearchParams.toString()}` : ""
    }`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.access_token}`,
      },
    }
  );

  console.log(`Deleted ${config.name}.${user.login}.partykit.dev`);
}

type TailCreationApiResponse = {
  result: {
    id: string;
    url: string;
    expires_at: Date;
  };
};

const TRACE_VERSION = "trace-v1";

export async function tail(options: {
  name: string | undefined;
  config: string | undefined;
  preview: string | undefined;
  status: ("ok" | "canceled" | "error")[];
  ip: string[] | undefined;
  header: string | undefined;
  samplingRate: number | undefined;
  method: string[] | undefined;
  format: "json" | "pretty";
  search: string | undefined;
  debug: boolean;
}) {
  // get user details
  const user = await getUser();

  const config = getConfig(options.config, options);
  if (!config.name) {
    throw new Error("project name is missing");
  }

  let scriptDisplayName = config.name;
  if (options.preview) {
    scriptDisplayName = `${scriptDisplayName} (preview: ${options.preview})`;
  }

  const filters: TailFilterMessage = translateCLICommandToFilterMessage({
    status: options.status,
    header: options.header,
    method: options.method,
    search: options.search,
    samplingRate: options.samplingRate,
    clientIp: options.ip,
  });

  const urlSearchParams = new URLSearchParams();
  if (options.preview) {
    urlSearchParams.set("preview", options.preview);
  }
  const {
    result: { id: tailId, url: websocketUrl, expires_at: expiration },
  } = await fetchResult<TailCreationApiResponse>(
    `/parties/${user.login}/${config.name}/tail${
      options.preview ? `?${urlSearchParams.toString()}` : ""
    }`,
    {
      method: "POST",
      body: JSON.stringify(filters),
      headers: {
        Authorization: `Bearer ${user.access_token}`,
      },
    }
  );

  if (options.format === "pretty") {
    console.log(
      `Successfully created tail, expires at ${expiration.toLocaleString()}`
    );
  }

  async function deleteTail() {
    await fetchResult(
      `/parties/${user.login}/${config.name}/tail/${tailId}${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      }
    );
  }

  // connect to the tail
  const tailSocket = new WebSocket(websocketUrl, TRACE_VERSION, {
    headers: {
      "Sec-WebSocket-Protocol": TRACE_VERSION, // needs to be `trace-v1` to be accepted
      "User-Agent": `partykit/${packageVersion}`,
    },
  });

  // send filters when we open up
  tailSocket.on("open", function () {
    tailSocket.send(
      JSON.stringify({ debug: options.debug || false }),
      { binary: false, compress: false, mask: false, fin: true },
      (err) => {
        if (err) {
          throw err;
        }
      }
    );
  });

  onExit(async () => {
    tailSocket.terminate();
    await deleteTail();
  });

  const printLog: (data: RawData) => void =
    options.format === "pretty" ? prettyPrintLogs : jsonPrintLogs;

  tailSocket.on("message", printLog);

  while (tailSocket.readyState !== tailSocket.OPEN) {
    switch (tailSocket.readyState) {
      case tailSocket.CONNECTING:
        await sleep(100);
        break;
      case tailSocket.CLOSING:
        await sleep(100);
        break;
      case tailSocket.CLOSED:
        throw new Error(
          `Connection to ${scriptDisplayName} closed unexpectedly.`
        );
    }
  }

  if (options.format === "pretty") {
    console.log(`Connected to ${scriptDisplayName}, waiting for logs...`);
  }

  tailSocket.on("close", async () => {
    tailSocket.terminate();
    await deleteTail();
  });
}

export async function list() {
  // get user details
  const user = await getUser();

  const res = await fetchResult(`/parties/${user.login}`, {
    headers: {
      Authorization: `Bearer ${user.access_token}`,
    },
  });

  console.log(res);
}

// type EnvironmentChoice = "production" | "development" | "preview";

export const env = {
  async list(options: {
    name: string | undefined;
    // env: EnvironmentChoice;
    config: string | undefined;
    preview: string | undefined;
  }) {
    // get user details
    const user = await getUser();

    const config = getConfig(options.config, options);
    if (!config.name) {
      throw new Error("project name is missing");
    }

    const urlSearchParams = new URLSearchParams();
    urlSearchParams.set("keys", "true");
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    const res = await fetchResult(
      `/parties/${user.login}/${config.name}/env?${urlSearchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      }
    );

    console.log(res);
  },
  async pull(
    fileName: string | undefined,
    options: {
      name: string | undefined;
      config: string | undefined;
      preview: string | undefined;
    }
  ) {
    // get user details
    const user = await getUser();

    const config = getConfig(options.config, options);
    if (!config.name) {
      throw new Error("project name is missing");
    }

    const urlSearchParams = new URLSearchParams();
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    const res = await fetchResult(
      `/parties/${user.login}/${config.name}/env${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      }
    );

    const targetFileName =
      fileName || options.config || getConfigPath() || "partykit.json";
    if (!fs.existsSync(targetFileName)) {
      console.log(`Creating ${targetFileName}...`);
      fs.writeFileSync(targetFileName, "{}");
    } else {
      console.log(`Updating ${targetFileName}...`);
    }

    fs.writeFileSync(
      targetFileName,
      JSON.stringify(
        {
          ...JSON.parse(fs.readFileSync(targetFileName, "utf8")),
          name: config.name,
          vars: res,
        },
        null,
        2
      ) + "\n"
    );
  },
  async push(options: {
    name: string | undefined;
    config: string | undefined;
    preview: string | undefined;
  }) {
    // get user details
    const user = await getUser();

    const config = getConfig(options.config, options);
    if (!config.name) {
      throw new Error("project name is missing");
    }

    const urlSearchParams = new URLSearchParams();
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    if (Object.keys(config.vars || {}).length === 0) {
      console.warn("No environment variables to push, exiting...");
      return;
    }

    await fetchResult(
      `/parties/${user.login}/${config.name}/env${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        method: "POST",
        body: JSON.stringify(config.vars || {}),
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Pushed environment variables");
  },
  async add(
    key: string,
    options: {
      name: string | undefined;
      // env: EnvironmentChoice;
      config: string | undefined;
      preview: string | undefined;
    }
  ) {
    // get user details
    const user = await getUser();

    const config = getConfig(options.config, options);
    if (!config.name) {
      throw new Error("project name is missing");
    }

    const { default: prompt } = await import("prompts");

    const { value } = !process.stdin.isTTY
      ? // the value is being piped in
        await new Promise<{ value: string }>((resolve, reject) => {
          const stdin = process.openStdin();

          let data = "";

          stdin.on("data", function (chunk) {
            data += chunk;
          });

          stdin.on("end", function () {
            resolve({ value: data });
          });

          stdin.on("error", function (err) {
            reject(err);
          });
        })
      : // the value is being entered manually
        await prompt({
          type: "password",
          name: "value",
          message: `Enter the value for ${key}`,
        });

    const urlSearchParams = new URLSearchParams();
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    const res = await fetchResult(
      `/parties/${user.login}/${config.name}/env/${key}${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        method: "POST",
        body: value,
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      }
    );

    console.log(res);
  },
  async remove(
    key: string | undefined,
    options: {
      name: string | undefined;
      // env: EnvironmentChoice;
      config: string | undefined;
      preview: string | undefined;
    }
  ) {
    // get user details
    const user = await getUser();

    const config = getConfig(options.config, options);
    if (!config.name) {
      throw new Error("project name is missing");
    }

    const urlSearchParams = new URLSearchParams();
    if (options.preview) {
      urlSearchParams.set("preview", options.preview);
    }

    if (!key) {
      const { default: prompt } = await import("prompts");

      const { value } = await prompt({
        type: "confirm",
        name: "value",
        message: `Are you sure you want to delete all environment variables?`,
        initial: true,
      });

      if (!value) {
        console.log("Aborted");
        return;
      } else {
        const res = await fetchResult(
          `/parties/${user.login}/${config.name}/env${
            options.preview ? `?${urlSearchParams.toString()}` : ""
          }`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user.access_token}`,
            },
          }
        );
        console.log(res);
        return;
      }
    }

    const res = await fetchResult(
      `/parties/${user.login}/${config.name}/env/${key}${
        options.preview ? `?${urlSearchParams.toString()}` : ""
      }`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      }
    );

    console.log(res);
  },
};
