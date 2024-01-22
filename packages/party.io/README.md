# 🎈 Party.IO

## Socket.IO server for PartyKit

**NB: Experimental!!!**

_An implementation of the Socket.IO protocol for PartyKit. Based on the incredible work by @darrachequesne at https://github.com/socketio/socket.io-deno/_

Table of contents:

- [Usage](#usage)
- [How does it work](#how-does-it-work)
- [Options](#options)
  - [`path`](#path)
  - [`connectTimeout`](#connecttimeout)
  - [`pingTimeout`](#pingtimeout)
  - [`pingInterval`](#pinginterval)
  - [`upgradeTimeout`](#upgradetimeout)
  - [`maxHttpBufferSize`](#maxhttpbuffersize)
  - [`allowRequest`](#allowrequest)
  - [`cors`](#cors)
  - [`editHandshakeHeaders`](#edithandshakeheaders)
  - [`editResponseHeaders`](#editresponseheaders)
- [Logs](#logs)

## Usage

```ts
// server.ts

import { createServer } from "party.io";

export default createServer((io) => {
  io.on("connection", (socket) => {
    console.log(`socket ${socket.id} connected`);

    socket.emit("hello", "world");

    socket.on("howdy", (data) => {
      console.log(`socket ${socket.id} says ${data}`);
    });

    socket.on("disconnect", (reason) => {
      console.log(`socket ${socket.id} disconnected due to ${reason}`);
    });
  });
});
```

In your browser, you can connect to the server with:

```ts
// client.ts

import { io } from "socket.io-client";

const socket = io({
  transports: ["websocket"]
});

socket.on("hello", (data) => {
  console.log(`server says ${data}`);
  // => server says world
});

socket.emit("howdy", "y'all");
```

And then run with:

```bash
partykit dev server.ts
```

Like the [Node.js server](https://socket.io/docs/v4/typescript/), you can also
provide types for the events sent between the server and the clients:

```ts
interface ClientToServerEvents {
  hello: () => void;
}

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  user_id: string;
}

export default createServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>((io) => {
  // ...
});
```

## How does it work

TODO

## Options

### `path`

Default value: `/socket.io/`

It is the name of the path that is captured on the server side.

Caution! The server and the client values must match (unless you are using a
path-rewriting proxy in between).

Example:

```ts
export default createServer(
  {
    path: "/my-custom-path/"
  },
  (io) => {
    // ...
  }
);
```

### `connectTimeout`

Default value: `45000`

The number of ms before disconnecting a client that has not successfully joined
a namespace.

### `pingTimeout`

Default value: `20000`

This value is used in the heartbeat mechanism, which periodically checks if the
connection is still alive between the server and the client.

The server sends a ping, and if the client does not answer with a pong within
`pingTimeout` ms, the server considers that the connection is closed.

Similarly, if the client does not receive a ping from the server within
`pingInterval + pingTimeout` ms, the client also considers that the connection
is closed.

### `pingInterval`

Default value: `25000`

See [`pingTimeout`](#pingtimeout) for more explanation.

### `upgradeTimeout`

Default value: `10000`

This is the delay in milliseconds before an uncompleted transport upgrade is
cancelled.

### `maxHttpBufferSize`

Default value: `1e6` (1 MB)

This defines how many bytes a single message can be, before closing the socket.
You may increase or decrease this value depending on your needs.

### `allowRequest`

Default value: `-`

A function that receives a given handshake or upgrade request as its first
parameter, and can decide whether to continue or not.

Example:

```ts
export default createServer(
  {
    allowRequest: (req, lobby, ctx) => {
      return Promise.reject("thou shall not pass");
    }
  },
  (io) => {
    // ...
  }
);
```

### `cors`

Default value: `-`

A set of options related to
[Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
(CORS).

Example:

```ts
export default createServer(
  {
    cors: {
      origin: ["https://example.com"],
      allowedHeaders: ["my-header"],
      credentials: true
    }
  },
  (io) => {
    // ...
  }
);
```

### `editHandshakeHeaders`

Default value: `-`

A function that allows to edit the response headers of the handshake request.

Example:

```ts
export default createServer(
  {
    editHandshakeHeaders: (responseHeaders, req, lobby, ctx) => {
      responseHeaders.set("set-cookie", "sid=1234");
    }
  },
  (io) => {
    // ...
  }
);
```

### `editResponseHeaders`

Default value: `-`

A function that allows to edit the response headers of all requests.

Example:

```ts
export default createServer(
  {
    editResponseHeaders: (responseHeaders, req, lobby, ctx) => {
      responseHeaders.set("my-header", "abcd");
    }
  },
  (io) => {
    // ...
  }
);
```

## Logs

```ts
// TODO:
```

## License

[ISC](/LICENSE)
