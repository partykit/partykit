import type * as Party from "partykit/server";

import { Server as Engine } from "../../engine.io";
import { EventEmitter } from "../../event-emitter";
import { getLogger } from "../../logger";
import { Decoder, Encoder } from "../../socket.io-parser";
import { type Handler } from "../../util";
import { Adapter, InMemoryAdapter } from "./adapter";
import { BroadcastOperator, RemoteSocket } from "./broadcast-operator";
import { Client } from "./client";
import { Namespace } from "./namespace";
import { ParentNamespace } from "./parent-namespace";
import { Socket } from "./socket";

import type { ServerOptions as EngineOptions } from "../../engine.io";
import type {
  DefaultEventsMap,
  EventNames,
  EventParams,
  EventsMap
} from "../../event-emitter";
import type { Room } from "./adapter";
import type { NamespaceReservedEvents } from "./namespace";

export interface ServerOptions {
  /**
   * Name of the request path to handle
   * @default "/socket.io/"
   */
  path: string;
  /**
   * Duration in milliseconds before a client without namespace is closed
   * @default 45000
   */
  connectTimeout: number;
  /**
   * The parser to use to encode and decode packets
   */
  parser: {
    createEncoder(): Encoder;
    createDecoder(): Decoder;
  };
  /**
   * The adapter to use to forward packets between several Socket.IO servers
   */
  adapter: (nsp: Namespace) => Adapter;
}

export interface ServerReservedEvents<
  ListenEvents extends EventsMap,
  EmitEvents extends EventsMap,
  ServerSideEvents extends EventsMap,
  SocketData
> extends NamespaceReservedEvents<
    ListenEvents,
    EmitEvents,
    ServerSideEvents,
    SocketData
  > {
  new_namespace: (
    namespace: Namespace<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
  ) => void;
}

type ParentNspNameMatchFn = (
  name: string,
  auth: Record<string, unknown>
) => Promise<void>;

