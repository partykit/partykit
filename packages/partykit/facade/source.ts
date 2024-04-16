// This is the facade for the worker that will be used in partykit.
// It will be compiled and imported by the CLI.

// @ts-expect-error We'll be replacing __WORKER__
// with the path to the input worker
import Worker from "__WORKER__";

import {
  createLazyConnection,
  HibernatingConnectionManager,
  InMemoryConnectionManager
} from "./connection";
import fetchStaticAsset from "./fetch-static-asset";
import { VectorizeClient } from "./vectorize";
import { ClassWorker, ModuleWorker } from "./worker";

import type * as Party from "../src/server";
import type { ConnectionManager } from "./connection";
import type { VectorizeClientOptions } from "./vectorize";
import type { PartyServerAPI } from "./worker";
import type {
  DurableObjectNamespace,
  DurableObjectState,
  ExecutionContext,
  RequestInfo,
  RequestInit
} from "@cloudflare/workers-types";

declare const Worker: Party.PartyKitServer;

declare const PARTYKIT_HOST: string;

declare const __R2_BINDINGS__: string[];
declare const __KV_BINDINGS__: string[];

function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

let didWarnAboutDevAnalytics = false;
const MockAnalyticsDataset: AnalyticsEngineDataset = {
  writeDataPoint: (_data: AnalyticsEngineDataPoint) => {
    if (!didWarnAboutDevAnalytics) {
      console.log(
        "⚠️  analytics.writeDataPoint is not implemented in local development."
      );
      didWarnAboutDevAnalytics = true;
    }
  }
};

// The roomId is /party/[roomId] or /parties/[partyName]/[roomId]
function getRoomAndPartyFromPathname(pathname: string): {
  room: string;
  party: string;
} | null {
  // NOTE: keep in sync with ./source.ts
  // TODO: use a URLPattern here instead
  if (pathname.startsWith("/party/")) {
    const [_, __, roomId] = pathname.split("/");
    return {
      room: roomId,
      party: "main"
    };
  } else if (pathname.startsWith("/parties/")) {
    const [_, __, partyName, roomId] = pathname.split("/");
    return {
      room: roomId,
      party: partyName
    };
  }
  return null;
}

// The worker script can either be an object with handlers, or a class with same handlers
function isClassWorker(worker: unknown): worker is Party.Worker {
  return (
    typeof worker === "function" &&
    "prototype" in worker &&
    worker.prototype instanceof Object
  );
}

function getBindings(env: Env): {
  r2: Record<string, R2Bucket>;
  kv: Record<string, KVNamespace>;
} {
  const r2Bindings = __R2_BINDINGS__;
  const kvBindings = __KV_BINDINGS__;

  return {
    r2: r2Bindings.reduce(
      (acc, name) => {
        acc[name] = env[name] as unknown as R2Bucket;
        return acc;
      },
      {} as Record<string, R2Bucket>
    ),
    kv: kvBindings.reduce(
      (acc, name) => {
        acc[name] = env[name] as unknown as KVNamespace;
        return acc;
      },
      {} as Record<string, KVNamespace>
    )
  };
}

class PartyDurable {}

type DurableObjectNamespaceEnv = {
  [key: string]: DurableObjectNamespace;
};

type Env = DurableObjectNamespaceEnv & {
  PARTYKIT_AI: Party.Room["context"]["ai"];
  PARTYKIT_DURABLE: DurableObjectNamespace;
  PARTYKIT_VECTORIZE: Record<string, VectorizeClientOptions>;
  PARTYKIT_CRONS: Record<string, string>;
};

let parties: Party.Room["context"]["parties"];

function extractVars(obj: Record<string, unknown>): Record<string, unknown> {
  const vars: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("pkvar-")) {
      vars[key.slice(`pkvar-`.length)] = value;
    }
  }
  return vars;
}

