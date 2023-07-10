// This is the facade for the worker that will be used in partykit.
// It will be compiled and imported by the CLI.

// @ts-expect-error We'll be replacing __WORKER__ with the path to the input worker
import Worker from "__WORKER__";
declare const Worker: PartyKitServer;

import type {
  PartyKitServer,
  PartyKitRoom,
  PartyKitConnection,
} from "../src/server";
import type {
  DurableObjectNamespace,
  DurableObjectState,
  ExecutionContext,
} from "@cloudflare/workers-types";

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

class PartyDurable {}

function createDurable(Worker: PartyKitServer) {
  if (Worker.onConnect && typeof Worker.onConnect !== "function") {
    throw new Error(".onConnect is not a function");
  }

  if (Worker.onBeforeConnect && typeof Worker.onBeforeConnect !== "function") {
    throw new Error(".onBeforeConnect should be a function");
  }

  if (Worker.onRequest && typeof Worker.onRequest !== "function") {
    throw new Error(".onRequest is not a function");
  }

  if (Worker.onBeforeRequest && typeof Worker.onBeforeRequest !== "function") {
    throw new Error(".onBeforeRequest should be a function");
  }

  if (Worker.onAlarm && typeof Worker.onAlarm !== "function") {
    throw new Error(".onAlarm should be a function");
  }

  return class extends PartyDurable implements DurableObject {
    controller: DurableObjectState;
    room: PartyKitRoom;

    constructor(controller: DurableObjectState, env: Env) {
      super();
      this.controller = controller;
      this.room = {
        id: "UNDEFINED", // using a string here because we're guaranteed to have set it before we use it
        // TODO: probably want to rename this to something else
        // "sockets"? "connections"? "clients"?
        internalID: this.controller.id.toString(),
        connections: new Map(),
        env,
        storage: this.controller.storage,
        parties: {},
        broadcast: this.broadcast,
      };
    }

    broadcast = (msg: string | Uint8Array, without: string[] = []) => {
      this.room.connections.forEach((connection) => {
        if (!without.includes(connection.id)) {
          connection.send(msg);
        }
      });
    };

    async fetch(request: Request) {
      const url = new URL(request.url);
      try {
        for (const [key, v] of Object.entries(this.room.env)) {
          const value = v as DurableObjectNamespace;
          if (typeof value.idFromName === "function") {
            this.room.parties[key] ||= {
              get: (name: string) => {
                const docId = value.idFromName(name).toString();
                const id = value.idFromString(docId);
                const stub = value.get(id);
                return {
                  fetch(init?: RequestInit) {
                    return stub.fetch(
                      `http://${url.host}/parties/${key}/${name}`,
                      init
                    );
                  },
                  connect: () => {
                    // wish there was a way to create a websocket from a durable object
                    return new WebSocket(
                      `ws://${url.host}/parties/${key}/${name}`
                    );
                  },
                };
              },
            };
          }
        }

        // populate the room id/slug if not previously done so

        const roomId = getRoomIdFromPathname(url.pathname);

        assert(roomId, "No room id found in request url");
        this.room.id = roomId;

        if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
          if (Worker.onRequest) {
            if (typeof Worker.onRequest === "function") {
              return await Worker.onRequest(request, this.room);
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
        if (!Worker.onConnect) {
          throw new Error("No onConnect handler");
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
        const rawInitial = request.headers.get("x-pk-initial");
        const unstable_initial = rawInitial
          ? JSON.parse(rawInitial)
          : undefined;

        // TODO: Object.freeze / mark as readonly!
        const connection: PartyKitConnection = Object.assign(serverWebSocket, {
          id: connectionId,
          socket: serverWebSocket,
          unstable_initial,
        });
        this.room.connections.set(connectionId, connection);

        // Accept the websocket connection
        serverWebSocket.accept();

        await this.handleConnection(this.room, connection);

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

    async handleConnection(room: PartyKitRoom, connection: PartyKitConnection) {
      assert(
        "onConnect" in Worker && typeof Worker.onConnect === "function",
        "No onConnect handler"
      );

      const handleCloseOrErrorFromClient = () => {
        // Remove the client from the room and delete associated user data.
        this.room.connections.delete(connection.id);

        connection.removeEventListener("close", handleCloseOrErrorFromClient);
        connection.removeEventListener("error", handleCloseOrErrorFromClient);

        if (room.connections.size === 0) {
          // TODO: implement this
        }
      };

      connection.addEventListener("close", handleCloseOrErrorFromClient);
      connection.addEventListener("error", handleCloseOrErrorFromClient);

      // and finally, connect the client to the worker
      // TODO: pass room id here? and other meta
      return Worker.onConnect(connection, room);
    }

    async alarm() {
      if (Worker.onAlarm) {
        return Worker.onAlarm(this.room);
      }
    }
  };
}

export const MainDO = createDurable(Worker);

__PARTIES__;
declare const __PARTIES__: Record<string, string>;

type Env = {
  [key: string]: DurableObjectNamespace;
};

export default {
  async fetch(
    request: Request,
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
          let onBeforeConnectResponse: unknown;
          if (Worker.onBeforeConnect) {
            if (typeof Worker.onBeforeConnect === "function") {
              try {
                onBeforeConnectResponse = await Worker.onBeforeConnect(
                  request,
                  {
                    id: roomId,
                    env,
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
          const docId = env.MAIN_DO.idFromName(roomId).toString();
          const id = env.MAIN_DO.idFromString(docId);

          if (onBeforeConnectResponse) {
            return await env.MAIN_DO.get(id).fetch(
              new Request(request, {
                headers: {
                  ...Object.fromEntries(request.headers.entries()),
                  "x-pk-initial": JSON.stringify(onBeforeConnectResponse),
                },
              })
            );
          }

          return await env.MAIN_DO.get(id).fetch(request);
        } else {
          let onBeforeRequestResponse: Request | Response = request;
          if (Worker.onBeforeRequest) {
            if (typeof Worker.onBeforeRequest === "function") {
              try {
                onBeforeRequestResponse = await Worker.onBeforeRequest(
                  request,
                  {
                    id: roomId,
                    env,
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
          if (!Worker.onRequest) {
            throw new Error("No onRequest handler");
          }

          // Set up the durable object for this room
          const docId = env.MAIN_DO.idFromName(roomId).toString();
          const id = env.MAIN_DO.idFromString(docId);

          return await env.MAIN_DO.get(id).fetch(onBeforeRequestResponse);
        }
      }

      return new Response("Not found", {
        status: 404,
      });
    } catch (e) {
      return new Response(e instanceof Error ? e.message : `${e}`, {
        status: 500,
      });
    }
  },
};
