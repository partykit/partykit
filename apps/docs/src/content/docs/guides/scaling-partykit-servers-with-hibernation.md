---
title: Scaling PartyKit servers with Hibernation
description: Hibernation API enables your app to scale to tens of thousands of connections.
sidebar:
    hidden: true
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

PartyKit enables your app to scale up to tens of thousands of connections. This is achieved thanks to the Hibernation API, which allows offloading the memory burden to the PartyKit platform instead of managing them inside the Party instance process.

- PartyKit can scale up to tens of thousands of connections, thanks to Hibernation
- The limit to scale per party instance is typically the 128MB memory
- Maintaining WebSocket connections requires a lot of memory
- Hibernation is a feature that allows offloading the memory burden to the PartyKit platform instead of managing them inside the party instance process

Insert graphic here?

## Benefits

- Allows a single party instance to handle vastly more active connections than it would be otherwise.
- Theoretical maximums:
  - Without hibernations: up to 100 connections per party instance
  - With hibernation: 32,000 connections per party instance
- In practice, your mileage may vary depending on the performance characteristics of the code you run on PartyKit, as the memory usage or CPU time may exceed what a single Party is able to do.
  - TODO: Reference/link Cloudflare Durable Objects limits


### Memory use in PartyKit

Memory is typically used by the following:

- Connections
- Code size (e.g. third party libraries)
- State (class fields you keep in memory between requests)
- Dynamic allocations (memory used by JavaScript for local variables, execution stack etc.)


## How it works

- Normally, we keep the `Party.Server` instance in memory as long as there are connected WebSockets
- With Hibernation, the party goes to sleep ("hibernates") when it's not actively handling a messages. This means the `Party.Server` instance is unallocated by the platform, while the platform still manages the open connections to clients.
  - When the party hibernates, the clients don't notice anything. The connections are maintained.
- The server behaviour changes: When the party comes back to hibernation, we instantiate a new instance of the `Party.Server` class, which means the constructor and `onStart` callback are executed again
  - This can happen quite frequently (think after few seconds of inactivity, i.e. no messages received from any client, or no alarms or other background processes keeping the room alive)

## Who is it for

- When you want to have more than 100 connected clients simultaneously
- When you don't need to maintain in-memory state between messages, you should always opt into hibernation, as this will lower the cost as the party is unloaded from memory when it's not being used
    - For example a relay server, where the use case is message passing between clients
- "Infrequent writes" use cases -- when clients rarely send messages, you can also lower the cost
- "HTTP-only writes" use cases -- when writes are done via e.g. HTTP POST request, and WebSockets are used solely for pushing messages to clients, such as webhooks

## Who is it not for

- Servers that depends on state for message handling that is expensive to recreate (e.g. make an API call to a external service to fetch some state)
- Y.js -- `y-partykit` doesn't currently support hibernation

## Limitations

- Manually attaching event handlers in `onConnect` will not work. As soon as the party hibernates, these handlers are lost. Use `onMessage` and `onClose` instead.
- Currently, the local `partykit dev` development environment does not hibernate. This means the behaviour of the code while developing can be different from behaviour on the hosted platform. (We are working on this...)

## Patterns

When using Hibernation, there are some programming patterns that make it work better.

### Partial state loading

- Tradeoff: If your Party requires state, you'll need to persist it either to party storage, or an external database or API, and reload it when the party is woken up from hibernation.
  - If loading the state is expensive (e.g. large amounts of state stored in party storage, or a slow API call), this means that message handling can be slow, as the party will have to wait for the state to load before running in the `onMessage` callback.


- Partial state loading: Don't load the full party state from storage in `onStart`, only read from storage what you need, when you need it.
  - Store state under multiple keys, instead of everything under one key.
  - Tip: The PartyKit `storage` API has its own built-in cache, so reading the same key frequently is very performant, because the result is cached in memory instead of having to read it from disk every time.


Don't
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
      this.party.broadcast(event.data)
    }

    if (event.type === "update") {
      const item = this.items[event.id];
      this.items[event.id] = {
        ...item,
        ...event.data
      };
    }

    // BAD
    // we need to persist the whole state again (expensive)
    await this.party.storage.put("items", this.items);
  }
} 
```
  
Do

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
      this.party.broadcast(event.data)
      // store each item under a separate key
      this.party.storage.put(`item:${event.id}`, event.data);
    }

    if (event.type === "update") {
      // GOOD: read stored state on-demand when needed
      const item = await this.party.storage.get(`item:${event.id}`) ?? {};
      const updatedItem = {
        ...item,
        ...event.data
      };

      // GOOD: now we need to write only to a single key
      this.party.storage.put(`item:${event.id}`, updatedItem);
    }
  }
} 
```



