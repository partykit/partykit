import ReconnectingWebSocket from "./ws";

import type * as RWS from "./ws";

type Maybe<T> = T | null | undefined;
type Params = Record<string, Maybe<string>>;
const valueIsNotNil = <T>(
  keyValuePair: [string, Maybe<T>]
): keyValuePair is [string, T] =>
  keyValuePair[1] !== null && keyValuePair[1] !== undefined;

export type PartySocketOptions = Omit<RWS.Options, "constructor"> & {
  id?: string; // the id of the client
  host: string; // base url for the party
  room?: string; // the room to connect to
  party?: string; // the party to connect to (defaults to main)
  protocol?: "ws" | "wss";
  protocols?: string[];
  path?: string; // the path to connect to
  query?: Params | (() => Params | Promise<Params>);
  // headers
};

export type PartyFetchOptions = {
  host: string; // base url for the party
  room: string; // the room to connect to
  party?: string; // the party to fetch from (defaults to main)
  path?: string; // the path to fetch from
  protocol?: "http" | "https";
  query?: Params | (() => Params | Promise<Params>);
  fetch?: typeof fetch;
};

function generateUUID(): string {
  // Public Domain/MIT
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  let d = new Date().getTime(); //Timestamp
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getPartyInfo(
  partySocketOptions: PartySocketOptions | PartyFetchOptions,
  defaultProtocol: "http" | "ws",
  defaultParams: Record<string, string> = {}
) {
  const {
    host: rawHost,
    path: rawPath,
    protocol: rawProtocol,
    room,
    party,
    query
  } = partySocketOptions;

  // strip the protocol from the beginning of `host` if any
  let host = rawHost.replace(/^(http|https|ws|wss):\/\//, "");
  // if user provided a trailing slash, remove it
  if (host.endsWith("/")) {
    host = host.slice(0, -1);
  }

  if (rawPath && rawPath.startsWith("/")) {
    throw new Error("path must not start with a slash");
  }

  const name = party ?? "main";
  const path = rawPath ? `/${rawPath}` : "";
  const protocol =
    rawProtocol ||
    (host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1:") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    (host.startsWith("172.") &&
      host.split(".")[1] >= "16" &&
      host.split(".")[1] <= "31") ||
    host.startsWith("[::ffff:7f00:1]:")
      ? // http / ws
        defaultProtocol
      : // https / wss
        defaultProtocol + "s");

  const baseUrl = `${protocol}://${host}/${
    party ? `parties/${party}` : "party"
  }/${room}${path}`;

  const makeUrl = (query: Params = {}) =>
    `${baseUrl}?${new URLSearchParams([
      ...Object.entries(defaultParams),
      ...Object.entries(query).filter(valueIsNotNil)
    ])}`;

  // allow urls to be defined as functions
  const urlProvider =
    typeof query === "function"
      ? async () => makeUrl(await query())
      : makeUrl(query);

  return {
    host,
    path,
    room,
    name,
    protocol,
    partyUrl: baseUrl,
    urlProvider
  };
}

// things that nathanboktae/robust-websocket claims are better:
// doesn't do anything in offline mode (?)
// "natively aware of error codes"
// can do custom reconnect strategies

// TODO: incorporate the above notes
export default class PartySocket extends ReconnectingWebSocket {
  _pk!: string;
  _pkurl!: string;
  name!: string;
  room?: string;
  host!: string;
  path!: string;

  constructor(readonly partySocketOptions: PartySocketOptions) {
    const wsOptions = getWSOptions(partySocketOptions);

    super(wsOptions.urlProvider, wsOptions.protocols, wsOptions.socketOptions);

    this.setWSProperties(wsOptions);
  }

  public updateProperties(partySocketOptions: Partial<PartySocketOptions>) {
    const wsOptions = getWSOptions({
      ...this.partySocketOptions,
      ...partySocketOptions,
      host: partySocketOptions.host ?? this.host,
      room: partySocketOptions.room ?? this.room,
      path: partySocketOptions.path ?? this.path
    });

    this._url = wsOptions.urlProvider;
    this._protocols = wsOptions.protocols;
    this._options = wsOptions.socketOptions;

    this.setWSProperties(wsOptions);
  }

  private setWSProperties(wsOptions: ReturnType<typeof getWSOptions>) {
    const { _pk, _pkurl, name, room, host, path } = wsOptions;

    this._pk = _pk;
    this._pkurl = _pkurl;
    this.name = name;
    this.room = room;
    this.host = host;
    this.path = path;
  }

  public reconnect(
    code?: number | undefined,
    reason?: string | undefined
  ): void {
    if (!this.room || !this.host) {
      throw new Error(
        "The room and host must be set before connecting, use `updateProperties` method to set them or pass them to the constructor."
      );
    }
    super.reconnect(code, reason);
  }

  get id() {
    return this._pk;
  }

  /**
   * Exposes the static PartyKit room URL without applying query parameters.
   * To access the currently connected WebSocket url, use PartySocket#url.
   */
  get roomUrl(): string {
    return this._pkurl;
  }

  // a `fetch` method that uses (almost) the same options as `PartySocket`
  static async fetch(
    options: PartyFetchOptions,
    init?: RequestInit
  ): Promise<Response> {
    const party = getPartyInfo(options, "http");
    const url =
      typeof party.urlProvider === "string"
        ? party.urlProvider
        : await party.urlProvider();
    const doFetch = options.fetch ?? fetch;
    return doFetch(url, init);
  }
}

export { PartySocket };

export { ReconnectingWebSocket as WebSocket };

function getWSOptions(partySocketOptions: PartySocketOptions) {
  const {
    id,
    host: _host,
    path: _path,
    party: _party,
    room: _room,
    protocol: _protocol,
    query: _query,
    protocols,
    ...socketOptions
  } = partySocketOptions;

  const _pk = id || generateUUID();
  const party = getPartyInfo(partySocketOptions, "ws", { _pk });

  return {
    _pk: _pk,
    _pkurl: party.partyUrl,
    name: party.name,
    room: party.room,
    host: party.host,
    path: party.path,
    protocols: protocols,
    socketOptions: socketOptions,
    urlProvider: party.urlProvider
  };
}
