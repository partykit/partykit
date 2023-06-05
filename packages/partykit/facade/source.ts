// This is the facade for the worker that will be used in partykit.
// It will be compiled and imported by the CLI.

// @ts-expect-error We'll be replacing __WORKER__ with the path to the input worker
import Worker from "__WORKER__";

import type { PartyKitServer, PartyKitRoom } from "../src/server";
import type {
  DurableObjectNamespace,
  DurableObjectState,
  ExecutionContext,
} from "@cloudflare/workers-types";

declare const Worker: PartyKitServer;

function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

// The roomId is /party/[roomId]
function getRoomIdFromPathname(pathname: string) {
  // TODO: use a URLPattern here instead
  // TODO: might want to introduce a real router too
  const getRoomId = new RegExp(/\/party\/(.*)/g);
  return getRoomId.exec(pathname)?.[1];
}

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

let didWarnAboutMissingConnectionId = false;

const MAX_CONNECTIONS = 100; // TODO: make this configurable

// TODO: get this from the 'partykit' package
type PartyKitConnection = {
  id: string;
  socket: WebSocket;
  unstable_initial: unknown;
};

export class MainDO implements DurableObject {
  controller: DurableObjectState;
  room: PartyKitRoom;

  constructor(controller: DurableObjectState, env: Env) {
    this.controller = controller;

    this.room = {
      id: "UNDEFINED", // using a string here because we're guaranteed to have set it before we use it
      // TODO: probably want to rename this to something else
      // "sockets"? "connections"? "clients"?
      internalID: this.controller.id.toString(),
      connections: new Map(),
      env: env,
      storage: this.controller.storage,
    };
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    try {
      // Don't connect if we're already at max connections

      if (this.room.connections.size >= MAX_CONNECTIONS) {
        return new Response("Room is full", {
          status: 503,
        });
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
      const unstable_initial = rawInitial ? JSON.parse(rawInitial) : undefined;

      // TODO: Object.freeze / mark as readonly!
      const connection: PartyKitConnection = {
        id: connectionId,
        socket: serverWebSocket,
        unstable_initial,
      };
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

      connection.socket.removeEventListener(
        "close",
        handleCloseOrErrorFromClient
      );
      connection.socket.removeEventListener(
        "error",
        handleCloseOrErrorFromClient
      );

      if (room.connections.size === 0) {
        // TODO: implement this
      }
    };

    connection.socket.addEventListener("close", handleCloseOrErrorFromClient);
    connection.socket.addEventListener("error", handleCloseOrErrorFromClient);

    // and finally, connect the client to the worker
    // TODO: pass room id here? and other meta
    return Worker.onConnect(connection.socket, room);
  }

  async alarm() {
    if (Worker.onAlarm) {
      return Worker.onAlarm(this.room);
    }
  }
}

type Env = {
  MAIN_DO: DurableObjectNamespace;
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const url = new URL(request.url);
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