/**
 * Represents a Socket.IO server.
 *
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
export class Server<
  ListenEvents extends EventsMap = DefaultEventsMap,
  EmitEvents extends EventsMap = ListenEvents,
  ServerSideEvents extends EventsMap = DefaultEventsMap,
  SocketData = unknown
> extends EventEmitter<
  ListenEvents,
  EmitEvents,
  ServerReservedEvents<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
> {
  public readonly engine: Engine;
  public readonly mainNamespace: Namespace<
    ListenEvents,
    EmitEvents,
    ServerSideEvents,
    SocketData
  >;
  public readonly opts: ServerOptions;

  /* private */ readonly _encoder: Encoder;

  /* private */ _nsps: Map<
    string,
    Namespace<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
  > = new Map();

  private parentNsps: Map<
    ParentNspNameMatchFn,
    ParentNamespace<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
  > = new Map();

  constructor(opts: Partial<ServerOptions & EngineOptions> = {}) {
    super();

    this.opts = Object.assign(
      {
        path: "/socket.io/",
        connectTimeout: 45_000,
        parser: {
          createEncoder() {
            return new Encoder();
          },
          createDecoder() {
            return new Decoder();
          }
        },
        adapter: (nsp: Namespace) => new InMemoryAdapter(nsp)
      },
      opts
    );

    this.engine = new Engine(this.opts);

    this.engine.on("connection", (conn, req, lobby, ctx) => {
      getLogger("socket.io").debug(
        `[server] incoming connection with id ${conn.id}`
      );
      new Client(this, this.opts.parser.createDecoder(), conn, req, lobby, ctx);
    });

    this._encoder = this.opts.parser.createEncoder();

    const mainNamespace = this.of("/");

    ["on", "once", "off", "listeners"].forEach((method) => {
      // @ts-ignore FIXME proper typing
      this[method] = function () {
        // @ts-ignore FIXME proper typing
        return mainNamespace[method].apply(mainNamespace, arguments);
      };
    });

    this.mainNamespace = mainNamespace;
  }

  /**
   * Returns a request handler.
   *
   * @example
   * import { serve } from "https://deno.land/std@a.b.c/http/server";
   * import { Server } from "https://deno.land/x/socket_io@x.y.z/mod";
   *
   * const io = new Server();
   *
   * await serve(io.handler(), {
   *   port: 3000,
   * });
   *
   * @param additionalHandler - another handler which will receive the request if the path does not match
   */
  public handler(
    additionalHandler?: Handler
  ): (
    req: Party.Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) => Response | Promise<Response> {
    return this.engine.handler(additionalHandler);
  }

  /**
   * Executes the middleware for an incoming namespace not already created on the server.
   *
   * @param name - name of incoming namespace
   * @param auth - the auth parameters
   * @param fn - callback
   *
   * @private
   */
  /* private */ async _checkNamespace(
    name: string,
    auth: Record<string, unknown>
  ): Promise<void> {
    if (this.parentNsps.size === 0) return Promise.reject();

    for (const [isValid, parentNsp] of this.parentNsps) {
      try {
        await isValid(name, auth);
      } catch (_) {
        continue;
      }

      if (this._nsps.has(name)) {
        // the namespace was created in the meantime
        getLogger("socket.io").debug(
          `[server] dynamic namespace ${name} already exists`
        );
      } else {
        const namespace = parentNsp._createChild(name);
        getLogger("socket.io").debug(
          `[server] dynamic namespace ${name} was created`
        );
        this.emitReserved("new_namespace", namespace);
      }

      return Promise.resolve();
    }

    return Promise.reject();
  }

  /**
   * Looks up a namespace.
   *
   * @example
   * // with a simple string
   * const myNamespace = io.of("/my-namespace");
   *
   * // with a regex
   * const dynamicNsp = io.of(/^\/dynamic-\d+$/).on("connection", (socket) => {
   *   const namespace = socket.nsp; // newNamespace.name === "/dynamic-101"
   *
   *   // broadcast to all clients in the given sub-namespace
   *   namespace.emit("hello");
   * });
   *
   * @param name - nsp name
   */
  public of(
    name: string | RegExp | ParentNspNameMatchFn
  ): Namespace<ListenEvents, EmitEvents, ServerSideEvents, SocketData> {
    if (typeof name === "function" || name instanceof RegExp) {
      const parentNsp = new ParentNamespace(this);
      getLogger("socket.io").debug(
        `[server] initializing parent namespace ${parentNsp.name}`
      );
      if (typeof name === "function") {
        this.parentNsps.set(name, parentNsp);
      } else {
        this.parentNsps.set(
          (nsp: string) =>
            (name as RegExp).test(nsp) ? Promise.resolve() : Promise.reject(),
          parentNsp
        );
      }

      return parentNsp;
    }

    if (String(name)[0] !== "/") name = "/" + name;

    let nsp = this._nsps.get(name);
    if (!nsp) {
      getLogger("socket.io").debug(`[server] initializing namespace ${name}`);
      nsp = new Namespace(this, name);
      this._nsps.set(name, nsp);
      if (name !== "/") {
        this.emitReserved("new_namespace", nsp);
      }
    }

    return nsp;
  }

  /**
   * Closes the server.
   *
   * @example
   * import { serve } from "https://deno.land/std@a.b.c/http/server";
   * import { Server } from "https://deno.land/x/socket_io@x.y.z/mod";
   *
   * const io = new Server();
   * const abortController = new AbortController();
   *
   * await serve(io.handler(), {
   *   port: 3000,
   *   signal: abortController.signal,
   *   onListen: () => {
   *     setTimeout(() => {
   *       // close the HTTP server
   *       abortController.abort();
   *       // close the Socket.IO server
   *       server.close();
   *     }, 10000);
   *   }
   * });
   */
  public close() {
    this.engine.close();
  }

  /**
   * Registers a middleware, which is a function that gets executed for every incoming {@link Socket}.
   *
   * @example
   * io.use(async (socket) => {
   *   // ...
   * });
   *
   * @param fn - the middleware function
   */
  public use(
    fn: (
      socket: Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
    ) => Promise<void>
  ): this {
    this.mainNamespace.use(fn);
    return this;
  }

  /**
   * Targets a room when emitting.
   *
   * @example
   * // the “foo” event will be broadcast to all connected clients in the “room-101” room
   * io.to("room-101").emit("foo", "bar");
   *
   * // with an array of rooms (a client will be notified at most once)
   * io.to(["room-101", "room-102"]).emit("foo", "bar");
   *
   * // with multiple chained calls
   * io.to("room-101").to("room-102").emit("foo", "bar");
   *
   * @param room - a room, or an array of rooms
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public to(room: Room | Room[]): BroadcastOperator<EmitEvents, SocketData> {
    return this.mainNamespace.to(room);
  }

  /**
   * Targets a room when emitting. Similar to `to()`, but might feel clearer in some cases:
   *
   * @example
   * // disconnect all clients in the "room-101" room
   * io.in("room-101").disconnectSockets();
   *
   * @param room - a room, or an array of rooms
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public in(room: Room | Room[]): BroadcastOperator<EmitEvents, SocketData> {
    return this.mainNamespace.in(room);
  }

  /**
   * Excludes a room when emitting.
   *
   * @example
   * // the "foo" event will be broadcast to all connected clients, except the ones that are in the "room-101" room
   * io.except("room-101").emit("foo", "bar");
   *
   * // with an array of rooms
   * io.except(["room-101", "room-102"]).emit("foo", "bar");
   *
   * // with multiple chained calls
   * io.except("room-101").except("room-102").emit("foo", "bar");
   *
   * @param room - a room, or an array of rooms
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public except(
    room: Room | Room[]
  ): BroadcastOperator<EmitEvents, SocketData> {
    return this.mainNamespace.except(room);
  }

  /**
   * Emits to all connected clients.
   *
   * @example
   * io.emit("hello", "world");
   *
   * // all serializable datastructures are supported (no need to call JSON.stringify)
   * io.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   * // with an acknowledgement from the clients
   * io.timeout(1000).emit("some-event", (err, responses) => {
   *   if (err) {
   *     // some clients did not acknowledge the event in the given delay
   *   } else {
   *     console.log(responses); // one response per client
   *   }
   * });
   *
   * @return Always true
   */
  override emit<Ev extends EventNames<EmitEvents>>(
    ev: Ev,
    ...args: EventParams<EmitEvents, Ev>
  ): boolean {
    return this.mainNamespace.emit(ev, ...args);
  }

  /**
   * Sends a `message` event to all clients.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * io.send("hello");
   *
   * // this is equivalent to
   * io.emit("message", "hello");
   *
   * @return self
   */
  public send(...args: EventParams<EmitEvents, "message">): this {
    this.mainNamespace.emit("message", ...args);
    return this;
  }

  /**
   * Sends a message to the other Socket.IO servers of the cluster.
   *
   * @example
   * io.serverSideEmit("hello", "world");
   *
   * io.on("hello", (arg1) => {
   *   console.log(arg1); // prints "world"
   * });
   *
   * // acknowledgements (without binary content) are supported too:
   * io.serverSideEmit("ping", (err, responses) => {
   *  if (err) {
   *     // some clients did not acknowledge the event in the given delay
   *   } else {
   *     console.log(responses); // one response per client
   *   }
   * });
   *
   * io.on("ping", (cb) => {
   *   cb("pong");
   * });
   *
   * @param ev - the event name
   * @param args - an array of arguments, which may include an acknowledgement callback at the end
   */
  public serverSideEmit<Ev extends EventNames<ServerSideEvents>>(
    ev: Ev,
    ...args: EventParams<ServerSideEvents, Ev>
  ): boolean {
    return this.mainNamespace.serverSideEmit(ev, ...args);
  }

  /**
   * Sets a modifier for a subsequent event emission that the event data may be lost if the client is not ready to
   * receive messages (because of network slowness or other issues, or because they’re connected through long polling
   * and is in the middle of a request-response cycle).
   *
   * @example
   * io.volatile.emit("hello"); // the clients may or may not receive it
   *
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public get volatile(): BroadcastOperator<EmitEvents, SocketData> {
    return this.mainNamespace.volatile;
  }

  /**
   * Sets a modifier for a subsequent event emission that the event data will only be broadcast to the current node.
   *
   * @example
   * // the “foo” event will be broadcast to all connected clients on this node
   * io.local.emit("foo", "bar");
   *
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public get local(): BroadcastOperator<EmitEvents, SocketData> {
    return this.mainNamespace.local;
  }

  /**
   * Adds a timeout in milliseconds for the next operation.
   *
   * @example
   * io.timeout(1000).emit("some-event", (err, responses) => {
   *   if (err) {
   *     // some clients did not acknowledge the event in the given delay
   *   } else {
   *     console.log(responses); // one response per client
   *   }
   * });
   *
   * @param timeout
   */
  public timeout(timeout: number): BroadcastOperator<EmitEvents, SocketData> {
    return this.mainNamespace.timeout(timeout);
  }

  /**
   * Returns the matching socket instances.
   *
   * Note: this method also works within a cluster of multiple Socket.IO servers, with a compatible {@link Adapter}.
   *
   * @example
   * // return all Socket instances
   * const sockets = await io.fetchSockets();
   *
   * // return all Socket instances in the "room1" room
   * const sockets = await io.in("room1").fetchSockets();
   *
   * for (const socket of sockets) {
   *   console.log(socket.id);
   *   console.log(socket.handshake);
   *   console.log(socket.rooms);
   *   console.log(socket.data);
   *
   *   socket.emit("hello");
   *   socket.join("room1");
   *   socket.leave("room2");
   *   socket.disconnect();
   * }
   */
  public fetchSockets(): Promise<RemoteSocket<EmitEvents, SocketData>[]> {
    return this.mainNamespace.fetchSockets();
  }

  /**
   * Makes the matching socket instances join the specified rooms.
   *
   * Note: this method also works within a cluster of multiple Socket.IO servers, with a compatible {@link Adapter}.
   *
   * @example
   *
   * // make all socket instances join the "room1" room
   * io.socketsJoin("room1");
   *
   * // make all socket instances in the "room1" room join the "room2" and "room3" rooms
   * io.in("room1").socketsJoin(["room2", "room3"]);
   *
   * @param room - a room, or an array of rooms
   */
  public socketsJoin(room: Room | Room[]): void {
    return this.mainNamespace.socketsJoin(room);
  }

  /**
   * Makes the matching socket instances leave the specified rooms.
   *
   * Note: this method also works within a cluster of multiple Socket.IO servers, with a compatible {@link Adapter}.
   *
   * @example
   * // make all socket instances leave the "room1" room
   * io.socketsLeave("room1");
   *
   * // make all socket instances in the "room1" room leave the "room2" and "room3" rooms
   * io.in("room1").socketsLeave(["room2", "room3"]);
   *
   * @param room - a room, or an array of rooms
   */
  public socketsLeave(room: Room | Room[]): void {
    return this.mainNamespace.socketsLeave(room);
  }

  /**
   * Makes the matching socket instances disconnect.
   *
   * Note: this method also works within a cluster of multiple Socket.IO servers, with a compatible {@link Adapter}.
   *
   * @example
   * // make all socket instances disconnect (the connections might be kept alive for other namespaces)
   * io.disconnectSockets();
   *
   * // make all socket instances in the "room1" room disconnect and close the underlying connections
   * io.in("room1").disconnectSockets(true);
   *
   * @param close - whether to close the underlying connection
   */
  public disconnectSockets(close = false): void {
    return this.mainNamespace.disconnectSockets(close);
  }
}
