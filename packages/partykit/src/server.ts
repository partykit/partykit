import type {
  AnalyticsEngineDataset,
  ExecutionContext as CFExecutionContext,
  Request as CFRequest,
  DurableObjectState,
  DurableObjectStorage,
  KVNamespace,
  R2Bucket,
  ScheduledController,
  VectorizeIndex,
  WebSocket
} from "@cloudflare/workers-types";

export type StaticAssetsManifestType = {
  devServer: string;
  browserTTL: number | null | undefined;
  edgeTTL: number | null | undefined;
  singlePageApp: boolean | undefined;
  assets: Record<string, string>;
  assetInfo?: Record<
    string,
    {
      fileSize: number;
      fileHash: string;
      fileName: string;
    }
  >;
};

type AssetFetcher = {
  fetch(path: string): Promise<Response | null>;
};

type StandardRequest = globalThis.Request;

// Types with PartyKit* prefix are used in module workers, i.e.
// `export default {} satisfies PartyKitServer;`

// Types with Party.* prefix are used in class workers, i.e.
// `export default class Room implements Party.Server {}`

// Extend type so that when language server (e.g. vscode) autocompletes,
// it will import this type instead of the underlying type directly.
export interface Request extends CFRequest {}

// Because when you construct a `new Request()` in a user script,
// it's assumed to be a standards-based Fetch API Response, unless overridden.
// This is fine by us, let user return whichever request type
type ReturnRequest = StandardRequest | CFRequest;

/** Per-party key-value storage */
export interface Storage extends DurableObjectStorage {}

/** Connection metadata only available when the connection is made */
export type ConnectionContext = { request: CFRequest };

export type Stub = {
  /** @deprecated Use `await socket()` instead */
  connect: () => WebSocket;
  socket(pathOrInit?: string | RequestInit): Promise<WebSocket>;
  socket(path: string, init?: RequestInit): Promise<WebSocket>;
  fetch(pathOrInit?: string | RequestInit | ReturnRequest): Promise<Response>;
  fetch(path: string, init?: RequestInit | ReturnRequest): Promise<Response>;
};

/** Additional information about other resources in the current project */
export type Context = {
  /** Access other parties in this project */
  parties: Record<
    string,
    {
      get(id: string): Stub;
    }
  >;
  /**
   * A binding to the Cloudflare AI service.
   */
  ai: AI;
  /**
   * A binding to the Cloudflare Vectorize service.
   */
  vectorize: Record<string, VectorizeIndex>;

  /**
   * A binding to fetch static assets
   */
  assets: AssetFetcher;

  /**
   * Custom bindings
   */
  bindings: CustomBindings;
};

export type AI = Record<string, never>;

export type FetchLobby = {
  env: Record<string, unknown>;
  ai: AI;
  parties: Context["parties"];
  vectorize: Context["vectorize"];
  analytics: AnalyticsEngineDataset;
  assets: AssetFetcher;
  bindings: CustomBindings;
};

export type CronLobby = {
  env: Record<string, unknown>;
  ai: AI;
  parties: Context["parties"];
  vectorize: Context["vectorize"];
  analytics: AnalyticsEngineDataset;
  assets: AssetFetcher;
  bindings: CustomBindings;
};

export type Lobby = {
  id: string;
  env: Record<string, unknown>;
  ai: AI;
  parties: Context["parties"];
  vectorize: Context["vectorize"];
  analytics: AnalyticsEngineDataset;
  assets: AssetFetcher;
  bindings: CustomBindings;
};

export type ExecutionContext = CFExecutionContext;

// https://stackoverflow.com/a/58993872
type ImmutablePrimitive = undefined | null | boolean | string | number;
type Immutable<T> = T extends ImmutablePrimitive
  ? T
  : T extends Array<infer U>
    ? ImmutableArray<U>
    : T extends Map<infer K, infer V>
      ? ImmutableMap<K, V>
      : T extends Set<infer M>
        ? ImmutableSet<M>
        : ImmutableObject<T>;
type ImmutableArray<T> = ReadonlyArray<Immutable<T>>;
type ImmutableMap<K, V> = ReadonlyMap<Immutable<K>, Immutable<V>>;
type ImmutableSet<T> = ReadonlySet<Immutable<T>>;
type ImmutableObject<T> = { readonly [K in keyof T]: Immutable<T[K]> };

export type ConnectionState<T> = ImmutableObject<T> | null;
export type ConnectionSetStateFn<T> = (prevState: ConnectionState<T>) => T;

/** A WebSocket connected to the Room */
export type Connection<TState = unknown> = WebSocket & {
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

  /**
   * Arbitrary state associated with this connection.
   * Read-only, use Connection.setState to update the state.
   */
  state: ConnectionState<TState>;

  setState(
    state: TState | ConnectionSetStateFn<TState> | null
  ): ConnectionState<TState>;

  /** @deprecated use Connection.setState instead */
  serializeAttachment<T = unknown>(attachment: T): void;

  /** @deprecated use Connection.state instead */
  deserializeAttachment<T = unknown>(): T | null;
};

