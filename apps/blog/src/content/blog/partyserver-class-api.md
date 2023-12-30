---
author: Jani Eväkallio
pubDatetime: 2023-09-12T15:00:00Z
title: Party.Server — New API for a programmable primitive
postSlug: partyserver-api
tags:
  - partykit
  - engineering
  - api-design
ogImage: /content-images/partyserver-class-api-og.png
description: Why we reimagined PartyKit's API, and how to use it.
---

If you hang out in the [PartyKit Discord](https://discord.gg/g5uqHQJc3z), you may have heard we recently redesigned the primary way developers interact with PartyKit.

PartyKit makes developing real-time, collaborative, multiplayer applications simple. In this post, I'll explain how the new `Party.Server` API makes it even simpler, and more fun!

First, let's look at an example of a little chat room:

```ts
import type * as Party from 'partykit/server';
// PartyKit creates an instance Party.Server for each chatroom id
export default class Chat implements Party.Server {
  // each server instance is stateful, so we can keep data in memory
  messages: string[];
  constructor(public party: Party.Party) {}
  onConnect(conn: Party.Connection) {
    // when a client connects via WebSocket, send them the full message history
    conn.send(this.messages);
  },
  onMessage(message: string) {
    // when a client sends a WebSocket message, keep track of message history
    this.messages.push(message);
    // and broadcast it to all clients (as easy as a for-loop)
    for (const conn of this.room.getConnections()) {
      conn.send(message);
    }
  }
}
```

You can connect to a party via WebSockets from a client, for example a React app:

```ts
const socket = new PartySocket({ host: PARTYKIT_HOST, room: id });
```

or communicate with a party using a regular HTTP request, for example from a React Server Component:

```ts
const res = await fetch(`${PARTYKIT_HOST}/party/${id}`);
```

## What's going on here?

If you're new to PartyKit, you might ask, _what's the big deal?_ We've just implemented a WebSocket server. How is this different from spinning up a Node.js WebSocket server on any other hosting provider?

And if you've used PartyKit before, you might (also, reasonably) ask, _so what?_ This doesn't look that different from our old API. Granted, it looks a bit nicer, but why the big buzz?

To answer both questions, let's first answer another question:

## What is a party, really?

Parties are **globally distributed**, **stateful**, **programmable**, **on-demand** web servers.

That's a lot of words! Let's unpack:

- **Web server** — Each party is a **web server**, addressed by an unique id, in above examples referred to as `id`. Every time you connect with a **new** `id`, we create a new web server for you.
- **On-demand** — Parties are so lightweight that we can spin them up with practically zero start-up time. In this regard, they are similar to a serverless function.
- **Stateful** — Unlike a serverless function, each party is also **stateful**. Every time a new client connects with the **same** `id`, we guarantee that the connection is routed to the same `Party.Server` instance. And because it's stateful, the `Party.Server` can keep data in memory in between requests.
- **Globally distributed** — Parties are powered by Cloudflare Durable Objects. This makes them reliable, horizontally scalable, and also very fast: thanks to Cloudflare's global edge network, we can create each party in a geographical location near you, minimising network latency.
- **Programmable** — Most hosted real-time platforms offer limited or no customisability of the server-side behaviour, leading developers to implement business rules on client-side. Parties allow you to write your own business logic, or use industry-standard open source packages to implement common use cases and workflows with full customisability.

In short, parties are a novel programming primitive that make developing real-time, collaborative, multiplayer systems as easy and fun as writing a serverless function.

## `Party.Server`: a programming primitive

In designing the `Party.Server` API, we wanted to accurately convey the mental model of **globally distributed**, **stateful**, **programmable**, **on-demand** web servers, and make it easy for you, a developer, to build the functionality you need.

Let's walk through the `Party.Server` API, step by step.

### `class implements Party.Server`

Classes are a divisive topic among JavaScript developers, but for us they are the perfect fit.

By expressing each server as a class instance, we're able to convey the statefulness of the party, and make it easy to store per-party state, as we do here for `messages`.

```ts
export default class Main implements Party.Server {
  room: Party.Room;
  messages: string[];
  constructor(room: Party.Room) {
    this.room = room;
    this.messages = [];
  }
}
```

### `constructor(party: Party)`

The `Party` object gives you access to the server state, such as storage, connections, id, and more.

For example:

```ts
const messages = (await this.room.storage.get<string[]>("messages")) ?? [];
const message = `There are ${messages.length} messages in ${party.id}`;

for (const conn in party.getConnections()) {
  if (conn.id !== sender.id) {
    conn.send(message);
  }
}
```

`Party` also exposes utility methods for common tasks. For example, the above code can be be achieved with `party.broadcast`:

```ts
party.broadcast(message, [sender.id]);
```

### `onStart`

PartyKit servers are convenient, because they're stateful, but you still need to make sure to persist the state for when the room restarts due to inactivity.

In the last example we read `messages` from storage when we needed them, but it would be much more convenient (and performant) to read the messages from storage just once when the server starts.

There's now a new lifecycle method `onStart` which fires before first connection or request to the room. You can use it to load data from storage and perform other asynchronous initialization, such as retrieving data or configuration from other services or databases.

```ts
  messages: string[] = [];
  async onStart() {
    this.messages = (await this.room.storage.get<string[]>("messages")) ?? [];
  }
```

### `onConnect`, `onClose`, `onError`

Each WebSocket connection's lifecycle is now exposed on `Party.Server`:

```ts
async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
  this.room.broadcast(`${connection.id} joined`);
}
async onClose(connection: Party.Connection) {
  this.room.broadcast(`${connection.id} left`);
}
async onError(connection: Party.Connection, err: Error) {
  this.room.broadcast(`${connection.id} is having connection difficulties`);
}
```

### `onMessage`

Every WebSocket message received from any connected client is routed to `onMessage`:

```ts
async onMessage(message: string, sender: Party.Connection) {
  this.room.broadcast(message, [sender.id]);
}
```

Just as with `onClose` and `onError`, you no longer need to manually attach and detach connection event handlers to the socket.

### `onRequest`

Each `Party.Server` can also handle standard HTTP requests (`GET`, `POST`, `PUT`, and others).

```ts
async onRequest(req: Party.Request) {
  if (req.method === "POST") {
    this.messages.push(await req.json());
    return new Response("OK", { status: 200 });
  }

  return Response.json(this.messages);
}
```

As simple as this looks, being able to access the same party state with both WebSockets and HTTP requests is a very powerful pattern, enabling many interesting use cases:

- Fetching data for, as an example, React server rendering
- Interacting with the party from environments that don't support WebSockets
- Limiting access to writes (only updating state from requests and reading them via WebSockets)
- Using parties as webhooks for third-party services
- Communicating between parties (all parties in your project are available on `party.context.parties`)

### `static onBeforeRequest`, `static onBeforeConnect`

The static `onBefore*` methods allow you to modify incoming request before they're sent to the room, or prevent the request from reaching the room altogether by returning a `Response` instead.

This can be very useful for scenarios such as authentication and authorisation:

```ts
export default class Main implements Party.Server {
  static async onBeforeRequest(req: Party.Request) {
    // only allow admins to make HTTP requests
    const user = authenticate(req);
    if (!user?.isAdmin) return new Response("Unauthorized", { status: 401 });
    return req;
  }
  static async onBeforeConnect(req: Party.Request) {
    // allow anyone to connect, pass user to the party
    const user = authenticate(req);
    if (user) req.headers.set("X-User-Id", authenticate(req).userId);
    return req;
  }
}
```

As I mentioned before, parties are globally distributed across Cloudflare's edge network, which means that:

- Each party is created in a specific location, nearest to the location of the first request.
- Each subsequent request is routed to that location via an edge worker that's nearest the user

The `onBefore*` methods run in the edge worker, so we've marked them static to make it explicit that they don't have access to the party's state:

![onBefore methods](/content-images/on-before.png)

### `static onFetch`

We've added another request handler to the edge worker, `onFetch`. It runs for every request that isn't routed to a party:

```ts
export default class Main implements Party.Server {
  static onFetch(req: Party.Request) {
    return new Response(`<h1>Hello ${req.url}!</h1>`, {
      headers: { "Content-Type": "application/html" },
    });
  }
}
```

This means you can now use your PartyServer as a full-fledged web server, and serve arbitrary content to any request sent to it.

## Better support for Hibernatable WebSockets

So far, I've told you that `Party.Server` is stateful, and remains in memory between requests. This is true, and indeed very useful, but for very high-traffic or high-connection requests, this can get expensive both computationally, and in billing seconds.

In order to support scaling parties to tens of thousands of concurrent connections, PartyKit supports the Cloudflare Durable Object [Hibernatable WebSockets API](https://developers.cloudflare.com/durable-objects/api/hibernatable-websockets-api).

When opting into hibernation, the server goes to sleep between messages, and only comes alive when there is work to be performed, making it more cost-effective and easier to scale.

### Explicit hibernation opt-in

Hibernation comes with tradeoffs. For lower-concurrency applications, you may want to keep the server in memory for longer between requests.

To give you control over which execution model you prefer, you can define an `options.hibernate` field, which defaults to `false`:

```ts
  readonly options: Party.ServerOptions = {
    hibernate: true,
  };
```

### Better connection management

Previously, PartyKit managed connections in a big in-memory `Map`, available in `party.connections`. This meant that every time your server woke up from hibernation, PartyKit needed to rehydrate all connections, which was slow, expensive, and, in many cases, unnecessary.

Now, instead, you can access connections on `Party` as follows:

```ts
// get connection by id (previously room.connections.get(id))
const connection = this.room.getConnection(id);
// iterate over all connection (previously room.connections.values())
for (const c of this.room.getConnections()) {
}
```

### Tagged connections

You can set additional metadata on connections by returning them from a `getConnectionTags` callback on `Party.Server`. Here, for example, we tag each connection with its origin country:

```ts
  getConnectionTags(connection: Party.Connection, ctx: Party.ConnectionContext) {
    const country = (ctx.request.cf?.country as string) ?? "unknown";
    return [country];
  }
```

You can then filter connections by tag, removing the need to wake up hibernated sockets unnecessarily:

```ts
for (const italians of this.room.getConnections("IT")) {
  italians.send(`Buongiorno!`);
}
```

## Naming changes

While designing the new API, we also wanted to be thoughtful about naming.

The biggest problem we wanted to solve was the distinction between "parties" and "rooms", which was confusing for many. From now on, we'll refer to PartyKit server instances as "parties", and "rooms" will refer to specific party instances.

To reflect this, we made the following names in our TypeScript types:

- `PartyKitRoom` is now `Party`, and refers to a single server instance (in other words, Durable Object)
- `Party.Server` refers to the instance code definition of the server (in other words, Durable Object)
- `Party.Worker` refers to the static code definition of the server which runs in a separate worker before connecting to the Party.
- `PartyKit*`-prefixed types are now shortened to `Party.*` by dropping the "Kit". It's cleaner.
- `room.parties` ➡️ `party.context.parties` — Represents the taxonomy and relationship between parties more clearly.

The old names are deprecated, but will continue to work. The deprecated names are decorated with JSDoc `@deprecated` pragmas, so it's easier to find the types that needs to be renamed.

## Full code example

You can see a full `Party.Server` example implementation in the [partykit GitHub repository](https://github.com/partykit/partykit/blob/main/examples/class/src/server.ts).

We also have a [Next.js template](https://github.com/partykit/partykit-nextjs-chat-template) that demonstrates how to build a fully featured chatroom (with an AI participant!).

## Documentation

The `Party.Server` API is documented in detail in the [PartyKit API Reference](https://docs.partykit.io/reference/partyserver-api/).

## Feedback welcome!

That's it. Give PartyKit at try on [GitHub](https://github.com/partykit/partykit), and let us know what you think on [Discord](https://discord.gg/g5uqHQJc3z) or [Twitter](https://twitter.com/partykit_io)!
