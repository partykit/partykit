---
title: Scaling PartyKit servers with Hibernation
description: Hibernation API enables your app to scale to tens of thousands of connections.
---

Hibernation API enables your app to scale to tens of thousands of connections. This page provides an overview of the Hibernation API - what it is, how it works, when it’s useful, and how to implement it.

## Opting into Hibernation

Opting into Hibernation is done with the following code:

```ts
export default class Server implements Party.Server {
  options: Party.ServerOptions = {
    hibernate: true,
  };
}
```

## Background

PartyKit enables your app to scale up to tens of thousands of connections. This is achieved thanks to the Hibernation API, which offloads the memory burden to the PartyKit platform from the party instances processes.

<!-- graphic -->

Additionally, you no longer need to maintain WebSocket connections which require a lot of memory.

:::danger[Scale limit]
Please note that the limit to scale per party instance is typically 128MB memory.
:::

## Benefits

The main benefit of Hibernation is allowing a single party instance to handle vastly more active connections than it would be otherwise.

| Without Hibernation                          | With Hibernation                                |
| -------------------------------------------- | ----------------------------------------------- |
| up to **100 connections** per party instance | up to **32,000 connections** per party instance |

Please note that the number of working connections may vary depending on the performance characteristics of the code you run on PartyKit (for example, [memory usage or CPU time](https://developers.cloudflare.com/durable-objects/platform/limits/)).

:::tip[Memory use in PartyKit]
Memory is typically used by the following:

- Active connections,
- Code size - for example, third-party libraries,
- State - class fields you keep in memory between requests,
- Dynamic allocations - memory used by JavaScript for local variables, execution stack, and so on
  :::

## How Hibernation works

By default, PartyKit keeps the `Party.Server` instance in memory as long as there are connected WebSockets.

With Hibernation, the party goes to sleep ("hibernates") when it's not actively handling messages. This means that the `Party.Server` instance is unallocated by the platform, while the platform still manages the open connections to clients. The clients don't notice anything as the connections are maintained. As soon as a client sends a message, a new party instance is instantiated with the constructor and `onStart` callback executed again.

This process can happen quite frequently - with no messages from any client, no alarms, or no other background processes keeping the room alive, it goes into hibernation after a few seconds.

## Who is it for

Hibernation is well-suited for the following use cases:

- Your app will have more than 100 connected clients simultaneously.
- Your app will have 'infrequent writes' (when clients rarely send messages), which will lower the usage cost.
- Your app is based on 'HTTP-only writes', which is when writes are done via for example HTTP POST request, and WebSockets are used solely for pushing messages to clients (for example, webhooks).
- You don't need to maintain in-memory state between messages, you should always opt into hibernation, as this will lower the cost as the party is unloaded from memory when it's not being used. A good example is message passing between clients like a relay server.

## Who is it not for

Hibernation does not perform well in the following cases:

- If your server depends on state for message handling that is expensive to recreate (for example, when it includes an API call to an external service to fetch data)
- If you're building with `Yjs` as `y-partykit` doesn't currently support Hibernation.

## Limitations

While using Hibernation, please note that:

- Attaching event handlers manually in `onConnect` will not work. As soon as the party hibernates, these handlers are lost. Use `onMessage` and `onClose` instead.
- The local `partykit dev` development environment does not Hibernate. This means the behaviour of the code while developing can be different from behaviour on the hosted platform. (This is an item on our roadmap.)

## Patterns

When using Hibernation, there are some programming patterns that make it work better.

### Partial state loading

Instead of loading the full state from storage in `onStart` lifecycle method, only read from storage the data you need, and only when you need it. To do so, store state under multiple keys, instead of one key.

If your party instance requires state, you will need to persist it either to party storage, an external database, or an API, and reload it when the party is woken up from hibernation.

:::tip[PartyKit `storage`]
The PartyKit `storage` API has its own built-in cache, so reading the same key frequently is very performant, because the result is cached in memory instead of having to read it from disk every time.
:::

If loading the state is expensive (for example, large amounts of state stored in party storage, or a slow API call), message handling may be slower, as the party will have to wait for the state to load before running in the `onMessage` callback.

#### Example

⛔️ **DON'T**

```ts
type AllItems = Record<string, any>;

export default class Server implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };
  constructor(readonly party: Party.Party) {}
  async onStart() {
    // BAD
    // we load full state from storage on start (may be big)
    this.items = await this.party.storage.get<AllItems>("state");
  }

  async onMessage(websocketMessage: string) {
    const event = JSON.parse(websocketMessage);
    if (event.type === "create") {
      this.items[event.id] = event.data;
      this.party.broadcast(event.data);
    }

    if (event.type === "update") {
      const item = this.items[event.id];
      this.items[event.id] = {
        ...item,
        ...event.data,
      };
    }

    // BAD
    // we need to persist the whole state again (expensive)
    await this.party.storage.put("items", this.items);
  }
}
```

✅ **DO**

```ts
type AllItems = Record<string, any>;

export default class Server implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };
  constructor(readonly party: Party.Party) {}

  // GOOD: no data loading on startup
  // onStart() {}

  async onMessage(websocketMessage: string) {
    const event = JSON.parse(websocketMessage);
    if (event.type === "create") {
      this.party.broadcast(event.data);
      // store each item under a separate key
      this.party.storage.put(`item:${event.id}`, event.data);
    }

    if (event.type === "update") {
      // GOOD: read stored state on-demand when needed
      const item = (await this.party.storage.get(`item:${event.id}`)) ?? {};
      const updatedItem = {
        ...item,
        ...event.data,
      };

      // GOOD: now we need to write only to a single key
      this.party.storage.put(`item:${event.id}`, updatedItem);
    }
  }
}
```