type CustomBindings = {
  r2: Record<string, R2Bucket>;
  kv: Record<string, KVNamespace>;
};

/** Room represents a single, self-contained, long-lived session. */
export type Room = {
  /** Room ID defined in the Party URL, e.g. /parties/:name/:id */
  id: string;

  /** Internal ID assigned by the platform. Use Party.id instead. */
  internalID: string;

  /** Party name defined in the Party URL, e.g. /parties/:name/:id */
  name: string;

  /** Environment variables (--var, partykit.json#vars, or .env) */
  env: Record<string, unknown>;

  /** A per-room key-value storage */
  storage: Storage;

  /** `blockConcurrencyWhile()` ensures no requests are delivered until */
  blockConcurrencyWhile: DurableObjectState["blockConcurrencyWhile"];

  /** Additional information about other resources in the current project */
  context: Context;

  /** @deprecated Use `room.getConnections` instead */
  connections: Map<string, Connection>;

  /** @deprecated Use `room.context.parties` instead */
  parties: Context["parties"];

  /** Send a message to all connected clients, except connection ids listed `without` */
  broadcast: (
    msg: string | ArrayBuffer | ArrayBufferView,
    without?: string[] | undefined
  ) => void;

  /** Get a connection by connection id */
  getConnection<TState = unknown>(id: string): Connection<TState> | undefined;

  /**
   * Get all connections. Optionally, you can provide a tag to filter returned connections.
   * Use `Party.Server#getConnectionTags` to tag the connection on connect.
   */
  getConnections<TState = unknown>(tag?: string): Iterable<Connection<TState>>;

  /**
   * Cloudflare Analytics Engine dataset. Use this to log custom events and metrics.
   */
  analytics: AnalyticsEngineDataset;
};

/** @deprecated Use `Party.Room` instead */
export type Party = Room;

/* Party.Server defines what happens when someone connects to and sends messages or HTTP requests to your party
 *
 * @example
 * export default class Room implements Party.Server {
 *   constructor(readonly room: Party) {}
 *   onConnect(connection: Party.Connection) {
 *     this.room.broadcast("Someone connected with id " + connection.id);
 *   }
 * }
 */
export type Server = {
  /**
   * You can define an `options` field to customise the Party.Server behaviour.
   */
  readonly options?: ServerOptions;

  /**
   * You can tag a connection to filter them in Party#getConnections.
   * Each connection supports up to 9 tags, each tag max length is 256 characters.
   */
  getConnectionTags?(
    connection: Connection,
    context: ConnectionContext
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
    connection: Connection,
    ctx: ConnectionContext
  ): void | Promise<void>;

  /**
   * Called when a WebSocket connection receives a message from a client, or another connected party.
   */
  onMessage?(
    message: string | ArrayBuffer | ArrayBufferView,
    sender: Connection
  ): void | Promise<void>;

  /**
   * Called when a WebSocket connection is closed by the client.
   */
  onClose?(connection: Connection): void | Promise<void>;

  /**
   * Called when a WebSocket connection is closed due to a connection error.
   */
  onError?(connection: Connection, error: Error): void | Promise<void>;

  /**
   * Called when a HTTP request is made to the room URL.
   */
  onRequest?(req: Request): Response | Promise<Response>;

  /**
   * Called when an alarm is triggered. Use Party.storage.setAlarm to set an alarm.
   *
   * Alarms have access to most Party resources such as storage, but not Party.id
   * and Party.context.parties properties. Attempting to access them will result in a
   * runtime error.
   */
  onAlarm?(): void | Promise<void>;
};

export type FetchSocket = WebSocket & {
  request: Request;
};

export type Cron = ScheduledController & {
  name: string;
};

type ServerConstructor = {
  new (room: Room): Server;
};

/**
 * Party.Worker allows you to customise the behaviour of the Edge worker that routes
 * connections to your party.
 *
 * The Party.Worker methods can be defined as static methods on the Party.Server constructor.
 * @example
 * export default class Room implements Party.Server {
 *   static onBeforeConnect(req: Party.Request) {
 *     return new Response("Access denied", { status: 403 })
 *   }
 *   constructor(readonly room: Room) {}
 * }
 *
 * Room satisfies Party.Worker;
 */

