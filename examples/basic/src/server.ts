import type { PartyKitServer } from "partykit/server";

export default {
  onConnect(room, ws: WebSocket) {
    // your business logic here
    ws.onmessage = function incoming(evt) {
      if (evt.data === "ping") {
        ws.send("pong");
      }
    };
  },
  async unstable_onValidate(_req: Request): Promise<boolean> {
    return true;
  },
} satisfies PartyKitServer;
