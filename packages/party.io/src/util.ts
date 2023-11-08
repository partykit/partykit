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
    return {
      response: new Response(null, { status: 101, webSocket: clientWebSocket }),
      socket: serverWebSocket,
    };
  } else {
    throw new Error("Not a websocket request");
  }
}
