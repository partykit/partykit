import { parse } from "url";
import path from "path";
import assert from "assert";
import open from "open";
import * as os from "os";
import * as fs from "fs";
import chalk from "chalk";
import { fetchResult } from "./fetchResult";
import { serialize, deserialize } from "v8";
import * as dotenv from "dotenv";
import findConfig from "find-config";
import type { PartyKitStorage } from "./server";
import type { Server as HttpServer } from "http";
import type { BuildOptions } from "esbuild";

const MAX_KEYS = 128;
const MAX_KEY_SIZE = 2048; /* 2KiB */
const MAX_VALUE_SIZE = 128 * 1024; /* 128KiB */
// As V8 serialisation adds some tagging information, Workers actually allows
// values to be 32 bytes greater than the advertised limit. This allows 128KiB
// byte arrays to be stored for example.
const ENFORCED_MAX_VALUE_SIZE = MAX_VALUE_SIZE + 32;

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

const envPath = findConfig(".env");
const envVars = envPath ? dotenv.parse(fs.readFileSync(envPath, "utf8")) : {};

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

const CONFIG_PATH = path.join(os.homedir(), ".partykit", "config.json");

// A map of room names to room servers.
type Rooms = Map<string, Room>;

const GITHUB_APP_ID = "670a9f76d6be706f5209";

const workerFacade = fs.readFileSync(
  path.join(__dirname, "../facade/generated.js"),
  "utf8"
);

export async function dev(
  script: string, // The path to the script that will be run in the room.
  options: { port?: number } = {}
): Promise<{ close: () => Promise<void> }> {
  if (!script) throw new Error("script path is missing");
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
      env: Record<string, string>;
      storage: RoomStorage;
    } = {
      id: roomId,
      connections: new Map(),
      env: envVars,
      storage: new RoomStorage(),
    };

    const { runServer, EdgeRuntime } = await import("edge-runtime");

    const runtime = new EdgeRuntime({
      initialCode: code,
      extend: (context) =>
        Object.assign(context, {
          wss,
          partyRoom,
        }),
    });

    const roomHttpServer = (await runServer({ runtime })) as Room["http"];

    const room = { http: roomHttpServer, ws: wss, runtime };
    rooms.set(roomId, room);
    return room;
  }

  const absoluteScriptPath = path.resolve(process.cwd(), script);
  let code = `
    addEventListener("fetch", (event) => {
      console.warn('Server not built yet');
      event.respondWith(new Response('Server not built yet', { status: 500 }));
    })
  `;

  const esbuild = await import("esbuild");

  let isFirstBuild = true;

  const ctx = await esbuild.context({
    stdin: {
      contents: workerFacade.replace("__WORKER__", absoluteScriptPath),
      resolveDir: process.cwd(),
      // TODO: setting a sourcefile name crashes the whole thing???
      // sourcefile: "./" + path.relative(process.cwd(), scriptPath),
    },
    ...esbuildOptions,
    sourcemap: true,
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
    ],
  });

  await ctx.watch(); // turn on watch mode

  const express = await import("express");
  const httpProxy = await import("http-proxy");

  const app = express.default();

  // what we use to proxy requests to the room server
  const proxy = httpProxy.default.createProxyServer();

  // TODO: maybe we can just use urlpattern here
  app.get("/party/:roomId", async (req, res) => {
    const room = await getRoom(req.params.roomId);

    proxy.web(req, res, {
      target: room.http.url,
    });
  });

  const port = options.port || 1999;

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

      room.ws.handleUpgrade(request, socket, head, function done(ws) {
        room.ws.emit("connection", ws, request);
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

type User = {
  login: string;
  access_token: string;
  type: "github";
};

async function getUser(): Promise<User> {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_LOGIN) {
    return {
      login: process.env.GITHUB_LOGIN,
      access_token: process.env.GITHUB_TOKEN,
      type: "github",
    };
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    await login();
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error("login failed");
  }
  // TODO: zod
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) as User;
  return config;
}

export async function deploy(
  scriptPath: string,
  options: { name: string }
): Promise<void> {
  if (!scriptPath) throw new Error("script path is missing");
  if (!options.name) throw new Error("name is missing");

  // get user details
  const user = await getUser();

  const absoluteScriptPath = path.resolve(process.cwd(), scriptPath);
  const esbuild = await import("esbuild");
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const code = esbuild.buildSync({
    entryPoints: [absoluteScriptPath],
    ...esbuildOptions,
  }).outputFiles![0].text;

  await fetchResult(`/parties/${user.login}/${options.name}`, {
    method: "POST",
    body: code,
    headers: {
      Authorization: `Bearer ${user.access_token}`,
      "X-PartyKit-User-Type": user.type,
    },
  });

  console.log(
    `Deployed ${scriptPath} as https://${options.name}.${user.login}.partykit.dev`
  );
}

