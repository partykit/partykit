import { Parser } from "../../engine.io-parser";
import { EventEmitter } from "../../event-emitter";
import { getLogger } from "../../logger";
import { type ServerOptions } from "./server";

import type { Packet, RawData } from "../../engine.io-parser";

interface TransportEvents {
  packet: (packet: Packet) => void;
  error: (error: TransportError) => void;
  drain: () => void;
  close: () => void;
}

type ReadyState = "open" | "closing" | "closed";

export abstract class Transport extends EventEmitter<
  Record<never, never>,
  Record<never, never>,
  TransportEvents
> {
  public writable = false;

  protected readyState: ReadyState = "open";
  protected readonly opts: ServerOptions;

  constructor(opts: ServerOptions) {
    super();
    this.opts = opts;
  }

  /**
   * The name of the transport
   */
  public abstract get name(): string;

  /**
   * The list of transports to upgrade to
   */
  public abstract get upgradesTo(): string[];

  /**
   * Called with an incoming HTTP request.
   *
   * @param req
   * @param responseHeaders
   */
  public abstract onRequest(
    req: Request,
    responseHeaders: Headers
  ): Promise<Response>;

  /**
   * Writes an array of packets.
   *
   * @param packets
   */
  public abstract send(packets: Packet[]): void;

  /**
   * Closes the transport.
   *
   * @protected
   */
  protected abstract doClose(): void;

  /**
   * Manually closes the transport.
   */
  public close() {
    if (["closing", "closed"].includes(this.readyState)) {
      return;
    }

    getLogger("engine.io").debug("[transport] closing transport");
    this.readyState = "closing";
    this.doClose();
  }

  /**
   * Called when the transport encounters a fatal error.
   *
   * @param message
   * @protected
   */
  protected onError(message: string) {
    this.emitReserved("error", new TransportError(message));
  }

  /**
   * Called with a parsed packet from the data stream.
   *
   * @param packet
   * @protected
   */
  protected onPacket(packet: Packet) {
    if (packet.type === "close") {
      getLogger("engine.io").debug("[transport] received 'close' packet");
      return this.doClose();
    }
    this.emitReserved("packet", packet);
  }

  /**
   * Called with the encoded packet data.
   *
   * @param data
   * @protected
   */
  protected onData(data: RawData) {
    this.onPacket(Parser.decodePacket(data));
  }

  /**
   * Called upon transport close.
   *
   * @protected
   */
  protected onClose() {
    this.readyState = "closed";
    this.emitReserved("close");
  }
}

export class TransportError extends Error {
  public readonly type = "TransportError";
}
