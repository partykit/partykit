---
title: How PartyKit works
description: Understand the underlying technology of any PartyKit app
---

As we learned in [What is PartyKit](/what-is-partykit), PartyKit simplifies developing real-time and multiplayer applications. To understand how PartyKit does this, let's dive deeper into what PartyKit is, and how it works.

## Overview

PartyKit is a deployment and hosting platform for **globally distributed**, **stateful**, **on-demand**, **programmable** **web servers**.

- You **implement** the server code using the `PartyServer` JS/TS API ([see documentation](/reference/partyserver-api))
- You **deploy** the server to the PartyKit runtime using the `partykit` CLI ([see documentation](/reference/partykit-cli)).
- We **host** the servers on the PartyKit runtime (continue reading below)

## PartyKit runtime

The PartyKit runtime is a modern standards-based JavaScript environment based on the [`workerd`](https://github.com/cloudflare/workerd) runtime by Cloudflare that powers [Cloudflare Workers](https://workers.cloudflare.com/). 

The runtime is hosted on Cloudflare's global edge network, within ~50 ms reach of about 95% of the world's Internet-connected population.

In addition to running modern JavaScript, it also supports [TypeScript](https://www.typescriptlang.org/), thousands of modules from [the npm registry](https://www.npmjs.com/), and [WebAssembly modules](https://webassembly.org/).

## PartyKit servers

Above, we described PartyKit as a hosting platform for  **globally distributed**, **stateful**, **on-demand**, **programmable** **web servers**.

That's a lot of words! Let's unpack them, one by one.

#### Web server

Each PartyKit server (also known as a **Party**), is backed by a Cloudflare [Durable Object](/glossary/#durable-object).

You can communicate with a Party with standard HTTP requests:
```ts
fetch(`https://${project}.${user}.partykit.dev/parties/main/${id}`, { method: "GET"});
```

More interestingly, perhaps, you can connect to a Party using standard WebSockets, enabling real-time push between client and the party:
```ts
new WebSocket(`https://${project}.${user}.partykit.dev/parties/main/${id}`)
```

Because the Party server uses standard HTTP and WebSocket protocols, you can connect to them from anywhere: web browsers, native mobile apps, or embedded devices. 

PartyKit also provides client SDKs, such as the [PartySocket](/reference/partysocket-api/) JavaScript/TypeScript client, but they are optional.

#### Programmable

PartyKit servers are fully programmable in TypeScript, JavaScript, and using any language that can be compiled into WebAssembly modules, such as Rust, Swift or C.

```ts
export default class Server implements PartyServer {
  onRequest(req: PartyRequest) {
    return new Response("Hello via HTTP");
  },
  onConnect(connection: PartyConnection) {
    connection.send("Hello via WebSockets");
  },
  onMessage(message: string) {
    this.party.broadcast(`Received ${message} via WebSockets`);
  }
```

Unlike most hosted real-time platforms, which offer limited or no customisability of the server-side behaviour, PartyKit allows you to write your own business logic, or use industry-standard open source packages to implement common use cases and workflows.

#### On-demand

Unlike normal web servers, which you need to provision, scale and maintain yourself, PartyKit can create instances **on-demand**.

In above examples, we saw that each party instance has an unique `id`:
```ts
fetch(`https://${project}.${user}.partykit.dev/parties/main/${id}`
```

You decide the `id`. It can be any arbitrary string, but it will often correspond to an id of the document, project, room, user, or other entity that you are adding multiplayer or real-time characteristics to.

The PartyKit runtime handler request routing based on the `id`, guaranteeing that:

- Every time you connect to a Party using the **same** `id`, the PartyKit platform guarantees that the request is routed to the same Party server instance.

- Every time you connect with a **new** unique `id`, the PartyKit platform creates a new web server instance for you.

Parties are so lightweight that we can spin them up with practically zero start-up time. In this regard, they are similar to a serverless function.

#### Stateful

Unlike a serverless function, each party is also **stateful**, which means you can manage state a Party in the same way you would in any TypeScript or JavaScript class:

```ts
export default class Server implements PartyServer {
  this.messages = [];
  onMessage(message: string) {
    // keep track of messages in-memory
    this.messages.push(message);
    // send them to all connected clients
    this.party.broadcast(JSON.stringify({ messages: [message]} ));
  }
  onConnect(connection: PartyConnection) {
    // when a new client connects, send them the full message history
    connection.send(JSON.stringify({ messages: this.messages }));
  }
```

This is possible, because:

- Each Party runs in a separate [Durable Object](/glossary/#durable-object), and is fully isolated from any other process.
- PartyKit guarantees that each request or connection with the same `id` is routed to the same instance of the Party, and vice versa.

This means you can radically simplify the programming model compared to normal stateful web servers by treating each Party effectively as a single-tenant application.

#### Globally distributed

Because each party runs in a separate [Durable Object](/glossary/#durable-object) inside CloudFlare's edge network, we can create servers on-demand in any of hundreds of data centers around the world. This makes them reliable and horizontally scalable.

This is also why PartyKit servers are suitable for real-time, latency-sensitive use cases. Because we always create the server in the network-topologically nearest data center, the connection between the client and server is typically very fast.

