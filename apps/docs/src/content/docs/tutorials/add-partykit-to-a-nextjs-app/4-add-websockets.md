---
title: Add WebSockets
sidebar:
    label: 4. Add WebSockets
description: In this step you'll add WebSockets connection into the mix
---

In the previous step, you've connected your PartyKit server and the UI. In this step you'll add WebSockets connection into the mix.

## Establish a WebSocket connection

Navigate to the `PollUI` file, which renders the poll. Since it is not a server component, the connection will be established directly from the user's device.

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

Let's go over the code above. PartyKit comes with [`usePartySocket`](https://docs.partykit.io/reference/partysocket-api/#usage-with-react), a React hook for WebSockets. Notice that the `id` is a prop containing the the same poll `id` created a moment ago so the WebSocket will connect to the right poll.

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

The votes are now recorded in real time but the point of the app is to also show the new votes immediately. In the next step, you will [broadcast them to all connected users](./5-broadcast-the-change).
