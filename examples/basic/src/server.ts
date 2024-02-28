import type {
  Cron,
  ExecutionContext,
  FetchLobby,
  FetchSocket,
  PartyKitServer
} from "partykit/server";

console.log(process.env);

declare global {
  const SOME_GLOBAL: string;
  const TEST_DEFINE_NUMBER: number;
  const TEST_DEFINE_STRING: string;
  const PARTYKIT_HOST: string;
}

console.log(TEST_DEFINE_NUMBER, typeof TEST_DEFINE_NUMBER);
console.log(TEST_DEFINE_STRING, typeof TEST_DEFINE_STRING);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  async onFetch(req, lobby, _ctx) {
    const url = new URL(req.url);
    if (url.pathname === "/another") {
      return lobby.assets.fetch("/another.html");
    }
  },
  async onSocket(
    socket: FetchSocket,
    _env: FetchLobby,
    _ctx: ExecutionContext
  ) {
    socket.addEventListener("message", (evt) => {
      console.log("got a message from client", evt.data);
    });

    (async () => {
      for (let i = 0; i < 10; i++) {
        await sleep(1000);
        socket.send("hello " + i);
      }
      socket.close(1001, "bye");
    })().catch(console.error);
  },
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
        "x-foo": "bar"
      }
    });
  },

  async onRequest(req, room) {
    console.log(room.env);

    console.log(process.env.WHATUP);
    console.log(room.context.parties);
    const res = await room.context.parties.xyz.get("some-id").fetch();
    console.log("gottt", await res.text());
    const wssss = await room.context.parties.xyz.get("some-id").socket();
    wssss.addEventListener("message", (evt) => {
      console.log("got a message from xyz", evt.data);
    });

    console.log(SOME_GLOBAL);
    return new Response(
      "Hello world:" +
        req.headers.get("x-foo") +
        " " +
        room.id +
        " " +
        TEST_DEFINE_NUMBER +
        " " +
        PARTYKIT_HOST
    );
  },

  onCron(cron: Cron, _lobby, _ctx) {
    console.log(
      `Running cron ${cron.name}: ${cron.cron} at ${cron.scheduledTime}`
    );
  }
} satisfies PartyKitServer;
