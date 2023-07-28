import type { PartyKitServer } from "partykit/server";

export default {
  onRequest(_req: Request) {
    return new Response("Hello from xyz");
  },
  onConnect(ws, _room) {
    console.log("xyz connected");
    ws.send("ping from xyz");
  },
} satisfies PartyKitServer;
