---
title: Broadcast the change
sidebar:
    label: 5. Broadcast the change
description: ...
---

INTRO
When the user submits the poll form, the Next.js app will send it to your PartyKit server.

## Add `broadcast`

Now that we are done with the client side, let's move back to the server code. Navigate to the server file (`party/index.ts`).

Your PartyKit server currently receives WebSocket messages from the client, but it doesn't yet do anything with the incoming messages. To change that, add `onMessage` method:

```ts
  async onMessage(message: string) {
    if (!this.poll) return;

    const event = JSON.parse(message);
    if (event.type === "vote") {
      this.poll.votes![event.option] += 1;
      this.party.broadcast(JSON.stringify(this.poll));
    }
  }
```

In the code above, you parse the incoming message, then increment the number of votes, and broadcast the updated poll to all connected clients so they will see votes come in live.

Now test it by opening the same poll page in two (or more) tabs and see the changes live:

<!-- screen recording -->
