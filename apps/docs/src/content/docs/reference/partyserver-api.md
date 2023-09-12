---
title: Party.Server (Server API)
description: PartyKit enables you to create real-time collaborative applications.
sidebar:
  order: 3
---

:::tip[TypeScript usage]
These code examples assume you're using TypeScript. PartyKit supports `.ts` files out of the box, but if you prefer to write your server in plain JavaScript, you can use the `.js` file extension and omit type annotations.
:::

## Party.Server

Each PartyKit server is a TypeScript module that implements the `Party.Server` interface.

```ts
// server.ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {}
```

**Note:** Previously, PartyKit supported an alternative `export default {} satisfies PartyKitServer` syntax. You can [read the API documentation for the legacy syntax here](/reference/partykitserver-legacy-api)

### new Party.Server (constructor)

The `Party.Server` constructor receives an instance of [`Party.Party`](#party), which gives you access to the room state and resources such as storage, connections, id, and more.

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  constructor(readonly party: Party.Party) {
    // ...
  }
}
```

### Party.Server.options

You can define an `options` field to customise the PartyServer behaviour.

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  readonly options = {
    hibernate: false,
  };
}
```

##### Party.Server.options.hibernate

Whether the PartyKit platform should remove the server from memory between HTTP requests and WebSocket messages. The default value is `false`.

**Related guide:** [Scaling PartyKit Servers with Hibernation](/guides/scaling-partykit-servers-with-hibernation)

### Party.Server.onStart

Called when the server is started, before first [`onConnect`](#partyserveronconnect) or [`onRequest`](#partyserveronrequest).

You can use this to load data from storage and perform other asynchronous initialization, such as retrieving data or configuration from other services or databases.

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  async onStart() {}
}
```

### Party.Server.onConnect

Called when a new incoming WebSocket connection is opened.

Receives a reference to the connecting [`Party.Connection`](#partyconnection), and a [`Party.ConnectionContext`](#partyconnectioncontext) that provides information about the initial connection request.

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {}
}
```

**Related guide:** [Building a Real-time WebSocket server](/guides/)

### Party.Server.onMessage

Called when a WebSocket connection receives a message from a client, or another connected party.

Receives the incoming message, which can either be a string or a raw binary [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), and a reference to the sending [`Party.Connection`](#partyconnection).

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {}
}
```

### Party.Server.onClose

Called when a WebSocket connection is closed by the client.

Receives a reference to the closed [`Party.Connection`](#partyconnection). By the time `onClose` is called, the connection is already closed and can no longer receive messages.

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  async onClose(connection: Party.Connection) {}
}
```

### Party.Server.onError

Called when a WebSocket connection is closed due to a connection error.

Receives a reference to the closed [`Party.Connection`](#partyconnection), and an `Error` object.

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  async onError(connection: Party.Connection, error: Error) {}
}
```

### Party.Server.onRequest

Called when a HTTP request is made to the party URL.

Receives an instance of [`Party.Request`](#partyrequest), and is expected to return a standard Fetch API [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  async onRequest(req: Party.Request) {
    return new Response(req.cf.country, { status: 200 });
  }
}
```

**Related guide:** [Responding to HTTP requests](/guides/responding-to-http-requests)

### Party.Server.onAlarm

Called when an alarm is triggered.

Alarms have access to most [`Party`](#party) resources such as storage, but not [`Party.id`](#partyid) and [`Party.context.parties`](#partycontextparties) properties. Attempting to access them will result in a runtime error.

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  async onAlarm() {}
}
```

**Related guide:** [Scheduling tasks with Alarms](/guides/scheduling-tasks-with-alarms)

### Party.Server.getConnectionTags

You can set additional metadata on connections by returning them from a `getConnectionTags`, and then filter connections based on the tag with [`Party.getConnections`](#partygetconnections).

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  getConnectionTags(
    connection: Party.Connection,
    ctx: Party.ConnectionContext
  ) {
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

Receives an instance of [`Party.Request`](#partyrequest), and is expected to either return a request, or a standard Fetch API [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  static async onBeforeRequest(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    return new Response("Access denied", { status: 403 });
  }
}
```

Because the static `onBeforeRequest` method runs in an edge worker near the user instead of in the room, it doesn't have access to `Party` room resources such as storage. Instead, you can access a subset of its properties via a [`Party.Lobby`](#partylobby).

Related reading: [How PartyKit works](/how-partykit-works)

