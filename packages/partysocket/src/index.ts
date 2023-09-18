import type * as RWS from "./ws";
import ReconnectingWebSocket from "./ws";

export type PartySocketOptions = Omit<RWS.Options, "constructor"> & {
  id?: string; // the id of the client
  host: string; // base url for the party
  room: string; // the room to connect to
  party?: string; // the party to connect to (defaults to main)
  protocol?: string;
  protocols?: string[];
  query?: Record<string, string>;
  // headers
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

// things that nathanboktae/robust-websocket claims are better:
// doesn't do anything in offline mode (?)
// "natively aware of error codes"
// can do custom reconnect strategies

// extremely basic for now but we'll add more options later
// TODO: incorporate the above notes
export default class PartySocket extends ReconnectingWebSocket {
  _pk: string;
  _pkurl: string;
  name: string;
  room: string;
  host: string;

  constructor(readonly partySocketOptions: PartySocketOptions) {
    const {
      host: rawHost,
      room,
      party,
      protocol,
      query,
      protocols,
      ...socketOptions
    } = partySocketOptions;
    const _pk = partySocketOptions.id || generateUUID();

    // strip the protocol from the beginning of `host` if any
    const host = rawHost.replace(/^(http|https|ws|wss):\/\//, "");

    let url = `${
      protocol ||
      (host.startsWith("localhost:") || host.startsWith("127.0.0.1:")
        ? "ws"
        : "wss")
    }://${host}/${party ? `parties/${party}` : "party"}/${room}`;
    if (query) {
      url += `?${new URLSearchParams({ ...query, _pk }).toString()}`;
    } else {
      url += `?_pk=${_pk}`;
    }

    super(url, protocols, socketOptions);
    this._pk = _pk;
    this._pkurl = url;

    this.name = party ?? "main";
    this.room = room;
    this.host = host;
  }
  get id() {
    return this._pk;
  }

  // partysocket has a static url, so we can just return that
  get url(): string {
    return this._pkurl;
  }
}

export { ReconnectingWebSocket as WebSocket };
