# PartySocket

_(Forked from the wonderful [reconnecting-websocket](https://github.com/joewalnes/reconnecting-websocket/) project, updated with pending PRs and bugfixes)_

A better WebSocket that Just Works™

## Install

```bash
npm install partysocket
```

## Features

- WebSocket API compatible (same interface, Level0 and Level2 event model)
- Reconnects when a connection drops
- Buffers messages when not connected, and sends accumulated messages when open
- Handle connection timeouts
- Allows changing server URL between reconnections
- Fully configurable
- Multi-platform (Web, ServiceWorkers, Node.js, React Native, Cloudflare Workers, Deno, Bun)
- Dependency free (does not depend on Window, DOM or any EventEmitter library)
- Debug mode
- Works everywhere, not just with PartyKit!

## Usage

### Compatible with WebSocket Browser API

[MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

### Simple usage

```javascript
import { WebSocket } from "partysocket";

const ws = new WebSocket("wss://my.site.com");

ws.addEventListener("open", () => {
  ws.send("hello!");
});
```

### Usage with PartyKit

```javascript
import PartySocket from "partysocket";

// optional: only needed if creating using inside node.js. Run `npm install ws`, and then add:
// import WS from "ws";

const ws = new PartySocket({
  host: "project.name.partykit.dev", // or localhost:1999 in dev
  room: "my-room",
  // add an optional id to identify the client,
  // if not provided, a random id will be generated
  id: "some-connection-id"
  // optional: if used from node.js, you need to pass the WebSocket polyfill imported from `ws`
  // WebSocket: WS
});

// optionally, update the properties of the connection
// (e.g. to change the host or room)
ws.updateProperties({
  host: "another-project.username.partykit.dev",
  room: "my-new-room"
});

ws.reconnect(); // make sure to call reconnect() after updating the properties
```

### Update URL

The `url` parameter will be resolved before connecting, with possible types:

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

```text
CONNECTING 0 The connection is not yet open.
OPEN       1 The connection is open and ready to communicate.
CLOSING    2 The connection is in the process of closing.
CLOSED     3 The connection is closed or couldn't be opened.
```

## License

MIT
