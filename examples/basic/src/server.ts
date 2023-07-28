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
      if (evt.data === "ping") {
        ws.send(`pong:${room.connections.size}`);
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

  async onBeforeRequest(req: Request) {
    return new Request(req.url, {
      headers: {
        "x-foo": "bar",
      },
    });
  },
  async onRequest(req: Request, room) {
    console.log(room.env);

    console.log(process.env.WHATUP);
    console.log(room.parties);
    // const res = await room.parties.xyz.get("some-id").fetch();
    // console.log("gottt", await res.text());
    const wssss = room.parties.xyz.get("some-id").connect();
    wssss.addEventListener("message", (evt) => {
      console.log("got a message from xyz", evt.data);
    });

    console.log(SOME_GLOBAL);
    return new Response(
      "Hello world:" + req.headers.get("x-foo") + " " + room.id
    );
  },
} satisfies PartyKitServer;
