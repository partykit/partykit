import ReconnectingWebSocket, * as RWS from "reconnecting-websocket";

type PartySocketOptions = Omit<RWS.Options, "WebSocket" | "constructor"> & {
  host: string; // base url for the party
  room: string; // the room to connect to
  protocol?: string;
  protocols?: string[];
  // query
  // headers
};

// things that nathanboktae/robust-websocket claims are better:
// doesn't do anything in offline mode (?)
// "natively aware of error codes"
// can do custom reconnect strategies

// extremely basic for now but we'll add more options later
// TODO: incorporate the above notes
export class PartySocket extends ReconnectingWebSocket {
  constructor(readonly partySocketOptions: PartySocketOptions) {
    const { host, room, protocol, protocols, ...socketOptions } =
      partySocketOptions;
    super(
      `${
        protocol ||
        (host.startsWith("localhost:") || host.startsWith("127.0.0.1:")
          ? "ws"
          : "wss")
      }://${host}/party/${room}`,
      protocols,
      socketOptions
    );
  }
}

type POJO =
  | string
  | number
  | boolean
  | null
  | undefined
  | POJO[]
  | { [key: string]: POJO };

class Connection {
  requests: Map<
    string,
    { resolve: (data: POJO) => void; reject: (err: Error) => void }
  > = new Map();
  subscriptions: Map<
    string,
    {
      next: (data: POJO) => void;
      return: () => void;
      throw: (err: Error) => void;
    }
  > = new Map();
  constructor(readonly partySocket: PartySocket) {
    // start listening for messages
  }
  sendMessage(
    type: string,
    data: { id: string; name: string; payload?: POJO }
  ) {
    this.partySocket.send(JSON.stringify({ type, data }));
  }
  send(name: string, payload?: POJO): void {
    this.sendMessage("send", { id: crypto.randomUUID(), name, payload });
  }

  async get(name: string, payload?: POJO) {
    const id = crypto.randomUUID();
    const promise = new Promise((resolve, reject) => {
      this.requests.set(id, { resolve, reject });
    });
    this.sendMessage("get", { id, name, payload });
    return promise;
  }

  subscribe(name: string, payload?: POJO): AsyncIterable<POJO> {
    const id = crypto.randomUUID();
    const connection = this.partySocket;
    const iterator = async function* () {
      // uh TODO
    }.bind(this)();
    return iterator;
  }

  close() {
    this.partySocket.close();
  }
}

export class Party {
  constructor(
    readonly host: string,
    readonly partySocketOptions: Omit<PartySocketOptions, "host" | "room"> = {}
  ) {}
  join(room: string) {
    const partySocket = new PartySocket({
      ...this.partySocketOptions,
      host: this.host,
      room,
    });
    return new Connection(partySocket);
  }
}

// const party = new Party("ws://localhost:1999");
// const room = party.join("some-room");

// // 1. send a one shot message
// room.send("ping", { foo: "bar" });

// // 2. send a message and wait for a response
// const response = await room.get("ping");

// // 3. subscribe to a stream of messages
// for await (const data of room.subscribe("ping")) {
//   console.log(data);
// }

// type ConnectionEvent =
//   | "connect"
//   | "disconnect"
//   | "connect_error"
//   | "error"
//   | "ping"
//   | "reconnect_attempt"
//   | "reconnect_error"
//   | "reconnect_failed";

// export class Party {
//   //   #id: string = uniqueId();
//   // eventually, we want to to be able to have alternate transports
//   // (e.g. websockets, http polling, etc).
//   // But we'll do that after folks ask for it.
//   //   transport: "websocket" | "polling" = "websocket";
//   connections = new Set<ReconnectingWebSocket>();
//   constructor(readonly options: PartyOptions) {
//     if (!options?.host)
//       throw new Error("Party must be constructed with a host");
//   }
//   connect(roomId: string, overrides?: Partial<PartyOptions>) {
//     const { host, protocols, ...socketOptions } = {
//       ...this.options,
//       ...overrides,
//     };
//     const connection = new ReconnectingWebSocket(
//       `ws://${host}/party/${roomId}`,
//       protocols,
//       socketOptions
//     );
//     this.connections.add(connection);
//     return connection;
//   }
// }

