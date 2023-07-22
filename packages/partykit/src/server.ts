import type {
  DurableObjectStorage,
  ExecutionContext,
  Request as PartyKitRequest,
  Response as PartyKitResponse,
  WebSocket,
} from "@cloudflare/workers-types";

// Because when you construct a `new Response()` in a user script,
// it's assumed to be a standards-based Fetch API Response, unless overridden.
// This is fine by us, let user return whichever response type.
type FetchRequest = Request;
type FetchResponse = Response;
type UserDefinedRequest = FetchRequest | PartyKitRequest;
type UserDefinedResponse = FetchResponse | PartyKitResponse;

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
        fetch: (init: RequestInit) => Promise<PartyKitResponse>;
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
};

/**
 * PartyKitServer may respond to HTTP requests in the `onRequest` callback.
 * This is available to all PartyKitServer variants.
 */
type RequestHandler = {
  onBeforeRequest?: (
    req: Request,
    room: {
      id: string;
      env: Record<string, unknown>;
      parties: PartyKitRoom["parties"];
    },
    ctx: ExecutionContext
  ) =>
    | UserDefinedRequest
    | Promise<UserDefinedRequest>
    | UserDefinedResponse
    | Promise<UserDefinedResponse>;
  onRequest?: (
    req: Request,
    room: PartyKitRoom
  ) => UserDefinedResponse | Promise<UserDefinedResponse>;
  onAlarm?: (room: Omit<PartyKitRoom, "id">) => void | Promise<void>;
};

/**
 * PartyKitServer may manage its own WebSocket connections,
 * in which case the server is kept in memory between messages.
 * This makes it easier to maintain state between messages,
 * but scales to fewer connections.
 */
type ConnectionHandler = RequestHandler & {
  onConnect?: (
    ws: PartyKitConnection,
    room: PartyKitRoom,
    ctx: PartyKitContext
  ) => void | Promise<void>;
  onBeforeConnect?: (
    req: Request,
    room: {
      id: string;
      env: Record<string, unknown>;
      parties: PartyKitRoom["parties"];
    },
    ctx: ExecutionContext
  ) =>
    | UserDefinedRequest
    | Promise<UserDefinedRequest>
    | UserDefinedResponse
    | Promise<UserDefinedResponse>;
  /**
   * PartyKitServer may opt into being hibernated between WebSocket
   * messages, which enables a single server to handle more connections.
   */
  onMessage?: (
    message: string | ArrayBuffer,
    ws: PartyKitConnection,
    room: PartyKitRoom
  ) => void | Promise<void>;
  onClose?: (
    ws: PartyKitConnection,
    room: PartyKitRoom
  ) => void | Promise<void>;
  onError?: (
    ws: PartyKitConnection,
    err: Error,
    room: PartyKitRoom
  ) => void | Promise<void>;
};

export type PartyKitServer = ConnectionHandler;
