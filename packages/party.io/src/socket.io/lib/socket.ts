import { generateId } from "../../engine.io";
import { EventEmitter } from "../../event-emitter";
import { getLogger } from "../../logger";
import { PacketType } from "../../socket.io-parser";
import { Adapter } from "./adapter";
import { BroadcastOperator } from "./broadcast-operator";
import { Client } from "./client";
import { Namespace } from "./namespace";

import type {
  DefaultEventsMap,
  EventNames,
  EventParams,
  EventsMap
} from "../../event-emitter";
import type { Packet } from "../../socket.io-parser";
import type { BroadcastFlags, Room, SocketId } from "./adapter";

type ClientReservedEvents = "connect" | "connect_error";

type DisconnectReason =
  // Engine.IO close reasons
  | "transport error"
  | "transport close"
  | "forced close"
  | "ping timeout"
  | "parse error"
  // Socket.IO disconnect reasons
  | "client namespace disconnect"
  | "server namespace disconnect";

export interface SocketReservedEvents {
  disconnect: (reason: DisconnectReason) => void;
  disconnecting: (reason: DisconnectReason) => void;
}

// EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
export interface EventEmitterReservedEvents {
  newListener: (
    eventName: string | symbol,
    listener: (...args: unknown[]) => void
  ) => void;
  removeListener: (
    eventName: string | symbol,
    listener: (...args: unknown[]) => void
  ) => void;
}

export const RESERVED_EVENTS: ReadonlySet<string | symbol> = new Set<
  | ClientReservedEvents
  | keyof SocketReservedEvents
  | keyof EventEmitterReservedEvents
>([
  "connect",
  "connect_error",
  "disconnect",
  "disconnecting",
  "newListener",
  "removeListener"
] as const);

/**
 * The handshake details
 */
export interface Handshake {
  /**
   * The headers sent as part of the handshake
   */
  headers: Headers;

  /**
   * The date of creation (as string)
   */
  time: string;

  /**
   * The ip of the client
   */
  address: string;

  /**
   * Whether the connection is cross-domain
   */
  xdomain: boolean;

  /**
   * Whether the connection is secure
   */
  secure: boolean;

  /**
   * The date of creation (as unix timestamp)
   */
  issued: number;

  /**
   * The request URL string
   */
  url: string;

  /**
   * The query object
   */
  query: URLSearchParams;

  /**
   * The auth object
   */
  auth: Record<string, unknown>;
}

function noop() {}

export type Event = [string, ...unknown[]];

/**
 * This is the main object for interacting with a client.
 *
 * A Socket belongs to a given {@link Namespace} and uses an underlying {@link Client} to communicate.
 *
 * Within each {@link Namespace}, you can also define arbitrary channels (called "rooms") that the {@link Socket} can
 * join and leave. That provides a convenient way to broadcast to a group of socket instances.
 *
 * @example
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
 *   // join the room named "room1"
 *   socket.join("room1");
 *
 *   // broadcast to everyone in the room named "room1"
 *   io.to("room1").emit("hello");
 *
 *   // upon disconnection
 *   socket.on("disconnect", (reason) => {
 *     console.log(`socket ${socket.id} disconnected due to ${reason}`);
 *   });
 * });
 */
export class Socket<
  ListenEvents extends EventsMap = DefaultEventsMap,
  EmitEvents extends EventsMap = DefaultEventsMap,
  ServerSideEvents extends EventsMap = DefaultEventsMap,
  SocketData = unknown
