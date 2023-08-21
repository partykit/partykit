// This is the facade for the worker that will be used in partykit.
// It will be compiled and imported by the CLI.

import type {
  PartyKitServer,
  PartyKitRoom,
  PartyKitConnection,
  PartyServerConstructor,
  PartyServer,
  PartyRequest,
  Party,
} from "../src/server";
import type {
  DurableObjectNamespace,
  DurableObjectState,
  ExecutionContext,
} from "@cloudflare/workers-types";

import fetchStaticAsset from "./fetch-static-asset";

// @ts-expect-error We'll be replacing __WORKER__
// with the path to the input worker
import Worker from "__WORKER__";
import {
  type ConnectionManager,
  HibernatingConnectionManager,
  InMemoryConnectionManager,
  createLazyConnection,
} from "./connection";
declare const Worker: PartyKitServer;

type WorkerDefinition =
  | { server: PartyServer; isClass: true }
  | { server: PartyKitServer; isClass: false };

function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

// The roomId is /party/[roomId] or /parties/[partyName]/[roomId]
function getRoomIdFromPathname(pathname: string) {
  // TODO: use a URLPattern here instead
  // TODO: might want to introduce a real router too
  if (pathname.startsWith("/party/")) {
    const [_, roomId] = pathname.split("/party/");
    return roomId;
  } else if (pathname.startsWith("/parties/")) {
    const [_, __, _partyName, roomId] = pathname.split("/");
    return roomId;
  }
}

let didWarnAboutMissingConnectionId = false;

// The worker script can either be an object with handlers, or a class with same handlers
function isClassWorker(worker: unknown): worker is PartyServerConstructor {
  return (
    typeof worker === "function" &&
    "prototype" in worker &&
    worker.prototype instanceof Object
  );
}

function supportsHibernation(worker: WorkerDefinition) {
  // if worker sets explicit options, use that
  return (
    ("options" in worker.server && worker.server.options?.hibernate === true) ||
    // otherwise default to legacy behaviour for object workers:
    // hibernate if there's a message handler, or no onConnect handler
    (!worker.isClass &&
      ("onMessage" in worker.server || !(`onConnect` in worker.server)))
  );
}

// When the worker is a class, to validate worker shape we'll look onto the worker prototype
// TODO: FIXME This type is not accurate when the worker is a class worker
const WorkerInstanceMethods: PartyKitServer = isClassWorker(Worker)
  ? Worker.prototype
  : Worker;

class PartyDurable {}

type Env = {
  [key: string]: DurableObjectNamespace;
} & {
  PARTYKIT_VARS: Record<string, unknown>;
};

let parties: PartyKitRoom["context"]["parties"];

// create a "multi-party" object that can be used to connect to other parties
function createMultiParties(
  namespaces: Record<string, DurableObjectNamespace>,
  options: {
    host: string;
  }
) {
  if (!parties) {
    parties = {};
    for (const [key, value] of Object.entries(namespaces)) {
      if (typeof value.idFromName === "function") {
        parties[key] ||= {
          get: (name: string) => {
            const docId = value.idFromName(name).toString();
            const id = value.idFromString(docId);
            const stub = value.get(id);
            return {
              fetch(init?: RequestInit) {
                return stub.fetch(
                  key === "main"
                    ? `http://${options.host}/party/${name}`
                    : `http://${options.host}/parties/${key}/${name}`,
                  init
                );
              },
              connect: () => {
                // wish there was a way to create a websocket from a durable object
                return new WebSocket(
                  key === "main"
                    ? `ws://${options.host}/party/${name}`
                    : `ws://${options.host}/parties/${key}/${name}`
                );
              },
            };
          },
        };
      }
    }
  }

  return parties;
}

// we use a symbol as a sigil value to indicate
// that the room id hasn't been set yet
const UNDEFINED = Symbol("UNDEFINED");

