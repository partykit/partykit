---
title: Responding to HTTP requests
description: ...
---

In addition to [serving real-time WebSocket traffic](../building-a-real-time-websocket-server/), PartyKit servers can respond to regular HTTP requests.

Let's send a request to the room's public URL:

:::note[About Party URLs]
Parties accept requests at `/parties/:party/:room-id`. The default `party` in each project is called `"main"`, but you can define [multiple parties per project](../using-multiple-parties-per-project/)
:::


```ts
fetch(`${PARTYKIT_HOST}/parties/main/${roomId}`, { 
  method: "POST", 
  body: JSON.stringify({
    message: "Hello!"
  })
});
```


### Handle incoming requests

To handle incoming requests, define an `onRequest` handler in your PartyKit server:
```ts

import type { Party, PartyRequest, PartyServer } from "partykit/server";

export default class MessageServer implements PartyServer {
  messages: string[] = [];
  constructor(readonly party: Party) {}

  async onRequest(request: PartyRequest) {
    // push new message
    if (request.method === "POST") {
      const payload = await request.json<{ message: string }>();
      this.messages.push(payload.message);
      this.party.broadcast(payload.message);
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

In the above example, the client can send messages via a HTTP `POST` request, and fetch all messages with a `GET` request. 

### Push/pull

The above code snippet implements a simple stateful HTTP server, but did you notice the following line hidden in the `POST` handler?

```ts
this.party.broadcast(payload.message);
```

The `onRequest` method has access to all of the room's resources, including connected WebSocket clients. 

As simple as this sounds, this is a powerful pattern. Being able to access the same party state with both WebSockets and HTTP requests enables us to create flexible push/pull systems that integrate well with third-party systems:

- Fetching initial page data for e.g. React server rendering
- Interacting with the party from environments that don't support WebSockets
- Using parties as webhook endpoints for third-party services
- Messaging between [multiple parties](./using-multiple-parties-per-project/)
- Building room admin APIs

To learn more common patterns and uses cases, head over to the [Examples](../../examples/all-examples/) section.
