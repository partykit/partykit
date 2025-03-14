---
title: Using multiple parties per project
description: Splitting your PartyKit project up to separate, smaller units that can communicate with each other
---

By default, each PartyKit project defines one party called `main`:

```json
{
  "name": "multiparty",
  "main": "src/server.ts"
}
```

<!-- TODO: Link to reference -->

In addition to the `main` party, each project can define any number of additional parties using the `parties` configuration key in its `partykit.json`:

```json
{
  "name": "multiparty",
  "main": "src/server.ts",
  "parties": {
    "user": "src/user.ts",
    "connections": "src/connections.ts"
  }
}
```

This is useful for:

- Splitting unrelated functionality into different servers while deploying them together
- Composing larger systems from multiple parties that communicate with each other

### Accessing parties via HTTP or WebSocket

Each party is exposed at `/parties/:party/:room-id`, where the `party` path segment is the name of the party defined in `partykit.json`.

To connect to a party using [`PartySocket`](/reference/partysocket-api/), specify the party name in the `party` argument:

```ts
const partySocket = new PartySocket({
  host: PARTYKIT_HOST,
  room: "room-id",
  party: "connections"
});
```

### Composing with multiple parties

Composing larger applications from multiple parties can be very useful when you want to manage information at different levels of granularity.

#### Accessing parties from other parties

All parties of the project are exposed on the `Party` object, accessible using the name defined in `partykit.json`.

Let's say you've created a `"user"` party to store user and session state on a per-user basis, for example user preferences, e-commerce shopping cart, or similar. Each room (an instance of the party) is distinguishable by its id.

You can communicate with any room:

```ts
const userParty = this.room.context.parties.user;
const userRoom = userParty.get(userId);

// make an HTTP request to the room
const res = await userRoom.fetch({ method: "GET" });

// or open a WebSocket connection to the room to listen to messages
const socket = await userRoom.socket();
```

#### Example: Tracking connections across rooms

Let's now look at a more fleshed-out example.

Let's say you want to keep track of all room instances, and see how many active connections there are to each room.

You can define a `connections` party that keeps track of the number of active connections when it receives an update via an HTTP `POST` request:

```ts
// src/connections.ts
export default class Rooms implements Party.Server {
  connections: Record<string, number> | undefined;
  constructor(readonly party: Party) {}

  async onRequest(request: Party.Request) {
    // read from storage
    this.connections =
      this.connections ?? (await this.room.storage.get("connections")) ?? {};
    // update connection count
    if (request.method === "POST") {
      const update = await request.json();
      const count = this.connections[update.roomId] ?? 0;
      if (update.type === "connect")
        this.connections[update.roomId] = count + 1;
      if (update.type === "disconnect")
        this.connections[update.roomId] = Math.max(0, count - 1);

      // notify any connected listeners
      this.broadcast(JSON.stringify(this.connections));

      // save to storage
      await this.room.storage.put("connections", this.connections);
    }

    // send connection counts to requester
    return new Response(JSON.stringify(this.connections));
  }
}
```

Any other party can notify the `connections` party of connection/disconnection events by calling `fetch`:

```ts
// src/main.ts
export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    this.updateConnections("connect", connection);
  }
  async onClose(connection: Party.Connection) {
    this.updateConnections("disconnect", connection);
  }
  async updateConnections(
    type: "connect" | "disconnect",
    connection: Party.Connection
  ) {
    // get handle to a shared room instance of the "connections" party
    const connectionsParty = this.room.context.parties.connections;
    const connectionsRoomId = "active-connections";
    const connectionsRoom = connectionsParty.get(connectionsRoomId);

    // notify room by making an HTTP POST request
    await connectionsRoom.fetch({
      method: "POST",
      body: JSON.stringify({
        type,
        connectionId: connection.id,
        roomId: this.room.id
      })
    });
  }
}
```
