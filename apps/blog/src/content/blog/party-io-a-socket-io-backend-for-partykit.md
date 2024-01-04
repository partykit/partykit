---
author: Sunil Pai
pubDatetime: 2023-11-30T10:12:00Z
title: Party.IO — a new Socket.IO backend for PartyKit
postSlug: party-io-a-socket-io-backend-for-partykit
featured: false
draft: false
tags:
  - socket-io
  - realtime
  - multiplayer
ogImage: "/content-images/party-io-og-image.png"
description: We are super excited to announce the release of Party.IO, a Socket.IO backend for PartyKit!
---

We are super excited to announce the release of Party.IO, a [Socket.IO](https://socket.io/) backend for PartyKit!

Socket.IO is an incredibly popular JavaScript library that enables real-time, bidirectional and event-based communication between web clients and servers. It's commonly used to build interactive applications where data needs to be exchanged frequently and instantly, such as in chat applications, live content updates, and real-time analytics.

Socket.IO was created in 2010 by [Guillermo Rauch](https://twitter.com/rauchg), right as browsers were starting to support WebSockets. It has since grown to be one of the most popular libraries for building real-time applications on the web.

## Scaling Socket.IO: Enter PartyKit

However, deploying and scaling Socket.IO servers can be a challenge. Unlike serverless computing, where you can simply deploy your code and let the cloud provider handle the rest, Socket.IO requires you to manage your own servers and infrastructure. It requires subject matter expertise to provision not just Node.js servers, but also Redis servers for scaling and load balancing. You also need to get wide coverage across the planet to guarantee low latency for your users.

Enter PartyKit. Powered by Cloudflare's worldwide edge network, PartyKit brings the primitives for compute and state to everyone. With PartyKit, you can write your Socket.IO server code and deploy it to the edge in minutes. PartyKit will automatically scale your code to handle any number of users, and will automatically load balance across the globe to ensure low latency for your users.

Making a Socket.IO backend is as simple as making a new PartyKit project and adding the following code:

```ts
// server.ts

import { createServer } from "party.io";

export default createServer(io => {
  io.on("connection", socket => {
    console.log(`socket ${socket.id} connected`);

    socket.emit("hello", "world");

    socket.on("howdy", data => {
      console.log(`socket ${socket.id} says ${data}`);
    });

    socket.on("disconnect", reason => {
      console.log(`socket ${socket.id} disconnected due to ${reason}`);
    });
  });
});
```

In your browser, you can connect to the server with:

```ts
// client.ts

import { io } from "socket.io-client";

const socket = io({
  transports: ["websocket"], // this is necessary, or else socket.io will try to use polling
});

socket.on("hello", data => {
  console.log(`server says ${data}`);
  // => server says world
});

socket.emit("howdy", "y'all");
```

And then run with:

```bash
$ partykit dev server.ts
```

## But wait, there's more

By default, Party.IO will use a single room to coordinate messages between rooms and clients. This should scale to thousands of concurrent users. However, depending on where this backend instantiates, you might find that users far away from it might face longer latencies than users who are closer.

We can solve this easily. When instantiating a client, pass a `partyID` that associates with the document of interest in your application in the `query` parameter. Party.IO will then instantiate a new syncing backend close to that user. For instance, you may use this when you want a distinct backend for every game session, chat room, collaborative drawing document, etc. It looks like this:

```ts
const socket = io({
  transports: ["websocket"],
  query: {
    partyID: "my-chat-room",
  },
});
```

## Get Started with Socket.IO on PartyKit

Head on to the [Party.IO Readme](https://github.com/partykit/partykit/blob/main/packages/party.io/README.md) and [Socket.IO docs](https://socket.io/docs/v4) to learn more about how to use Socket.IO.

You can also see our port of the classic Socket.IO chat example [here](https://github.com/partykit/partykit/tree/main/examples/socket.io-chat)

We hope you enjoy using Party.IO! If you have any questions or feedback, please join our [Discord](https://discord.gg/GJwKKTcQ7W) or talk to us on [Twitter](https://twitter.com/partykit_io)!