// create a "multi-party" object that can be used to connect to other parties
function createMultiParties(
  namespaces: Record<string, DurableObjectNamespace>,
  options: {
    host: string;
  }
): Party.Room["context"]["parties"] {
  if (!parties) {
    parties = {};
    for (const [key, value] of Object.entries(namespaces)) {
      if (typeof value.idFromName === "function") {
        parties[key] ||= {
          get: (name: string): Party.Stub => {
            const docId = value.idFromName(name).toString();
            const id = value.idFromString(docId);
            const stub = value.get(id);
            return {
              fetch(
                pathOrInit?: string | RequestInit | Request,
                maybeInit?: RequestInit | Request
              ) {
                let path: RequestInfo | undefined;
                let init: RequestInit | Request | undefined;
                if (pathOrInit) {
                  if (typeof pathOrInit === "string") {
                    path = pathOrInit;
                    init = maybeInit;
                    if (path[0] !== "/") {
                      throw new Error("Path must start with /");
                    }
                    return stub.fetch(
                      `http://${options.host}/parties/${key}/${name}${path}`,
                      init
                    );
                  } else {
                    init = pathOrInit;
                    return stub.fetch(
                      `http://${options.host}/parties/${key}/${name}`,
                      init
                    );
                  }
                } else {
                  return stub.fetch(
                    `http://${options.host}/parties/${key}/${name}`
                  );
                }
              },
              connect: () => {
                return new WebSocket(
                  `ws://${options.host}/parties/${key}/${name}`
                );
              },
              async socket(
                pathOrInit?: string | RequestInit,
                maybeInit?: RequestInit
              ) {
                let res: Response;
                // This method is better because it doesn't go via the internet
                // and doesn't get 522/404/ get caught in CF firewall
                let path: RequestInfo | undefined;
                let init: RequestInit | undefined;
                if (pathOrInit) {
                  if (typeof pathOrInit === "string") {
                    path = pathOrInit;
                    init = maybeInit;
                    if (path[0] !== "/") {
                      throw new Error("Path must start with /");
                    }
                    res = await stub.fetch(
                      `http://${options.host}/parties/${key}/${name}${path}`,
                      {
                        ...init,
                        headers: {
                          upgrade: "websocket",
                          ...init?.headers
                        }
                      }
                    );
                  } else {
                    init = pathOrInit;
                    res = await stub.fetch(
                      `http://${options.host}/parties/${key}/${name}`,
                      {
                        ...init,
                        headers: {
                          upgrade: "websocket",
                          ...init?.headers
                        }
                      }
                    );
                  }
                } else {
                  res = await stub.fetch(
                    `http://${options.host}/parties/${key}/${name}`,
                    {
                      headers: {
                        upgrade: "websocket"
                      }
                    }
                  );
                }
                const ws = res.webSocket;
                if (!ws) {
                  throw new Error("Expected a websocket response");
                }
                ws.accept();
                return ws as WebSocket;
              }
            };
          }
        };
      }
    }
  }

  return parties;
}

async function assetsFetch(
  path: string,
  env: Env,
  ctx: ExecutionContext
): Promise<Response | null> {
  if (!path.startsWith("/")) {
    throw new Error("Path must start with /");
  }
  return fetchStaticAsset(new Request(`http://dummy.com${path}`), env, ctx);
}

