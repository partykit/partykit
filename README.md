# PartyKit

![npm beta](https://img.shields.io/npm/v/partykit/beta)
[![Discord](https://img.shields.io/discord/1051830863576453180?color=7289DA&logo=discord&logoColor=white)](https://discord.gg/KDZb7J4uxJ)
![License](https://img.shields.io/github/license/partykit/partykit)

[PartyKit](https://partykit.io/) is an SDK designed for creating real-time collaborative applications.

Whether you wish to augment your existing web applications or construct new ones from scratch, PartyKit makes the task easier with minimal coding effort.

:warning: Please note, all updates to `partykit` are currently published directly to npm using the `beta`` tag.

## Installation

Install PartyKit through npm:

```sh
npm install partykit@beta partysocket@beta
```

For yarn users:

```sh
yarn add partykit@beta partysocket@beta
```

## Quick Start

The fundamental components of a partykit application are the server and the client. The server is a simple JavaScript module exporting an object that defines how your server behaves, primarily in response to WebSocket events. The client connects to this server and listens for these events.

For a quick demonstration, we will create a server that sends a welcome message to the client upon connection to a room. Then, we will set up a client to listen for this message.

First, let's create our server:

```ts
// server.ts
export default {
  onConnect(websocket, room) {
    // This is invoked whenever a user joins a room
    websocket.send("hello from room: " + room.id);
  },
  // optionally, you can respond to HTTP requests as well
  onRequest(request, room) {
    return new Response("hello from room: " + room.id);
  },
};
```

To start the server for local development, run:

```sh
npx partykit dev server.ts
```

When you're ready to go live, deploy your application to the cloud using:

```sh
npx partykit deploy server.ts --name my-party
```

Next, connect your application to this server with a simple client:

```ts
// Import PartySocket - a lightweight abstraction over WebSocket
import PartySocket from "partysocket";

const socket = new PartySocket({
  host: "localhost:1999", // for local development
  // host: "my-party.username.partykit.dev", // for production
  room: "my-room",
});

socket.addEventListener("message", (message) => {
  console.log(message); // "hello from room: my-room"
});
```

## Libraries

### y-partykit

`y-partykit` is an addon library for `partykit` designed to host backends for [Yjs](https://yjs.dev), a high-performance library of data structures for building collaborative software (and particularly for text editors). You can set up a Yjs backend with just a few lines of code:

```ts
// server.ts
import { onConnect } from "y-partykit";

export default { onConnect };
```

Then, use the provider to connect to this server:

```ts
import YPartyKitProvider from "y-partykit/provider";

const provider = new YPartyKitProvider("localhost:1999", "my-room", doc);
```

Refer to the [official Yjs documentation](https://docs.yjs.dev/ecosystem/editor-bindings) for more information. Examples provided in the Yjs documentation should work seamlessly with `y-partykit` (ensure to replace `y-websocket` with `y-partykit/provider`).

## Contributing

We encourage contributions to PartyKit. If you're interested in contributing or need help or have questions, please join us in our [Discord](https://discord.gg/KDZb7J4uxJ).

## License

PartyKit is [MIT licensed](./LICENSE).
