import type {
  DurableObjectStorage,
  ExecutionContext,
  WebSocket,
  CFRequest,
} from "@cloudflare/workers-types";
// Because when you construct a `new Response()` in a user script,
// it's assumed to be a standards-based Fetch API Response, unless overridden.
// This is fine by us, let user return whichever response type.
// export type Response = Response;

export interface PartyRequest extends CFRequest {}

export type PartyKitStorage = DurableObjectStorage;

export type PartyKitContext = {
  request: PartyRequest;
};

export type PartyStub = {
  get(id: string): {
    connect: () => WebSocket;
    fetch: (init: RequestInit) => Promise<Response>;
  };
};

export type PartyContext = {
  parties: Record<string, PartyStub>;
};

export type PartyKitRoom = {
  id: string; // room id, usually a slug
  internalID: string; // internal id
  connections: Map<string, PartyKitConnection>;
  env: Record<string, unknown>; // use a .env file, or --var
  storage: PartyKitStorage;
  /** @deprecated Use `room.context.parties` instead */
  parties: Record<string, PartyStub>;
  context: {
    // replaces room.parties
    parties: Record<string, PartyStub>;
  };
  broadcast: (msg: string, without?: string[] | undefined) => void;
};

export type PartyKitConnection = WebSocket & {
  id: string;
  /**
   * @deprecated
   */
  socket: WebSocket;
  // We would have been able to use Websocket::url
  // but it's not available in the Workers runtime
  // (rather, url is `null` when using WebSocketPair)
  // It's also set as readonly, so we can't set it ourselves.
  // Instead, we'll use the `uri` property.
  uri: string;
};

/**
 * PartyKitServer may respond to HTTP requests in the `onRequest` callback.
 * This is available to all PartyKitServer variants.
 */
type RequestHandler = {
  unstable_onFetch?: (
    req: PartyRequest,
    lobby: {
      env: Record<string, unknown>;
      parties: PartyKitRoom["parties"];
    },
    ctx: ExecutionContext
  ) => Response | Promise<Response>;
  onBeforeRequest?: (
    req: PartyRequest,
    room: {
      id: string;
      env: Record<string, unknown>;
      parties: PartyKitRoom["parties"];
    },
    ctx: ExecutionContext
  ) => PartyRequest | Promise<PartyRequest> | Response | Promise<Response>;
  onRequest?: (
    req: PartyRequest,
    room: PartyKitRoom
  ) => Response | Promise<Response>;
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
    req: PartyRequest,
    room: {
      id: string;
      env: Record<string, unknown>;
      parties: PartyKitRoom["parties"];
    },
    ctx: ExecutionContext
  ) => PartyRequest | Promise<PartyRequest> | Response | Promise<Response>;
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

// New Class API
// --------------------------------------------

export type Party = Omit<PartyKitRoom, "parties"> & {
  context: PartyContext;
};
export type PartyConnection = PartyKitConnection;
export type PartyServerOptions = {
  hibernate?: boolean;
};

// PartyKitServer is now called PartyServer
export interface PartyServer {
  readonly party: Party;
  readonly options?: PartyServerOptions;

  onStart?(): void | Promise<void>;
  onConnect?(ws: PartyConnection, ctx: PartyKitContext): void | Promise<void>;
  onMessage?(
    message: string | ArrayBuffer,
    ws: PartyConnection
  ): void | Promise<void>;
  onClose?(ws: PartyConnection): void | Promise<void>;
  onError?(ws: PartyConnection, err: Error): void | Promise<void>;
  onRequest?(req: PartyRequest): Response | Promise<Response>;

  // TODO: does this belong on the static side?
  onAlarm?(room: Omit<PartyKitRoom, "id">): void | Promise<void>;
}

// PartyServer class definition has static methods
export type PartyServerConstructor = {
  new (party: Party): PartyServer;
  unstable_onFetch?(
    req: PartyRequest,
    lobby: {
      env: Record<string, unknown>;
      parties: Party["context"]["parties"];
    },
    ctx: ExecutionContext
  ): Response | Promise<Response>;
  onBeforeRequest?(
    req: PartyRequest,
    room: {
      id: string;
      env: Record<string, unknown>;
      parties: Party["context"]["parties"];
    },
    ctx: ExecutionContext
  ): PartyRequest | Promise<PartyRequest> | Response | Promise<Response>;

  onBeforeConnect?(
    req: PartyRequest,
    room: {
      id: string;
      env: Record<string, unknown>;
      parties: PartyKitRoom["parties"];
    },
    ctx: ExecutionContext
  ): PartyRequest | Promise<PartyRequest> | Response | Promise<Response>;
};

export type StaticAssetsManifestType = {
  devServer: string;
  browserTTL: number | undefined;
  edgeTTL: number | undefined;
  serveSinglePageApp: boolean | undefined;
  assets: Record<string, string>;
};
