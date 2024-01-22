---
title: Responding to HTTP requests
description: n addition to serving real-time WebSocket traffic, PartyKit servers can respond to regular HTTP requests
---

In addition to [serving real-time WebSocket traffic](/guides/building-a-real-time-websocket-server/), PartyKit servers can respond to regular HTTP requests.

:::note[About Party URLs]
Parties accept requests at `/parties/:party/:roomId`. The default `party` in each project is called `"main"`, but you can define [multiple parties per project](/guides/using-multiple-parties-per-project/).
:::

Let's send a request to the room's public URL:

```ts
fetch(`https://${PARTYKIT_HOST}/parties/main/${roomId}`, {
  method: "POST",
  body: JSON.stringify({ message: "Hello!" })
});
```

The PartyKit hosting environment uses the `https` protocol by default, but in local development you are most likely using `http`, so in practice, your code might look something like this:

```ts
const protocol = PARTYKIT_HOST.startsWith("localhost") ? "http" : "https";
fetch(`${protocol}://${PARTYKIT_HOST}/parties/main/${roomId}`, {
  method: "POST",
  body: JSON.stringify({ message: "Hello!" })
});
```

To make this easier, the [`partysocket`](/reference/partysocket-api) package exports a `PartySocket.fetch` utility that constructs the correct URL for you:

```ts
PartySocket.fetch(
  { host: PARTYKIT_HOST, room: roomId },
  {
    method: "POST",
    body: JSON.stringify({ message: "Hello!" })
  }
);
```

### Handle incoming requests

To handle incoming requests, define an `onRequest` handler in your PartyKit server:

```ts
import type * as Party from "partykit/server";

export default class MessageServer implements Party.Server {
  messages: string[] = [];
  constructor(readonly room: Party.Room) {}

  async onRequest(request: Party.Request) {
    // push new message
    if (request.method === "POST") {
      const payload = await request.json<{ message: string }>();
      this.messages.push(payload.message);
      this.room.broadcast(payload.message);
      return new Response("OK");
    }

    // get all messages
    if (request.method === "GET") {
      return new Response(JSON.stringify(this.messages));
    }

    return new Response("Method not allowed", { status: 405 });
  }
}
```

In the above example, the client can send messages via an HTTP `POST` request, and fetch all messages with a `GET` request.

### Push/pull

The above code snippet implements a simple stateful HTTP server, but did you notice the following line hidden in the `POST` handler?

```ts
this.room.broadcast(payload.message);
```

The `onRequest` method has access to all of the room's resources, including connected WebSocket clients.

As simple as this sounds, this is a powerful pattern. Being able to access the same party state with both WebSockets and HTTP requests enables us to create flexible push/pull systems that integrate well with third-party systems such as:

- fetching initial page data for, for example, React server rendering,
- interacting with the room from environments that don't support WebSockets,
- using parties as webhook endpoints for third-party services,
- messaging between [multiple parties](/guides/using-multiple-parties-per-project/),
- building room admin APIs.

To learn more common patterns and uses cases, head over to the [Examples](/examples/) section.
