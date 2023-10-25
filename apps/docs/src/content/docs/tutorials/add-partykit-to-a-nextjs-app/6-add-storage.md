---
title: Add storage
sidebar:
    label: 6. Add storage
description: ...
---

PartyKit rooms come with a key-value storage, which make it easy to persist data without the need for an external database. It is also a good way to ensure that your data will persist in case of, for example, server restart or app redeployment.

## Loading data on start

Navigate to the server file (`party/index.ts`) and add a new method called `onStart`, which will be triggered when the first connection is made to the PartyKit room or after the server restarts:

```ts
  async onStart() {
    this.poll = await this.party.storage.get<Poll>("poll");
  }
```

## Persisting data

Next, give your app possibility to also add data to storage. Create a helper method:

```ts
  async savePoll() {
    if (this.poll) {
      await this.party.storage.put<Poll>("poll", this.poll);
    }
  }
```

And then invoke it in `onRequest` (for communication with the SSR components):

```ts
  async onRequest(req: Party.Request) {
    if (req.method === "POST") {
      const poll = (await req.json()) as Poll;
      this.poll = { ...poll, votes: poll.options.map(() => 0) };
      this.savePoll();
    }

    if (this.poll) {
      return new Response(JSON.stringify(this.poll), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }
```

and in `onMessage` (for the WebSockets connection):

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

And - that's it! You are now persisting data on the PartyKit server.

:::tip[Learn more about storage]
To learn more about the Storage API, check [our docs](https://docs.partykit.io/guides/persisting-state-into-storage/).
:::

