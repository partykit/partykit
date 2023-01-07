import type { PartyKitRoom } from "partykit/server";
// @ts-expect-error we should define some types for this package upstream
import { setupWSConnection } from "../vendor/y-websocket-utils";

declare function setupWSConnection(
  ws: WebSocket,
  placeholder: null,
  options: { docName: string }
): void;

export function onConnect(ws: WebSocket, room: PartyKitRoom) {
  setupWSConnection(ws, null, { docName: room.id });
}
