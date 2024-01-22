---
title: PartyKitServer (Legacy Server API)
description: PartyKitServer Legacy API reference
sidebar:
  hidden: true
---

You may encounter PartyKit code that exports a plain object conforming to the `PartyKitServer` type, instead of exporting a class that implements the [PartyServer interface](/reference/partyserver-api).

```ts
import { PartyKitRoom, PartyKitServer } from "partykit/server";

export default {
  async onConnect(connection, room: PartyKitRoom) {},
  async onRequest(request: Request, room: PartyKitRoom) {}
} satisfies PartyKitServer;
```

## API

:::danger[Deprecation warning]
The `export default { }` syntax is deprecated, and may be removed in a future version of PartyKit. Previously deployed projects will continue to work, but new deployments may break once support for the syntax is removed.

We recommend migrating to the new `export default class implements PartyServer` API.
:::

```ts
import { PartyKitContext, PartyKitRoom, PartyKitServer } from "partykit/server";

export default {
  async onConnect(connection, room: PartyKitRoom, ctx: PartyKitContext) {
    // `connection` is a WebSocket object, but with a few extra properties
    // and methods. See the PartyKitConnection type for more details.
    connection.send("Hello, world!"); // Send a message to the client
    connection.addEventListener("message", (event) => {
      console.log(event.data); // Log a message from the client
    });
  },
  async onRequest(request: Request, room: PartyKitRoom) {
    // ...
  }
} satisfies PartyKitServer;
```

#### **_onConnect_**

This function `onConnect` will be called whenever a new client (usually a browser, but it can be any device that can make WebSocket connections) connects to your project. The `connection` argument is a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) object that you can use to send and receive messages to/from the client (with a couple of additional properties).

#### **_onRequest_**

The function `onRequest` will be called whenever a client makes an HTTP request to your project. The `request` argument is a [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object that you can use to get information about the request, and the `room` argument is the same as the one in `onConnect`.

#### **_request_**: _Request_

A [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object that contains information about the HTTP request that initiated the WebSocket connection. This is useful if you want to get information about the client that's connecting to your project. For example, you can get the IP address of the client like this: `ctx.request.headers.get('cf-connecting-ip')`

#### **_room_:** _PartyKitRoom_

The `room` argument passed on `onRequest` and `onConnect` is an object that contains information about the room that the client is in. It has the following properties:

**_id:_** _string_

A string that uniquely identifies the room. This is usually associated with a single document, drawing, game session, or other collaborative experience. For example, if you're building a collaborative drawing app, this would be the id of the drawing that the client is currently viewing.

**_connections_**: Map<string, {id: string, socket: PartyKitConnection}>

A Map of connection IDs to all the connections in the room. The ID is usually associated with a single client. For example, if you're building a collaborative drawing app, this would be the id of the user that's currently viewing the drawing. You can either specify this id yourself by passing a `_pk` query param in the WebSocket connection, or let PartyKit generate one for you.

**_env_**: Record<string, any>

A map of all the environment variables that you've set for your project. See the [vars](#vars) section for more details.

**_storage_**: (TODO, see [Durable Objects storage API](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/#transactional-storage-api) as a reference)

**_internalID_**: _string_

This too is a string that uniquely identifies the room, but it's not meant to be directly used by your application. It's used internally by the PartyKit platform to identify the room.

### Further reading

Read more about the [rationale behind the new API on the PartyKit blog](https://blog.partykit.io/posts/partyserver-api).
