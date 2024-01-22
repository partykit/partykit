import type * as Party from "partykit/server";

import { Parser } from "../../../engine.io-parser";
import { getLogger } from "../../../logger";
import { upgradeWebSocket } from "../../../util";
import { Transport } from "../transport";

import type { Packet, RawData } from "../../../engine.io-parser";

export class WS extends Transport {
  private socket?: WebSocket;

  public get name() {
    return "websocket";
  }

  public get upgradesTo(): string[] {
    return [];
  }

  public send(packets: Packet[]) {
    for (const packet of packets) {
      Parser.encodePacket(packet, true, (data: RawData) => {
        if (this.writable) {
          // @ts-expect-error TODO
          this.socket?.send(data);
        }
      });
    }
  }

  public onRequest(req: Request): Promise<Response> {
    const { socket, response } = upgradeWebSocket(req);

    this.socket = socket;

    // With CF, we don't need to wait for the socket to be open
    // to start writing to it
    // socket.addEventListener("open", () => {
    getLogger("engine.io").debug("[websocket] transport is now writable");
    this.writable = true;
    this.emitReserved("drain");
    // });

    socket.addEventListener("message", ({ data }) => {
      // note: we use the length of the string here, which might be different from the number of bytes (up to 4 bytes)
      const byteLength =
        typeof data === "string" ? data.length : data.byteLength;
      if (byteLength > this.opts.maxHttpBufferSize) {
        return this.onError("payload too large");
      } else {
        this.onData(data);
      }
    });

    socket.addEventListener("error", (errorEvent) => {
      getLogger("engine.io").debug(`[websocket] onerror with ${errorEvent}`);
      // this.onError(errorEvent);
    });

    socket.addEventListener("close", (closeEvent) => {
      getLogger("engine.io").debug(
        `[websocket] onclose with code ${closeEvent.code} and reason ${closeEvent.reason}`
      );
      this.writable = false;
      this.onClose();
    });

    // note: response.headers is immutable, so it seems we can't add headers here

    return Promise.resolve(response);
  }

  protected doClose() {
    this.socket?.close();
  }
}
