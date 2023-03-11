// This is the facade for the worker that will be used in partykit.
// It will be compiled and imported by the CLI.

// @ts-expect-error We'll be replacing __WORKER__ with the path to the input worker
import Worker from "__WORKER__";
import type { WebSocketServer } from "ws";
// this is a node type, careful
import type { IncomingMessage } from "http";

import type { PartyKitServer, PartyKitRoom } from "../src/server";

declare const Worker: PartyKitServer;
declare const wss: WebSocketServer;
declare const partyRoom: PartyKitRoom;

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

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/party/")) {
    if (request.headers.get("upgrade")?.toLowerCase() === "websocket") {
      if (Worker.onBeforeConnect) {
        let initialRes: unknown;
        try {
          initialRes = await Worker.onBeforeConnect(request, {
            id: partyRoom.id,
            env: partyRoom.env,
          });
        } catch (e) {
          return new Response(
            (e as Error).message || `${e}` || "Unauthorized",
            {
              status: 401,
            }
          );
        }
        if (initialRes !== undefined) {
          return new Response(JSON.stringify(initialRes), {
            headers: {
              "content-type": "application/json",
            },
          });
        }
      }
    } else {
      let reqOrRes: Request | Response = request;
      if (Worker.onBeforeRequest) {
        reqOrRes = await Worker.onBeforeRequest(request, {
          id: partyRoom.id,
          env: partyRoom.env,
        });
      }
      if (reqOrRes instanceof Response) {
        return reqOrRes;
      }
      if (Worker.onRequest) {
        return Worker.onRequest(reqOrRes, partyRoom);
      }
    }
  }
  return new Response("Not found", { status: 404 });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

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

wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
  const url = new URL(`http://${request.headers.host}${request.url}`);

  const connectionId = url.searchParams.get("_pk");
  const roomId = getRoomIdFromPathname(url.pathname);

  assert(roomId, "roomId is required");
  assert(connectionId, "_pk is required");

  const rawInitial = request.headers["x-pk-initial"];
  const unstable_initial = rawInitial ? JSON.parse(`${rawInitial}`) : undefined;

  partyRoom.connections.set(connectionId, {
    id: connectionId,
    socket: ws,
    unstable_initial,
  });

  function closeOrErrorListener() {
    assert(roomId, "roomId is required");
    assert(connectionId, "_pk is required");
    ws.removeEventListener("close", closeOrErrorListener);
    ws.removeEventListener("error", closeOrErrorListener);
    partyRoom.connections.delete(connectionId);
  }

  ws.addEventListener("close", closeOrErrorListener);
  ws.addEventListener("error", closeOrErrorListener);

  Worker.onConnect?.(ws, partyRoom)?.catch((err) => {
    console.error("failed to connect", err);
  });
});