> extends EventEmitter<ListenEvents, EmitEvents, SocketReservedEvents> {
  /**
   * An unique identifier for the session.
   */
  public readonly id: SocketId;
  /**
   * The handshake details.
   */
  public readonly handshake: Handshake;
  /**
   * Additional information that can be attached to the Socket instance and which will be used in the
   * {@link Server.fetchSockets()} method.
   */
  public data: Partial<SocketData> = {};

  /**
   * Whether the socket is currently connected or not.
   *
   * @example
   * io.use(async (socket) => {
   *   console.log(socket.connected); // false
   * });
   *
   * io.on("connection", (socket) => {
   *   console.log(socket.connected); // true
   * });
   */
  public connected = false;

  private readonly nsp: Namespace<
    ListenEvents,
    EmitEvents,
    ServerSideEvents,
    SocketData
  >;
  private readonly adapter: Adapter;

  /* private */ _acks: Map<number, () => void> = new Map();
  private flags: BroadcastFlags = {};
  #anyIncomingListeners?: Array<(...args: Event) => void>;
  #anyOutgoingListeners?: Array<(...args: Event) => void>;

  #preConnectBuffer: Packet[] = [];

  /* private */ readonly client: Client<
    ListenEvents,
    EmitEvents,
    ServerSideEvents,
    SocketData
  >;

  constructor(
    nsp: Namespace<ListenEvents, EmitEvents, ServerSideEvents, SocketData>,
    client: Client<ListenEvents, EmitEvents, ServerSideEvents, SocketData>,
    handshake: Handshake
  ) {
    super();
    this.nsp = nsp;
    this.id = generateId();
    this.client = client;
    this.adapter = nsp.adapter;
    this.handshake = handshake;
  }

  /**
   * Emits to this client.
   *
   * @example
   * io.on("connection", (socket) => {
   *   socket.emit("hello", "world");
   *
   *   // all serializable datastructures are supported (no need to call JSON.stringify)
   *   socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   *   // with an acknowledgement from the client
   *   socket.emit("hello", "world", (val) => {
   *     // ...
   *   });
   * });
   *
   * @return Always returns `true`.
   */
  override emit<Ev extends EventNames<EmitEvents>>(
    ev: Ev,
    ...args: EventParams<EmitEvents, Ev>
  ): boolean {
    if (RESERVED_EVENTS.has(ev)) {
      throw new Error(`"${String(ev)}" is a reserved event name`);
    }
    const data: unknown[] = [ev, ...args];
    const packet: Packet = {
      nsp: this.nsp.name,
      type: PacketType.EVENT,
      data: data
    };

    // access last argument to see if it's an ACK callback
    if (typeof data[data.length - 1] === "function") {
      const id = this.nsp._ids++;
      getLogger("socket.io").debug(
        `[socket] emitting packet with ack id ${id}`
      );

      this.registerAckCallback(id, data.pop() as (...args: unknown[]) => void);
      packet.id = id;
    }

    const flags = Object.assign({}, this.flags);
    this.flags = {};

    if (this.connected) {
      this._notifyOutgoingListeners(packet.data);
      this.packet(packet, flags);
    } else {
      this.#preConnectBuffer.push(packet);
    }

    return true;
  }

  /**
   * @private
   */
  private registerAckCallback(id: number, ack: (...args: unknown[]) => void) {
    const timeout = this.flags.timeout;
    if (timeout === undefined) {
      this._acks.set(id, ack);
      return;
    }

    const timerId = setTimeout(() => {
      getLogger("socket.io").debug(
        `[socket] event with ack id ${id} has timed out after ${timeout} ms`
      );
      this._acks.delete(id);
      ack.call(this, new Error("operation has timed out"));
    }, timeout);

    this._acks.set(id, (...args) => {
      clearTimeout(timerId);
      ack.apply(this, [null, ...args]);
    });
  }

  /**
   * Targets a room when broadcasting.
   *
   * @example
   * io.on("connection", (socket) => {
   *   // the “foo” event will be broadcast to all connected clients in the “room-101” room, except this socket
   *   socket.to("room-101").emit("foo", "bar");
   *
   *   // the code above is equivalent to:
   *   io.to("room-101").except(socket.id).emit("foo", "bar");
   *
   *   // with an array of rooms (a client will be notified at most once)
   *   socket.to(["room-101", "room-102"]).emit("foo", "bar");
   *
   *   // with multiple chained calls
   *   socket.to("room-101").to("room-102").emit("foo", "bar");
   * });
   *
   * @param room - a room, or an array of rooms
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public to(room: Room | Room[]): BroadcastOperator<EmitEvents, SocketData> {
    return this.newBroadcastOperator().to(room);
  }

  /**
   * Targets a room when broadcasting. Similar to `to()`, but might feel clearer in some cases:
   *
   * @example
   * io.on("connection", (socket) => {
   *   // disconnect all clients in the "room-101" room, except this socket
   *   socket.in("room-101").disconnectSockets();
   * });
   *
   * @param room - a room, or an array of rooms
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public in(room: Room | Room[]): BroadcastOperator<EmitEvents, SocketData> {
    return this.newBroadcastOperator().in(room);
  }

  /**
   * Excludes a room when broadcasting.
   *
   * @example
   * io.on("connection", (socket) => {
   *   // the "foo" event will be broadcast to all connected clients, except the ones that are in the "room-101" room
   *   // and this socket
   *   socket.except("room-101").emit("foo", "bar");
   *
   *   // with an array of rooms
   *   socket.except(["room-101", "room-102"]).emit("foo", "bar");
   *
   *   // with multiple chained calls
   *   socket.except("room-101").except("room-102").emit("foo", "bar");
   * });
   *
   * @param room - a room, or an array of rooms
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public except(
    room: Room | Room[]
  ): BroadcastOperator<EmitEvents, SocketData> {
    return this.newBroadcastOperator().except(room);
  }

  /**
   * @param packet
   *
   * @private
   */
  /* private */ _onpacket(packet: Packet) {
    if (!this.connected) {
      return;
    }

    getLogger("socket.io").debug(`[socket] got packet type ${packet.type}`);
    switch (packet.type) {
      case PacketType.EVENT:
      case PacketType.BINARY_EVENT:
        this.onevent(packet);
        break;

      case PacketType.ACK:
      case PacketType.BINARY_ACK:
        this.onack(packet);
        break;

      case PacketType.DISCONNECT:
        this.ondisconnect();
        break;
    }
  }

  /**
   * Called upon event packet.
   *
   * @param {Packet} packet - packet object
   * @private
   */
  private onevent(packet: Packet): void {
    const args = packet.data || [];
    getLogger("socket.io").debug(`[socket] emitting event ${args}`);

    if (null != packet.id) {
      getLogger("socket.io").debug("[socket] attaching ack callback to event");
      args.push(this.ack(packet.id));
    }

    this.#notifyIncomingListeners(args);

    if (this.connected) {
      super.emit.apply(this, args);
    }
  }

  /**
   * Produces an ack callback to emit with an event.
   *
   * @param {Number} id - packet id
   * @private
   */
  private ack(id: number): () => void {
    let sent = false;
    return (...args) => {
      // prevent double callbacks
      if (sent) return;
      getLogger("socket.io").debug(`[socket] sending ack ${id}`);

      this.packet({
        id: id,
        type: PacketType.ACK,
        data: args
      });

      sent = true;
    };
  }

  /**
   * Called upon ack packet.
   *
   * @private
   */
  private onack(packet: Packet): void {
    const ack = this._acks.get(packet.id!);
    if ("function" == typeof ack) {
      getLogger("socket.io").debug(`[socket] calling ack ${packet.id}`);
      ack.apply(this, packet.data);
      this._acks.delete(packet.id!);
    } else {
      getLogger("socket.io").debug(`[socket] bad ack ${packet.id}`);
    }
  }

  /**
   * Called upon client disconnect packet.
   *
   * @private
   */
  private ondisconnect(): void {
    getLogger("socket.io").debug("[socket] got disconnect packet");
    this._onclose("client namespace disconnect");
  }

  /**
   * Called upon closing. Called by `Client`.
   *
   * @param {String} reason
   * @throw {Error} optional error object
   *
   * @private
   */
  /* private */ _onclose(reason: DisconnectReason): this | undefined {
    if (!this.connected) return this;
    getLogger("socket.io").debug(`[socket] closing socket - reason ${reason}`);
    this.emitReserved("disconnecting", reason);
    this._cleanup();
    this.nsp._remove(this);
    this.client._remove(this);
    this.connected = false;
    this.emitReserved("disconnect", reason);
    return;
  }

  /**
   * Makes the socket leave all the rooms it was part of and prevents it from joining any other room
   *
   * @private
   */
  /* private */ _cleanup() {
    this.leaveAll();
    this.join = noop;
  }

  /**
   * Notify the listeners for each packet sent (emit or broadcast)
   *
   * @param packet
   *
   * @private
   */
  /* private */ _notifyOutgoingListeners(args: Event) {
    if (this.#anyOutgoingListeners) {
      for (const listener of this.#anyOutgoingListeners) {
        listener.apply(this, args);
      }
    }
  }

  /**
   * Sends a `message` event.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * io.on("connection", (socket) => {
   *   socket.send("hello");
   *
   *   // this is equivalent to
   *   socket.emit("message", "hello");
   * });
   *
   * @return self
   */
  public send(...args: EventParams<EmitEvents, "message">): this {
    this.emit("message", ...args);
    return this;
  }

  /**
   * Writes a packet.
   *
   * @param {Object} packet - packet object
   * @param {Object} opts - options
   * @private
   */
  private packet(
    packet: Omit<Packet, "nsp"> & Partial<Pick<Packet, "nsp">>,
    opts = {}
  ): void {
    packet.nsp = this.nsp.name;
    this.client._packet(packet as Packet, opts);
  }

  /**
   * Joins a room.
   *
   * @example
   * io.on("connection", (socket) => {
   *   // join a single room
   *   socket.join("room1");
   *
   *   // join multiple rooms
   *   socket.join(["room1", "room2"]);
   * });
   *
   * @param {String|Array} rooms - room or array of rooms
   * @return a Promise or nothing, depending on the adapter
   */
  public join(rooms: Room | Array<Room>): Promise<void> | void {
    getLogger("socket.io").debug(`[socket] join room ${rooms}`);

    return this.adapter.addAll(
      this.id,
      new Set(Array.isArray(rooms) ? rooms : [rooms])
    );
  }

  /**
   * Leaves a room.
   *
   * @example
   * io.on("connection", (socket) => {
   *   // leave a single room
   *   socket.leave("room1");
   *
   *   // leave multiple rooms
   *   socket.leave("room1").leave("room2");
   * });
   *
   * @param {String} room
   * @return a Promise or nothing, depending on the adapter
   */
  public leave(room: Room): Promise<void> | void {
    getLogger("socket.io").debug("[socket] leave room %s", room);

    return this.adapter.del(this.id, room);
  }

  /**
   * Leave all rooms.
   *
   * @private
   */
  private leaveAll(): void {
    this.adapter.delAll(this.id);
  }

  /**
   * Called by `Namespace` upon successful
   * middleware execution (ie: authorization).
   * Socket is added to namespace array before
   * call to join, so adapters can access it.
   *
   * @private
   */
  /* private */ _onconnect(): void {
    getLogger("socket.io").debug("[socket] socket connected - writing packet");
    this.connected = true;
    this.join(this.id);
    this.packet({ type: PacketType.CONNECT, data: { sid: this.id } });
    this.#preConnectBuffer.forEach((packet) => {
      this._notifyOutgoingListeners(packet.data);
      this.packet(packet);
    });
    this.#preConnectBuffer = [];
  }

  /**
   * Produces an `error` packet.
   *
   * @param err - error object
   *
   * @private
   */
  /* private */ _error(err: { message: string; data: unknown }) {
    this.packet({ type: PacketType.CONNECT_ERROR, data: err });
  }

  /**
   * Disconnects this client.
   *
   * @example
   * io.on("connection", (socket) => {
   *   // disconnect this socket (the connection might be kept alive for other namespaces)
   *   socket.disconnect();
   *
   *   // disconnect this socket and close the underlying connection
   *   socket.disconnect(true);
   * })
   *
   * @param {Boolean} close - if `true`, closes the underlying connection
   * @return self
   */
  public disconnect(close = false): this {
    if (!this.connected) return this;
    if (close) {
      this.client._disconnect();
    } else {
      this.packet({ type: PacketType.DISCONNECT });
      this._onclose("server namespace disconnect");
    }
    return this;
  }

  /**
   * Sets a modifier for a subsequent event emission that the event data may be lost if the client is not ready to
   * receive messages (because of network slowness or other issues, or because they’re connected through long polling
   * and is in the middle of a request-response cycle).
   *
   * @example
   * io.on("connection", (socket) => {
   *   socket.volatile.emit("hello"); // the client may or may not receive it
   * });
   *
   * @return self
   */
  public get volatile(): this {
    this.flags.volatile = true;
    return this;
  }

  /**
   * Sets a modifier for a subsequent event emission that the event data will only be broadcast to every sockets but the
   * sender.
   *
   * @example
   * io.on("connection", (socket) => {
   *   // the “foo” event will be broadcast to all connected clients, except this socket
   *   socket.broadcast.emit("foo", "bar");
   * });
   *
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public get broadcast(): BroadcastOperator<EmitEvents, SocketData> {
    return this.newBroadcastOperator();
  }

  /**
   * Sets a modifier for a subsequent event emission that the event data will only be broadcast to the current node.
   *
   * @example
   * io.on("connection", (socket) => {
   *   // the “foo” event will be broadcast to all connected clients on this node, except this socket
   *   socket.local.emit("foo", "bar");
   * });
   *
   * @return a new {@link BroadcastOperator} instance for chaining
   */
  public get local(): BroadcastOperator<EmitEvents, SocketData> {
    return this.newBroadcastOperator().local;
  }

  /**
   * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
   * given number of milliseconds have elapsed without an acknowledgement from the client:
   *
   * @example
   * io.on("connection", (socket) => {
   *   socket.timeout(5000).emit("my-event", (err) => {
   *     if (err) {
   *       // the client did not acknowledge the event in the given delay
   *     }
   *   });
   * });
   *
   * @returns self
   */
  public timeout(timeout: number): this {
    this.flags.timeout = timeout;
    return this;
  }

  /**
   * Returns the rooms the socket is currently in.
   *
   * @example
   * io.on("connection", (socket) => {
   *   console.log(socket.rooms); // Set { <socket.id> }
   *
   *   socket.join("room1");
   *
   *   console.log(socket.rooms); // Set { <socket.id>, "room1" }
   * });
   */
  public get rooms(): Set<Room> {
    return this.adapter.socketRooms(this.id) || new Set();
  }

  private newBroadcastOperator(): BroadcastOperator<EmitEvents, SocketData> {
    const flags = Object.assign({}, this.flags);
    this.flags = {};
    return new BroadcastOperator(
      this.adapter,
      new Set<Room>(),
      new Set<Room>([this.id]),
      flags
    );
  }

  #notifyIncomingListeners(args: Event) {
    if (this.#anyIncomingListeners) {
      for (const listener of this.#anyIncomingListeners) {
        listener.apply(this, args);
      }
    }
  }

  /**
   * Adds a listener that will be fired when any event is received. The event name is passed as the first argument to
   * the callback.
   *
   * @example
   * io.on("connection", (socket) => {
   *   socket.onAnyIncoming((event, ...args) => {
   *     console.log(`got event ${event}`);
   *   });
   * });
   *
   * @param listener
   */
  public onAnyIncoming(listener: (...args: Event) => void): this {
    this.#anyIncomingListeners = this.#anyIncomingListeners || [];
    this.#anyIncomingListeners.push(listener);
    return this;
  }

  /**
   * Removes the listener that will be fired when any event is received.
   *
   * @example
   * io.on("connection", (socket) => {
   *   const catchAllListener = (event, ...args) => {
   *     console.log(`got event ${event}`);
   *   }
   *
   *   socket.onAnyIncoming(catchAllListener);
   *
   *   // remove a specific listener
   *   socket.offAnyIncoming(catchAllListener);
   *
   *   // or remove all listeners
   *   socket.offAnyIncoming();
   * });
   *
   * @param listener
   */
  public offAnyIncoming(listener?: (...args: Event) => void): this {
    if (this.#anyIncomingListeners && listener) {
      const i = this.#anyIncomingListeners.indexOf(listener);
      if (i !== -1) {
        this.#anyIncomingListeners.splice(i, 1);
      }
    } else {
      this.#anyIncomingListeners = [];
    }
    return this;
  }

  /**
   * Adds a listener that will be fired when any event is sent. The event name is passed as the first argument to
   * the callback.
   *
   * @example
   * io.on("connection", (socket) => {
   *   socket.onAnyOutgoing((event, ...args) => {
   *     console.log(`sent event ${event}`);
   *   });
   * });
   *
   * @param listener
   */
  public onAnyOutgoing(listener: (...args: Event) => void): this {
    this.#anyOutgoingListeners = this.#anyOutgoingListeners || [];
    this.#anyOutgoingListeners.push(listener);
    return this;
  }

  /**
   * Removes the listener that will be fired when any event is sent.
   *
   * @example
   * io.on("connection", (socket) => {
   *   const catchAllListener = (event, ...args) => {
   *     console.log(`sent event ${event}`);
   *   }
   *
   *   socket.onAnyOutgoing(catchAllListener);
   *
   *   // remove a specific listener
   *   socket.offAnyOutgoing(catchAllListener);
   *
   *   // or remove all listeners
   *   socket.offAnyOutgoing();
   * });
   *
   * @param listener - the catch-all listener
   */
  public offAnyOutgoing(listener?: (...args: Event) => void): this {
    if (this.#anyOutgoingListeners && listener) {
      const i = this.#anyOutgoingListeners.indexOf(listener);
      if (i !== -1) {
        this.#anyOutgoingListeners.splice(i, 1);
      }
    } else {
      this.#anyOutgoingListeners = [];
    }
    return this;
  }
}