function createDurable(Worker: PartyKitServer) {
  const isClassAPI = isClassWorker(Worker);

  for (const handler of [
    "onConnect",
    "onRequest",
    "onMessage",
    "onClose",
    "onError",
    "onAlarm",
  ] satisfies (keyof PartyKitServer)[]) {
    if (handler in Worker && typeof Worker[handler] !== "function") {
      throw new Error(`.${handler} should be a function`);
    }
  }

  for (const handler of [
    "unstable_onFetch",
    "onBeforeConnect",
    "onBeforeRequest",
  ] satisfies (keyof PartyKitServer)[]) {
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
    room: Party;
    namespaces: Record<string, DurableObjectNamespace>;

    // assigned when first connection is received
    connectionManager?: ConnectionManager;

    // for the interim, we support both class and object worker syntax.
    worker?:
      | { server: PartyServer; isClass: true }
      | { server: PartyKitServer; isClass: false };

    constructor(controller: DurableObjectState, env: Env) {
      super();

      const { PARTYKIT_VARS, PARTYKIT_DURABLE, ...namespaces } = env;

      this.controller = controller;
      this.namespaces = namespaces;

      Object.assign(this.namespaces, {
        main: PARTYKIT_DURABLE,
      });

      // Party.connections getter needs access to durable object in closure
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;

      this.room = {
        // @ts-expect-error - id is a symbol when we start
        id: UNDEFINED, // using a string here because we're guaranteed to have set it before we use it
        internalID: this.controller.id.toString(),
        env: PARTYKIT_VARS,
        storage: this.controller.storage,
        broadcast: this.broadcast,
        context: {
          parties: {},
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

        /// @deprecated, supported for backwards compatibility only
        get connections() {
          console.warn(
            "Party.connections is deprecated and will be removed in a future version of PartyKit. Use Party.getConnections() instead."
          );

          if (self.connectionManager) {
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
        },
      };
    }

    broadcast = (msg: string | Uint8Array, without: string[] = []) => {
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
      const request = req as unknown as PartyRequest;
      const url = new URL(request.url);

      try {
        if (!this.worker) {
          await this.initialize(request.url);
        }

        assert(this.worker, "Worker not initialized.");
        assert(this.connectionManager, "ConnectionManager not initialized.");

        if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
          if ("onRequest" in this.worker.server) {
            if (typeof this.worker?.server.onRequest === "function") {
              return await this.worker.server.onRequest(request, this.room);
            } else {
              return new Response("Invalid onRequest handler", {
                status: 500,
              });
            }
          }
        }
      } catch (e) {
        const errMessage = e instanceof Error ? e.message : `${e}`;
        // @ts-expect-error - code is not a property on Error
        const errCode = "code" in e ? (e.code as number) : 500;
        return new Response(
          errMessage || "Uncaught exception when making a request",
          {
            status: errCode,
          }
        );
      }
      try {
        if (
          !(
            ("onConnect" in this.worker.server &&
              typeof this.worker.server.onConnect === "function") ||
            ("onMessage" in this.worker.server &&
              typeof this.worker.server.onMessage === "function")
          )
        ) {
          throw new Error("No onConnect or onMessage handler");
        }

        // Create the websocket pair for the client
        const { 0: clientWebSocket, 1: serverWebSocket } = new WebSocketPair();

        let connectionId = url.searchParams.get("_pk");
        if (!connectionId) {
          if (!didWarnAboutMissingConnectionId) {
            didWarnAboutMissingConnectionId = true;
          }
          connectionId = crypto.randomUUID();
        }

        // TODO: Object.freeze / mark as readonly!
        const connection: PartyKitConnection = Object.assign(serverWebSocket, {
          id: connectionId,
          socket: serverWebSocket,
          uri: request.url,
        });

        // Accept the websocket connection
        this.connectionManager.accept(connection, []);

        if (!supportsHibernation(this.worker)) {
          await this.attachSocketEventHandlers(connection);
        }

        // Notify the user server that a new connection has been established
        if (typeof this.worker.server.onConnect === "function") {
          await (this.worker.isClass
            ? this.worker.server.onConnect(connection, { request })
            : this.worker.server.onConnect(connection, this.room, { request }));
        }

        return new Response(null, { status: 101, webSocket: clientWebSocket });
      } catch (e) {
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
      const roomId = getRoomIdFromPathname(url.pathname);
      assert(roomId, "No room id found in request url");

      this.room.id = roomId;
      this.room.context.parties = createMultiParties(this.namespaces, {
        host: url.host,
      });
    }

    async #initializeWorker() {
      if (isClassAPI) {
        this.worker = {
          server: new Worker(this.room),
          isClass: true,
        };
      } else {
        this.worker = { server: Worker, isClass: false };
      }

      this.connectionManager = supportsHibernation(this.worker)
        ? new HibernatingConnectionManager(this.controller)
        : new InMemoryConnectionManager();

      if (
        "onStart" in this.worker.server &&
        typeof this.worker.server.onStart === "function"
      ) {
        return this.worker.server.onStart();
      }
    }

    async attachSocketEventHandlers(connection: PartyKitConnection) {
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
    async webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer) {
      const connection = createLazyConnection(ws);
      if (!this.worker) {
        // This means the room "woke up" after hibernation
        // so we need to hydrate this.room again
        assert(connection.uri, "No uri found in connection");
        await this.initialize(connection.uri);
      }

      assert(this.worker, "[onMessage] Worker not initialized.");
      return this.invokeOnMessage(connection, msg);
    }

    /** Runtime calls webSocketClose when hibernated connection closes  */
    async webSocketClose(ws: WebSocket) {
      return this.invokeOnClose(createLazyConnection(ws));
    }

    /** Runtime calls webSocketError when hibernated connection errors  */
    async webSocketError(ws: WebSocket, err: Error) {
      return this.invokeOnError(createLazyConnection(ws), err);
    }

    async invokeOnClose(connection: PartyKitConnection) {
      assert(this.worker, "[onClose] Worker not initialized.");

      if (typeof this.worker.server.onClose === "function") {
        return this.worker.isClass
          ? this.worker.server.onClose(connection)
          : this.worker.server.onClose(connection, this.room);
      }
    }

    async invokeOnError(connection: PartyKitConnection, err: Error) {
      assert(this.worker, "[onError] Worker not initialized.");

      if (typeof this.worker.server.onError === "function") {
        return this.worker.isClass
          ? this.worker.server.onError(connection, err)
          : this.worker.server.onError(connection, err, this.room);
      }
    }

    async invokeOnMessage(
      connection: PartyKitConnection,
      msg: string | ArrayBuffer
    ) {
      assert(this.worker, "[onMessage] Worker not initialized.");
      if (typeof this.worker.server.onMessage === "function") {
        return this.worker.isClass
          ? this.worker.server.onMessage(msg, connection)
          : this.worker.server.onMessage(msg, connection, this.room);
      }
    }

    async alarm() {
      if (!this.worker) {
        // TODO: we need the room id here so we can call initialize.
        // Currently room.id and room.parties are going to be undefined
        await this.#initializeWorker();
        assert(this.worker, "[onAlarm] Worker not initialized.");
      }

      if (this.worker.server.onAlarm) {
        return this.worker.server.onAlarm(this.room);
      }
    }
  };
}

export const PartyKitDurable = createDurable(Worker);

__PARTIES__;
declare const __PARTIES__: Record<string, string>;

export default {
  async fetch(
    request: PartyRequest,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const url = new URL(request.url);

      if (url.pathname.startsWith("/parties/")) {
        const [_, __, partyName, docName] = url.pathname.split("/");
        const partyDO = env[partyName];
        if (!partyDO) {
          return new Response(`Party ${partyName} not found`, { status: 404 });
        }
        const docId = partyDO.idFromName(docName).toString();
        const id = partyDO.idFromString(docId);
        const ns = partyDO.get(id);
        return await ns.fetch(request);
      }

      const roomId = getRoomIdFromPathname(url.pathname);
      // TODO: throw if room is longer than x characters

      const { PARTYKIT_VARS, PARTYKIT_DURABLE, ...namespaces } = env;

      Object.assign(namespaces, {
        main: PARTYKIT_DURABLE,
      });

      const parties: PartyKitRoom["parties"] = createMultiParties(namespaces, {
        host: url.host,
      });

      if (roomId) {
        if (request.headers.get("upgrade")?.toLowerCase() === "websocket") {
          let connectionId = url.searchParams.get("_pk");
          if (!connectionId) {
            if (!didWarnAboutMissingConnectionId) {
              didWarnAboutMissingConnectionId = true;
            }
            connectionId = crypto.randomUUID();
          }

          // we should make this work, once we decide behaviour
          // isValidRequest?
          // onAuth?
          let onBeforeConnectResponse: PartyRequest | Response | undefined =
            undefined;
          if ("onBeforeConnect" in Worker) {
            if (typeof Worker.onBeforeConnect === "function") {
              try {
                onBeforeConnectResponse = await Worker.onBeforeConnect(
                  request,
                  {
                    id: roomId,
                    env: PARTYKIT_VARS,
                    parties,
                  },
                  ctx
                );
              } catch (e) {
                return new Response(
                  e instanceof Error ? e.message : `${e}` || "Unauthorised",
                  {
                    status: 401,
                  }
                );
              }
            } else {
              throw new Error(".onBeforeConnect must be a function");
            }
          }

          // Set up the durable object for this room
          const docId = PARTYKIT_DURABLE.idFromName(roomId).toString();
          const id = PARTYKIT_DURABLE.idFromString(docId);

          if (onBeforeConnectResponse) {
            if (onBeforeConnectResponse instanceof Response) {
              return onBeforeConnectResponse;
            } else if (onBeforeConnectResponse instanceof Request) {
              return await PARTYKIT_DURABLE.get(id).fetch(
                onBeforeConnectResponse
              );
            }
          }

          return await PARTYKIT_DURABLE.get(id).fetch(request);
        } else {
          let onBeforeRequestResponse: Request | Response = request;
          if ("onBeforeRequest" in Worker) {
            if (typeof Worker.onBeforeRequest === "function") {
              try {
                onBeforeRequestResponse = await Worker.onBeforeRequest(
                  request,
                  {
                    id: roomId,
                    env: PARTYKIT_VARS,
                    parties,
                  },
                  ctx
                );
              } catch (e) {
                return new Response(
                  e instanceof Error ? e.message : `${e}` || "Unauthorised",
                  {
                    status: 401,
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
          const docId = PARTYKIT_DURABLE.idFromName(roomId).toString();
          const id = PARTYKIT_DURABLE.idFromString(docId);

          return await PARTYKIT_DURABLE.get(id).fetch(onBeforeRequestResponse);
        }
      } else {
        const staticAssetsResponse = await fetchStaticAsset(request, env, ctx);
        if (staticAssetsResponse) {
          return staticAssetsResponse;
        } else if ("unstable_onFetch" in Worker) {
          if (typeof Worker.unstable_onFetch === "function") {
            return await Worker.unstable_onFetch(
              request,
              {
                env: PARTYKIT_VARS,
                parties,
              },
              ctx
            );
          } else {
            throw new Error(".unstable_onFetch must be a function");
          }
        }

        return new Response("Not found", {
          status: 404,
        });
      }
    } catch (e) {
      return new Response(e instanceof Error ? e.message : `${e}`, {
        status: 500,
      });
    }
  },
};
