<img width="870" alt="image" src="https://github.com/partykit/partykit/assets/18808/485d32ff-cbee-4b03-8673-c594200774a2">

![npm beta](https://img.shields.io/npm/v/partykit)
[![Discord](https://img.shields.io/discord/1051830863576453180?color=7289DA&logo=discord&logoColor=white)](https://discord.gg/g5uqHQJc3z)
![License](https://img.shields.io/github/license/partykit/partykit)

[PartyKit](https://partykit.io/) is a platform designed for creating real-time collaborative applications.

Whether you wish to augment your existing applications or make new ones from scratch, PartyKit makes the task easier with minimal coding effort.

## Quick start

You can create a PartyKit project by running:

```sh
npm create partykit@latest
```

This will ask a few questions about your project and create a new directory with a PartyKit application, that includes a server and a client. From inside the directory, you can then run `npm run dev` to start the development server. When you'reready, you can deploy your application on to the PartyKit cloud with `npm run deploy`.

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

## Libraries

### y-partykit

`y-partykit` is an addon library for `partykit` designed to host backends for [Yjs](https://yjs.dev), a high-performance library of data structures for building collaborative software. You can set up a Yjs backend with just a few lines of code:

```ts
// server.ts
import { onConnect } from "y-partykit";

export default {
  async onConnect(conn, room, context) {
    return onConnect(conn, room);
  },
};
```

You can pass additional options for more complex backends:

```ts
// server.ts
import { onConnect } from "y-partykit";

export default {
  async onConnect(conn, room, context) {
    return await onConnect(conn, room, {
      // experimental: persist the document to partykit's room storage
      persist: true,

      // enable read only access to true to disable editing, default: false
      readOnly: true,

      // Or, you can load/save to your own database or storage
      load() {
        // load a document from a database, or some remote resource
        // and return a Y.Doc instance here (or null if no document exists)
      },
      callback: {
        async handler(yDoc) {
          // called every few seconds after edits
          // you can use this to write to a database
          // or some external storage
        },
        // control how often handler is called with these options
        debounceWait: 10000, // default: 2000 ms
        debounceMaxWait: 20000, // default: 10000 ms
        timeout: 5000, // default: 5000 ms
      },
    });
  },
};
```

Then, use the provider to connect to this server from your client:

```ts
import YPartyKitProvider from "y-partykit/provider";
import * as Y from "yjs";

const yDoc = new Y.Doc();

const provider = new YPartyKitProvider(
  "localhost:1999",
  "my-document-name",
  yDoc
);
```

You can add additional options to the provider:

```ts
// ...
const provider = new YPartyKitProvider(
  "localhost:1999",
  "my-document-name",
  yDoc,
  {
    connect: false, // don't connect immediately, use provider.connect() when required
    params: { token: "my-secret-token" }, // adds to the query string of the websocket connection
    awareness: new awarenessProtocol.Awareness(yDoc), // use your own Yjs awareness instance
  }
);
```

If you're using react, then you can the hook version of the provider: `useYPartyKitProvider`.

```tsx
import useYProvider from "y-partykit/react";
function App() {
  const provider = useYProvider({
    host: "localhost:1999",
    room: "my-document-name",
    doc: yDoc, // optional!
    options,
  });
}
```

Refer to the [official Yjs documentation](https://docs.yjs.dev/ecosystem/editor-bindings) for more information. Examples provided in the Yjs documentation should work seamlessly with `y-partykit` (ensure to replace `y-websocket` with `y-partykit/provider`).

## Contributing

We encourage contributions to PartyKit. If you're interested in contributing or need help or have questions, please join us in our [Discord](https://discord.gg/g5uqHQJc3z).

## License

PartyKit is [MIT licensed](./LICENSE).
