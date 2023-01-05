import type { PartyKitServer } from "partykit/server";

export default {
  onConnect(ws, room) {
    // your business logic here
    ws.onmessage = function incoming(evt) {
      if (evt.data === "ping") {
        ws.send(`pong:${room.connections.size}`);
      }
    };
  },
  async unstable_onValidate(_req: Request): Promise<boolean> {
    return true;
  },
} satisfies PartyKitServer;
