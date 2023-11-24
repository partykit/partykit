---
title: Rate limiting messages
description: Preventing connections from flooding a room with messages
---

PartyKit is very fast, and can process hundreds of messages per second from a single WebSocket connection, and thousands per second per room.

However, this is not always a desired behavior! For example, a connected client may misbehave (accidentally or on purpose), and spam the room with messages on a loop. If you're a security expert, you may be thinking of spambots. If you're a React developer, you may be thinking of a runaway `useEffect` with a missing `memo` variable.

You can prevent scenarios like these by applying rate limiting to your connections.

## Rate limiting messages from a connection

In order to keep track of how frequently a specific connection sends messages, you can use the `connection.state` variable to track most recent messages:

```ts
onMessage(message: string, sender: Party.Connection<{ lastMessageTime?: number }>) {

  const now = Date.now();
  const prev = sender.state?.lastMessageTime;

  if (prev && now < (prev + 1000)) {
    // if previous message was less than 1 second ago, remove them from the room!
    sender.close();
  } else {
    // otherwise keep track of the previous time
    sender.setState({ lastMessageTime: now });
  }
}
```

The above example is rather unfriendly. You are welcome to implement a rate-limiting approach that makes sense for you.

Our live reaction counter example contains [a simple, incremental back-off rate limiter](https://github.com/partykit/example-reactions/blob/main/src/limiter.ts), which sends the client warnings before terminating the connection.

You can use it as follows:

```ts
onMessage(message: string, sender: Party.Connection) {
  // rate limit incoming messages to every 100ms with an incremental back-off
  rateLimit(sender, 100, () => {
    // do things
  });
}
```

:::tip[Expect reconnections]
If your rate limiter removes users from the room by closing their connection, they are likely to reconnect again. The `partysocket` library does this by default. You can instruct the client to not reconnect by sending a specific error code, and checking for it on the client.

Alternatively, you can also **shadow-ban connections** by not closing them, but simply not broadcasting their messages to others. This way, they themselves will see their own messages, but others won't.
:::

## Fine-grained rate limiting

To implement more sophisticated rate-limiting algorithms, you can implement your own, or reach for an open source library like the [rate-limiter-flexible package on npm](https://www.npmjs.com/package/rate-limiter-flexible).
