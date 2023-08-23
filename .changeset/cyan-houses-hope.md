---
"partykit": patch
---

# New class-based `PartyServer` API

PartyKit now supports a new ES6 Class-based API.

## TL;DR;

Before:

```ts
import type {
  PartyKitServer,
  PartyKitRoom,
  PartyKitConnection,
} from "partykit/server";

export default {
  onBeforeConnect(request: Request) {
    request.headers.set("X-User", getUser(request.headers.Authorization));
    return request;
  },
  onConnect(connection: PartyKitConnection, room: PartyKitRoom) {
    room.broadcast(`Someone joined room ${room.id}!`);
  },
} satisfies PartyKitServer;
```

After:

```ts
import type {
  Party,
  PartyConnection,
  PartyRequest,
  PartyServer,
  PartyWorker,
} from "partykit/server";

export default class MyParty implements PartyServer {
  constructor(public party: Party) {}

  static onBeforeConnect(request: PartyRequest) {
    request.headers.set("X-User", getUser(request.headers.Authorization));
    return request;
  }

  onConnect(connection: PartyConnection) {
    this.party.broadcast(`Someone joined room ${this.party.id}!`);
  }
}

MyParty satisfies PartyWorker;
```

The old API remains supported for the time being, but we highly recommend starting all new projects with the new API, as the old API may be deprecated in the future.
## New Class-based API

Previously, you created PartyKit servers by exporting an plain object that defines handlers for different events that occur in a room.  This was nice and terse, but we found a lot of room for improvement:

- This API didn't accurately convey PartyKit's mental model of each party being a stateful object (backed by a CloudFlare Durable Object)
- It was hard to manage derived state safely
- It was hard to distinguish between code that runs in the Edge worker near the user (e.g.`onBeforeConnect`) and the Party worker that runs where the room was first created (e.g. `onConnect`).
- The naming of different concepts (parties, rooms, etc) was ambiguous

With this feedback in mind, we've redesigned PartyKit's primary server interface with a new ES6 Class-based API.

The following code sample demonstrates the new API, with comments describing what's changing:

```ts
import type {
  Party,
  PartyConnection,
  PartyRequest,
  PartyServer,
  PartyWorker,
  PartyServerOptions,
  PartyConnectionContext,
} from "partykit/server";

// PartyKit servers now implement PartyServer interface
export default class Main implements PartyServer {
  // onBefore* handlers that run in the worker nearest the user are now
  // explicitly marked static, because they have no access to Party state
  static async onBeforeRequest(request: PartyRequest) {}
  static async onBeforeConnect(request: PartyRequest) {}

  // onFetch is now stable. No more unstable_onFetch
  static async onFetch(req: PartyRequest) {}

  // Opting into hibernation is now an explicit option
  readonly options: PartyServerOptions = {
    hibernate: true,
  };

  // Servers can now keep state in class instance variables
  messages: string[] = [];

  // PartyServer receives the Party (previous PartyKitRoom) as a constructor argument
  // instead of receiving the `room` argument in each method.
  readonly party: Party;
  constructor(party: Party) {
    this.party = party;
  }

  // There's now a new lifecycle method `onStart` which fires before first connection
  // or request to the room. You can use this to load data from storage and perform other
  // asynchronous initialization. The Party will wait until `onStart` completes before
  // processing any connections or requests.
  async onStart() {
    this.messages = (await this.party.storage.get<string[]>("messages")) ?? [];
  }

  // You can now tag connections, and retrieve tagged connections using Party.getConnections()
  getConnectionTags(connection: PartyConnection, ctx: PartyConnectionContext) {
    return [ctx.request.cf?.country as string];
  }

  // onConnect, onRequest, onAlarm no longer receive the room argument.
  async onRequest(req: PartyRequest) {}
  async onAlarm() {}
  async onConnect(connection: PartyConnection, ctx: PartyConnectionContext) {
    // You can now read the room state from `this.party` instead.
    this.party.broadcast(JSON.stringify({ messages: this.messages }));

    const country = ctx.request.cf?.country as string;

    // room.connections is now called room.getConnections(tag?)
    // that receives an optional tag argument to filter connections
    for (const compatriot of this.party.getConnections(country)) {
      compatriot.send(
        JSON.stringify({ message: `${connection.id} is also from ${country}!` })
      );
    }
  }

  // Previously onMessage, onError, onClose were only called for hibernating parties.
  // They're now available for all parties, so you no longer need to manually
  // manage event handlers in onConnect!
  async onError(ws: PartyConnection, err: Error) {}
  async onClose(ws: PartyConnection) {}
  async onMessage(message: string, connection: PartyConnection) {}
}

// Optional: Typecheck the static methods with a `satisfies` statement.
Main satisfies PartyWorker;
```

