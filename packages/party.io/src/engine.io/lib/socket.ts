import { EventEmitter } from "../../event-emitter";
import { getLogger } from "../../logger";
import { type ServerOptions } from "./server";
import { Transport, TransportError } from "./transport";

import type { Packet, PacketType, RawData } from "../../engine.io-parser";

type ReadyState = "opening" | "open" | "closing" | "closed";

type UpgradeState = "not_upgraded" | "upgrading" | "upgraded";

export type CloseReason =
  | "transport error"
  | "transport close"
  | "forced close"
  | "ping timeout"
  | "parse error";

interface SocketEvents {
  open: () => void;
  packet: (packet: Packet) => void;
  packetCreate: (packet: Packet) => void;
  message: (message: RawData) => void;
  flush: (writeBuffer: Packet[]) => void;
  drain: () => void;
  heartbeat: () => void;
  upgrading: (transport: Transport) => void;
  upgrade: (transport: Transport) => void;
  close: (reason: CloseReason) => void;
}

const FAST_UPGRADE_INTERVAL_MS = 100;

export class Socket extends EventEmitter<
  Record<never, never>,
  Record<never, never>,
  SocketEvents
> {
  public readonly id: string;
  public readyState: ReadyState = "opening";
  public transport: Transport;

  private readonly opts: ServerOptions;
  private upgradeState: UpgradeState = "not_upgraded";
  private writeBuffer: Packet[] = [];
  private pingIntervalTimerId?: ReturnType<typeof setTimeout>;
  private pingTimeoutTimerId?: ReturnType<typeof setTimeout>;

  constructor(id: string, opts: ServerOptions, transport: Transport) {
    super();

    this.id = id;
    this.opts = opts;

    this.transport = transport;
    this.bindTransport(transport);
    this.onOpen();
  }

  /**
   * Called upon transport considered open.
   *
   * @private
   */
  private onOpen() {
    this.readyState = "open";

    this.sendPacket(
      "open",
      JSON.stringify({
        sid: this.id,
        upgrades: this.transport.upgradesTo,
        pingInterval: this.opts.pingInterval,
        pingTimeout: this.opts.pingTimeout,
        maxPayload: this.opts.maxHttpBufferSize
      })
    );

    this.emitReserved("open");
    this.schedulePing();
  }

  /**
   * Called upon transport packet.
   *
   * @param packet
   * @private
   */
  private onPacket(packet: Packet) {
    if (this.readyState !== "open") {
      getLogger("engine.io").debug(
        "[socket] packet received with closed socket"
      );
      return;
    }

    getLogger("engine.io").debug(`[socket] received packet ${packet.type}`);

    this.emitReserved("packet", packet);

    switch (packet.type) {
      case "pong":
        getLogger("engine.io").debug("[socket] got pong");

        clearTimeout(this.pingTimeoutTimerId!);
        this.schedulePing();

        this.emitReserved("heartbeat");
        break;

      case "message":
        this.emitReserved("message", packet.data!);
        break;

      case "error":
      default:
        this.onClose("parse error");
        break;
    }
  }

  /**
   * Called upon transport error.
   *
   * @param err
   * @private
   */
  private onError(err: TransportError) {
    getLogger("engine.io").debug(`[socket] transport error: ${err.message}`);
    this.onClose("transport error");
  }

  /**
   * Pings client every `pingInterval` and expects response
   * within `pingTimeout` or closes connection.
   *
   * @private
   */
  private schedulePing() {
    this.pingIntervalTimerId = setTimeout(() => {
      getLogger("engine.io").debug(
        `[socket] writing ping packet - expecting pong within ${this.opts.pingTimeout} ms`,
        this.opts.pingTimeout
      );
      this.sendPacket("ping");
      this.resetPingTimeout();
    }, this.opts.pingInterval);
  }

  /**
   * Resets ping timeout.
   *
   * @private
   */
  private resetPingTimeout() {
    clearTimeout(this.pingTimeoutTimerId!);
    this.pingTimeoutTimerId = setTimeout(() => {
      if (this.readyState !== "closed") {
        this.onClose("ping timeout");
      }
    }, this.opts.pingTimeout);
  }

  /**
   * Attaches handlers for the given transport.
   *
   * @param transport
   * @private
   */
  private bindTransport(transport: Transport) {
    this.transport = transport;
    this.transport.once("error", (err) => this.onError(err));
    this.transport.on("packet", (packet) => this.onPacket(packet));
    this.transport.on("drain", () => this.flush());
    this.transport.on("close", () => this.onClose("transport close"));
  }

  /**
   * Upgrades socket to the given transport
   *
   * @param transport
   * @private
   */
  /* private */ _maybeUpgrade(transport: Transport) {
    if (this.upgradeState === "upgrading") {
      getLogger("engine.io").debug(
        "[socket] transport has already been trying to upgrade"
      );
      return transport.close();
    } else if (this.upgradeState === "upgraded") {
      getLogger("engine.io").debug(
        "[socket] transport has already been upgraded"
      );
      return transport.close();
    }

    getLogger("engine.io").debug("[socket] upgrading existing transport");
    this.upgradeState = "upgrading";

    const timeoutId = setTimeout(() => {
      getLogger("engine.io").debug(
        "[socket] client did not complete upgrade - closing transport"
      );
      transport.close();
    }, this.opts.upgradeTimeout);

    transport.on("close", () => {
      clearInterval(fastUpgradeTimerId);
      transport.off();
    });

    let fastUpgradeTimerId: ReturnType<typeof setInterval>;

    // we need to make sure that no packets gets lost during the upgrade, so the client does not cancel the HTTP
    // long-polling request itself, instead the server sends a "noop" packet to cleanly end any ongoing polling request
    const sendNoopPacket = () => {
      if (this.transport.name === "polling" && this.transport.writable) {
        getLogger("engine.io").debug(
          "[socket] writing a noop packet to polling for fast upgrade"
        );
        this.transport.send([{ type: "noop" }]);
      }
    };

    transport.on("packet", (packet) => {
      if (packet.type === "ping" && packet.data === "probe") {
        getLogger("engine.io").debug(
          "[socket] got probe ping packet, sending pong"
        );
        transport.send([{ type: "pong", data: "probe" }]);

        sendNoopPacket();
        fastUpgradeTimerId = setInterval(
          sendNoopPacket,
          FAST_UPGRADE_INTERVAL_MS
        );

        this.emitReserved("upgrading", transport);
      } else if (packet.type === "upgrade" && this.readyState !== "closed") {
        getLogger("engine.io").debug("[socket] got upgrade packet - upgrading");

        this.upgradeState = "upgraded";

        clearTimeout(timeoutId);
        clearInterval(fastUpgradeTimerId);
        transport.off();
        this.closeTransport();
        this.bindTransport(transport);

        this.emitReserved("upgrade", transport);
        this.flush();
      } else {
        getLogger("engine.io").debug("[socket] invalid upgrade packet");

        clearTimeout(timeoutId);
        transport.close();
      }
    });
  }

  /**
   * Called upon transport considered closed.
   *
   * @param reason
   * @private
   */
  private onClose(reason: CloseReason) {
    if (this.readyState === "closed") {
      return;
    }
    getLogger("engine.io").debug(`[socket] socket closed due to ${reason}`);

    this.readyState = "closed";
    clearTimeout(this.pingIntervalTimerId!);
    clearTimeout(this.pingTimeoutTimerId!);

    this.closeTransport();
    this.emitReserved("close", reason);
  }

  /**
   * Sends a "message" packet.
   *
   * @param data
   */
  public send(data: RawData): Socket {
    this.sendPacket("message", data);
    return this;
  }

  /**
   * Sends a packet.
   *
   * @param type
   * @param data
   * @private
   */
  private sendPacket(type: PacketType, data?: RawData) {
    if (["closing", "closed"].includes(this.readyState)) {
      console.warn("Socket is closed, ignoring packet");
      return;
    }

    getLogger("engine.io").debug(`[socket] sending packet ${type} (${data})`);

    const packet: Packet = {
      type,
      data
    };

    this.emitReserved("packetCreate", packet);

    this.writeBuffer.push(packet);

    this.flush();
  }

  /**
   * Attempts to flush the packets buffer.
   *
   * @private
   */
  private flush() {
    const shouldFlush =
      this.readyState !== "closed" &&
      this.transport.writable &&
      this.writeBuffer.length > 0;

    if (!shouldFlush) {
      return;
    }

    getLogger("engine.io").debug(
      `[socket] flushing buffer with ${this.writeBuffer.length} packet(s) to transport`
    );

    this.emitReserved("flush", this.writeBuffer);

    const buffer = this.writeBuffer;
    this.writeBuffer = [];

    this.transport.send(buffer);
    this.emitReserved("drain");
  }

  /**
   * Closes the socket and underlying transport.
   */
  public close() {
    if (this.readyState !== "open") {
      return;
    }

    this.readyState = "closing";

    const close = () => {
      this.closeTransport();
      this.onClose("forced close");
    };

    if (this.writeBuffer.length) {
      getLogger("engine.io").debug(
        `[socket] buffer not empty, waiting for the drain event`
      );
      this.once("drain", close);
    } else {
      close();
    }
  }

  /**
   * Closes the underlying transport.
   *
   * @private
   */
  private closeTransport() {
    this.transport.off();
    this.transport.close();
  }
}
