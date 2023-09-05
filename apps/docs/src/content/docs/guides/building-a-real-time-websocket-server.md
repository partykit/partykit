---
title: Building a WebSocket server
description: ...
---

:::note[Run it yourself]
To try this code yourself, follow the [Quickstart](../../quickstart/) guide to create a new PartyKit project.
:::

Every PartyKit server accepts WebSocket connections by default:

```ts
// server.ts
import type { PartyServer } from "partykit/server";

export default class WebSocket implements PartyServer { }
```

You can connect to it using the [`PartySocket`](../../reference/partysocket-api/) client library. 

```ts
// client.ts
import PartySocket from "partysocket";

// connect to our server
const partySocket = new PartySocket({
  host: "localhost:1999",
  room: "my-room",
});

// send a message to the server
partySocket.send("Hello everyone!");

// print each incoming message from the server to console
partySocket.addEventListener("message", (e) => {
  console.log(e.data);
});
```

This will automatically open a WebSocket connection to the PartyKit server at `ws://localhost:1999/party/my-room`, and send a greeting message.

The `room` id, in this case `"my-room"`, uniquely identifies the party that you're connecting to. Each time you use a new room id, we create a new PartyServer instance. 

This means that two clients connecting with the same room id will always be connected to the same server, and can communicate to each other. This also means that creating new server instances is as easy as using a new id.

### Handling incoming messages

However, the server doesn't do anything yet! Let's fix that by adding an `onMessage` handler that receives all incoming messages, and sends them along to all other connected clients:

```ts
export default class WebSocketServer implements PartyServer {
  constructor(readonly party: Party) {}
  onMessage(message: string, sender: PartyConnection) {
    // send the message to all connected clients
    for (const conn of this.party.getConnections()) {
      if (conn.id !== sender.id) {
        conn.send(`${sender.id} says: ${message}`);
      }
    }
  }
}
```

Now, every connected client will instantly see the same message in their browser console:

> 07f60783-d421-4ce4-a408-5e1c0588c2d2 says: Hey everyone!

<!-- TODO: API reference link -->
This works, because the `Party` maintains references to all connected clients. You can access them using the `Party.getConnections()` method.

This pattern is called "broadcasting" -- we receive a message from one client, and send the same message to everyone. In fact, this use case is so common that PartyKit includes a `broadcast` utility method that does the same thing as the `for...of` loop through connections.

```ts
this.party.broadcast(message);
```

So the above can be simplified to:
```ts
export default class WebSocketServer implements PartyServer {
  constructor(readonly party: Party) {}
  onMessage(message: string, sender: PartyConnection) {
    this.party.broadcast(message, [sender.id]);
  }
}
```

That's it! We've implemented a simple WebSocket broadcast server in just 5 lines of code.

### Handling connection events

Let's make our server a little friendlier and notify other members new users connect and disconnect:

```ts
export default class WebSocketServer implements PartyServer {
  constructor(readonly party: Party) {}
  // when a client sends a message
  onMessage(message: string, sender: PartyConnection) {
    // send it to everyone else
    this.party.broadcast(message, [sender.id]);
  }
  // when a new client connects
  onConnect(connection: PartyConnection) {
    // welcome the new joiner
    connection.send(`Welcome, ${connection.id}`);
    // let everyone else know that a new connection joined
    this.party.broadcast(`Heads up! ${connection.id} joined the party!`, [sender.id]);
  }
  // when a client disconnects
  onClose(connection: PartyConnection) {
    this.party.broadcast(`So sad! ${connection.id} left the party!`);
  }
}
```

Now, when you connect to the server, you'll see the following message:

> Welcome, 07f60783-d421-4ce4-a408-5e1c0588c2d2

And every other connected client will see the following:

> Heads up! 07f60783-d421-4ce4-a408-5e1c0588c2d2 joined the party!

### Putting into action

That's all it takes to create a real-time WebSocket server with PartyKit. To learn more common patterns and uses cases, head over to the [Examples](../../examples/all-examples/) section.