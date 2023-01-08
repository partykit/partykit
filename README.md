## partykit

Everything's better with friends.

`partykit` is a software development kit for building realtime collaborative applications. You can use it with your existing web applications, or build new ones from scratch.

You can create a server with very little code:

```ts
// server.ts

export default {
  onConnect(websocket, room) {
    // called whenever a user join a room
    websocket.send("hello from room: " + room.id);
  },
};
```

Then run `npx partykit server.ts` to start the server for local development. You can later deploy it to the cloud with `npx partykit publish server.ts --name my-party`.

Then, in your application, you can connect to this server with a simple client:

```ts
// PartySocket is a small abstraction over
// WebSocket that adds reconnection logic, etc.
import PartySocket from "partysocket";

const socket = new PartySocket({
  // for local development
  host: "localhost:1999",
  // for production
  // host: "my-party.username.partykit.dev",
  room: "my-room",
});

socket.on("message", (message) => {
  console.log(message); // "hello from room: my-room"
});
```

This way, you can add realtime collaboration to your existing web application with very little code. It runs alongside your existing application, and you can use it to build realtime features like collaborative text editors, multiplayer games, and more.

### y-partykit

[Yjs](https://yjs.dev) is a library of data structures for building collaborative applications. `y-partykit` is a library that makes it easy to host backends for [Yjs](https://yjs.dev) on partykit. You can create a yjs backend with as little code as this:

```ts
// server.ts
import { onConnect } from "y-partykit";

export default { onConnect };
```

Then, you can use the provider to connect to this server:

```ts
import YPartyKitProvider from "y-partykit/provider";

const provider = new YPartyKitProvider("localhost:1999", "my-room", doc);
```

### party.io

`party.io` is a library heavily influenced by [socket.io](https://socket.io). It's an abstraction over `partysocket` that makes it easy to build realtime applications. You might use it on the client:

```ts
import Party from "party.io";

const io = new Party({
  // for local development
  host: "localhost:1999",
  // for production
  // host: "my-party.username.partykit.dev",
});

const socket = io.join("my-room");

socket.emit("hello", "world"); // named events

socket.emit("hello", { nested: { object: "world" } }, ["some", "array"]); // nested objects and arrays

socket.emit("hello", [1, 2, 3], (...args) => {
  // callbacks
});

socket.on("hello", (arg1, arg2, callback) => {
  // subscribe to events
});
```

And on the server:

```ts
import { onConnect } from "party.io";

export default {
  onConnect(ws, room) {
    onConnect(ws, room, (socket) => {
      socket.on("hello", (arg1, arg2, callback) => {
        // subscribe to events
      });

      socket.emit("hello", "world"); // named events
      // ...and so on
    });
  },
};
```
