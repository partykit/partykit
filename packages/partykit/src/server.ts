import type {
  DurableObjectStorage,
  ExecutionContext,
  WebSocket,
  Request as CFRequest,
} from "@cloudflare/workers-types";

export type StaticAssetsManifestType = {
  devServer: string;
  browserTTL: number | undefined;
  edgeTTL: number | undefined;
  singlePageApp: boolean | undefined;
  assets: Record<string, string>;
};

// Types with PartyKit* prefix are used in module workers, i.e.
// `export default {} satisfies PartyKitServer;`

// Types with Party* prefix are used in class workers, i.e.
// `export default class Room implements PartyServer {}`

// Extend type so that when language server (e.g. vscode) autocompletes,
// it will import this type instead of the underlying type directly.
export interface PartyRequest extends CFRequest {}

// Because when you construct a `new Request()` in a user script,
// it's assumed to be a standards-based Fetch API Response, unless overridden.
// This is fine by us, let user return whichever request type
type ReturnRequest = Request | PartyRequest;

/** Per-party key-value storage */
export interface PartyStorage extends DurableObjectStorage {}

/** @deprecated use PartyStorage instead */
export type PartyKitStorage = PartyStorage;

/** Connection metadata only available when the connection is made */
export type PartyConnectionContext = { request: PartyRequest };

/** @deprecated use PartyConnectionContext instead */
export type PartyKitContext = PartyConnectionContext;

export type PartyStub = {
  connect: () => WebSocket;
  fetch: (init: RequestInit) => Promise<Response>;
};

/** Additional information about other resources in the current project */
export type PartyContext = {
  /** Access other parties in this project */
  parties: Record<
    string,
    {
      get(id: string): PartyStub;
    }
  >;
};

export type PartyFetchLobby = {
  env: Record<string, unknown>;
  parties: PartyContext["parties"];
};

export type PartyLobby = {
  id: string;
  env: Record<string, unknown>;
  parties: PartyContext["parties"];
};

export type PartyExecutionContext = ExecutionContext;

/** A WebSocket connected to the Party */
export type PartyConnection = WebSocket & {
  /** Connection identifier */
  id: string;

  /** @deprecated You can access the socket properties directly on the connection*/
  socket: WebSocket;
  // We would have been able to use Websocket::url
  // but it's not available in the Workers runtime
  // (rather, url is `null` when using WebSocketPair)
  // It's also set as readonly, so we can't set it ourselves.
  // Instead, we'll use the `uri` property.
  uri: string;
};

/** Party represents a single, self-contained, long-lived session. */
export type Party = {
  /** Party ID defined in the Party URL, e.g. /parties/:name/:id */
  id: string;

  /** Internal ID assigned by the platform. Use Party.id instead. */
  internalID: string;

  /** Environment variables (--var, partykit.json#vars, or .env) */
  env: Record<string, unknown>;

  /** A per-party key-value storage */
  storage: PartyStorage;

  /** Additional information about other resources in the current project */
  context: PartyContext;

  /** @deprecated Use `party.getConnections` instead */
  connections: Map<string, PartyConnection>;

  /** @deprecated Use `party.context.parties` instead */
  parties: PartyContext["parties"];

  /** Send a message to all connected clients, except connection ids listed `without` */
  broadcast: (msg: string, without?: string[] | undefined) => void;

  /** Get a connection by connection id */
  getConnection(id: string): PartyConnection | undefined;

  /**
   * Get all connections. Optionally, you can provide a tag to filter returned connections.
   * Use `PartyServer#getConnectionTags` to tag the connection on connect.
   */
  getConnections(tag?: string): Iterable<PartyConnection>;
};

/**
 * PartyServer defines what happens when someone connects to and sends messages or HTTP requests to your party
 *
 * @example
 * export default class Room implements PartyServer {
 *   constructor(readonly party: Party) {}
 *   onConnect(connection: PartyConnection) {
 *     this.party.broadcast("Someone connected with id " + connection.id);
 *   }
 * }
 */
export interface PartyServer {
  // readonly party: Party;

  /**
   * You can define an `options` field to customise the PartyServer behaviour.
   */
  readonly options?: PartyServerOptions;

  /**
   * You can tag a connection to filter them in Party#getConnections.
   * Each connection supports up to 9 tags, each tag max length is 256 characters.
   */
  getConnectionTags?(
    connection: PartyConnection,
    context: PartyConnectionContext
  ): string[] | Promise<string[]>;

  /**
   * Called when the server is started, before first `onConnect` or `onRequest`.
   * Useful for loading data from storage.
   *
   * You can use this to load data from storage and perform other asynchronous
   * initialization, such as retrieving data or configuration from other
   * services or databases.
   */
  onStart?(): void | Promise<void>;

  /**
   * Called when a new incoming WebSocket connection is opened.
   */
  onConnect?(
    connection: PartyConnection,
    ctx: PartyConnectionContext
  ): void | Promise<void>;

