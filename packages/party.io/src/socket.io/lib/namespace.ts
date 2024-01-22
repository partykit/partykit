import { EventEmitter } from "../../event-emitter";
import { getLogger } from "../../logger";
import { Adapter } from "./adapter";
import { BroadcastOperator, RemoteSocket } from "./broadcast-operator";
import { Client } from "./client";
import { Server } from "./server";
import { Socket } from "./socket";

import type {
  DefaultEventsMap,
  EventNames,
  EventParams,
  EventsMap
} from "../../event-emitter";
import type { Room, SocketId } from "./adapter";
import type { ServerReservedEvents } from "./server";
import type { Handshake } from "./socket";

export interface NamespaceReservedEvents<
  ListenEvents extends EventsMap,
  EmitEvents extends EventsMap,
  ServerSideEvents extends EventsMap,
  SocketData
> {
  connection: (
    socket: Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
  ) => void;
}

export const RESERVED_EVENTS: ReadonlySet<string | symbol> = new Set<
  keyof ServerReservedEvents<never, never, never, never>
>(["connection", "new_namespace"] as const);

/**
 * A Namespace is a communication channel that allows you to split the logic of your application over a single shared
 * connection.
 *
 * Each namespace has its own:
 *
 * - event handlers
 *
 * ```
 * io.of("/orders").on("connection", (socket) => {
 *   socket.on("order:list", () => {});
 *   socket.on("order:create", () => {});
 * });
 *
 * io.of("/users").on("connection", (socket) => {
 *   socket.on("user:list", () => {});
 * });
 * ```
 *
 * - rooms
 *
 * ```
 * const orderNamespace = io.of("/orders");
 *
 * orderNamespace.on("connection", (socket) => {
 *   socket.join("room1");
 *   orderNamespace.to("room1").emit("hello");
 * });
 *
 * const userNamespace = io.of("/users");
 *
 * userNamespace.on("connection", (socket) => {
 *   socket.join("room1"); // distinct from the room in the "orders" namespace
 *   userNamespace.to("room1").emit("holà");
 * });
 * ```
 *
 * - middlewares
 *
 * ```
 * const orderNamespace = io.of("/orders");
 *
 * orderNamespace.use(async (socket) => {
 *   // ensure the socket has access to the "orders" namespace
 * });
 *
 * const userNamespace = io.of("/users");
 *
 * userNamespace.use(async (socket) => {
 *   // ensure the socket has access to the "users" namespace
 * });
 * ```
 */
export class Namespace<
  ListenEvents extends EventsMap = DefaultEventsMap,
  EmitEvents extends EventsMap = DefaultEventsMap,
  ServerSideEvents extends EventsMap = DefaultEventsMap,
  SocketData = unknown
> extends EventEmitter<
  ServerSideEvents,
  EmitEvents,
  NamespaceReservedEvents<
    ListenEvents,
    EmitEvents,
    ServerSideEvents,
    SocketData
  >
