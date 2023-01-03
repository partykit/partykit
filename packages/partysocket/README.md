- https://github.com/pladaria/reconnecting-websocket/pull/166 Fix: handle error if getNextUrl throws (TODO: add test for this one )
- https://github.com/pladaria/reconnecting-websocket/pull/132 feat: make protocols updatable
- https://github.com/pladaria/reconnecting-websocket/pull/141 [Fix] Socket doesn't connect again after closing while connecting

(TODO: more)

- https://github.com/pladaria/reconnecting-websocket/pull/163 Support for Dynamic Protocols
- https://github.com/pladaria/reconnecting-websocket/pull/47 reconnecting and reconnectscheduled custom events

# Reconnecting WebSocket

[![Build Status](https://travis-ci.org/pladaria/reconnecting-websocket.svg?branch=master&v=1)](https://travis-ci.org/pladaria/reconnecting-websocket)
[![Coverage Status](https://coveralls.io/repos/github/pladaria/reconnecting-websocket/badge.svg?branch=master&v=3)](https://coveralls.io/github/pladaria/reconnecting-websocket?branch=master)

WebSocket that will automatically reconnect if the connection is closed.

## Features

- WebSocket API compatible (same interface, Level0 and Level2 event model)
- Fully configurable
- Multi-platform (Web, ServiceWorkers, Node.js, React Native)
- Dependency free (does not depend on Window, DOM or any EventEmitter library)
- Handle connection timeouts
- Allows changing server URL between reconnections
- Buffering. Will send accumulated messages on open
- Multiple builds available (see dist folder)
- Debug mode

## Install

```bash
npm install --save reconnecting-websocket
```

## Usage

### Compatible with WebSocket Browser API

So this documentation should be valid:
[MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

Ping me if you find any problems. Or, even better, write a test for your case and make a pull
request :)

### Simple usage

```javascript
import ReconnectingWebSocket from "reconnecting-websocket";

const rws = new ReconnectingWebSocket("ws://my.site.com");

rws.addEventListener("open", () => {
  rws.send("hello!");
});
```

### Update URL

The `url` parameter will be resolved before connecting, possible types:

- `string`
- `() => string`
- `() => Promise<string>`

```javascript
import ReconnectingWebSocket from "reconnecting-websocket";

const urls = ["ws://my.site.com", "ws://your.site.com", "ws://their.site.com"];
let urlIndex = 0;

// round robin url provider
const urlProvider = () => urls[urlIndex++ % urls.length];

const rws = new ReconnectingWebSocket(urlProvider);
```

```javascript
import ReconnectingWebSocket from "reconnecting-websocket";

// async url provider
const urlProvider = async () => {
  const token = await getSessionToken();
  return `wss://my.site.com/${token}`;
};

const rws = new ReconnectingWebSocket(urlProvider);
```

### Update Protocols

The `protocols` parameter will be resolved before connecting, possible types:

- `null`
- `string`
- `string[]`
- `() => string | string[] | null`
- `() => Promise<string | string[] | null>`

```javascript
import ReconnectingWebSocket from 'reconnecting-websocket`;
const rws = new ReconnectingWebSocket('ws://your.site.com', 'your protocol');
```

```javascript
import ReconnectingWebSocket from 'reconnecting-websocket`;

const protocols = ['p1', 'p2', ['p3.1', 'p3.2']];
let protocolsIndex = 0;

// round robin protocols provider
const protocolsProvider = () => protocols[protocolsIndex++ % protocols.length];

const rws = new ReconnectingWebSocket('ws://your.site.com', protocolsProvider);
```

### Options

#### Sample with custom options

```javascript
import ReconnectingWebSocket from "reconnecting-websocket";
import WS from "ws";

const options = {
  WebSocket: WS, // custom WebSocket constructor
  connectionTimeout: 1000,
  maxRetries: 10,
};
const rws = new ReconnectingWebSocket("ws://my.site.com", [], options);
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

## Contributing

[Read here](./CONTRIBUTING.md)

## License

MIT