function createDurable(
  Worker: Party.PartyKitServer,
  options: {
    name: string;
  }
) {
  const isClassAPI = isClassWorker(Worker);

  // When the worker is a class, to validate worker shape we'll look onto the worker prototype
  const WorkerInstanceMethods: Party.PartyKitServer = isClassWorker(Worker)
    ? Worker.prototype
    : Worker;

  for (const handler of [
    "onConnect",
    "onRequest",
    "onMessage",
    "onClose",
    "onError",
    "onAlarm"
  ] satisfies (keyof Party.PartyKitServer)[]) {
    if (handler in Worker && typeof Worker[handler] !== "function") {
      throw new Error(`.${handler} should be a function`);
    }
  }

  for (const handler of [
    "unstable_onFetch",
    "onFetch",
    "onBeforeConnect",
    "onBeforeRequest"
  ] satisfies (keyof Party.PartyKitServer)[]) {
    if (handler in WorkerInstanceMethods) {
      if (isClassAPI) {
        console.warn(
          `.${handler} is present on the class instance, but it should be defined as a static method`
        );
      }

      if (typeof WorkerInstanceMethods[handler] !== "function") {
        throw new Error(`.${handler} should be a function`);
      }
    }
  }

  return class extends PartyDurable implements DurableObject {
    controller: DurableObjectState;
    room: Party.Room;
    namespaces: Record<string, DurableObjectNamespace>;
    inAlarm = false; // used to prevent access to certain properties in onAlarm

    // assigned when first connection is received
    id?: string;
    worker?: PartyServerAPI;
    parties?: Party.Room["context"]["parties"];
    vectorize: Record<string, VectorizeClient>;
    connectionManager?: ConnectionManager;

    constructor(controller: DurableObjectState, env: Env) {
      super();

      const {
        PARTYKIT_AI,
        PARTYKIT_DURABLE,
        PARTYKIT_VECTORIZE,
        ...namespaces
      } = env;

      this.controller = controller;
      this.namespaces = namespaces;

      Object.assign(this.namespaces, {
        main: PARTYKIT_DURABLE
      });

      this.vectorize = Object.fromEntries(
        Object.entries(PARTYKIT_VECTORIZE || {}).map(([key, value]) => [
          key,
          new VectorizeClient(value)
        ])
      );

      // Party.connections getter needs access to durable object in closure
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;

      this.room = {
        get id() {
          if (self.inAlarm) {
            throw new Error(
              "You can not access `Party.id` in the `onAlarm` handler.\n" +
                "This is a known limitation, and may be fixed in a future version of PartyKit.\n" +
                "If you access to the id, you can save it into the Room storage when setting the alarm.\n"
            );
          }
          if (self.id) {
            return self.id;
          }
          throw new Error(
            "Party.id is not yet initialized. This is probably a bug in PartyKit."
          );
        },
        internalID: this.controller.id.toString(),
        name: options.name,
        env: extractVars(env),
        storage: this.controller.storage,
        blockConcurrencyWhile: this.controller.blockConcurrencyWhile.bind(
          this.controller
        ),
        broadcast: this.broadcast,
        context: {
          get parties() {
            if (self.inAlarm) {
              throw new Error(
                "You can not access `Party.context.parties` in the `onAlarm` handler.\n" +
                  "This is a known limitation, and may be fixed in a future version of PartyKit."
              );
            }
            if (self.parties) {
              return self.parties;
            }
            throw new Error(
              "Parties are not yet initialized. This is probably a bug in PartyKit."
            );
          },
          vectorize: this.vectorize,
          ai: PARTYKIT_AI,
          assets: {
            fetch(path: string) {
              return assetsFetch(path, env, {
                passThroughOnException() {
                  // no op
                },
                waitUntil(_promise: Promise<unknown>) {
                  // no op
                }
              });
            }
          },
          bindings: getBindings(env)
        },
        getConnection(id: string) {
          if (self.connectionManager) {
            return self.connectionManager.getConnection(id);
          }

          console.warn(
            ".getConnection was invoked before first connection. This will always return undefined."
          );
          return undefined;
        },

        getConnections(tag?: string) {
          if (self.connectionManager) {
            return self.connectionManager.getConnections(tag);
          }

          console.warn(
            "Party.getConnections was invoked before first connection. This will always return an empty list."
          );
          return [].values();
        },

        analytics: MockAnalyticsDataset,

        /// @deprecated, supported for backwards compatibility only
        get connections() {
          console.warn(
            "Party.connections is deprecated and will be removed in a future version of PartyKit. Use Party.getConnections() instead."
          );
          if (self.connectionManager) {
            // note: this is expensive for hibernating connections
            return self.connectionManager.legacy_getConnectionMap();
          }

          console.warn(
            "Party.connections was invoked before first connection. This will always return an empty Map."
          );
          return new Map();
        },

        get parties() {
          console.warn(
            "Party.parties is deprecated and will be removed in a future version of PartyKit. Use Party.context.parties instead."
          );
          return this.context.parties;
        }
      };
    }

    broadcast = (
      msg: string | ArrayBuffer | ArrayBufferView,
      without: string[] = []
    ) => {
      if (!this.connectionManager) {
        return;
      }

      for (const connection of this.connectionManager.getConnections()) {
        if (!without.includes(connection.id)) {
          connection.send(msg);
        }
      }
    };

    async fetch(req: Request) {
      // Coerce the request type to our extended request type.
      // We do this to make typing in userland simpler
      const request = req as unknown as Party.Request;
      const url = new URL(request.url);

      try {
        if (!this.worker) {
          await this.initialize(request.url);
        }

        // make sure initialization ran as expected
        assert(this.worker, "Worker not initialized.");
        assert(this.connectionManager, "ConnectionManager not initialized.");

        // handle non-websocket requests
        if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
          return await this.worker.onRequest(request);
        }
      } catch (e) {
        console.error("onRequest error", e);
        const errMessage = e instanceof Error ? e.message : `${e}`;
        // @ts-expect-error - code is not a property on Error
        const errCode = "code" in e ? (e.code as number) : 500;
        return new Response(
          errMessage || "Uncaught exception when making a request",
          {
            status: errCode
          }
        );
      }
      // handle websocket connections
      try {
        if (
          !(
            ("onConnect" in this.worker &&
              typeof this.worker.onConnect === "function") ||
            ("onMessage" in this.worker &&
              typeof this.worker.onMessage === "function")
          )
        ) {
          throw new Error("No onConnect or onMessage handler");
        }

        // Create the websocket pair for the client
        const { 0: clientWebSocket, 1: serverWebSocket } = new WebSocketPair();

        let connectionId = url.searchParams.get("_pk");
        if (!connectionId) {
          connectionId = crypto.randomUUID();
        }

        // TODO: Object.freeze / mark as readonly!
        let connection: Party.Connection = Object.assign(serverWebSocket, {
          id: connectionId,
          socket: serverWebSocket,
          uri: request.url,
          state: null as unknown as Party.ConnectionState<unknown>,
          setState<T = unknown>(setState: T | Party.ConnectionSetStateFn<T>) {
            let state: T;
            if (setState instanceof Function) {
              state = setState(this.state as Party.ConnectionState<T>);
            } else {
              state = setState;
            }

            // TODO: deepFreeze object?
            this.state = state as Party.ConnectionState<T>;
            return this.state;
          }
        });

        const ctx = { request };
        const tags = await this.worker.getConnectionTags(connection, ctx);

        // Accept the websocket connection
        connection = this.connectionManager.accept(connection, tags);

        if (!this.worker.supportsHibernation) {
          await this.attachSocketEventHandlers(connection);
        }

        await this.worker.onConnect(connection, ctx);

        return new Response(null, { status: 101, webSocket: clientWebSocket });
      } catch (e) {
        console.error("Error when connecting");
        console.error(e);

        // Annoyingly, if we return an HTTP error
        // in response to a WebSocket request, Chrome devtools
        // won't show us the response body! So...
        // let's send a WebSocket response with an error frame instead.

        const errMessage = e instanceof Error ? e.message : `${e}`;
        const pair = new WebSocketPair();
        pair[1].accept();
        pair[1].close(1011, errMessage || "Uncaught exception when connecting");
        return new Response(null, { status: 101, webSocket: pair[0] });
      }
    }

    /**
     * Parties can only be created once we have a request URL.
     * This method should be called when the durable object receives its
     * first connection, or is woken up from hibernation.
     */
    async initialize(requestUri: string) {
      // these can be collapsed into a single method once we solve
      // request url rehydration on alarm
      this.#initializeParty(requestUri);
      return this.#initializeWorker();
    }

    #initializeParty(requestUri: string) {
      const url = new URL(requestUri);
      const roomId = getRoomAndPartyFromPathname(url.pathname)?.room;
      assert(roomId, "No room id found in request url");

      this.id = roomId;
      this.parties = createMultiParties(this.namespaces, {
        host: url.host
      });
    }

    async #initializeWorker() {
      this.worker = isClassAPI
        ? new ClassWorker(Worker, this.room)
        : new ModuleWorker(Worker, this.room);

      this.connectionManager = this.worker.supportsHibernation
        ? new HibernatingConnectionManager(this.controller)
        : new InMemoryConnectionManager();

      return this.worker.onStart();
    }

    async attachSocketEventHandlers(connection: Party.Connection) {
      assert(this.worker, "[onConnect] Worker not initialized.");

      const handleMessageFromClient = (event: MessageEvent) => {
        this.invokeOnMessage(connection, event.data).catch((e) => {
          console.error(e);
        });
      };

      const handleCloseFromClient = () => {
        connection.removeEventListener("message", handleMessageFromClient);
        connection.removeEventListener("close", handleCloseFromClient);
        this.invokeOnClose(connection).catch((e) => {
          console.error(e);
        });
      };

      const handleErrorFromClient = (e: ErrorEvent) => {
        connection.removeEventListener("message", handleMessageFromClient);
        connection.removeEventListener("error", handleErrorFromClient);
        this.invokeOnError(connection, e.error).catch((e) => {
          console.error(e);
        });
      };

      connection.addEventListener("close", handleCloseFromClient);
      connection.addEventListener("error", handleErrorFromClient);
      connection.addEventListener("message", handleMessageFromClient);
    }

    /** Runtime calls webSocketMessage when hibernated connection receives a message  */
    async webSocketMessage(
      ws: WebSocket,
      msg: string | ArrayBuffer | ArrayBufferView
    ) {
      const connection = createLazyConnection(ws);
      if (!this.worker) {
        // This means the room "woke up" after hibernation
        // so we need to hydrate this.room again
        assert(connection.uri, "No uri found in connection");
        await this.initialize(connection.uri);
      }

      return this.invokeOnMessage(connection, msg);
    }

    /** Runtime calls webSocketClose when hibernated connection closes  */
    async webSocketClose(ws: WebSocket) {
      const connection = createLazyConnection(ws);
      if (!this.worker) {
        // This means the room "woke up" after hibernation
        // so we need to hydrate this.room again
        assert(connection.uri, "No uri found in connection");
        await this.initialize(connection.uri);
      }
      return this.invokeOnClose(connection);
    }

    /** Runtime calls webSocketError when hibernated connection errors  */
    async webSocketError(ws: WebSocket, err: Error) {
      const connection = createLazyConnection(ws);
      if (!this.worker) {
        // This means the room "woke up" after hibernation
        // so we need to hydrate this.room again
        assert(connection.uri, "No uri found in connection");
        await this.initialize(connection.uri);
      }
      return this.invokeOnError(connection, err);
    }

    async invokeOnClose(connection: Party.Connection) {
      assert(this.worker, "[onClose] Worker not initialized.");
      return this.worker.onClose(connection);
    }

    async invokeOnError(connection: Party.Connection, err: Error) {
      assert(this.worker, "[onError] Worker not initialized.");
      return this.worker.onError(connection, err);
    }

    async invokeOnMessage(
      connection: Party.Connection,
      msg: string | ArrayBuffer | ArrayBufferView
    ) {
      assert(this.worker, "[onMessage] Worker not initialized.");
      return this.worker.onMessage(msg, connection);
    }

    async alarm() {
      if (!this.worker) {
        // TODO: we need the room id here so we can call initialize.
        // Currently room.id and room.parties are going to be undefined
        await this.#initializeWorker();
        assert(this.worker, "[onAlarm] Worker not initialized.");
      }

      try {
        this.inAlarm = true;
        return await this.worker.onAlarm();
      } finally {
        this.inAlarm = false;
      }
    }
  };
}

