import type * as Party from "partykit/server";

export type Handler = (
  req: Request,
  lobby: Party.FetchLobby,
  ctx: Party.ExecutionContext
) => Response | Promise<Response>;

export function upgradeWebSocket(req: Request): {
  response: Response;
  socket: WebSocket;
} {
  if (req.headers.get("upgrade") === "websocket") {
    // Create the websocket pair for the client
    const { 0: clientWebSocket, 1: serverWebSocket } = new WebSocketPair();
    serverWebSocket.accept();
    clientWebSocket.addEventListener("close", () => {
      console.log("closing server websocket on close");
      serverWebSocket.close();
    });
    clientWebSocket.addEventListener("error", () => {
      console.log("closing server websocket on error");
      serverWebSocket.close();
    });
    return {
      response: new Response(null, { status: 101, webSocket: clientWebSocket }),
      socket: serverWebSocket
    };
  } else {
    throw new Error("Not a websocket request");
  }
}
