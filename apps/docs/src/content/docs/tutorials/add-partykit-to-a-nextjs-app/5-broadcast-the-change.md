---
title: Broadcast the change
sidebar:
    label: 5. Broadcast the change
description: ...
---

INTRO
When the user submits the poll form, the Next.js app will send it to your PartyKit server.

## Add `broadcast`

Navigate to the server file (`party/index.ts`).

Your file doesn't currently have a way to interact with the incoming WebSocket messages. To change that, add `onMessage` method:

```ts
  async onMessage(message: string) {
    if (!this.poll) return;

    const event = JSON.parse(message);
    if (event.type === "vote") {
      this.poll.votes![event.option] += 1;
      this.party.broadcast(JSON.stringify(this.poll));
      this.savePoll();
    }
  }
```

In the code above, you parse the incoming message, then increment the number of votes, and broadcast the updated poll to all connected clients so they will see votes come in live.

Now test it by opening the same poll page in two (or more) tabs and see the changes live:

<!-- screen recording -->
