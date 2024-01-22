/**
 * The Redis adapter, to broadcast packets between several Socket.IO servers
 *
 * Documentation: https://socket.io/docs/v4/redis-adapter/
 *
 * @example
 * import { serve } from "https://deno.land/std/http/server";
 * import { Server, createRedisAdapter, createRedisClient } from "https://deno.land/x/socket_io/mod";
 *
 * const [pubClient, subClient] = await Promise.all([
 *   createRedisClient({
 *     hostname: "localhost",
 *   }),
 *   createRedisClient({
 *     hostname: "localhost",
 *   })
 * ]);
 *
 * const io = new Server({
 *     adapter: createRedisAdapter(pubClient, subClient)
 * });
 *
 * await serve(io.handler(), {
 *     port: 3000
 * });
 */
// export {
//   createAdapter,
//   type PartyAdapterOptions,
// } from "./socket.io/lib/party-adapter";

import type * as Party from "partykit/server";

import { type ServerOptions as EngineOptions } from "./engine.io";
import {
  type DefaultEventsMap,
  // EventEmitter,
  // type EventNames,
  // type EventParams,
  type EventsMap
} from "./event-emitter";
import { Server as SocketIOServer } from "./socket.io";
import { createAdapter } from "./socket.io/lib/party-adapter";

import type { ServerOptions as SocketServerOptions } from "./socket.io";

/**
 * @example
 * import { serve } from "https://deno.land/std@a.b.c/http/server";
 * import { Server } from "https://deno.land/x/socket_io@x.y.z/mod";
 *
 * const io = new Server();
 *
 * io.on("connection", (socket) => {
 *   console.log(`socket ${socket.id} connected`);
 *
 *   // send an event to the client
 *   socket.emit("foo", "bar");
 *
 *   socket.on("foobar", () => {
 *     // an event was received from the client
 *   });
 *
 *   // upon disconnection
 *   socket.on("disconnect", (reason) => {
 *     console.log(`socket ${socket.id} disconnected due to ${reason}`);
 *   });
 * });
 *
 * await serve(io.handler(), {
 *   port: 3000,
 * });
 */
export {
  // Adapter,
  // type BroadcastOptions,
  // type Namespace,
  // Server,
  // type ServerOptions,
  type Socket
} from "./socket.io";

export type ServerOptions = Omit<
  SocketServerOptions & EngineOptions,
  "adapter"
>;

type IOSetup<
  L extends EventsMap,
  E extends EventsMap,
  Se extends EventsMap,
  So
> = (
  server: SocketIOServer<L, E, Se, So>,
  req: Party.Request,
  lobby: Party.FetchLobby,
  ctx: Party.ExecutionContext
) => void | Promise<void>;

export function createServer<
  ListenEvents extends EventsMap = DefaultEventsMap,
  EmitEvents extends EventsMap = ListenEvents,
  ServerSideEvents extends EventsMap = DefaultEventsMap,
  SocketData = unknown
>(
  opts:
    | Partial<ServerOptions>
    | IOSetup<ListenEvents, EmitEvents, ServerSideEvents, SocketData>,
  ioSetup?: IOSetup<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
) {
  return class implements Party.Server {
    static async onFetch(
      req: Request,
      lobby: Party.FetchLobby,
      ctx: Party.ExecutionContext
    ) {
      const url = new URL(req.url);
      const query = url.searchParams;
      if (typeof opts === "function") {
        ioSetup = opts;
        opts = {};
      }
      const io = new SocketIOServer<
        ListenEvents,
        EmitEvents,
        ServerSideEvents,
        SocketData
      >({
        ...opts,
        adapter: createAdapter(lobby, ctx, {
          partyId: query.get("partyId") || undefined
        })
      });
      await ioSetup!(io, req, lobby, ctx);
      return io.handler()(req, lobby, ctx);
    }

    constructor(public room: Party.Room) {}

    onMessage(
      message: string | ArrayBuffer | ArrayBufferView
    ): void | Promise<void> {
      this.room.broadcast(message);
    }

    onRequest(req: Party.Request): Response | Promise<Response> {
      if (req.method === "POST") {
        const url = new URL(req.url);

        if (url.pathname.endsWith("/count")) {
          let count = 0;
          for (const _ of this.room.getConnections()) {
            count++;
          }
          return new Response(count.toString(), { status: 200 });
        }
      }
      return new Response("not found", { status: 404 });
    }
  };
}
