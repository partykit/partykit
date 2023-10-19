import type * as RWS from "./ws";
import ReconnectingWebSocket from "./ws";

type Maybe<T> = T | null | undefined;
type Params = Record<string, Maybe<string>>;
const valueIsNotNil = <T>(
  keyValuePair: [string, Maybe<T>]
): keyValuePair is [string, T] =>
  keyValuePair[1] !== null && keyValuePair[1] !== undefined;

export type PartySocketOptions = Omit<RWS.Options, "constructor"> & {
  id?: string; // the id of the client
  host: string; // base url for the party
  room: string; // the room to connect to
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
    query,
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
    (host.startsWith("localhost:") || host.startsWith("127.0.0.1:")
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
      ...Object.entries(query).filter(valueIsNotNil),
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
    urlProvider,
  };
}

// things that nathanboktae/robust-websocket claims are better:
// doesn't do anything in offline mode (?)
// "natively aware of error codes"
// can do custom reconnect strategies

// TODO: incorporate the above notes
export default class PartySocket extends ReconnectingWebSocket {
  _pk: string;
  _pkurl: string;
  name: string;
  room: string;
  host: string;
  path: string;

  constructor(readonly partySocketOptions: PartySocketOptions) {
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

    super(party.urlProvider, protocols, socketOptions);
    this._pk = _pk;
    this._pkurl = party.partyUrl;
    this.name = party.name;
    this.room = party.room;
    this.host = party.host;
    this.path = party.path;
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

  /**
   * Generates a PartyKit room URL with query parameters applied.
   */
  static async url(
    options: PartySocketOptions | PartyFetchOptions
  ): Promise<string> {
    const { urlProvider } = getPartyInfo(options, "http");
    return typeof urlProvider === "string" ? urlProvider : urlProvider();
  }

  /**
   * Makes a HTTP request to a PartyKit room.
   * You can use Party.Server#onRequest to handle the request:
   * https://docs.partykit.io/guides/responding-to-http-requests/
   **/
  static async fetch(
    options: PartyFetchOptions,
    init?: RequestInit
  ): Promise<Response> {
    const url = await PartySocket.url(options);
    const doFetch = options.fetch ?? fetch;
    return doFetch(url, init);
  }
}

export { ReconnectingWebSocket as WebSocket };
