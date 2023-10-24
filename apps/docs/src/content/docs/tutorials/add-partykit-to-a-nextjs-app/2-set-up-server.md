---
title: 2. Set up server
description: ...
---

INTRO

## Install PartyKit

To add PartyKit to a new app, run the following command in the terminal in your app directory:

```bash
npm partykit@latest init
```

This command added three things:

1. the `partykit` package, which enables building and deploying realtime servers,
2. the `partysocket` package, which provides a WebSocket client that will automatically reconnect if the connection is dropped,
3. a new directory called `party` where your server code will live.

## Run dev servers

In the previous step started the Next.js dev server. Now open a new tab in your terminal to run PartyKit dev server alongside it:

```bash
npx partykit dev
```

If it works correctly, you should see an output similar to the following:

<!-- output -->

## `party` directory

Navigate to the `party` directory. 