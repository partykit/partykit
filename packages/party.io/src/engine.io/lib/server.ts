import type * as Party from "partykit/server";

import { EventEmitter } from "../../event-emitter";
import { getLogger } from "../../logger";
import { addCorsHeaders } from "./cors";
import { Socket } from "./socket";
import { Transport } from "./transport";
import { Polling } from "./transports/polling";
import { WS } from "./transports/websocket";
import { generateId } from "./util";

import type { Handler } from "../../util";
import type { CorsOptions } from "./cors";

const TRANSPORTS = ["polling", "websocket"];

export interface ServerOptions {
  /**
   * Name of the request path to handle
   * @default "/engine.io/"
   */
  path: string;
  /**
   * Duration in milliseconds without a pong packet to consider the connection closed
   * @default 20000
   */
  pingTimeout: number;
  /**
   * Duration in milliseconds before sending a new ping packet
   * @default 25000
   */
  pingInterval: number;
  /**
   * Duration in milliseconds before an uncompleted transport upgrade is cancelled
   * @default 10000
   */
  upgradeTimeout: number;
  /**
   * Maximum size in bytes or number of characters a message can be, before closing the session (to avoid DoS).
   * @default 1e6 (1 MB)
   */
  maxHttpBufferSize: number;
  /**
   * A function that receives a given handshake or upgrade request as its first parameter,
   * and can decide whether to continue or not.
   */
  allowRequest?: (
    req: Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) => Promise<void>;
  /**
   * The options related to Cross-Origin Resource Sharing (CORS)
   */
  cors?: CorsOptions;
  /**
   * A function that allows to edit the response headers of the handshake request
   */
  editHandshakeHeaders?: (
    responseHeaders: Headers,
    req: Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) => void | Promise<void>;
  /**
   * A function that allows to edit the response headers of all requests
   */
  editResponseHeaders?: (
    responseHeaders: Headers,
    req: Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) => void | Promise<void>;
}

interface ConnectionError {
  req: Request;
  code: number;
  message: string;
  context: Record<string, unknown>;
}

interface ServerReservedEvents {
  connection: (
    socket: Socket,
    request: Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) => void;
  connection_error: (err: ConnectionError) => void;
}

const enum ERROR_CODES {
  UNKNOWN_TRANSPORT = 0,
  UNKNOWN_SID,
  BAD_HANDSHAKE_METHOD,
  BAD_REQUEST,
  FORBIDDEN,
  UNSUPPORTED_PROTOCOL_VERSION
}

const ERROR_MESSAGES = new Map<ERROR_CODES, string>([
  [ERROR_CODES.UNKNOWN_TRANSPORT, "Transport unknown"],
  [ERROR_CODES.UNKNOWN_SID, "Session ID unknown"],
  [ERROR_CODES.BAD_HANDSHAKE_METHOD, "Bad handshake method"],
  [ERROR_CODES.BAD_REQUEST, "Bad request"],
  [ERROR_CODES.FORBIDDEN, "Forbidden"],
  [ERROR_CODES.UNSUPPORTED_PROTOCOL_VERSION, "Unsupported protocol version"]
]);

export class Server extends EventEmitter<
  Record<never, never>,
  Record<never, never>,
  ServerReservedEvents
