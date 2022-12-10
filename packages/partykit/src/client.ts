// stealing from https://socket.io/docs/v4/client-api/

import uniqueId from "./uniqueId";

type PartyOptions = {
  transports?: ("websocket" | "polling")[];
  query?: Record<string, string | number | boolean>; // ?
  headers?: Record<string, string>; // only when polling
  protocols?: string[];
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  randomizationFactor: number;
  timeout: number;
  autoConnect: boolean;

  // more from https://socket.io/docs/v4/client-options
  //  withCredentials
  //  timestampRequests
  //  timestampParam
  //  closeOnBeforeunload
  //  autoUnref

  // parser https://socket.io/docs/v4/custom-parser/

  // node options
  //  agent
  //  pfx
  //  key
  //  passphrase
  //  cert
  //  ca
  //  ciphers
  //  rejectUnauthorized
};

class Party {
  options: PartyOptions;
  constructor(public readonly path: string, options: Partial<PartyOptions>) {
    this.options = Object.assign(
      {
        // default options
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        timeout: 20000,
        autoConnect: true,
      },
      options
    );
  }
  /**
   * Enter a room at the party.
   */
  enter(room: string, options: Partial<ConnectionOptions>): Connection {
    return new Connection(
      room,
      Object.assign(
        {
          autoConnect: this.options.autoConnect,
        },
        options
      )
    );
  }
}

type ConnectionOptions = {
  autoConnect: boolean;
};

type ConnectionEvent =
  | "connect"
  | "disconnect"
  | "connect_error"
  | "error"
  | "ping"
  | "reconnect_attempt"
  | "reconnect_error"
  | "reconnect_failed";

class Connection {
  // events:
  #id: string = uniqueId();
  #buffer: Message[] = [];
  transport: "websocket" | "polling" = "websocket";
  connected: boolean = false;
  constructor(
    public readonly room: string,
    public readonly options: ConnectionOptions
  ) {
    if (options.autoConnect) {
      this.connect();
    }
  }
  connect() {}
  disconnect() {}
  send(message: Message, callback?: (message: Message) => void) {}
  on(event: ConnectionEvent, callback: (evt: Event) => void) {
    // return unsubscribe?
  }
  off(event: ConnectionEvent, callback: (evt: Event) => void) {}
}

// volative flags? https://socket.io/docs/v4/client-api/#flag-volatile

type Message = string | ArrayBufferLike | Blob | ArrayBufferView;

// type Connection = EventTarget & {
//   buffer: Message[];
//   send: (msg: Message) => void;
//   onmessage: (msg: Message) => void;
// };

class Transport extends EventTarget {
  constructor(public url: string) {
    super();
  }
  send(message: string) {
    throw new Error("not implemented");
  }
}

/**
 * A transport abstracts the actual network layer
 * It could be a websocket, could be long polling
 * Useful when websockets aren't even available (like corp proxies)
 */

type Options = {
  baseUrl: string;
};

export function connect(id: string, options: Options) {
  // reconnect when dropped
  // exponential dropoff
  // ? batch an flush on frame/idle?
  // batch when disconnected
  // ? disconnect when backgrounded
}

// .send('message', { data: 'hello' })
// .on
//   message
//   error
//   close
//   open
//   reconnect
//   disconnect
//   connect
//   reconnecting
//   reconnect_error
//   reconnect_failed
//   ping
//   pong
//   upgrade

// .off