### `static` onBeforeConnect

Runs before any WebSocket connection is made to the party. You can modify the `request` before it is forwarded to the party, or return a `Response` to prevent the connection

Receives an instance of [`Party.Request`](#partyrequest), and is expected to either return a request, or a standard Fetch API [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  static async onBeforeConnect(
    req: Party.Request,
    lobby: Party.Lobby,
    ctx: Party.ExecutionContext
  ) {
    return new Response("Access denied", { status: 403 });
  }
}
```

Because the static `onBeforeConnect` method runs in an edge worker near the user instead of in the room, it doesn't have access to `Party` room resources such as storage. Instead, you can access a subset of its properties via a [`Party.Lobby`](#partylobby).

Related reading: [How PartyKit works](/how-partykit-works)

### `static` onFetch

Runs on any HTTP request that does not match a Party URL or a static asset. Useful for running lightweight HTTP endpoints that don't need access to the [`Party`]() state.

Receives an instance of [`Party.Request`](#partyrequest), and is expected to either return a standard Fetch API [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  static async onFetch(
    req: Party.Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) {
    return new Response(req.url, { status: 403 });
  }
}
```

Because the static `onFetch` method runs in an edge worker near the user instead of in the room, it doesn't have access to `Party` room resources such as storage. Instead, you can access a subset of its properties via a [`Party.FetchLobby`](#partyfetchlobby).

:::danger[Multiple parties and onFetch]
Each project can only define one `onFetch` handler in its `main` party. Other parties' `onFetch` handlers are quietly ignored. Read more: [Using multiple parties per project](/guides/using-multiple-parties-per-project)
:::

Related reading: [Creating custom endpoints with onFetch](/guides/creating-custom-endpoints-with-onfetch)

## Party.Worker

The `Party.Worker` interface describes the `static` methods available on the `Party.Server` class. You can use it to add additional type safety to your TypeScript code:

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  static async onFetch(req: Party.Request) {
    return new Response(req.url);
  }
}

Server satisfies Party.Worker;
```

## Party

Each `Party.Server` instance receives an instance of `Party.Party` as a constructor parameter, and can use it to access the room state and resources such as storage, connections, id, and more.

```ts
import type * as Party from "partykit/server";
export default class Server implements Party.Server {
  constructor(readonly party: Party.Party) {
    // ...
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
await this.party.storage.put("user", { user });
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

## Party.Connection

Wraps a standard [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket), with a few additional PartyKit-specific properties.

```ts
connection.send("Good-bye!");
connection.close();
```

##### Party.Connection.id

Uniquely identifies the connection. Usually an automatically generated GUID, but can be specified by the client by setting an `id` property on [PartySocket](/reference/partysocket-api).

##### Party.Connection.uri

The original URI of the connection request.

##### Party.Connection.serializeAttachment

Normally, you can store state (e.g. connection metadata) on each connection by simply assigning a value to the `Party.Connection` object. However, when [`options.hibernate`](#partyserveroptionshibernate) is set to `true`, any in-memory state is lost when the server hibernates.

To store state to survive hibernation, store it on the connection using `serializeAttachment`:

```ts
connection.serializeAttachment({ username: "jani" });
```

**Related guide:** [Scaling PartyKit Servers with Hibernation](/guides/scaling-partykit-servers-with-hibernation)

##### Party.Connection.deserializeAttachment

Read state stored with [`PartyConnection.serializeAttachment`](#partyconnectionserializeattachment).

```ts
const user = connection.deserializeAttachment() as { username: string };
```

**Related guide:** [Scaling PartyKit Servers with Hibernation](/guides/scaling-partykit-servers-with-hibernation)

## Party.Request

Wraps an underlying Cloudflare runtime [Request](https://developers.cloudflare.com/workers/runtime-apis/request/).

## Party.Lobby

Provides access to a limited subset of room resources for `onBeforeConnect` and `onBeforeRequest` methods.

### Party.Lobby.id

See: [`Party.id`](#partyid)

### Party.Lobby.env

See: [`Party.env`](#partyenv)

### Party.Lobby.parties

See: [`Party.context.parties`](#partycontextparties)

## Party.FetchLobby

Provides access to a limited subset of project resources for the `onFetch` method:

### Party.Lobby.env

See: [`Party.env`](#partyenv)

### Party.Lobby.parties

See: [`Party.context.parties`](#partycontextparties)
