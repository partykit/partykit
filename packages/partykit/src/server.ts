import type {
  DurableObjectStorage,
  ExecutionContext as CFExecutionContext,
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
  connect: () => WebSocket;
  fetch: (init?: RequestInit) => Promise<Response>;
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
};

export type FetchLobby = {
  env: Record<string, unknown>;
  parties: Context["parties"];
};

export type Lobby = {
  id: string;
  env: Record<string, unknown>;
  parties: Context["parties"];
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

export type ConnectionState<T> = ImmutableObject<T>;
export type ConnectionSetStateFn<T> = (
  prevState: ConnectionState<T> | null
) => T;

/** A WebSocket connected to the Party */
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
  state: ConnectionState<TState> | null;

  setState(
    state: TState | ConnectionSetStateFn<TState>
  ): ConnectionState<TState>;

  /** @deprecated use Connection.setState instead */
  serializeAttachment<T = unknown>(attachment: T): void;

  /** @deprecated use Connection.state instead */
  deserializeAttachment<T = unknown>(): T | null;
};

/** Party represents a single, self-contained, long-lived session. */
export type Party = {
  /** Party ID defined in the Party URL, e.g. /parties/:name/:id */
  id: string;

  /** Internal ID assigned by the platform. Use Party.id instead. */
  internalID: string;

  /** Party name defined in the Party URL, e.g. /parties/:name/:id */
  name: string;

  /** Environment variables (--var, partykit.json#vars, or .env) */
  env: Record<string, unknown>;

  /** A per-party key-value storage */
  storage: Storage;

  /** Additional information about other resources in the current project */
  context: Context;

  /** @deprecated Use `party.getConnections` instead */
  connections: Map<string, Connection>;

  /** @deprecated Use `party.context.parties` instead */
  parties: Context["parties"];

  /** Send a message to all connected clients, except connection ids listed `without` */
  broadcast: (msg: string, without?: string[] | undefined) => void;

  /** Get a connection by connection id */
  getConnection<TState = unknown>(id: string): Connection<TState> | undefined;

  /**
   * Get all connections. Optionally, you can provide a tag to filter returned connections.
   * Use `Party.Server#getConnectionTags` to tag the connection on connect.
   */
  getConnections<TState = unknown>(tag?: string): Iterable<Connection<TState>>;
};

/* Party.Server defines what happens when someone connects to and sends messages or HTTP requests to your party
 *
 * @example
 * export default class Room implements Party.Server {
 *   constructor(readonly party: Party) {}
 *   onConnect(connection: Party.Connection) {
 *     this.party.broadcast("Someone connected with id " + connection.id);
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
    message: string | ArrayBuffer,
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
   * Called when a HTTP request is made to the party URL.
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

type ServerConstructor = {
  new (party: Party): Server;
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
 *   constructor(readonly party: Party) {}
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
  ): Response | Promise<Response>;

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
  /** @deprecated. Use `onFetch` instead */
  unstable_onFetch?: (
    req: Request,
    lobby: FetchLobby,
    ctx: ExecutionContext
  ) => Response | Promise<Response>;
  onFetch?: (
    req: Request,
    lobby: FetchLobby,
    ctx: ExecutionContext
  ) => Response | Promise<Response>;
  onBeforeRequest?: (
    req: Request,
    party: {
      id: string;
      env: Record<string, unknown>;
      parties: Context["parties"];
    },
    ctx: ExecutionContext
  ) => ReturnRequest | Response | Promise<ReturnRequest | Response>;

  onRequest?: (req: Request, party: Party) => Response | Promise<Response>;
  onAlarm?: (party: Omit<Party, "id" | "parties">) => void | Promise<void>;
  onConnect?: (
    connection: Connection,
    party: Party,
    ctx: ConnectionContext
  ) => void | Promise<void>;
  onBeforeConnect?: (
    req: Request,
    party: {
      id: string;
      env: Record<string, unknown>;
      parties: Context["parties"];
    },
    ctx: ExecutionContext
  ) => ReturnRequest | Response | Promise<ReturnRequest | Response>;

  /**
   * PartyKitServer may opt into being hibernated between WebSocket
   * messages, which enables a single server to handle more connections.
   */
  onMessage?: (
    message: string | ArrayBuffer,
    connection: Connection,
    party: Party
  ) => void | Promise<void>;
  onClose?: (connection: Connection, party: Party) => void | Promise<void>;
  onError?: (
    connection: Connection,
    err: Error,
    party: Party
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

/** @deprecated use Party.Request instead */
export type PartyRequest = Request;

/** @deprecated use Party.Storage instead */
export type PartyStorage = Storage;

/** @deprecated use Party.Storage instead */
export type PartyKitStorage = Storage;

/** @deprecated use Party.ConnectionContext instead */
export type PartyConnectionContext = ConnectionContext;

/** @deprecated use Party.ConnectionContext instead */
export type PartyKitContext = ConnectionContext;

/** @deprecated use Party.Stub instead */
export type PartyStub = Stub;

/** Additional information about other resources in the current project */
/** @deprecated use Party.Context instead */
export type PartyContext = Context;

/** @deprecated use Party.FetchLobby instead */
export type PartyFetchLobby = FetchLobby;

/** @deprecated use Party.Lobby instead */
export type PartyLobby = Lobby;

/** @deprecated use Party.ExecutionContext instead */
export type PartyExecutionContext = ExecutionContext;

/** @deprecated use Party.Connection instead */
export type PartyConnection = Connection;

/** @deprecated use Party.Server instead */
export type PartyServer = Server;

/** @deprecated use Party.Worker instead */
export type PartyWorker = Worker;

/** @deprecated Use `Party` instead */
export type PartyKitRoom = Party;

/** @deprecated Use `Party.Connection` instead */
export type PartyKitConnection = Connection;

/** @deprecated Use `Party.ServerOptions` instead */
export type PartyServerOptions = ServerOptions;
