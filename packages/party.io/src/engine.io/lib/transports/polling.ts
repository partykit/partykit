import type * as Party from "partykit/server";

import { Parser } from "../../../engine.io-parser";
import { getLogger } from "../../../logger";
import { Transport } from "../transport";

import type { Packet } from "../../../engine.io-parser";

export class Polling extends Transport {
  private pollingPromise?: {
    resolve: (res: Response) => void;
    reject: () => void;
    responseHeaders: Headers;
  };

  public get name() {
    return "polling";
  }

  public get upgradesTo(): string[] {
    return ["websocket"];
  }

  public onRequest(req: Request, responseHeaders: Headers): Promise<Response> {
    if (req.method === "GET") {
      return this.onPollRequest(req, responseHeaders);
    } else if (req.method === "POST") {
      return this.onDataRequest(req, responseHeaders);
    }
    return Promise.resolve(
      new Response(null, { status: 400, headers: responseHeaders })
    );
  }

  /**
   * The client sends a long-polling request awaiting the server to send data.
   *
   * @param req
   * @param responseHeaders
   * @private
   */
  private onPollRequest(
    req: Request,
    responseHeaders: Headers
  ): Promise<Response> {
    if (this.pollingPromise) {
      getLogger("engine.io").debug("[polling] request overlap");
      this.onError("overlap from client");
      return Promise.resolve(
        new Response(null, { status: 400, headers: responseHeaders })
      );
    }

    req.signal.addEventListener("abort", () => {
      // note: this gets never triggered
      this.onError("poll connection closed prematurely");
    });

    getLogger("engine.io").debug("[polling] new polling request");

    return new Promise<Response>((resolve, reject) => {
      this.pollingPromise = { resolve, reject, responseHeaders };

      getLogger("engine.io").debug("[polling] transport is now writable");
      this.writable = true;
      this.emitReserved("drain");
    });
  }

  /**
   * The client sends a request with data.
   *
   * @param req
   * @param responseHeaders
   */
  private async onDataRequest(
    req: Request,
    responseHeaders: Headers
  ): Promise<Response> {
    req.signal.addEventListener("abort", () => {
      // note: this gets never triggered
      this.onError("data request connection closed prematurely");
    });

    getLogger("engine.io").debug("[polling] new data request");

    const data = await req.text();

    if (data.length > this.opts.maxHttpBufferSize) {
      this.onError("payload too large");
      return Promise.resolve(
        new Response(null, { status: 413, headers: responseHeaders })
      );
    }

    const packets = Parser.decodePayload(data);

    getLogger("engine.io").debug(
      `[polling] decoded ${packets.length} packet(s)`
    );

    for (const packet of packets) {
      this.onPacket(packet);
    }

    return Promise.resolve(
      new Response("ok", {
        status: 200,
        headers: responseHeaders
      })
    );
  }

  public send(packets: Packet[]) {
    this.writable = false;
    Parser.encodePayload(packets, (data: string) => this.write(data));
  }

  /**
   * Writes data as response to long-polling request
   *
   * @param data
   * @private
   */
  private write(data: string) {
    getLogger("engine.io").debug(`[polling] writing ${data}`);

    if (!this.pollingPromise) {
      return;
    }

    const headers = this.pollingPromise.responseHeaders;
    headers.set("Content-Type", "text/plain; charset=UTF-8");

    // note: the HTTP server automatically handles the compression
    // see https://deno.land/manual@v1.24.3/runtime/http_server_apis#automatic-body-compression
    this.pollingPromise.resolve(
      new Response(data, {
        status: 200,
        headers
      })
    );

    this.pollingPromise = undefined;
  }

  protected doClose() {
    if (this.writable) {
      getLogger("engine.io").debug(
        "[polling] transport writable - closing right away"
      );
      // if we have received a "close" packet from the client, then we can just send a "noop" packet back
      this.send([{ type: this.readyState === "closing" ? "close" : "noop" }]);
    }

    this.onClose();
  }
}
