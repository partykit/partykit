---
title: Add realtime cursors to your app
description: In this tutorial, you'll build realtime presence to your app by adding interactive cursors which reflect the position of each user.
---

In this tutorial, you will build realtime presence to your app by adding interactive cursors which reflect the position of each user.

## Where are we now?

You can see the code at this point in the tutorial on GitHub or CodeSandbox.
If you're interested in the isolated use case of implementing the cursors, fork on CodeSandbox to start coding along in your browser from here. Alternatively, you can also look at the minimal example of a PartyKit app with realtime cursors.

## Where are we going?

In this part of the tutorial, we will:

1. Implement a PartyPresence helper class, to manage state and events for the party.
2.

## 1. Set up a WebSocket connection

<!-- explanation of why we need websockets here -->

To do so, let's install `partysocket`, a library which makes managing WebSocket connection easier and is compatible with PartyKit:

```bash
npm install partysocket@beta
```

In the `client.ts` file, import PartySocket from "partysocket" and
