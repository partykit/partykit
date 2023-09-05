---
title: Authentication
description: Setting up JWT authentication with PartyKit
---

When your PartyKit project is deployed, the server accepts HTTP requests and WebSocket connections from the internet.

In order to prevent unauthorized requests being routed to your server, you can implement authentication in your `onBeforeConnect` and `onBeforeRequest` handlers.

<!-- TODO: Better image design -->
![onBefore handlers](../../../assets/on-before.png)

:::note[About the example code]

This guide demonstrates authentication using [JSON Web Tokens](https://jwt.io/) (JWTs) with the [Clerk](https://clerk.dev/) authentication service. The same approach will work for any JWT library, and can be adapted to different secret- and session-based authentication methods.
:::

### Authenticating WebSocket connections

Every PartyKit server accepts WebSocket connections by default. 

To ensure that only authorized users can connect to your server, you should pass a session token to the initial connection request.  The most convenient way to do this is pass the token as a query string parameter:
```ts
// get an auth token using your authentication client library
const token = getToken();
const partySocket = new PartySocket({
  host: PARTYKIT_HOST,
  room: "room-id",
  // pass token to PartyKit in the query string
  query: {
    token
  }
});
```

You can then verify your user's identity in a `static onBeforeConnect` method:

```ts
import type { PartyRequest, PartyServer } from "partykit/server";
import { verifyToken } from "@clerk/backend";

const CLERK_ENDPOINT = "https://clerk.yourdomain.com";

export default class Server implements PartyServer {
  static async onBeforeConnect(request: PartyRequest) {
    try {
      // get token from request query string
      const token = new URL(request.url).searchParams.get("token") ?? "";
      // verify the JWT (in this case using clerk)
      await verifyToken(token, { issuer: CLERK_ENDPOINT });
      // forward the request onwards on onRequest
      return request;
    } catch (e) {
      // authentication failed!
      // short-circuit the request before it's forwarded to the party
      return new Response("Unauthorized", { status: 401 });
    }
  }

  onRequest(req: PartyRequest) {
    return new Response(`Hello from party!`);
  }
}
```

### Authenticating HTTP requests

<!-- TODO: Add links to guide/API-->
You can configure your PartyKit server to [respond to HTTP requests](/guides/responding-to-http-requests).

To ensure that only authorized users can make requests to your server, you should send a session token in the request. 

 The recommended way is to pass it as an `Authorization` header:
```ts
fetch(`${PARTYKIT_HOST}/party/${roomId}`, {
  headers: {
    // get an auth token using your authentication client library
    Authorization: getToken()
  }
})
```

You can then verify your user's identity in a `static onBeforeRequest` method:


```ts
import type { PartyRequest, PartyServer } from "partykit/server";
import { verifyToken } from "@clerk/backend";

const CLERK_ENDPOINT = "https://clerk.yourdomain.com";

export default class Server implements PartyServer {
  static async onBeforeRequest(request: PartyRequest) {
    try {
      // get token from request headers
      const token = request.headers.get("Authorization") ?? "";
      // verify the JWT (in this case using clerk)
      await verifyToken(token, { issuer: CLERK_ENDPOINT });
      // forward the request onwards on onRequest
      return request;
    } catch (e) {
      // authentication failed!
      // short-circuit the request before it's forwarded to the party
      return new Response("Unauthorized", { status: 401 });
    }
  }

  onRequest(req: PartyRequest) {
    return new Response(`Hello from party!`);
  }
}
```

### Other authentication methods

The above examples use Clerk for brevity, but you can use any authentication provider.

If you're rolling your own JWT authentication, or your identity provider doesn't supply a SDK that's compatible with PartyKit's Cloudflare Workers runtime, you can verify and decode your JWTs with the [`cloudflare-worker-jwt`](https://github.com/tsndr/cloudflare-worker-jwt) package.

#### Other authentication methods

- For server-to-server communication, you can use a shared secret. Read about [managing secrets with PartyKit](./managing-secrets-with-partykit).

- For client-to-server connections, you can pass any type of session token, and verify it against your session service. For an example with [NextAuth.js](https://next-auth.js.org/), see the [PartyKit Next.js example app](../../examples/next-js).