export async function _delete(options: { name: string }) {
  if (!options.name) throw new Error("name is missing");
  // get user details
  const user = await getUser();

  await fetchResult(`/parties/${user.login}/${options.name}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${user.access_token}`,
    },
  });

  console.log(`Deleted https://${options.name}.${user.login}.partykit.dev`);
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

export async function login(): Promise<void> {
  // see if we already have a code
  if (fs.existsSync(CONFIG_PATH)) {
    const user = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) as User;
    // test if code is valid
    const res = await fetch(`https://api.github.com/user`, {
      headers: {
        Authorization: `Bearer ${user.access_token}`,
      },
    });
    if (res.ok && user.login && (await res.json()).login === user.login) {
      console.log(`Logged in as ${user.login}`);
      return;
    } else {
      console.warn("invalid token detected, logging in again");
      // delete the existing config file
      fs.rmSync(CONFIG_PATH);
    }
  }

  // run github's oauth device flow
  // https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#device-flow
  const res = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_APP_ID,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to get device code: ${res.status} ${res.statusText}`
    );
  }

  const { device_code, user_code, verification_uri, expires_in, interval } =
    await res.json();

  console.log(
    `Please visit ${chalk.bold(
      verification_uri
    )} and paste the code ${chalk.bold(user_code)}`
  );
  console.log(`This code will expire in ${expires_in} seconds`);
  console.log(`Waiting for you to authorize...`);

  // we do this because for some reason the clipboardy package doesn't work
  // with a direct import up top
  const { default: clipboardy } = await import("clipboardy");
  clipboardy.writeSync(user_code);

  await open(verification_uri);

  const start = Date.now();
  while (Date.now() - start < expires_in * 1000) {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_APP_ID,
        device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    if (!res.ok) {
      throw new Error(
        `Failed to get access token: ${res.status} ${res.statusText}`
      );
    }

    const { access_token, error } = await res.json();

    // now get the username
    const githubUserDetails = (await (
      await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    ).json()) as { login: string };

    if (access_token) {
      // now write the token to the config file at ~/.partykit/config.json
      fs.mkdirSync(path.join(os.homedir(), ".partykit"), { recursive: true });
      fs.writeFileSync(
        CONFIG_PATH,
        JSON.stringify(
          { access_token, login: githubUserDetails.login, type: "github" },
          null,
          2
        )
      );
      console.log(`Logged in as ${chalk.bold(githubUserDetails.login)}`);
      return;
    }
    if (error === "authorization_pending") {
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
      continue;
    }
    throw new Error(`Unexpected error: ${error}`);
  }
}

export async function logout() {
  if (fs.existsSync(CONFIG_PATH)) {
    fs.rmSync(CONFIG_PATH);
  }
  // TODO: delete the token from github
  console.log("Logged out");
}

type EnvironmentChoice = "production" | "development" | "preview";

export const env = {
  async list(options: { name: string; env: EnvironmentChoice }) {
    // get user details
    const user = await getUser();

    const res = await fetchResult(
      `/parties/${user.login}/${options.name}/env?keys=true`,
      {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      }
    );

    console.log(res);
  },
  async pull(fileName: string, options: { name: string }) {
    // get user details
    const user = await getUser();

    const res = await fetchResult(
      `/parties/${user.login}/${options.name}/env`,
      {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      }
    );

    let fileContent = "";

    // write the file in dotenv syntax
    Object.entries(res as Record<string, string | number | boolean>).forEach(
      ([key, value]) => {
        fileContent += `${key}=${JSON.stringify(value)}\n`;
      }
    );

    fs.writeFileSync(fileName, fileContent);
  },
  async add(key: string, options: { name: string; env: EnvironmentChoice }) {
    // get user details
    const user = await getUser();

    const inquirer = await import("inquirer");

    const prompt = inquirer.createPromptModule();

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
          type: "input",
          name: "value",
          message: `Enter the value for ${key}`,
          transformer: (input) => {
            return "*".repeat(input.length);
          },
        });

    const res = await fetchResult(
      `/parties/${user.login}/${options.name}/env/${key}`,
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
  async remove(key: string, options: { name: string; env: EnvironmentChoice }) {
    // get user details
    const user = await getUser();

    const res = await fetchResult(
      `/parties/${user.login}/${options.name}/env/${key}`,
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
