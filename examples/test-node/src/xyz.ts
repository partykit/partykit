import type { PartyKitServer } from "partykit/server";

export default {
  // onBeforeRequest(_req) {
  //   console.log("xyz before request");
  //   return new Response("Hello from xyz request");
  // },
  onRequest(_req) {
    return new Response("Hello from xyz");
  },
  onConnect(ws, _room) {
    console.log("xyz connected");
    ws.send("ping from xyz");
  }
} satisfies PartyKitServer;
