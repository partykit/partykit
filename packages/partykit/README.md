## partykit

[PartyKit](https://partykit.io/) is a platform designed for creating real-time collaborative applications.

Whether you wish to augment your existing applications or make new ones from scratch, PartyKit makes the task easier with minimal coding effort.

## Quick start

You can create a PartyKit project by running:

```sh
npm create partykit@latest
```

This will ask a few questions about your project and create a new directory with a PartyKit application, including a server and a client. From inside the directory, you can then run `npm run dev` to start the development server. When you'reready, you can deploy your application on to the PartyKit cloud with `npm run deploy`.

## From scratch

The fundamental components of a PartyKit application are the server and the client. The server is a JavaScript module exporting an object that defines how your server behaves, primarily in response to WebSocket events. The client connects to this server and listens for these events.

For a quick demonstration, we will create a server that sends a welcome message to the client upon connection to a room. Then, we will set up a client to listen for this message.

First, install PartyKit through npm:

```sh
npm install partykit partysocket
```

Then, let's create our server:

```ts
// server.ts
export default {
  // This function is called when a client connects to the server.
  async onConnect(connection, room, context) {
    // You can send messages to the client using the connection object
    connection.send("hello from room: " + room.id);
    console.log(`Connection URL: ${context.request.url}`);

    // You can also listen for messages from the client
    connection.addEventListener("message", (evt) => {
      console.log(evt.data, connection.id); // "hello from client (id)"

      // You can also broadcast messages to all clients in the room
      room.broadcast(
        `message from client: ${evt.data} (id: ${connection.id}")`,
        // You can exclude any clients from the broadcast
        [connection.id] // in this case, we exclude the client that sent the message
      );
    });
  },
  // optionally, you can respond to HTTP requests as well
  async onRequest(request, room) {
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

You can add further configuration including passing variables, substituting expressions, and more with a `partykit.json` file. For example:

```jsonc
{
  "name": "my-cool-partykit-project",
  "main": "server.ts", // path to the server file
  "vars": {
    // variables to pass to the server
    // these can be accessed in the server under `room.env`
    "MY_VAR": "my-value" // access with `room.env.MY_VAR`
    // You can also pass vars with the CLI --var flag
    // For example, `npx partykit dev server.ts --var MY_VAR=my-value`
  },
  "define": {
    // substitute expressions
    // for example, you can use this to pass the room name to the server
    "process.env.MAGIC_NUMBER": "42" // all instances of `process.env.MAGIC_NUMBER` in the server will be replaced with `42`
    // You can also pass defines with the CLI --define flag
    // For example, `npx partykit dev server.ts --define process.env.MAGIC_NUMBER=42`
  }
}
```

See more details in the [reference docs](./docs/reference.md).

Next, connect your application to this server with a simple client:

```ts
// Import PartySocket - a lightweight abstraction over WebSocket
// that handles resilence, reconnection, and message buffering
import PartySocket from "partysocket";

const socket = new PartySocket({
  host: "localhost:1999", // for local development
  // host: "my-party.username.partykit.dev", // for production
  room: "my-room",
});

socket.addEventListener("message", (evt) => {
  console.log(evt.data); // "hello from room: my-room"
});

// You can also send messages to the server
socket.send("hello from client");
```

Configure your bundler/server of choice to serve the client code (like [`vite`](https://vitejs.dev/), [next.js](https://nextjs.org/) etc). Alternately, use PartyKit's inbuild serving/bundling capabilities.

### Serve and bundle Static assets

You can serve static assets (like html, css, js, images) from PartyKit. Keep them in a directory (say `./public`), and pass `--serve public` to the `dev`/`deploy` commands. These assets will be served from the root of your domain. You can also compile and bundle your client code with configuration. For example, in your `partykit.json` file:

```jsonc
{
  // ...
  "serve": {
    "path": "public",
    "build": "path/to/client.ts"
  }
}
```

See additional configuration that you can pass to `serve` and `serve.build` in the [reference docs](./docs/reference.md).
