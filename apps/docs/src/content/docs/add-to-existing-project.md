---
title: Add PartyKit to existing project
description: Bring realtime collaboration to your app with PartyKit
---

# Installation

System Requirements:

- [Node.js 17](https://nodejs.org/en) or later.
- macOS, Windows (including WSL), and Linux are supported.

Follow this quick guide to add PartyKit to your existing app, and deploy it in just a few minutes.

:::tip[Prefer a tutorial?]
If you'd prefer an in-depth walkthrough, consider following our [tutorial](/tutorials/add-partykit-to-a-nextjs-app).
:::

## Automatic Installation

### Create a new PartyKit app

Add PartyKit to your existing project using the following command in the project's root directory:

```bash
npx partykit@latest init
```

This command installed two packages (<a href="/reference/partyserver-api/" target="_blank" rel="noopener noreferrer"><code>partykit</code></a> and <a href="/reference/partykit-cli/" target="_blank" rel="noopener noreferrer"><code>partysocket</code></a>) and added the `party` directory with a server template.

### Run a dev server

Run the following command in your terminal in your project's directory to start the dev server:

```bash
npx partykit dev --live
```

### Develop your server

Add desired behavior to your server, and connect it to the UI.

:::tip[Where to start?]
If you don't now where to start, follow our [guide to building a WebSocket server](/guides).
:::

### Deploy your app

Lastly, deploy your PartyKit server:

```bash
npx partykit deploy
```

To read more about deploying PartyKit server, check <a href="/guides/deploying-your-partykit-server/" target="_blank" rel="noopener noreferrer">our deployment guide</a>.

:::note
Custom domains will be available in the near future.
:::

---

## Manual Installation

To manually create a partykit app, install the required packages:

```bash
npm install partykit@latest partysocket@latest
```

Create an `party/` folder, then add a `partykit.json` and `server.ts` file.This will be the main entry that partykit will use to start the server.

Inside `partykit.json`, add the following starter code:

```json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "my-partykit-app", // replace with your app name
  "main": "src/server.ts",
  "compatibilityDate": "2024-02-19", // replace with the date you want to support until
  "serve": {
    "path": "public",
    "build": "src/client.ts"
  }
}
```

These configurations are used to define the main entry point of the server and the client.

- `name` - The name of your app.
- `main` - The main entry point of the server.
- `compatibilityDate` - The date you want to support until.
- `serve` - The path to the public folder and the build file. Note, if you are not building your client, you can remove the `serve` key.

Inside `server.ts`, add the following starter code:

```typescript
import type * as Party from "partykit/server";

export default class WebSocketServer implements Party.Server {}
```

You can connect to it using the PartySocket client library.

```typescript title=client.ts
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

:::tip[What's next?]
To know more about `server.ts`, follow our [guide to building a WebSocket server](/guides).
:::

### Run the Development Server

Run `npx partykit dev --live` to start the development server.

This will automatically open a WebSocket connection to the PartyKit server at `ws://localhost:1999/party/my-room`, and send a greeting message.

### Deploy your app

Lastly, deploy your PartyKit server:

```bash
npx partykit deploy
```

To read more about deploying PartyKit server, check <a href="/guides/deploying-your-partykit-server/" target="_blank" rel="noopener noreferrer">our deployment guide</a>.

:::note
Custom domains will be available in the near future.
:::

---

## Enjoy 🎈

Welcome to the party, pal!

---

Questions? Ideas? We'd love to hear from you 🎈 Reach out to us on [Discord](https://discord.gg/KDZb7J4uxJ) or [Twitter](https://twitter.com/partykit_io)!