export type Worker = ServerConstructor & {
  /**
   * Runs on any HTTP request that does not match a Party URL or a static asset.
   * Useful for running lightweight HTTP endpoints that don't need access to the Party
   * state.
   **/
  onFetch?(
    req: Request,
    lobby: FetchLobby,
    ctx: ExecutionContext
  ): Response | undefined | null | Promise<Response | null | undefined>;

  /**
   * Runs on any WebSocket connection that does not match a Party URL or a static asset.
   * Useful for running lightweight WebSocket endpoints that don't need access to the Party
   * state.
   */
  onSocket?(
    socket: FetchSocket,
    lobby: FetchLobby,
    ctx: ExecutionContext
  ): void | Promise<void>;

  /**
   * Runs before any HTTP request is made to the party. You can modify the request
   * before it is forwarded to the party, or return a Response to short-circuit it.
   */
  onBeforeRequest?(
    req: Request,
    lobby: Lobby,
    ctx: ExecutionContext
  ): Request | Response | Promise<Request | Response>;

  /**
   * Runs before any WebSocket connection is made to the party. You can modify the request
   * before opening a connection, or return a Response to prevent the connection.
   */
  onBeforeConnect?(
    req: Request,
    lobby: Lobby,
    ctx: ExecutionContext
  ): Request | Response | Promise<Request | Response>;

  /**
   * Runs on a schedule. You can use this to perform periodic tasks, such as
   * sending a heartbeat to a third-party service.
   */
  onCron?(
    controller: Cron,
    lobby: CronLobby,
    ctx: ExecutionContext
  ): Response | Promise<Response>;
};

/**
 * PartyKitServer is allows you to customise the behaviour of your Party.
 *
 * @note If you're starting a new project, we recommend using the newer
 * Party.Server API instead.
 *
 * @example
 * export default {
 *   onConnect(connection, room) {
 *     room.broadcast("Someone connected with id " + connection.id);
 *   }
 * }
 */
export type PartyKitServer = {
  /** @deprecated Use `onFetch` instead */
  unstable_onFetch?: (
    req: Request,
    lobby: FetchLobby,
    ctx: ExecutionContext
  ) => Response | null | undefined | Promise<Response | null | undefined>;
  onFetch?: (
    req: Request,
    lobby: FetchLobby,
    ctx: ExecutionContext
  ) => Response | null | undefined | Promise<Response | null | undefined>;
  onSocket?(
    socket: FetchSocket,
    lobby: FetchLobby,
    ctx: ExecutionContext
  ): void | Promise<void>;
  onBeforeRequest?: (
    req: Request,
    lobby: Lobby,
    ctx: ExecutionContext
  ) => ReturnRequest | Response | Promise<ReturnRequest | Response>;

  onCron?: (
    controller: Cron,
    lobby: CronLobby,
    ctx: ExecutionContext
  ) => void | Promise<void>;

  onRequest?: (req: Request, room: Room) => Response | Promise<Response>;
  onAlarm?: (room: Omit<Room, "id" | "parties">) => void | Promise<void>;
  onConnect?: (
    connection: Connection,
    room: Room,
    ctx: ConnectionContext
  ) => void | Promise<void>;
  onBeforeConnect?: (
    req: Request,
    lobby: Lobby,
    ctx: ExecutionContext
  ) => ReturnRequest | Response | Promise<ReturnRequest | Response>;

  /**
   * PartyKitServer may opt into being hibernated between WebSocket
   * messages, which enables a single server to handle more connections.
   */
  onMessage?: (
    message: string | ArrayBuffer | ArrayBufferView,
    connection: Connection,
    room: Room
  ) => void | Promise<void>;
  onClose?: (connection: Connection, room: Room) => void | Promise<void>;
  onError?: (
    connection: Connection,
    err: Error,
    room: Room
  ) => void | Promise<void>;
};

export type ServerOptions = {
  /**
   * Whether the PartyKit platform should remove the server from memory
   * between HTTP requests and WebSocket messages.
   *
   * The default value is `false`.
   */
  hibernate?: boolean;
};

//
// ---
// DEPRECATIONS
// ---
//

/** @deprecated Use Party.Request instead */
export type PartyRequest = Request;

/** @deprecated Use Party.Storage instead */
export type PartyStorage = Storage;

/** @deprecated Use Party.Storage instead */
export type PartyKitStorage = Storage;

/** @deprecated Use Party.ConnectionContext instead */
export type PartyConnectionContext = ConnectionContext;

/** @deprecated Use Party.ConnectionContext instead */
export type PartyKitContext = ConnectionContext;

/** @deprecated Use Party.Stub instead */
export type PartyStub = Stub;

/** Additional information about other resources in the current project */
/** @deprecated Use Party.Context instead */
export type PartyContext = Context;

/** @deprecated Use Party.FetchLobby instead */
export type PartyFetchLobby = FetchLobby;

/** @deprecated Use Party.Lobby instead */
export type PartyLobby = Lobby;

/** @deprecated Use Party.ExecutionContext instead */
export type PartyExecutionContext = ExecutionContext;

/** @deprecated Use Party.Connection instead */
export type PartyConnection = Connection;

/** @deprecated Use Party.Server instead */
export type PartyServer = Server;

/** @deprecated Use Party.Worker instead */
export type PartyWorker = Worker;

/** @deprecated Use `Room` instead */
export type PartyKitRoom = Room;

/** @deprecated Use `Party.Connection` instead */
export type PartyKitConnection = Connection;

/** @deprecated Use `Party.ServerOptions` instead */
export type PartyServerOptions = ServerOptions;
