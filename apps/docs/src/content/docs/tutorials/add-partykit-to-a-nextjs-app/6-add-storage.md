---
title: Add storage
sidebar:
  label: 6. Add storage
description: In this step, you will enable your server to store the votes
---

PartyKit rooms come with a key-value storage, which make it easy to persist data without the need for an external database. It is also a good way to ensure that your data will persist in case of, for example, server restart or app redeployment. In this step, you will enable your server to store the votes.

## Loading data on start

Navigate to the server file (`party/index.ts`) and add a new method called `onStart`. This method will be triggered when the first connection is made to the PartyKit room or after the server restarts:

```ts
  async onStart() {
    this.poll = await this.room.storage.get<Poll>("poll");
  }
```

## Persisting data

Next, give your app possibility to also add data to storage. Create a helper method:

```ts
  async savePoll() {
    if (this.poll) {
      await this.room.storage.put<Poll>("poll", this.poll);
    }
  }
```

And then invoke it in `onRequest` (to save the poll when it's created) by adding just one line of code:

```ts
  async onRequest(req: Party.Request) {
    if (req.method === "POST") {
      const poll = (await req.json()) as Poll;
      this.poll = { ...poll, votes: poll.options.map(() => 0) };
      // ADD THIS LINE:
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

and invoke it again in `onMessage` to save the poll when user votes:

```ts
  async onMessage(message: string) {
    if (!this.poll) return;

    const event = JSON.parse(message);
    if (event.type === "vote") {
      this.poll.votes![event.option] += 1;
      this.room.broadcast(JSON.stringify(this.poll));
      // ADD THIS LINE:
      this.savePoll();
    }
  }
```

And - that's it! You are now persisting data on the PartyKit server.

:::tip[Storage API]
To learn more about the Storage API, check <a href="https://docs.partykit.io/guides/persisting-state-into-storage/" target="_blank" rel="noopener noreferrer">our docs</a>.
:::

## Next steps

Congratulations! Your polling app is working! Now it's time to [deploy it](/tutorials/add-partykit-to-a-nextjs-app/7-deploy-your-app) 🥳

🎈 If you'd like to check how your code compares to the finished app, check <a href="https://github.com/partykit/partypoll/blob/main/party/index.ts" target="_blank" rel="noopener noreferrer">the finished code</a> online 🎈
