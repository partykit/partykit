---
title: PartyServer (Server API)
description: PartyKit enables you to create real-time collaborative applications.
sidebar:
    order: 3
---

:::tip[TypeScript usage]
These code examples assume you're using TypeScript. PartyKit supports `.ts` files out of the box, but if you prefer to write your server in plain JavaScript, you can use the `.js` file extension and omit type annotations.
:::

## PartyServer

Each PartyKit server is a TypeScript module that implements the `PartyServer` interface.

```ts
// server.ts
import type { PartyServer } from "partykit/server";
export default class Server implements PartyServer {}
```

**Note:** Previously, PartyKit supported an alternative `export default {} satisfies PartyKitServer` syntax. You can [read the API documentation for the legacy syntax here](/reference/partykitserver-legacy-api)


### new PartyServer (constructor)

The `PartyServer` constructor receives an instance of [`Party`](#party), which gives you access to the room state and resources such as storage, connections, id, and more.

```ts
import type { PartyServer, Party } from "partykit/server";
export default class Server implements PartyServer {
  readonly party: Party;
  constructor(party: Party) {
    this.party = party;
  }
}
```

### PartyServer.options

You can define an `options` field to customise the PartyServer behaviour.
```ts
import type { PartyServer } from "partykit/server";
export default class Server implements PartyServer {
  readonly options = {
    hibernate: false
  }
}
```

##### PartyServer.options.hibernate

Whether the PartyKit platform should remove the server from memory between HTTP requests and WebSocket messages. The default value is `false`.

**Related guide:** [Scaling PartyKit Servers with Hibernation](/guides/scaling-partykit-servers-with-hibernation)

### PartyServer.onStart

Called when the server is started, before first [`onConnect`]() or [`onRequest`](#onrequest).

You can use this to load data from storage and perform other asynchronous initialization, such as retrieving data or configuration from other services or databases.

```ts
import type { PartyServer } from "partykit/server";
export default class Server implements PartyServer {
  async onStart() { }
}
```

### PartyServer.onConnect

Called when a new incoming WebSocket connection is opened.

Receives a reference to the connecting [`PartyConnection`](#partyconnection), and a [`PartyConnectionContext`](#partyconnectioncontext) that provides information about the initial connection request.

```ts
import type { PartyServer, PartyConnection, PartyConnectionContext } from "partykit/server";
export default class Server implements PartyServer {
  async onConnect(
    connection: PartyConnection, 
    ctx: PartyConnectionContext
  ) { }
}
```

**Related guide:** [Building a Real-time WebSocket server](/guides/)

### PartyServer.onMessage

Called when a WebSocket connection receives a message from a client, or another connected party.

Receives the incoming message, which can either be a string or a raw binary [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), and a reference to the sending [`PartyConnection`](#partyconnection).

```ts
import type { PartyServer, PartyConnection } from "partykit/server";
export default class Server implements PartyServer {
  async onMessage(
    message: string | ArrayBuffer,
    sender: PartyConnection
  ) { }
}
```

### PartyServer.onClose

Called when a WebSocket connection is closed by the client.

Receives a reference to the closed [`PartyConnection`](#partyconnection). By the time `onClose` is called, the connection is already closed and can no longer receive messages.

```ts
import type { PartyServer, PartyConnection } from "partykit/server";
export default class Server implements PartyServer {
  async onClose(
    connection: PartyConnection, 
  ) { }
}
```

### PartyServer.onError

Called when a WebSocket connection is closed due to a connection error.

Receives a reference to the closed [`PartyConnection`](#partyconnection), and an `Error` object.

```ts
import type { PartyServer, PartyConnection } from "partykit/server";
export default class Server implements PartyServer {
  async onError(
    connection: PartyConnection, 
    error: Error
  ) { }
}
```

### PartyServer.onRequest

Called when a HTTP request is made to the party URL. 

Receives an instance of [`PartyRequest`](#partyrequest), and is expected to return a standard Fetch API [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).

```ts
import type { PartyServer, PartyRequest } from "partykit/server";
export default class Server implements PartyServer {
  async onRequest(
    req: PartyRequest, 
  ) { 
    return new Response(req.cf.country, { status: 200 });
  }
}
```

**Related guide:** [Responding to HTTP requests](/guides/responding-to-http-requests)

### PartyServer.onAlarm

Called when an alarm is triggered.

Alarms have access to most [`Party`](#party) resources such as storage, but not [`Party.id`](#partyid) and [`Party.context.parties`](#partycontextparties) properties. Attempting to access them will result in a runtime error.


```ts
import type { PartyServer } from "partykit/server";
export default class Server implements PartyServer {
  async onAlarm() { }
}
```

**Related guide:** [Scheduling tasks with Alarms](/guides/scheduling-tasks-with-alarms)

### PartyServer.getConnectionTags

You can set additional metadata on connections by returning them from a `getConnectionTags`, and then filter connections based on the tag with [`Party.getConnections`](#partygetconnections).

```ts

import type { PartyServer, PartyConnection } from "partykit/server";
export default class Server implements PartyServer {
  getConnectionTags(connection: PartyConnection, ctx: PartyConnectionContext) {
    const country = (ctx.request.cf?.country as string) ?? "unknown";
    return [country];
  }
  async onMessage(message: string) { 
    for (const british of this.party.getConnections("GB")) {
      british.send(`Pip-pip!`);
    }
  }
}
```

### `static` onBeforeRequest

Runs before any HTTP request is made to the party. You can modify the `request` before it is forwarded to the party, or return a `Response` to short-circuit it.

Receives an instance of [`PartyRequest`](#partyrequest), and is expected to either return a request, or a standard Fetch API [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response). 


```ts
import type { PartyServer, PartyRequest, PartyLobby, PartyExecutionContext } from "partykit/server";
export default class Server implements PartyServer {
  static async onBeforeRequest(
    req: PartyRequest, 
    lobby: PartyLobby,
    ctx: PartyExecutionContext
  ) { 
    return new Response("Access denied", { status: 403 });
  }
}
```

Because the static `onBeforeRequest` method runs in an edge worker near the user instead of in the room, it doesn't have access to `Party` room resources such as storage. Instead, you can access a subset of its properties via a [`PartyLobby`](#partylobby).

Related reading: [How PartyKit works](/how-partykit-works)

### `static` onBeforeConnect

Runs before any WebSocket connection is made to the party. You can modify the `request` before it is forwarded to the party, or return a `Response` to prevent the connection

Receives an instance of [`PartyRequest`](#partyrequest), and is expected to either return a request, or a standard Fetch API [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response). 


```ts
import type { PartyServer, PartyRequest, PartyLobby, PartyExecutionContext } from "partykit/server";
export default class Server implements PartyServer {
  static async onBeforeConnect(
    req: PartyRequest, 
    lobby: PartyLobby,
    ctx: PartyExecutionContext
  ) { 
    return new Response("Access denied", { status: 403 });
  }
}
```

Because the static `onBeforeConnect` method runs in an edge worker near the user instead of in the room, it doesn't have access to `Party` room resources such as storage. Instead, you can access a subset of its properties via a [`PartyLobby`](#partylobby).

Related reading: [How PartyKit works](/how-partykit-works)

### `static` onFetch

Runs on any HTTP request that does not match a Party URL or a static asset. Useful for running lightweight HTTP endpoints that don't need access to the [`Party`]() state.

Receives an instance of [`PartyRequest`](#partyrequest), and is expected to either return a standard Fetch API [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response). 


```ts
import type { PartyServer, PartyRequest, PartyFetchLobby, PartyExecutionContext } from "partykit/server";
export default class Server implements PartyServer {
  static async onFetch(
    req: PartyRequest, 
    lobby: PartyFetchLobby,
    ctx: PartyExecutionContext
  ) { 
    return new Response(req.url, { status: 403 });
  }
}
```

Because the static `onFetch` method runs in an edge worker near the user instead of in the room, it doesn't have access to `Party` room resources such as storage. Instead, you can access a subset of its properties via a [`PartyFetchLobby`](#partyfetchlobby).

:::danger[Multiple parties and onFetch]
Each project can only define one `onFetch` handler in its `main` party. Other parties' `onFetch` handlers are quietly ignored. Read more: [Using multiple parties per project](/guides/using-multiple-parties-per-project)
:::


Related reading: [Creating custom endpoints with onFetch](/guides/creating-custom-endpoints-with-onfetch)


## PartyWorker

The `PartyWorker` interface describes the `static` methods available on the `PartyServer` class. You can use it to add additional type safety to your TypeScript code:

```ts
import type { PartyServer, PartyWorker, PartyRequest} from "partykit/server";
export default class Server implements PartyServer { 
  static async onFetch(req: PartyRequest) {
    return new Response(req.url)
  }
}

Server satisfies PartyWorker
```

## Party


Each `PartyServer` instance receives an instance of `Party` as a constructor parameter, and can use it to access the room state and resources such as storage, connections, id, and more.

```ts
import type { PartyServer, Party } from "partykit/server";
export default class Server implements PartyServer {
  readonly party: Party;
  constructor(party: Party) { 
    this.party = party;
  }
}
```

### Party.id

Party ID defined in the Party URL, e.g. `/parties/:name/:id`.

### Party.internalID

Internal ID assigned by the platform. Use `Party.id` instead.

### Party.env

Environment variables defined for this party.

Related reading: [Managing environment variables with PartyKit](/guides/managing-environment-variables).

### Party.storage

A per-party, asyncronous key-value storage.

- The key must be a string with a max size of 2,048 bytes.
- The value can be any type supported by the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm), limited to 128 KiB (131,072 bytes) per value

```ts
// write arbitrary data
const input = { username: "jani" };
await this.party.storage.put("user", {user});
// read data
const user = await this.party.storage.get<{ username: string }>("user");
```

Related reading: [Persisting state into storage](/guides/persisting-state-into-storage).

### Party.context

Additional information about other resources in the current project.

##### Party.context.parties

Access other parties in this project.

```ts
const otherParty = this.party.context.parties.other;
const otherPartyInstance = otherParty.other.get("room-id");
const req = await otherRoom.fetch({ method: "GET" });
const res = await req.json();
```

Read more: [Using multiple parties per project](/guides/using-multiple-parties-per-project)

### Party.broadcast

Send a message to all connected clients, except connection ids listed in the second array parameter.

```ts
this.party.broadcast(message, [sender.id]);
```

**Related guide:** [Building a Real-time WebSocket server](/guides/building-a-real-time-websocket-server)

### Party.getConnection

Get a connection by connection id. Returns a [`PartyConnection`](#partyconnection) `undefined` if connection by id doesn't exist. 

### Party.getConnections

Get all currently connected WebSocket connections. Returns an iterable list of [`PartyConnection`](#partyconnection)s.

Optionally, you can provide a tag to filter returned connections.

```ts
const playerCount = [...this.party.getConnections()].length;
for (const everyone of this.party.getConnections()) {
  everyone.send(`Let's play!`);
}
for (const tagged of this.party.getConnections("some-tag")) {
  tagged.send(`You're it!`);
}

```

Use [`PartyServer.getConnectionTags`](#partyservergetconnectiontags) to tag the connection when the connection is made.

## PartyConnection

Wraps a standard [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket), with a few additional PartyKit-specific properties.

```ts
connection.send("Good-bye!");
connection.close();
```

##### PartyConnection.id

Uniquely identifies the connection. Usually an automatically generated GUID, but can be specified by the client by setting an `id` property on [PartySocket](/reference/partysocket-api).

##### PartyConnection.uri

The original URI of the connection request.

##### PartyConnection.serializeAttachment

Normally, you can store state (e.g. connection metadata) on each connection by simply assigning a value to the `PartyConnection` object. However, when [`options.hibernate`](#partyserveroptionshibernate) is set to `true`, any in-memory state is lost when the server hibernates.

To store state to survive hibernation, store it on the connection using `serializeAttachment`:

```ts
connection.serializeAttachment({ username: "jani" });
```

**Related guide:** [Scaling PartyKit Servers with Hibernation](/guides/scaling-partykit-servers-with-hibernation)

##### PartyConnection.deserializeAttachment

Read state stored with [`PartyConnection.serializeAttachment`](#partyconnectionserializeattachment).

```ts
const user = connection.deserializeAttachment() as { username: string };
```

**Related guide:** [Scaling PartyKit Servers with Hibernation](/guides/scaling-partykit-servers-with-hibernation)

## PartyRequest

Wraps an underlying Cloudflare runtime [Request](https://developers.cloudflare.com/workers/runtime-apis/request/).

## PartyLobby

Provides access to a limited subset of room resources for `onBeforeConnect` and `onBeforeRequest` methods.

### PartyLobby.id

See: [`Party.id`](#partyid)

### PartyLobby.env

See: [`Party.env`](#partyenv)

### PartyLobby.parties

See: [`Party.context.parties`](#partycontextparties)


## PartyFetchLobby

Provides access to a limited subset of project resources for the `onFetch` method:

### PartyLobby.env

See: [`Party.env`](#partyenv)

### PartyLobby.parties

See: [`Party.context.parties`](#partycontextparties)