  /**
   * Called when a WebSocket connection receives a message from a client, or another connected party.
   */
  onMessage?(
    message: string | ArrayBuffer,
    sender: PartyConnection
  ): void | Promise<void>;

  /**
   * Called when a WebSocket connection is closed by the client.
   */
  onClose?(connection: PartyConnection): void | Promise<void>;

  /**
   * Called when a WebSocket connection is closed due to a connection error.
   */
  onError?(connection: PartyConnection, error: Error): void | Promise<void>;

  /**
   * Called when a HTTP request is made to the party URL.
   */
  onRequest?(req: PartyRequest): Response | Promise<Response>;

  /**
   * Called when an alarm is triggered. Use Party.storage.setAlarm to set an alarm.
   *
   * Alarms have access to most Party resources such as storage, but not Party.id
   * and Party.context.parties properties. Attempting to access them will result in a
   * runtime error.
   */
  onAlarm?(): void | Promise<void>;
}

type PartyServerConstructor = {
  new (party: Party): PartyServer;
};

/**
 * PartyWorker allows you to customise the behaviour of the Edge worker that routes
 * connections to your party.
 *
 * The PartyWorker methods can be defined as static methods on the PartyServer constructor.
 * @example
 * export default class Room implements PartyServer {
 *   static onBeforeConnect(req: PartyRequest) {
 *     return new Response("Access denied", { status: 403 })
 *   }
 *   constructor(readonly party: Party) {}
 * }
 *
 * Room satisfies PartyWorker;
 */
export type PartyWorker = PartyServerConstructor & {
  /**
   * Runs on any HTTP request that does not match a Party URL or a static asset.
   * Useful for running lightweight HTTP endpoints that don't need access to the Party
   * state.
   **/
  onFetch?(
    req: PartyRequest,
    lobby: PartyFetchLobby,
    ctx: PartyExecutionContext
  ): Response | Promise<Response>;

  /**
   * Runs before any HTTP request is made to the party. You can modify the request
   * before it is forwarded to the party, or return a Response to short-circuit it.
   */
  onBeforeRequest?(
    req: PartyRequest,
    lobby: PartyLobby,
    ctx: PartyExecutionContext
  ): PartyRequest | Response | Promise<PartyRequest | Response>;

  /**
   * Runs before any WebSocket connection is made to the party. You can modify the request
   * before opening a connection, or return a Response to prevent the connection.
   */
  onBeforeConnect?(
    req: PartyRequest,
    lobby: PartyLobby,
    ctx: PartyExecutionContext
  ): PartyRequest | Response | Promise<PartyRequest | Response>;
};

/**
 * PartyKitServer is allows you to customise the behaviour of your Party.
 *
 * @note If you're starting a new project, we recommend using the newer
 * PartyServer API instead.
 *
 * @example
 * export default {
 *   onConnect(connection, room) {
 *     room.broadcast("Someone connected with id " + connection.id);
 *   }
 * }
 */
export type PartyKitServer = {
  /** @deprecated. Use `onFetch` instead */
  unstable_onFetch?: (
    req: PartyRequest,
    lobby: PartyFetchLobby,
    ctx: PartyExecutionContext
  ) => Response | Promise<Response>;
  onFetch?: (
    req: PartyRequest,
    lobby: PartyFetchLobby,
    ctx: PartyExecutionContext
  ) => Response | Promise<Response>;
  onBeforeRequest?: (
    req: PartyRequest,
    party: {
      id: string;
      env: Record<string, unknown>;
      parties: PartyContext["parties"];
    },
    ctx: PartyExecutionContext
  ) => ReturnRequest | Response | Promise<ReturnRequest | Response>;

  onRequest?: (req: PartyRequest, party: Party) => Response | Promise<Response>;
  onAlarm?: (party: Omit<Party, "id" | "parties">) => void | Promise<void>;
  onConnect?: (
    connection: PartyConnection,
    party: Party,
    ctx: PartyConnectionContext
  ) => void | Promise<void>;
  onBeforeConnect?: (
    req: PartyRequest,
    party: {
      id: string;
      env: Record<string, unknown>;
      parties: PartyContext["parties"];
    },
    ctx: PartyExecutionContext
  ) => ReturnRequest | Response | Promise<ReturnRequest | Response>;

  /**
   * PartyKitServer may opt into being hibernated between WebSocket
   * messages, which enables a single server to handle more connections.
   */
  onMessage?: (
    message: string | ArrayBuffer,
    connection: PartyConnection,
    party: Party
  ) => void | Promise<void>;
  onClose?: (connection: PartyConnection, party: Party) => void | Promise<void>;
  onError?: (
    connection: PartyConnection,
    err: Error,
    party: Party
  ) => void | Promise<void>;
};

/** @deprecated Use `Party` instead */
export type PartyKitRoom = Party;

/** @deprecated Use `PartyConnection` instead */
export type PartyKitConnection = PartyConnection;

export type PartyServerOptions = {
  /**
   * Whether the PartyKit platform should remove the server from memory
   * between HTTP requests and WebSocket messages.
   *
   * The default value is `false`.
   */
  hibernate?: boolean;
};