In addition to moving from an object syntax to class syntax, we've introduced multiple improvements to developer ergonomics:

## `onStart` handler

PartyKit servers are convenient, because they're stateful, but you still need to make sure to store the state into room storage for when the room restarts due to inactivity or exceeding its maximum CPU time.

There's now a new lifecycle method `onStart` which fires before first connection or request to the room. You can use this to load data from storage and perform other asynchronous initialization, such as retrieving data or configuration from other services or databases.

```ts
  // Servers can now keep state in class instance variables
  messages: string[] = [];
  async onStart() {
    this.messages = (await this.party.storage.get<string[]>("messages")) ?? [];
  }
```

The Party will wait until `onStart` completes before processing any connections or requests to the party.

## Better support for Hibernatable WebSockets

In order to support scaling parties to tens of thousands of concurrent connections, PartyKit supports CloudFlare Durable Object [Hibernatable WebSockets API](https://developers.cloudflare.com/durable-objects/api/hibernatable-websockets-api).

When opting into hibernation, the server goes to sleep between messages, and only comes alive when there is work to be performed, making it more cost-effective and easier to scale. Hibernation comes with tradeoffs: for certain type of applications, you may want to keep the server in memory for longer between requests.

### Explicit hibernation opt-in

Previously, we automatically opted you into "hibernation mode" when you defined an `onMessage` handler in your server. Now, you can define an `options.hibernate` field, which defaults to `false`:

```ts
  readonly options: PartyServerOptions = {
    hibernate: true,
  };
```

### More convenient message handling

Previously the so-called "hibernation-mode handlers" `onMessage`, `onError`, `onClose` were only called when you opted into hibernation. They're now available for all servers, so you no longer need to manually manage event handlers in `onConnect`:

```ts
  async onMessage(message: string, connection: PartyConnection) {}
  async onError(ws: PartyConnection, err: Error) {}
  async onClose(ws: PartyConnection) {}
```

No more manually registering event handlers in `onConnect`! (Unless you want to, of course.)

### Better connection management

Previously, PartyKit managed connections in memory in a big Map, available in `room.connections`. This meant that every time your server woke up from hibernation, PartyKit needed to rehydrate all connections, which was both slow and expensive.

Now, instead, you can access connections on `Party` as follows:

```ts
// get connection by id (previously room.connections.get(id))
const connection = this.party.getConnection(id);
// iterate over all connection (previously room.connections.values())
for (const c of this.party.getConnections()) {
}
```

### Tagged connections

You can set additional metadata on connections by returning them from a `getConnectionTags` callback on `PartyServer`:

```ts
  getConnectionTags(connection: PartyConnection) {
    return ["some tag"];
  }
```

You can then filter connections by tag, removing the need to wake up hibernated sockets unnecessarily:

```ts
for (const c of this.party.getConnections("some tag")) {
}
```

## Naming changes

While designing the new API, we also wanted to be thoughtful about naming.

The biggest problem we wanted to solve was the distinction between "parties" and "rooms", which was confusing for many. From now on, we'll refer to PartyKit server instances as "parties", and will no longer use the "room" terminology.

To reflect this, we made the following names in our TypeScript types:

-  `PartyKitRoom` is now `Party`, and refers to a single server instance (i.e. Durable Object)
-  `PartyServer` refers to the instance code definition of the server (i.e. Durable Object)
-  `PartyWorker` refers to the static code definition of the server which runs in a separate worker before connecting to the Party.
-  `PartyKit*`-prefixed types are now shortened to `Party*` by dropping the "Kit". It's cleaner.
-  `room.parties` ➡️ `party.context.parties` — Represents the taxonomy and relationship between parties more clearly.
  
The old names are deprecated, but will continue to work. The deprecated names are decorated with JSDoc `@deprecated` pragmas, so you can find the types you need to rename.
## Breaking changes

There are no breaking runtime changes. Existing PartyKit projects should continue working as expected.

### Incoming request types

However, while making changes to our TypeScript types, we discovered that the type definitions for `on(Before)Request` and `on(Before)Connect` were incorrectly defined to receive a Fetch API `Request` type, whereas at runtime they would always receive a `PartyKitRequest` type, which is an instance of CloudFlare Workers -specific Request object.

We decided to fix this issue, which means you'll need to make the following change:

```diff

+ import { PartyRequest } from "partykit/server";

export default {
-  onBeforeRequest(request: Request) {
+  onBeforeRequest(request: PartyRequest) {
    return new Request(request.url, { headers: { "x-foo": "bar" } });
  }
}
```

Note that you can still return a normal `Request` -- only the input type has changed.
