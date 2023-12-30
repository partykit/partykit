---
title: Broadcast the change
sidebar:
  label: 5. Broadcast the change
description: In this step you will broadcast the changes immediately to all connected clients
---

Your app now records the votes in real time, but users won't be able to see the votes without refreshing the page. In this step you will broadcast the changes immediately to all connected clients.

## Add `broadcast`

Now that you are done with the client side, let's move back to the server code. Navigate to the server file (`party/index.ts`).

Your PartyKit server currently receives WebSocket messages from the client, but it doesn't yet do anything with the incoming messages. To change that, add the `onMessage` method:

```ts
  async onMessage(message: string) {
    if (!this.poll) return;

    const event = JSON.parse(message);
    if (event.type === "vote") {
      this.poll.votes![event.option] += 1;
      this.room.broadcast(JSON.stringify(this.poll));
    }
  }
```

In the code above, you parse the incoming message and increment the number of votes. Next, you broadcast the updated poll to all connected clients so they will see votes change live.

Now test it by opening the same poll page in two (or more) tabs and see the immediate changes 🥳

## Next steps

Now that your app works as intended, it's time to store the data somewhere. In the next step, you will [enable your server to store the votes](/tutorials/add-partykit-to-a-nextjs-app/6-add-storage).

🎈 If you'd like to check how your code compares to the finished app, check <a href="https://github.com/partykit/partypoll/blob/main/party/index.ts#L26-L35" target="_blank" rel="noopener noreferrer">the finished code</a> online 🎈
