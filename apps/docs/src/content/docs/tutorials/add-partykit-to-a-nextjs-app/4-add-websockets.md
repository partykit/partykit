---
title: Add WebSockets
sidebar:
    label: 4. Add WebSockets
description: In this step you'll add WebSockets connection into the mix
---

In the previous step, you've connected your PartyKit server and the UI. In this step you'll add WebSockets connection into the mix.

## Establish a WebSocket connection

Navigate to the `PollUI` file (see online in <a href="https://github.com/partykit/tutorial-starter-partypoll/blob/main/components/PollUI.tsx#L22-L26" target="_blank" rel="noopener noreferrer">the starter</a> or <a href="https://github.com/partykit/partypoll/blob/main/components/PollUI.tsx#L21-L37" target="_blank" rel="noopener noreferrer">the finished code</a>), which renders the poll.

Before you move forward, please uncomment the following import line in the top of the file so you can use the `partysocket` package:

```ts
import usePartySocket from "partysocket/react";
```

Since `PollUI` is not a server component, the connection will be established directly from the user's device.

Add this hook between the state setters and `sendVote` method:

```ts
  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: id,
    onMessage(event) {
      const message = JSON.parse(event.data) as Poll;
      if (message.votes) {
        setVotes(message.votes);
      }
    },
  });
```

Let's go over the code above. PartyKit comes with <a href="https://docs.partykit.io/reference/partysocket-api/#usage-with-react" target="_blank" rel="noopener noreferrer"><code>usePartySocket</code></a>, a React hook for WebSockets. Notice that the `id` is a prop containing the the same poll `id` created a moment ago so the WebSocket will connect to the right poll.

The `onMessage` callback is called when we receive a WebSocket message from the PartyKit server. In this case, we'd want the vote counter to be updated. To do so, you will parse the message from the server and update the local component state, which will trigger the UI update.

## Send the votes when the user clicks the button

Now that you have started a WebSocket connection, modify the existing `sendVote` function and add the code that will enable the button to send vote data when the user chooses an option:

```ts
  const sendVote = (option: number) => {
    if (vote === null) {
      socket.send(JSON.stringify({ type: "vote", option }));
      setVote(option);
    }
  };
```

## Next steps

🎈 If you'd like to check how your code compares to the finished app, check <a href="https://github.com/partykit/partypoll/blob/main/components/PollUI.tsx#L21-L37" target="_blank" rel="noopener noreferrer">the finished code</a> online 🎈

The votes are now recorded in real time but the point of the app is to also show the new votes immediately. In the next step, you will [broadcast them to all connected users](/tutorials/add-partykit-to-a-nextjs-app/5-broadcast-the-change).