> {
  public readonly opts: ServerOptions;

  private clients: Map<string, Socket> = new Map();

  constructor(opts: Partial<ServerOptions> = {}) {
    super();

    this.opts = Object.assign(
      {
        path: "/engine.io/",
        pingTimeout: 20000,
        pingInterval: 25000,
        upgradeTimeout: 10000,
        maxHttpBufferSize: 1e6
      },
      opts
    );
  }

  /**
   * Returns a request handler.
   *
   * @param additionalHandler - another handler which will receive the request if the path does not match
   */
  public handler(additionalHandler?: Handler) {
    return (
      req: Request,
      lobby: Party.FetchLobby,
      ctx: Party.ExecutionContext
    ): Response | Promise<Response> => {
      const url = new URL(req.url);
      if (url.pathname === this.opts.path) {
        return this.handleRequest(req, lobby, ctx, url);
      } else if (additionalHandler) {
        return additionalHandler(req, lobby, ctx);
      } else {
        return new Response(null, { status: 404 });
      }
    };
  }

  /**
   * Handles an HTTP request.
   *
   * @private
   */
  private async handleRequest(
    req: Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext,
    url: URL
  ): Promise<Response> {
    getLogger("engine.io").debug(`[server] handling ${req.method} ${req.url}`);

    const responseHeaders = new Headers();
    if (this.opts.cors) {
      addCorsHeaders(responseHeaders, this.opts.cors, req);

      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: responseHeaders });
      }
    }

    if (this.opts.editResponseHeaders) {
      await this.opts.editResponseHeaders(responseHeaders, req, lobby, ctx);
    }

    try {
      await this.verify(req, url);
    } catch (err) {
      const { code, context } = err as ConnectionError;
      const message = ERROR_MESSAGES.get(code)!;
      this.emitReserved("connection_error", {
        req,
        code,
        message,
        context
      });
      const body = JSON.stringify({
        code,
        message
      });
      responseHeaders.set("Content-Type", "application/json");
      return new Response(body, {
        status: 400,
        headers: responseHeaders
      });
    }

    if (this.opts.allowRequest) {
      try {
        await this.opts.allowRequest(req, lobby, ctx);
      } catch (reason) {
        this.emitReserved("connection_error", {
          req,
          code: ERROR_CODES.FORBIDDEN,
          message: ERROR_MESSAGES.get(ERROR_CODES.FORBIDDEN)!,
          context: {
            message: reason
          }
        });
        const body = JSON.stringify({
          code: ERROR_CODES.FORBIDDEN,
          message: reason
        });
        responseHeaders.set("Content-Type", "application/json");
        return new Response(body, {
          status: 403,
          headers: responseHeaders
        });
      }
    }

    const sid = url.searchParams.get("sid");
    if (sid) {
      // the client must exist since we have checked it in the verify method
      const socket = this.clients.get(sid)!;

      if (req.headers.has("upgrade")) {
        const transport = new WS(this.opts);

        const promise = transport.onRequest(req);

        socket._maybeUpgrade(transport);

        return promise;
      }

      getLogger("engine.io").debug(
        "[server] setting new request for existing socket"
      );

      return socket.transport.onRequest(req, responseHeaders);
    } else {
      return this.handshake(req, lobby, ctx, responseHeaders);
    }
  }

  /**
   * Verifies a request.
   *
   * @private
   */
  private verify(req: Request, url: URL): Promise<void> {
    const transport = url.searchParams.get("transport") || "";
    if (!TRANSPORTS.includes(transport)) {
      getLogger("engine.io").debug(`unknown transport "${transport}"`);
      return Promise.reject({
        code: ERROR_CODES.UNKNOWN_TRANSPORT,
        context: {
          transport
        }
      });
    }

    const sid = url.searchParams.get("sid");
    if (sid) {
      const client = this.clients.get(sid);
      if (!client) {
        getLogger("engine.io").debug(`[server] unknown client with sid ${sid}`);
        return Promise.reject({
          code: ERROR_CODES.UNKNOWN_SID,
          context: {
            sid
          }
        });
      }
      const previousTransport = client.transport.name;
      if (previousTransport === "websocket") {
        getLogger("engine.io").debug(
          "[server] unexpected transport without upgrade"
        );
        return Promise.reject({
          code: ERROR_CODES.BAD_REQUEST,
          context: {
            name: "TRANSPORT_MISMATCH",
            transport,
            previousTransport
          }
        });
      }
    } else {
      // handshake is GET only
      if (req.method !== "GET") {
        return Promise.reject({
          code: ERROR_CODES.BAD_HANDSHAKE_METHOD,
          context: {
            method: req.method
          }
        });
      }

      const protocol = url.searchParams.get("EIO") === "4" ? 4 : 3; // 3rd revision by default
      if (protocol === 3) {
        return Promise.reject({
          code: ERROR_CODES.UNSUPPORTED_PROTOCOL_VERSION,
          context: {
            protocol
          }
        });
      }
    }

    return Promise.resolve();
  }

  /**
   * Handshakes a new client.
   *
   * @private
   */
  private async handshake(
    req: Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext,
    responseHeaders: Headers
  ): Promise<Response> {
    const id = generateId();

    let transport: Transport;
    if (req.headers.has("upgrade")) {
      transport = new WS(this.opts);
    } else {
      transport = new Polling(this.opts);
    }

    getLogger("engine.io").info(`[server] new socket ${id}`);

    const socket = new Socket(id, this.opts, transport);
    this.clients.set(id, socket);

    socket.once("close", (reason) => {
      getLogger("engine.io").info(
        `[server] socket ${id} closed due to ${reason}`
      );
      this.clients.delete(id);
    });

    if (this.opts.editHandshakeHeaders) {
      await this.opts.editHandshakeHeaders(responseHeaders, req, lobby, ctx);
    }

    const promise = transport.onRequest(req, responseHeaders);

    this.emitReserved("connection", socket, req, lobby, ctx);

    return promise;
  }

  /**
   * Closes all clients.
   */
  public close() {
    getLogger("engine.io").debug("[server] closing all open clients");
    this.clients.forEach((client) => client.close());
  }
}
