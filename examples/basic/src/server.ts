import type { PartyKitServer } from "partykit/server";

export default {
  onConnect(ws, room) {
    // your business logic here
    ws.onmessage = function incoming(evt) {
      if (evt.data === "ping") {
        ws.send(`pong:${room.connections.size}`);
      } else if (evt.data.startsWith("latency")) {
        ws.send(evt.data);
      }
    };
  },
  async onBeforeConnect(_req: Request) {
    return { x: 1 };
  },
  async onBeforeRequest(req: Request) {
    return new Request(req.url, {
      headers: {
        "x-foo": "bar",
      },
    });
  },
  async onRequest(req: Request, room) {
    return new Response(
      "Hello world:" + req.headers.get("x-foo") + " " + room.id
    );
  },
} satisfies PartyKitServer;
