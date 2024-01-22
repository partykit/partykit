import type * as Party from "partykit/server";

import { type Socket as RawSocket } from "../../engine.io";
import { type RawData } from "../../engine.io-parser";
import { type CloseReason } from "../../engine.io/lib/socket";
import { type EventsMap } from "../../event-emitter";
import { getLogger } from "../../logger";
import { Decoder, PacketType } from "../../socket.io-parser";
import { Server } from "./server";
import { Socket } from "./socket";

import type { Packet } from "../../socket.io-parser";
import type { Handshake } from "./socket";

interface WriteOptions {
  volatile?: boolean;
}

/**
 * A {@link Client} can be associated with many multiplexed {@link Socket} that belong to different {@link Namespace}.
 */
export class Client<
  ListenEvents extends EventsMap,
  EmitEvents extends EventsMap,
  ServerSideEvents extends EventsMap,
  SocketData = unknown
> {
  public readonly conn: RawSocket;

  private readonly server: Server<
    ListenEvents,
    EmitEvents,
    ServerSideEvents,
    SocketData
  >;
  private readonly handshake: Omit<Handshake, "issued" | "time" | "auth">;
  private readonly decoder: Decoder;

  private sockets = new Map<
    string,
    Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
  >();

  private connectTimerId?: ReturnType<typeof setTimeout>;

  constructor(
    server: Server<ListenEvents, EmitEvents, ServerSideEvents, SocketData>,
    decoder: Decoder,
    conn: RawSocket,
    req: Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) {
    this.server = server;
    this.decoder = decoder;
    this.conn = conn;

    const url = new URL(req.url);
    this.handshake = {
      url: url.pathname,
      headers: req.headers,
      query: url.searchParams,
      // TODO: remote address hostname in cf?
      // address: (connInfo.remoteAddr as Deno.NetAddr).hostname,
      address: url.hostname,
      secure: false,
      xdomain: req.headers.has("origin")
    };

    conn.on("message", (data) => this.decoder.add(data));
    conn.on("close", (reason) => this.onclose(reason));

    this.decoder.on("packet", (packet) => this.onPacket(packet));
    this.decoder.on("error", () => this.onclose("parse error"));

    this.connectTimerId = setTimeout(() => {
      if (this.sockets.size === 0) {
        getLogger("socket.io").debug(
          "[client] no namespace joined yet, close the client"
        );
        this.close();
      }
    }, this.server.opts.connectTimeout);
  }

  private onPacket(packet: Packet) {
    const socket = this.sockets.get(packet.nsp);

    if (!socket && packet.type === PacketType.CONNECT) {
      this.connect(packet.nsp, packet.data);
    } else if (
      socket &&
      packet.type !== PacketType.CONNECT &&
      packet.type !== PacketType.CONNECT_ERROR
    ) {
      socket._onpacket(packet);
    } else {
      getLogger("socket.io").debug(
        `[client] invalid state (packet type: ${packet.type})`
      );
      this.close();
    }
  }

  private async connect(name: string, auth: Record<string, unknown> = {}) {
    if (this.server._nsps.has(name)) {
      getLogger("socket.io").debug(`[client] connecting to namespace ${name}`);
      return this.doConnect(name, auth);
    }

    try {
      await this.server._checkNamespace(name, auth);
    } catch (_) {
      getLogger("socket.io").debug(
        `[client] creation of namespace ${name} was denied`
      );
      this._packet({
        type: PacketType.CONNECT_ERROR,
        nsp: name,
        data: {
          message: "Invalid namespace"
        }
      });
      return;
    }

    getLogger("socket.io").debug(
      `[client] connecting to dynamic namespace ${name}`
    );
    this.doConnect(name, auth);
  }

  /**
   * Connects a client to a namespace.
   *
   * @param name - the namespace
   * @param {Object} auth - the auth parameters
   *
   * @private
   */
  private doConnect(name: string, auth: Record<string, unknown>): void {
    const nsp = this.server.of(name);

    const now = new Date();
    const handshake: Handshake = Object.assign(
      {
        issued: now.getTime(),
        time: now.toISOString(),
        auth
      },
      this.handshake
    );

    nsp._add(this, handshake, (socket) => {
      this.sockets.set(name, socket);

      if (this.connectTimerId) {
        clearTimeout(this.connectTimerId);
        this.connectTimerId = undefined;
      }
    });
  }

  /**
   * Disconnects from all namespaces and closes transport.
   *
   * @private
   */
  _disconnect(): void {
    for (const socket of this.sockets.values()) {
      socket.disconnect();
    }
    this.sockets.clear();
    this.close();
  }

  /**
   * Removes a socket. Called by each `Socket`.
   *
   * @private
   */
  _remove(
    socket: Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>
  ): void {
    this.sockets.delete(socket.id);
  }

  private close() {
    if (this.conn.readyState === "open") {
      getLogger("socket.io").debug("[client] forcing transport close");
      this.conn.close();
      this.onclose("forced close");
    }
  }

  private onclose(reason: CloseReason) {
    getLogger("socket.io").debug(
      `[client] client closed with reason ${reason}`
    );

    // ignore a potential subsequent `close` event
    this.conn.off();
    this.decoder.off();

    if (this.connectTimerId) {
      clearTimeout(this.connectTimerId);
      this.connectTimerId = undefined;
    }

    for (const socket of this.sockets.values()) {
      socket._onclose(reason);
    }

    this.sockets.clear();
    this.decoder.destroy();
  }

  /**
   * Writes a packet to the transport.
   *
   * @param {Object} packet object
   * @param {Object} opts
   * @private
   */
  /* private */ _packet(packet: Packet, opts: WriteOptions = {}) {
    if (this.conn.readyState !== "open") {
      getLogger("socket.io").debug(`[client] ignoring packet write ${packet}`);
      return;
    }
    const encodedPackets = this.server._encoder.encode(packet);
    this._writeToEngine(encodedPackets, opts);
  }

  /* private */ _writeToEngine(encodedPackets: RawData[], opts: WriteOptions) {
    if (opts.volatile && !this.conn.transport.writable) {
      getLogger("socket.io").debug(
        "[client] volatile packet is discarded since the transport is not currently writable"
      );
      return;
    }
    for (const encodedPacket of encodedPackets) {
      this.conn.send(encodedPacket);
    }
  }
}