const Workers: Record<string, Party.PartyKitServer> = {
  main: Worker
};

export const PartyKitDurable = createDurable(Worker, { name: "main" });
__PARTIES__;
declare const __PARTIES__: Record<string, string>;

export default {
  async fetch(
    request: Party.Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const url = new URL(request.url);

      // TODO: throw if room is longer than x characters

      const {
        PARTYKIT_AI,
        PARTYKIT_DURABLE,
        PARTYKIT_VECTORIZE,
        PARTYKIT_CRONS,
        ...namespaces
      } = env;

      Object.assign(namespaces, {
        main: PARTYKIT_DURABLE
      });

      const { room: roomId, party: targetParty } =
        getRoomAndPartyFromPathname(url.pathname) || {};

      const parties: Party.Room["context"]["parties"] = createMultiParties(
        namespaces,
        {
          host: url.host
        }
      );

      const vectorizeBindings = Object.fromEntries(
        Object.entries(PARTYKIT_VECTORIZE || {}).map(([key, value]) => [
          key,
          new VectorizeClient(value)
        ])
      );

      if (roomId) {
        assert(targetParty, "No party found in request url"); // hopefully this never triggers
        const targetWorker = Workers[targetParty];
        const targetDurable = namespaces[targetParty];
        if (!targetWorker) {
          return new Response(`Party ${targetParty} not found`, {
            status: 404
          });
        }

        // When the worker is a class, to validate worker shape we'll look onto the worker prototype
        const WorkerInstanceMethods: Party.PartyKitServer = isClassWorker(
          targetWorker
        )
          ? targetWorker.prototype
          : targetWorker;

        if (request.headers.get("upgrade")?.toLowerCase() === "websocket") {
          let connectionId = url.searchParams.get("_pk");
          if (!connectionId) {
            connectionId = crypto.randomUUID();
          }

          // we should make this work, once we decide behaviour
          // isValidRequest?
          // onAuth?
          let onBeforeConnectResponse: Party.Request | Response | undefined =
            undefined;
          if ("onBeforeConnect" in targetWorker) {
            if (typeof targetWorker.onBeforeConnect === "function") {
              try {
                const mutableRequest = new Request(request.url, request);
                onBeforeConnectResponse = await targetWorker.onBeforeConnect(
                  mutableRequest,
                  {
                    id: roomId,
                    env: extractVars(env),
                    ai: PARTYKIT_AI,
                    assets: {
                      fetch(path: string) {
                        return assetsFetch(path, env, ctx);
                      }
                    },
                    parties,
                    vectorize: vectorizeBindings,
                    analytics: MockAnalyticsDataset,
                    bindings: getBindings(env)
                  },
                  ctx
                );
              } catch (e) {
                console.error("onBeforeConnect error", e);
                return new Response(
                  e instanceof Error ? e.message : `${e}` || "Unauthorised",
                  {
                    status: 401
                  }
                );
              }
            } else {
              throw new Error(".onBeforeConnect must be a function");
            }
          }

          // Set up the durable object for this room
          const docId = targetDurable.idFromName(roomId).toString();
          const id = targetDurable.idFromString(docId);

          if (onBeforeConnectResponse) {
            if (onBeforeConnectResponse instanceof Response) {
              return onBeforeConnectResponse;
            } else if (onBeforeConnectResponse instanceof Request) {
              return await targetDurable.get(id).fetch(onBeforeConnectResponse);
            }
          }

          return await targetDurable.get(id).fetch(request);
        } else {
          let onBeforeRequestResponse: Request | Response = request;
          if ("onBeforeRequest" in targetWorker) {
            if (typeof targetWorker.onBeforeRequest === "function") {
              try {
                const mutableRequest = new Request(request.url, request);
                onBeforeRequestResponse = await targetWorker.onBeforeRequest(
                  mutableRequest,
                  {
                    id: roomId,
                    env: extractVars(env),
                    ai: PARTYKIT_AI,
                    parties,
                    assets: {
                      fetch(path: string) {
                        return assetsFetch(path, env, ctx);
                      }
                    },
                    vectorize: vectorizeBindings,
                    analytics: MockAnalyticsDataset,
                    bindings: getBindings(env)
                  },
                  ctx
                );
              } catch (e) {
                console.error("onBeforeRequest error", e);
                return new Response(
                  e instanceof Error ? e.message : `${e}` || "Unauthorised",
                  {
                    status: 401
                  }
                );
              }
            } else {
              throw new Error(".onBeforeRequest must be a function");
            }
          }

          // TODO: can this be faster?
          if (onBeforeRequestResponse instanceof Response) {
            return onBeforeRequestResponse;
          }
          if (!("onRequest" in WorkerInstanceMethods)) {
            throw new Error("No onRequest handler");
          }

          // Set up the durable object for this room
          const docId = targetDurable.idFromName(roomId).toString();
          const id = targetDurable.idFromString(docId);

          return await targetDurable.get(id).fetch(onBeforeRequestResponse);
        }
      } else {
        if (
          request.headers.get("upgrade")?.toLowerCase() === "websocket" &&
          Worker.onSocket
        ) {
          const { 0: clientWebSocket, 1: serverWebSocket } =
            new WebSocketPair();
          const connection = serverWebSocket as Party.FetchSocket;
          connection.request = request;
          connection.accept();
          await Worker.onSocket(
            connection,
            {
              env: extractVars(env),
              ai: PARTYKIT_AI,
              parties,
              vectorize: vectorizeBindings,
              analytics: MockAnalyticsDataset,
              assets: {
                fetch(path: string) {
                  return assetsFetch(path, env, ctx);
                }
              },
              bindings: getBindings(env)
            },
            ctx
          );
          return new Response(null, {
            status: 101,
            webSocket: clientWebSocket
          });
        }

        const staticAssetsResponse = await fetchStaticAsset(request, env, ctx);

        const onFetch =
          Worker.onFetch ??
          // eslint-disable-next-line deprecation/deprecation
          Worker.unstable_onFetch;

        const onCron = Worker.onCron;
        if (url.pathname === "/__scheduled__" && typeof onCron === "function") {
          const cronName = url.searchParams.get("cron") || "unknown";
          const cron =
            Object.entries(PARTYKIT_CRONS).find(
              ([name, _val]) => name === cronName
            )?.[1] || "* * * * *";

          await onCron(
            {
              scheduledTime: Date.now(),
              cron,
              name: cronName,
              noRetry() {
                throw new Error("Not implemented");
              }
            },
            {
              env: extractVars(env),
              ai: PARTYKIT_AI,
              parties,
              vectorize: vectorizeBindings,
              analytics: MockAnalyticsDataset,
              assets: {
                fetch(path: string) {
                  return assetsFetch(path, env, ctx);
                }
              },
              bindings: getBindings(env)
            },
            ctx
          );
          return new Response(`ran cron ${cronName}: ${cron}`, { status: 200 });
        }

        if (staticAssetsResponse) {
          return staticAssetsResponse;
        } else if (typeof onFetch === "function") {
          const fetchResponse = await onFetch(
            request,
            {
              env: extractVars(env),
              ai: PARTYKIT_AI,
              parties,
              vectorize: vectorizeBindings,
              analytics: MockAnalyticsDataset,
              assets: {
                fetch(path: string) {
                  return assetsFetch(path, env, ctx);
                }
              },
              bindings: getBindings(env)
            },
            ctx
          );
          if (fetchResponse) {
            return fetchResponse;
          }
        }

        // let's try to get 404.html from static assets
        const notFoundResponse = await assetsFetch("/404.html", env, ctx);

        if (notFoundResponse) {
          // modify status to 404

          return new Response(notFoundResponse.body, {
            status: 404,
            statusText: "Not Found",
            headers: notFoundResponse.headers
          });
        }

        return new Response("Not found", {
          status: 404
        });
      }
    } catch (e) {
      console.warn("fetch error", e);
      return new Response(e instanceof Error ? e.message : `${e}`, {
        status: 500
      });
    }
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {
    const {
      PARTYKIT_AI,
      PARTYKIT_DURABLE,
      PARTYKIT_VECTORIZE,
      PARTYKIT_CRONS,
      ...namespaces
    } = env;

    Object.assign(namespaces, {
      main: PARTYKIT_DURABLE
    });

    const onCron = Worker.onCron;
    if (typeof onCron === "function") {
      const vectorizeBindings = Object.fromEntries(
        Object.entries(PARTYKIT_VECTORIZE || {}).map(([key, value]) => [
          key,
          new VectorizeClient(value)
        ])
      );

      const parties: Party.Room["context"]["parties"] = createMultiParties(
        namespaces,
        {
          host: PARTYKIT_HOST
        }
      );

      const cron = controller.cron;
      const cronName =
        Object.entries(PARTYKIT_CRONS).find(
          ([_name, val]) => val === cron
        )?.[0] || "unknown";

      return onCron(
        Object.assign(controller, {
          name: cronName
        }),
        {
          env: extractVars(env),
          ai: PARTYKIT_AI,
          parties,
          vectorize: vectorizeBindings,
          analytics: MockAnalyticsDataset,
          assets: {
            fetch(path: string) {
              return assetsFetch(path, env, ctx);
            }
          },
          bindings: getBindings(env)
        },
        ctx
      );
    }
  }
} satisfies ExportedHandler<Env>;
