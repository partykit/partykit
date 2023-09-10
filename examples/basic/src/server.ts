import type { PartyKitServer } from "partykit/server";

declare global {
  const SOME_GLOBAL: string;
}

export default {
  onConnect(ws, room) {
    console.log(room.env);

    console.log(process.env.WHATUP);

    console.log(SOME_GLOBAL);
    // your business logic here
    ws.addEventListener("message", (evt) => {
      const connections = [...room.getConnections()];
      if (evt.data === "ping") {
        ws.send(`pong:${connections.length}`);
      } else if ((evt.data as string).startsWith("latency")) {
        ws.send(evt.data);
      }
    });
  },

  // onMessage(msg, conn, room) {
  //   if (msg === "ping") {
  //     conn.send(`pong:${room.connections.size}`);
  //   } else if ((msg as string).startsWith("latency")) {
  //     conn.send(msg);
  //   }
  // },

  // async onBeforeConnect(_req: Request) {
  //   return { x: 1 };
  // },

  async onBeforeRequest(req) {
    return new Request(req.url, {
      headers: {
        "x-foo": "bar",
      },
    });
  },

  async onRequest(req, room) {
    console.log(room.env);

    console.log(process.env.WHATUP);
    console.log(room.context.parties);
    const res = await room.context.parties.xyz.get("some-id").fetch();
    console.log("gottt", await res.text());
    const wssss = room.context.parties.xyz.get("some-id").connect();
    wssss.addEventListener("message", (evt) => {
      console.log("got a message from xyz", evt.data);
    });

    console.log(SOME_GLOBAL);
    return new Response(
      "Hello world:" + req.headers.get("x-foo") + " " + room.id
    );
  },
} satisfies PartyKitServer;
