import { runServer, EdgeRuntime } from "edge-runtime";
import { parse } from "url";
import { WebSocketServer } from "ws";
import httpProxy from "http-proxy";
import express from "express";
import path from "path";
import * as esbuild from "esbuild";
import assert from "assert";

// A "room" is a server that is running a script,
// as well as a websocket server distinct to the room.
type Room = {
  http: Awaited<ReturnType<typeof runServer>> & {
    // This... might not even be necessary??
    __server: import("http").Server;
  };
  ws: WebSocketServer;
};

// A map of room names to room servers.
type Rooms = Map<string, Room>;

export async function runPartykit(
  script: string, // The path to the script that will be run in the room.
  options: { port: number } = { port: 3141 }
): Promise<{ close: () => Promise<void> }> {
  if (!script) throw new Error("script path is missing");
  const absoluteScriptPath = path.resolve(process.cwd(), script);
  const initialCode = esbuild.buildSync({
    stdin: {
      contents: `
      import * as Worker from "${absoluteScriptPath}"
      addEventListener('fetch', event => {
        return event.respondWith(new Response('Hello world from the room'));
      })
      wss.on("connection", Worker.connect);  
    `,
      resolveDir: process.cwd(),
      // sourcefile: "./" + path.relative(process.cwd(), scriptPath),
    },
    format: "esm",
    bundle: true,
    write: false,
    sourcemap: true,
    target: "esnext",
  }).outputFiles[0].text;

  // A map of room names to room servers.
  const rooms: Rooms = new Map();

  // This is the function that gets/creates a room server.
  async function getRoom(roomId: string): Promise<Room> {
    if (rooms.has(roomId)) {
      return rooms.get(roomId)!;
    }

    const wss = new WebSocketServer({ noServer: true });

    const runtime = new EdgeRuntime({
      initialCode,
      extend: (context) =>
        Object.assign(context, {
          wss,
        }),
    });

    const roomHttpServer = (await runServer({ runtime })) as Room["http"];

    const room = { http: roomHttpServer, ws: wss };
    rooms.set(roomId, room);
    return room;
  }

  const app = express();

  // what we use to proxy requests to the room server
  const proxy = httpProxy.createProxyServer();

  // TODO: maybe we can just use urlpattern here
  app.get("/party/:roomId", async (req, res) => {
    const room = await getRoom(req.params.roomId);

    proxy.web(req, res, {
      target: room.http.url,
    });
  });

  const server = app.listen(options.port);
  await new Promise((resolve) => server.once("listening", resolve));

  server.on("upgrade", async function upgrade(request, socket, head) {
    assert(request.url, "request url is missing");
    const { pathname } = parse(request.url);
    assert(pathname, "pathname is missing!");

    // TODO: maybe we can just use urlpattern here
    if (pathname.startsWith("/party/")) {
      const roomId = pathname.split("/")[2];
      const room = await getRoom(roomId);

      room.ws.handleUpgrade(request, socket, head, function done(ws) {
        room.ws.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  console.log(`Listening on http://localhost:${options.port}...`);

  return {
    async close() {
      // cleanup
      const ctr = rooms.size * 2 + 1;
      return new Promise((resolve, reject) => {
        let count = 0;
        function done(err?: Error) {
          if (err) {
            reject(err);
            return;
          }
          count++;
          if (count === ctr) {
            resolve(undefined);
          }
        }
        // proxy.close(done);
        server.close(done);
        rooms.forEach((room) => {
          // TODO: bleh we should fix server.close() signature upstream
          room.http.__server.close(done);
          room.ws.close(done);
        });
      });
    },
  };
}
