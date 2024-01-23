---
title: PartySocket (Client API)
description: PartySocket is a TypeScript client library for connecting to PartyKit servers via WebSockets

sidebar:
  order: 4
---

`PartySocket` is a TypeScript client library for connecting to PartyKit servers via WebSockets.

## Install

```bash
npm install partysocket@latest
```

## Features

- WebSocket API compatible (same interface, Level0 and Level2 event model)
- Automatically reconnect if the connection is closed.
- Multi-platform (Web, ServiceWorkers, Node.js, React Native)
- Dependency free (does not depend on Window, DOM or any EventEmitter library)
- Handle connection timeouts
- Allows changing server URL between reconnections
- Buffering. Will send accumulated messages on open
- Multiple builds available (see dist folder)
- Debug mode
- Fully configurable
- Works everywhere, not just with PartyKit!

## Usage

### Compatible with WebSocket Browser API

[MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

### Usage with PartyKit

```javascript
import PartySocket from "partysocket";

const ws = new PartySocket({
  host: "project-name.username.partykit.dev", // or localhost:1999 in dev
  room: "my-room",
  // add an optional id to identify the client,
  // if not provided, a random id will be generated
  // note that the id needs to be unique per connection,
  // not per user, so e.g. multiple devices or tabs need a different id
  id: "some-connection-id",

  // optionally, specify the party to connect to.
  // if not provided, will connect to the "main" party defined in partykit.json
  party: "main",

  // optionally, pass an object of query string parameters to add to the request
  query: async () => ({
    token: await getAuthToken()
  })
});

// optionally, update the properties of the connection
// (e.g. to change the host or room)
ws.updateProperties({
  host: "another-project.username.partykit.dev",
  room: "my-new-room"
});

ws.reconnect(); // make sure to call reconnect() after updating the properties
```

### Usage with React

PartySocket also exports a React hook for convenience:

```tsx
import usePartySocket from "partysocket/react";

const Component = () => {
  const ws = usePartySocket({
    // usePartySocket takes the same arguments as PartySocket.
    host: "project-name.username.partykit.dev", // or localhost:1999 in dev
    room: "my-room",

    // in addition, you can provide socket lifecycle event handlers
    // (equivalent to using ws.addEventListener in an effect hook)
    onOpen() {
      console.log("connected");
    },
    onMessage(e) {
      console.log("message", e.data);
    },
    onClose() {
      console.log("closed");
    },
    onError(e) {
      console.log("error");
    }
  });
};
```

The `usePartySocket` hook handles connecting on mount, disconnecting on unmount, and cleaning up the `on(Connect|Message|Close|Error)` handlers.

### Usage with other WebSocket servers

PartySocket can be used with any WebSocket server, not only PartyKit servers.

```javascript
import { WebSocket } from "partysocket";

const ws = new WebSocket("wss://my.site.com");

ws.addEventListener("open", () => {
  ws.send("hello!");
});
```

### Update URL

The `url` parameter will be resolved before connecting, possible types:

- `string`
- `() => string`
- `() => Promise<string>`

```javascript
import { WebSocket } from "partysocket";

const urls = [
  "wss://my.site.com",
  "wss://your.site.com",
  "wss://their.site.com"
];
let urlIndex = 0;

// round robin url provider
const urlProvider = () => urls[urlIndex++ % urls.length];

const ws = new WebSocket(urlProvider);
```

```javascript
import { WebSocket } from "partysocket";

// async url provider
const urlProvider = async () => {
  const token = await getSessionToken();
  return `wss://my.site.com/${token}`;
};

const ws = new WebSocket(urlProvider);
```

### Update Protocols

The `protocols` parameter will be resolved before connecting, possible types:

- `null`
- `string`
- `string[]`
- `() => string | string[] | null`
- `() => Promise<string | string[] | null>`

```javascript
import { WebSocket } from "partysocket";

const ws = new WebSocket("wss://your.site.com", "your protocol");
```

```javascript
import WebSocket from 'partysocket`;

const protocols = ['p1', 'p2', ['p3.1', 'p3.2']];
let protocolsIndex = 0;

// round robin protocols provider
const protocolsProvider = () => protocols[protocolsIndex++ % protocols.length];

const ws = new WebSocket('wss://your.site.com', protocolsProvider);
```

### Options

#### Sample with custom options

```javascript
import { WebSocket } from "partysocket";
import WS from "ws";

const options = {
  WebSocket: WS, // custom WebSocket constructor
  connectionTimeout: 1000,
  maxRetries: 10
};
const ws = new WebSocket("wss://my.site.com", [], options);
```

#### Available options

```typescript
type Options = {
  WebSocket?: any; // WebSocket constructor, if none provided, defaults to global WebSocket
  maxReconnectionDelay?: number; // max delay in ms between reconnections
  minReconnectionDelay?: number; // min delay in ms between reconnections
  reconnectionDelayGrowFactor?: number; // how fast the reconnection delay grows
  minUptime?: number; // min time in ms to consider connection as stable
  connectionTimeout?: number; // retry connect if not connected after this time, in ms
  maxRetries?: number; // maximum number of retries
  maxEnqueuedMessages?: number; // maximum number of messages to buffer until reconnection
  startClosed?: boolean; // start websocket in CLOSED state, call `.reconnect()` to connect
  debug?: boolean; // enables debug output
  debugLogger?: (...args: any[]) => void; // Use a custom logger (when `debug` is true)
};
```

#### Default values

```javascript
WebSocket: undefined,
maxReconnectionDelay: 10000,
minReconnectionDelay: 1000 + Math.random() * 4000,
reconnectionDelayGrowFactor: 1.3,
minUptime: 5000,
connectionTimeout: 4000,
maxRetries: Infinity,
maxEnqueuedMessages: Infinity,
startClosed: false,
debug: false,
```

## API

### Methods

```typescript
constructor(url: UrlProvider, protocols?: ProtocolsProvider, options?: Options)

close(code?: number, reason?: string)
reconnect(code?: number, reason?: string)

send(data: string | ArrayBuffer | Blob | ArrayBufferView)

addEventListener(type: 'open' | 'close' | 'message' | 'error', listener: EventListener)
removeEventListener(type:  'open' | 'close' | 'message' | 'error', listener: EventListener)
```

### Attributes

[More info](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

```typescript
binaryType: string;
bufferedAmount: number;
extensions: string;
onclose: EventListener;
onerror: EventListener;
onmessage: EventListener;
onopen: EventListener;
protocol: string;
readyState: number;
url: string;
retryCount: number;
```

### Constants

```
CONNECTING 0 The connection is not yet open.
OPEN       1 The connection is open and ready to communicate.
CLOSING    2 The connection is in the process of closing.
CLOSED     3 The connection is closed or couldn't be opened.
```

## Acknowledgements

:::note[Open Source]
PartySocket is a fork of the wonderful [reconnecting-websocket](https://github.com/joewalnes/reconnecting-websocket/) project, updated with pending PRs and bug fixes.
:::
