---
title: Party.Server (Server API)
description: PartyKit enables you to create real-time collaborative applications
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

The `Party.Server` constructor receives an instance of [`Party.Room`](#partyroom), which gives you access to the room state and resources such as storage, connections, id, and more.

```ts
import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {
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
    hibernate: false
  };
}
```

##### Party.Server.options.hibernate

Whether the PartyKit platform should remove the server from memory between HTTP requests and WebSocket messages. The default value is `false`.

**Related guide:** [Scaling PartyKit Servers with Hibernation](/guides/scaling-partykit-servers-with-hibernation)

### Party.Server.onStart

Called when the server is started or after waking up from hibernation, before first [`onConnect`](#partyserveronconnect) or [`onRequest`](#partyserveronrequest).

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

Called when a HTTP request is made to the room URL.

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

Alarms have access to most [`Room`](#partyroom) resources such as storage, but not [`Room.id`](#roomid) and [`Room.context.parties`](#roomcontextparties) properties. Attempting to access them will result in a runtime error.

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
    for (const british of this.room.getConnections("GB")) {
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

### `static` onFetch

Runs on any HTTP request that does not match a Party URL or a static asset. Useful for running lightweight HTTP endpoints that don't need access to the `Party` state.

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

Server satisfies Party.Worker;
```

Because the static `onFetch` method runs in an edge worker near the user instead of in the room, it doesn't have access to `Party` room resources such as storage. Instead, you can access a subset of its properties via a [`Party.FetchLobby`](#partyfetchlobby).

:::danger[Multiple parties and onFetch]
Each project can only define one `onFetch` handler in its `main` party. Other parties' `onFetch` handlers are quietly ignored. Read more: [Using multiple parties per project](/guides/using-multiple-parties-per-project)
:::

Related reading: [Creating custom endpoints with onFetch](/guides/creating-custom-endpoints-with-onfetch)

### `static` onSocket

Runs on any WebSocket connection that does not match a Party URL. Useful for running lightweight WebSocket endpoints that don't need access to the `Party` state.

Receives an instance of [`Party.FetchSocket`](#partyfetchsocket).

```ts
import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  static async onSocket(
    socket: Party.FetchSocket,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) {
    socket.send("Hello!");
  }
}

Server satisfies Party.Worker;
```

:::danger[Multiple parties and onSocket]
Each project can only define one `onSocket` handler in its `main` party. Other parties' `onSocket` handlers are quietly ignored. Read more: [Using multiple parties per project](/guides/using-multiple-parties-per-project)
:::

### `static` onCron

Runs on a schedule defined in the `crons` field of the `partykit.json` file. Useful for running code periodically, such as sending reminders or cleaning up old data.

Receives an instance of [`Party.Cron`](#partycron).

```jsonc
{
  // ...
  "crons": {
    "every-minute": "*/1 * * * *",
    "every-hour": "0 * * * *",
    "every-day": "0 0 * * *"
  }
}
```

```ts
import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  static async onCron(
    cron: Party.Cron,
    lobby: Party.CronLobby,
    ctx: Party.ExecutionContext
  ) {
    console.log(`Running cron ${cron.name} at ${cron.scheduledTime}`);
  }
}

Server satisfies Party.Worker;
```

:::tip[Local development]
When developing locally, you can test your cron jobs by visiting `http://localhost:1999/__scheduled__?cron=cron-name` in your browser.
:::

## Party.Room

Each `Party.Server` instance receives an instance of [`Party.Room`](#partyroom) as a constructor parameter, and can use it to access the room state and resources such as storage, connections, id, and more.

```ts
import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {
    // ...
  }
}
```

### Room.id

Room ID defined in the Party URL, e.g. `/parties/:name/:id`.

### Room.internalID

Internal ID assigned by the platform. Use `Room.id` instead.

### Room.env

Environment variables defined for this project.

Related reading: [Managing environment variables with PartyKit](/guides/managing-environment-variables).

### Room.storage

A per-room, asynchronous key-value storage.

- The key must be a string with a max size of 2,048 bytes.
- The value can be any type supported by the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm), limited to 128 KiB (131,072 bytes) per value

```ts
// write arbitrary data
const input = { username: "jani" };
await this.room.storage.put("user", { user });
// read data
const user = await this.room.storage.get<{ username: string }>("user");
```

Related reading: [Persisting state into storage](/guides/persisting-state-into-storage).

### Room.context

Additional information about other resources in the current project.

#### Room.context.parties

Access other parties in this project.

```ts
const otherParty = this.room.context.parties.other;
const otherPartyInstance = otherParty.other.get("room-id");
const req = await otherRoom.fetch({ method: "GET" });
const res = await req.json();
```

Read more: [Using multiple parties per project](/guides/using-multiple-parties-per-project)

#### Room.context.ai

Access to the AI binding defined in the project.

Related reading: [PartyKit AI](/reference/partykit-ai/)

#### Room.context.vectorize

Access to Vectorize Indexes defined in the project.

Related reading: [PartyKit AI](/reference/partykit-ai/)

### Room.broadcast

Send a message to all connected clients, except connection ids listed in the second array parameter.

```ts
this.room.broadcast(message, [sender.id]);
```

**Related guide:** [Building a Real-time WebSocket server](/guides/building-a-real-time-websocket-server)

### Room.getConnection

Get a connection by connection id. Returns a [`PartyConnection`](#partyconnection) `undefined` if connection by id doesn't exist.

### Room.getConnections

Get all currently connected WebSocket connections. Returns an iterable list of [`PartyConnection`](#partyconnection)s.

Optionally, you can provide a tag to filter returned connections.

```ts
const playerCount = [...this.room.getConnections()].length;
for (const everyone of this.room.getConnections()) {
  everyone.send(`Let's play!`);
}
for (const tagged of this.room.getConnections("some-tag")) {
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

##### Party.Connection.setState

`setState` allows you to store small pieces of data on each connection.

Unlike [`Room.storage`](#roomstorage), connection state is not persisted, and will only exist for the lifetime of the WebSocket connection.

```ts
connection.setState({ username: "jani" });
```

:::danger[State size]
The maximum size of the state you can store on a connection is 2KB. If you try to store values larger than 2KB, `setState` will throw an error.

For larger state, use [`Room.storage`](#roomstorage) instead.
:::

##### Party.Connection.state

Read state stored with [`Party.Connection.setState`](#partyconnectionsetstate).

```ts
const user = connection.state?.username;
```

##### Party.Connection.serializeAttachment

**Deprecated**. Use [`Party.Connection.setState`](#partyconnectionsetstate) instead.

##### Party.Connection.deserializeAttachment

**Deprecated**. Use [`Party.Connection.state`](#partyconnectionstate) instead.

## Party.Request

Wraps an underlying Cloudflare runtime [Request](https://developers.cloudflare.com/workers/runtime-apis/request/).

## Party.Lobby

Provides access to a limited subset of room resources for `onBeforeConnect` and `onBeforeRequest` methods.

### Party.Lobby.id

See: [`Room.id`](#roomid)

### Party.Lobby.env

See: [`Room.env`](#roomenv)

### Party.Lobby.parties

See: [`Room.context.parties`](#roomcontextparties)

### Party.Lobby.ai

Access to the AI binding defined in the project.

Related reading: [PartyKit AI](/reference/partykit-ai/)

### Party.Lobby.vectorize

Access to Vectorize Indexes defined in the project.

Related reading: [PartyKit AI](/reference/partykit-ai/)

## Party.FetchLobby

Provides access to a limited subset of project resources for the `onFetch` method:

### FetchLobby.env

Environment variables defined for this project.

Related reading: [Managing environment variables with PartyKit](/guides/managing-environment-variables).

### FetchLobby.parties

Access other parties in this project.

```ts
const otherParty = lobby.parties.other;
const otherPartyInstance = otherParty.other.get("room-id");
const req = await otherRoom.fetch({ method: "GET" });
const res = await req.json();
```

Read more: [Using multiple parties per project](/guides/using-multiple-parties-per-project)

### FetchLobby.ai

Access to the AI binding defined in the project.

Related reading: [PartyKit AI](/reference/partykit-ai/)

### FetchLobby.vectorize

Access to Vectorize Indexes defined in the project.

Related reading: [PartyKit AI](/reference/partykit-ai/)

## Party.FetchSocket

Wraps a standard [`WebSocket`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket), with an additional `request` property that contains the original HTTP request.

## Party.Cron

Describes a cron job that is about to be executed. You can use it to access the cron's name, definition and scheduledTime.

## Party.CronLobby

Provides access to a limited subset of project resources for the `onCron` method:

### CronLobby.env

Environment variables defined for this project.

Related reading: [Managing environment variables with PartyKit](/guides/managing-environment-variables).

### CronLobby.parties

Access other parties in this project.

```ts
const otherParty = lobby.parties.other;
const otherPartyInstance = otherParty.other.get("room-id");
const req = await otherRoom.fetch({ method: "GET" });
const res = await req.json();
```

Read more: [Using multiple parties per project](/guides/using-multiple-parties-per-project)

### CronLobby.ai

Access to the AI binding defined in the project.

Related reading: [CronLobby AI](/reference/partykit-ai/)

### CronLobby.vectorize

Access to Vectorize Indexes defined in the project.

Related reading: [PartyKit AI](/reference/partykit-ai/)
