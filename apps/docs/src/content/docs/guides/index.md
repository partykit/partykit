---
title: Building a WebSocket server
description: This guide provides an overview of building a PartyKit server
---

:::note[Run it yourself]
To try this code yourself, follow the [Quickstart](/quickstart/) guide to create a new PartyKit project.
:::

Every PartyKit server accepts WebSocket connections by default:

```ts
// server.ts
import type * as Party from "partykit/server";

export default class WebSocketServer implements Party.Server {}
```

You can connect to it using the [`PartySocket`](/reference/partysocket-api/) client library.

```ts
// client.ts
import PartySocket from "partysocket";

// connect to our server
const partySocket = new PartySocket({
  host: "localhost:1999",
  room: "my-room"
});

// send a message to the server
partySocket.send("Hello everyone");

// print each incoming message from the server to console
partySocket.addEventListener("message", (e) => {
  console.log(e.data);
});
```

This will automatically open a WebSocket connection to the PartyKit server at `ws://localhost:1999/party/my-room`, and send a greeting message.

The `room` id, in this case `"my-room"`, uniquely identifies the room that you're connecting to. Each time you use a new room id, a new PartyServer instance is created.

This means that two clients connecting with the same `room` id will always be connected to the same server and can communicate to each other. In other words, creating new server instances is as easy as using a new id.

### Handling incoming messages

However, the server doesn't do anything yet! Let's fix that by adding an `onMessage` handler that receives all incoming messages, and sends them along to all other connected clients:

```ts
export default class WebSocketServer implements Party.Server {
  constructor(readonly room: Party.Room) {}
  onMessage(message: string, sender: Party.Connection) {
    // send the message to all connected clients
    for (const conn of this.room.getConnections()) {
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

This works, because the `Room` maintains references to all connected clients. You can access them using the `Room.getConnections()` method.

This pattern is called "broadcasting" -- a message from one client is received and sent to everyone. In fact, this use case is so common that PartyKit includes a `broadcast` utility method that does the same thing as the `for...of` loop through connections.

```ts
this.room.broadcast(message);
```

The above can be simplified to:

```ts
export default class WebSocketServer implements Party.Server {
  constructor(readonly room: Party.Room) {}
  onMessage(message: string, sender: Party.Connection) {
    this.room.broadcast(message, [sender.id]);
  }
}
```

That's it! We've implemented a simple WebSocket broadcast server in just 5 lines of code.

### Handling connection events

Let's make our server a little friendlier and notify other members when new users connect and disconnect:

```ts
export default class WebSocketServer implements Party.Server {
  constructor(readonly room: Party.Room) {}
  // when a client sends a message
  onMessage(message: string, sender: Party.Connection) {
    // send it to everyone else
    this.room.broadcast(message, [sender.id]);
  }
  // when a new client connects
  onConnect(connection: Party.Connection) {
    // welcome the new joiner
    connection.send(`Welcome, ${connection.id}`);
    // let everyone else know that a new connection joined
    this.room.broadcast(`Heads up! ${connection.id} joined the party!`, [
      connection.id
    ]);
  }
  // when a client disconnects
  onClose(connection: Party.Connection) {
    this.room.broadcast(`So sad! ${connection.id} left the party!`);
  }
}
```

Now, when you connect to the server, you'll see the following message:

> Welcome, 07f60783-d421-4ce4-a408-5e1c0588c2d2

And every other connected client will see the following:

> Heads up! 07f60783-d421-4ce4-a408-5e1c0588c2d2 joined the party!

### Putting into action

That's all it takes to create a real-time WebSocket server with PartyKit. To learn more about common patterns and uses cases, head over to the [Examples](/examples/) section.