> {
  public readonly name: string;
  public readonly sockets: Map<
    SocketId,
    Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
  > = new Map();
  public adapter: Adapter;

  /* private */ readonly _server: Server<
    ListenEvents,
    EmitEvents,
    ServerSideEvents,
    SocketData
  >;

  /* private */ _fns: Array<
    (
      socket: Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
    ) => Promise<void>
  > = [];

  /* private */ _ids = 0;

  constructor(
    server: Server<ListenEvents, EmitEvents, ServerSideEvents, SocketData>,
    name: string
  ) {
    super();
    this._server = server;
    this.name = name;
    this.adapter = server.opts.adapter(this as Namespace);
  }

  /**
   * Registers a middleware, which is a function that gets executed for every incoming {@link Socket}.
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * myNamespace.use(async (socket) => {
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
    this._fns.push(fn);
    return this;
  }

  /**
   * Executes the middleware for an incoming client.
   *
   * @param socket - the socket that will get added
   * @private
   */
  private async run(
    socket: Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
  ): Promise<void> {
    switch (this._fns.length) {
      case 0:
        return;
      case 1:
        return this._fns[0](socket);
      default:
        for (const fn of this._fns.slice()) {
          await fn(socket);
        }
    }
  }

  /**
   * Targets a room when emitting.
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * // the “foo” event will be broadcast to all connected clients in the “room-101” room
   * myNamespace.to("room-101").emit("foo", "bar");
   *
   * // with an array of rooms (a client will be notified at most once)
   * myNamespace.to(["room-101", "room-102"]).emit("foo", "bar");
   *
   * // with multiple chained calls
   * myNamespace.to("room-101").to("room-102").emit("foo", "bar");
   *
   * @param room - a room, or an array of rooms
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public to(room: Room | Room[]): BroadcastOperator<EmitEvents, SocketData> {
    return new BroadcastOperator(this.adapter).to(room);
  }

  /**
   * Targets a room when emitting. Similar to `to()`, but might feel clearer in some cases:
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * // disconnect all clients in the "room-101" room
   * myNamespace.in("room-101").disconnectSockets();
   *
   * @param room - a room, or an array of rooms
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public in(room: Room | Room[]): BroadcastOperator<EmitEvents, SocketData> {
    return new BroadcastOperator(this.adapter).in(room);
  }

  /**
   * Excludes a room when emitting.
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * // the "foo" event will be broadcast to all connected clients, except the ones that are in the "room-101" room
   * myNamespace.except("room-101").emit("foo", "bar");
   *
   * // with an array of rooms
   * myNamespace.except(["room-101", "room-102"]).emit("foo", "bar");
   *
   * // with multiple chained calls
   * myNamespace.except("room-101").except("room-102").emit("foo", "bar");
   *
   * @param room - a room, or an array of rooms
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public except(
    room: Room | Room[]
  ): BroadcastOperator<EmitEvents, SocketData> {
    return new BroadcastOperator(this.adapter).except(room);
  }

  /**
   * Adds a new client
   *
   * @param client - the client
   * @param handshake - the handshake
   * @private
   */
  /* private */ async _add(
    client: Client<ListenEvents, EmitEvents, ServerSideEvents, SocketData>,
    handshake: Handshake,
    callback: (
      socket: Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
    ) => void
  ) {
    getLogger("socket.io").debug(
      `[namespace] adding socket to nsp ${this.name}`
    );
    const socket = new Socket<
      ListenEvents,
      EmitEvents,
      ServerSideEvents,
      SocketData
    >(this, client, handshake);

    try {
      await this.run(socket);
    } catch (e) {
      const err = e as any; // TODO
      getLogger("socket.io").debug(
        "[namespace] middleware error, sending CONNECT_ERROR packet to the client"
      );
      socket._cleanup();
      return socket._error({
        message: err.message || err,
        data: err.data
      });
    }

    if (client.conn.readyState !== "open") {
      getLogger("socket.io").debug(
        "[namespace] next called after client was closed - ignoring socket"
      );
      socket._cleanup();
      return;
    }

    // track socket
    this.sockets.set(socket.id, socket);

    // it's paramount that the internal `onconnect` logic
    // fires before user-set events to prevent state order
    // violations (such as a disconnection before the connection
    // logic is complete)
    socket._onconnect();

    callback(socket);

    // fire user-set events
    this.emitReserved("connection", socket);
  }

  /**
   * Removes a client. Called by each `Socket`.
   *
   * @private
   */
  /* private */ _remove(
    socket: Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
  ): void {
    this.sockets.delete(socket.id);
  }

  /**
   * Emits to all connected clients.
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * myNamespace.emit("hello", "world");
   *
   * // all serializable datastructures are supported (no need to call JSON.stringify)
   * myNamespace.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   * // with an acknowledgement from the clients
   * myNamespace.timeout(1000).emit("some-event", (err, responses) => {
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
    return new BroadcastOperator<EmitEvents, SocketData>(this.adapter).emit(
      ev,
      ...args
    );
  }

  /**
   * Sends a `message` event to all clients.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * myNamespace.send("hello");
   *
   * // this is equivalent to
   * myNamespace.emit("message", "hello");
   *
   * @return self
   */
  public send(...args: EventParams<EmitEvents, "message">): this {
    this.emit("message", ...args);
    return this;
  }

  /**
   * Sends a message to the other Socket.IO servers of the cluster.
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * myNamespace.serverSideEmit("hello", "world");
   *
   * myNamespace.on("hello", (arg1) => {
   *   console.log(arg1); // prints "world"
   * });
   *
   * // acknowledgements (without binary content) are supported too:
   * myNamespace.serverSideEmit("ping", (err, responses) => {
   *  if (err) {
   *     // some clients did not acknowledge the event in the given delay
   *   } else {
   *     console.log(responses); // one response per client
   *   }
   * });
   *
   * myNamespace.on("ping", (cb) => {
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
    if (RESERVED_EVENTS.has(ev)) {
      throw new Error(`"${String(ev)}" is a reserved event name`);
    }
    args.unshift(ev);
    this.adapter.serverSideEmit(args);
    return true;
  }

  /**
   * Called when a packet is received from another Socket.IO server
   *
   * @param args - an array of arguments, which may include an acknowledgement callback at the end
   *
   * @private
   */
  /* private */ _onServerSideEmit(args: [string, ...unknown[]]) {
    // @ts-ignore FIXME
    super.emit.apply(this, args);
  }

  /**
   * Sets a modifier for a subsequent event emission that the event data may be lost if the client is not ready to
   * receive messages (because of network slowness or other issues, or because they’re connected through long polling
   * and is in the middle of a request-response cycle).
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * myNamespace.volatile.emit("hello"); // the clients may or may not receive it
   *
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public get volatile(): BroadcastOperator<EmitEvents, SocketData> {
    return new BroadcastOperator(this.adapter).volatile;
  }

  /**
   * Sets a modifier for a subsequent event emission that the event data will only be broadcast to the current node.
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * // the “foo” event will be broadcast to all connected clients on this node
   * myNamespace.local.emit("foo", "bar");
   *
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public get local(): BroadcastOperator<EmitEvents, SocketData> {
    return new BroadcastOperator(this.adapter).local;
  }

  /**
   * Adds a timeout in milliseconds for the next operation.
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * myNamespace.timeout(1000).emit("some-event", (err, responses) => {
   *   if (err) {
   *     // some clients did not acknowledge the event in the given delay
   *   } else {
   *     console.log(responses); // one response per client
   *   }
   * });
   *
   * @param timeout
   */
  public timeout(timeout: number) {
    return new BroadcastOperator(this.adapter).timeout(timeout);
  }

  /**
   * Returns the matching socket instances.
   *
   * Note: this method also works within a cluster of multiple Socket.IO servers, with a compatible {@link Adapter}.
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * // return all Socket instances
   * const sockets = await myNamespace.fetchSockets();
   *
   * // return all Socket instances in the "room1" room
   * const sockets = await myNamespace.in("room1").fetchSockets();
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
    return new BroadcastOperator(this.adapter).fetchSockets();
  }

  /**
   * Makes the matching socket instances join the specified rooms.
   *
   * Note: this method also works within a cluster of multiple Socket.IO servers, with a compatible {@link Adapter}.
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * // make all socket instances join the "room1" room
   * myNamespace.socketsJoin("room1");
   *
   * // make all socket instances in the "room1" room join the "room2" and "room3" rooms
   * myNamespace.in("room1").socketsJoin(["room2", "room3"]);
   *
   * @param room - a room, or an array of rooms
   */
  public socketsJoin(room: Room | Room[]): void {
    return new BroadcastOperator(this.adapter).socketsJoin(room);
  }

  /**
   * Makes the matching socket instances leave the specified rooms.
   *
   * Note: this method also works within a cluster of multiple Socket.IO servers, with a compatible {@link Adapter}.
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * // make all socket instances leave the "room1" room
   * myNamespace.socketsLeave("room1");
   *
   * // make all socket instances in the "room1" room leave the "room2" and "room3" rooms
   * myNamespace.in("room1").socketsLeave(["room2", "room3"]);
   *
   * @param room - a room, or an array of rooms
   */
  public socketsLeave(room: Room | Room[]): void {
    return new BroadcastOperator(this.adapter).socketsLeave(room);
  }

  /**
   * Makes the matching socket instances disconnect.
   *
   * Note: this method also works within a cluster of multiple Socket.IO servers, with a compatible {@link Adapter}.
   *
   * @example
   * const myNamespace = io.of("/my-namespace");
   *
   * // make all socket instances disconnect (the connections might be kept alive for other namespaces)
   * myNamespace.disconnectSockets();
   *
   * // make all socket instances in the "room1" room disconnect and close the underlying connections
   * myNamespace.in("room1").disconnectSockets(true);
   *
   * @param close - whether to close the underlying connection
   */
  public disconnectSockets(close = false): void {
    return new BroadcastOperator(this.adapter).disconnectSockets(close);
  }
}
