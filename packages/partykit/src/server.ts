import type {
  DurableObjectStorage,
  ExecutionContext,
  Request,
  Response,
  WebSocket,
} from "@cloudflare/workers-types";

export type PartyKitStorage = DurableObjectStorage;

export type PartyKitContext = {
  request: Request;
};

export type PartyKitRoom = {
  id: string; // room id, usually a slug
  internalID: string; // internal id
  connections: Map<string, PartyKitConnection>;
  env: Record<string, unknown>; // use a .env file, or --var
  storage: PartyKitStorage;
  parties: Record<
    string,
    {
      get(id: string): {
        connect: () => WebSocket;
        fetch: (init: RequestInit) => Promise<Response>;
      };
    }
  >;
  broadcast: (msg: string, without?: string[] | undefined) => void;
};

export type PartyKitConnection = WebSocket & {
  id: string;
  /**
   * @deprecated
   */
  socket: WebSocket;
  unstable_initial: unknown;
};

/**
 * PartyKitServer may respond to HTTP requests in the `onRequest` callback.
 * This is available to all PartyKitServer variants.
 */
type RequestHandler = {
  onBeforeRequest?: (
    req: Request,
    room: { id: string; env: Record<string, unknown> },
    ctx: ExecutionContext
  ) => Request | Promise<Request> | Response | Promise<Response>;
  onRequest?: (
    req: Request,
    room: PartyKitRoom
  ) => Response | Promise<Response>;
  onAlarm?: (room: Omit<PartyKitRoom, "id">) => void | Promise<void>;
};

/**
 * PartyKitServer may manage its own WebSocket connections, in which case the server is kept in memory
 * between messages. This makes it easier to maintain state between messages, but scales to fewer connections.
 *
 * In this case, the server should handle messages with `ws.addEventListener` in `onConnect`, so `onMessage` is not allowed.
 */
type ConnectionHandler<Initial = unknown> = RequestHandler & {
  onConnect: (
    ws: PartyKitConnection,
    room: PartyKitRoom,
    ctx: PartyKitContext
  ) => void | Promise<void>;
  onBeforeConnect?: (
    req: Request,
    room: { id: string; env: Record<string, unknown> },
    ctx: ExecutionContext
  ) => Initial | Promise<Initial>;

  /** onMessage may not be used when onConnect is defined */
  onMessage?: never;
};

/**
 * PartyKitServer may opt into being hibernated between WebSocket messages, which enables a single
 * server to handle more connections.
 *
 * In this case, the server can not track its own connections, so onConnect is not allowed.
 */
type MessageHandler = RequestHandler & {
  onMessage: (
    message: string | ArrayBuffer,
    ws: PartyKitConnection,
    room: PartyKitRoom
  ) => void | Promise<void>;
  onClose?: (ws: WebSocket, room: PartyKitRoom) => void | Promise<void>;
  onError?: (
    ws: PartyKitConnection,
    err: Error,
    room: PartyKitRoom
  ) => void | Promise<void>;

  /** onConnect may not be used when onMessage is defined */
  onConnect?: never;
};

export type PartyKitServer<Initial = unknown> =
  | RequestHandler
  | ConnectionHandler<Initial>
  | MessageHandler;
