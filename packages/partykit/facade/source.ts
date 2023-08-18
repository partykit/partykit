// This is the facade for the worker that will be used in partykit.
// It will be compiled and imported by the CLI.

import type {
  PartyKitServer,
  PartyKitRoom,
  PartyKitConnection,
  PartyKitContext,
  PartyServerConstructor,
  PartyServer,
  PartyRequest,
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
declare const Worker: PartyKitServer;

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

const rehydratedConnections = new WeakMap<WebSocket, PartyKitConnection>();

function rehydrateHibernatedConnection(ws: WebSocket): PartyKitConnection {
  if (rehydratedConnections.has(ws)) {
    return rehydratedConnections.get(ws) as PartyKitConnection;
  }
  const connection = Object.assign(ws, {
    ...ws.deserializeAttachment(),
    socket: ws,
  }) as PartyKitConnection;

  rehydratedConnections.set(ws, connection);
  return connection;
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

  let pendingInitializer: Promise<boolean> | void;

  return class extends PartyDurable implements DurableObject {
    controller: DurableObjectState;
    room: PartyKitRoom;
    namespaces: Record<string, DurableObjectNamespace>;

    // for the interim, we support both class and object worker syntax.
    readonly worker:
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

      this.room = {
        // @ts-expect-error - id is a symbol when we start
        id: UNDEFINED, // using a string here because we're guaranteed to have set it before we use it
        internalID: this.controller.id.toString(),
        connections: new Map(),
        env: PARTYKIT_VARS,
        storage: this.controller.storage,
        parties: {},
        broadcast: this.broadcast,
        context: {
          parties: {},
        },
      };

      if (isClassAPI) {
        this.worker = {
          server: new Worker(this.room),
          isClass: true,
        };
      } else {
        this.worker = { server: Worker, isClass: false };
      }

      if (!this.worker.isClass && "onMessage" in this.worker.server) {
        // when using the Hibernation API, we'll initialize the connections map by deserializing
        // the sockets tracked by the platform. after this point, the connections map is kept up
        // to date as sockets connect/disconnect, until next hibernation
        this.room.connections = new Map(
          controller.getWebSockets().map((socket) => {
            const connection = rehydrateHibernatedConnection(socket);
            return [connection.id, connection];
          })
        );
      }

      if (
        "onStart" in this.worker.server &&
        typeof this.worker.server.onStart === "function"
      ) {
        pendingInitializer = this.worker.server
          .onStart()
          ?.then(() => true)
          .catch(() => false)
          .finally(() => (pendingInitializer = undefined));
      }
    }

    broadcast = (msg: string | Uint8Array, without: string[] = []) => {
      this.room.connections.forEach((connection) => {
        if (!without.includes(connection.id)) {
          connection.send(msg);
        }
      });
    };

    async fetch(req: Request) {
      // Coerce the request type to our extended request type.
      // We do this to make typing in userland simpler
      const request = req as unknown as PartyRequest;

      const url = new URL(request.url);

      // wait for any initialization code to complete
      if (pendingInitializer) {
        await pendingInitializer;
      }

      try {
        this.room.context.parties = createMultiParties(this.namespaces, {
          host: url.host,
        });
        // deprecated, keep around for legacy users
        this.room.parties = this.room.context.parties;

        // populate the room id/slug if not previously done so

        const roomId = getRoomIdFromPathname(url.pathname);

        assert(roomId, "No room id found in request url");
        this.room.id = roomId;

        if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
          if ("onRequest" in this.worker.server) {
            if (typeof this.worker.server.onRequest === "function") {
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
        this.room.connections.set(connectionId, connection);

        const context = { request };

        const shouldHibernate =
          // if worker sets explicit options, use that
          ("options" in this.worker.server &&
            this.worker.server.options?.hibernate === true) ||
          // otherwise default to legacy behaviour for object workers:
          // hibernate if there's a message handler, or no onConnect handler
          (!this.worker.isClass &&
            ("onMessage" in this.worker.server ||
              !(`onConnect` in this.worker.server)));

        // Accept the websocket connection
        if (shouldHibernate) {
          this.controller.acceptWebSocket(serverWebSocket);
          connection.serializeAttachment({
            id: connectionId,
            uri: request.url,
          });

          if (
            "onConnect" in this.worker.server &&
            typeof this.worker.server.onConnect === "function"
          ) {
            await (this.worker.isClass
              ? this.worker.server.onConnect(connection, context)
              : this.worker.server.onConnect(connection, this.room, context));
          }
        } else {
          serverWebSocket.accept();
          await this.handleConnection(this.room, connection, context);
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

    async handleConnection(
      room: PartyKitRoom,
      connection: PartyKitConnection,
      context: PartyKitContext
    ) {
      assert(
        "onConnect" in this.worker.server &&
          typeof this.worker.server.onConnect === "function",
        "No onConnect handler"
      );

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

      // and finally, connect the client to the worker
      return this.worker.isClass
        ? this.worker.server.onConnect(connection, context)
        : this.worker.server.onConnect(connection, room, context);
    }

    /** Runtime calls webSocketMessage when hibernated connection receives a message  */
    async webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer) {
      const connection = rehydrateHibernatedConnection(ws);
      // @ts-expect-error - it may be a symbol before initialised
      if (this.room.id === UNDEFINED) {
        // This means the room "woke up" after hibernation
        // so we need to hydrate this.room again
        const { uri } = connection;
        assert(uri, "No uri found in connection");

        const url = new URL(uri);
        const roomId = getRoomIdFromPathname(url.pathname);
        assert(roomId, "No room id found in request url");

        this.room.id = roomId;
        this.room.context.parties = createMultiParties(this.namespaces, {
          host: url.host,
        });
        this.room.parties = this.room.context.parties;
      }

      return this.invokeOnMessage(connection, msg);
    }

    /** Runtime calls webSocketClose when hibernated connection closes  */
    async webSocketClose(ws: WebSocket) {
      return this.invokeOnClose(rehydrateHibernatedConnection(ws));
    }

    /** Runtime calls webSocketError when hibernated connection errors  */
    async webSocketError(ws: WebSocket, err: Error) {
      return this.invokeOnError(rehydrateHibernatedConnection(ws), err);
    }

    async invokeOnClose(connection: PartyKitConnection) {
      this.room.connections.delete(connection.id);

      if (typeof this.worker.server.onClose === "function") {
        return this.worker.isClass
          ? this.worker.server.onClose(connection)
          : this.worker.server.onClose(connection, this.room);
      }
    }

    async invokeOnError(connection: PartyKitConnection, err: Error) {
      this.room.connections.delete(connection.id);

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
      if (typeof this.worker.server.onMessage === "function") {
        return this.worker.isClass
          ? this.worker.server.onMessage(msg, connection)
          : this.worker.server.onMessage(msg, connection, this.room);
      }
    }

    async alarm() {
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
        const staticAssetsResponse = await fetchStaticAsset(url, env, ctx);
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