// class Connection{
//   send(type: string, payload: any, callback?: (any) => void)
//   send(type: string, callback?: (any) => void)
//   send(type: string, payload?: any, callback?: (any) => void) {
//     if (typeof payload === "function") {
//       callback = payload;
//       payload = undefined;
//     }
//     this.socket.send(JSON.stringify({ type, payload }), callback);
//   }
// }

// // stealing from https://socket.io/docs/v4/client-api/

// import uniqueId from "./uniqueId";

// type PartyOptions = {
//   transports?: ("websocket" | "polling")[];
//   query?: Record<string, string | number | boolean>; // ?
//   headers?: Record<string, string>; // only when polling
//   protocols?: string[];
//   reconnection: boolean;
//   reconnectionAttempts: number;
//   reconnectionDelay: number;
//   reconnectionDelayMax: number;
//   randomizationFactor: number;
//   timeout: number;
//   autoConnect: boolean;

//   // more from https://socket.io/docs/v4/client-options
//   //  withCredentials
//   //  timestampRequests
//   //  timestampParam
//   //  closeOnBeforeunload
//   //  autoUnref

//   // parser https://socket.io/docs/v4/custom-parser/

//   // node options
//   //  agent
//   //  pfx
//   //  key
//   //  passphrase
//   //  cert
//   //  ca
//   //  ciphers
//   //  rejectUnauthorized
// };

// class Party {
//   options: PartyOptions;
//   constructor(public readonly path: string, options: Partial<PartyOptions>) {
//     this.options = Object.assign(
//       {
//         // default options
//         transports: ["websocket", "polling"],
//         reconnection: true,
//         reconnectionAttempts: Infinity,
//         reconnectionDelay: 1000,
//         reconnectionDelayMax: 5000,
//         randomizationFactor: 0.5,
//         timeout: 20000,
//         autoConnect: true,
//       },
//       options
//     );
//   }
//   /**
//    * Enter a room at the party.
//    */
//   enter(room: string, options: Partial<ConnectionOptions>): Connection {
//     return new Connection(
//       room,
//       Object.assign(
//         {
//           autoConnect: this.options.autoConnect,
//         },
//         options
//       )
//     );
//   }
// }

// type ConnectionOptions = {
//   autoConnect: boolean;
// };

// type ConnectionEvent =
//   | "connect"
//   | "disconnect"
//   | "connect_error"
//   | "error"
//   | "ping"
//   | "reconnect_attempt"
//   | "reconnect_error"
//   | "reconnect_failed";

// class Connection {
//   // events:
//   #id: string = uniqueId();
//   #buffer: Message[] = [];
//   transport: "websocket" | "polling" = "websocket";
//   connected: boolean = false;
//   constructor(
//     public readonly room: string,
//     public readonly options: ConnectionOptions
//   ) {
//     if (options.autoConnect) {
//       this.connect();
//     }
//   }
//   connect() {}
//   disconnect() {}
//   send(message: Message, callback?: (message: Message) => void) {}
//   on(event: ConnectionEvent, callback: (evt: Event) => void) {
//     // return unsubscribe?
//   }
//   off(event: ConnectionEvent, callback: (evt: Event) => void) {}
// }

// // volative flags? https://socket.io/docs/v4/client-api/#flag-volatile

// type Message = string | ArrayBufferLike | Blob | ArrayBufferView;

// // type Connection = EventTarget & {
// //   buffer: Message[];
// //   send: (msg: Message) => void;
// //   onmessage: (msg: Message) => void;
// // };

// class Transport extends EventTarget {
//   constructor(public url: string) {
//     super();
//   }
//   send(message: string) {
//     throw new Error("not implemented");
//   }
// }

// /**
//  * A transport abstracts the actual network layer
//  * It could be a websocket, could be long polling
//  * Useful when websockets aren't even available (like corp proxies)
//  */

// type Options = {
//   baseUrl: string;
// };

// export function connect(id: string, options: Options) {
//   // reconnect when dropped
//   // exponential dropoff
//   // ? batch an flush on frame/idle?
//   // batch when disconnected
//   // ? disconnect when backgrounded
// }

// // .send('message', { data: 'hello' })
// // .on
// //   message
// //   error
// //   close
// //   open
// //   reconnect
// //   disconnect
// //   connect
// //   reconnecting
// //   reconnect_error
// //   reconnect_failed
// //   ping
// //   pong
// //   upgrade

// // .off
