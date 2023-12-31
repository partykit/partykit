---
author: J Chris Anderson
pubDatetime: 2023-10-16T10:01:00Z
title: Multi-user database collaboration made easy with Fireproof
postSlug: fireproof-database-connector
featured: false
draft: false
tags:
  - database
  - local-first
  - collaboration
  - fireproof
ogImage: "/content-images/fireproof-database-connector/og.png"
description: PartyKit’s effortless connections are the perfect complement to 🔥 Fireproof’s immutable storage
---

_[J Chris Anderson](https://github.com/jchris)’s relentless pursuit of simple programming models for event driven apps running near the user led to his early success with Apache CouchDB and Couchbase Mobile, and now to his creation of [Fireproof](https://use-fireproof.com/)._

PartyKit’s effortless connections are the perfect complement to Fireproof’s immutable storage, and we both love breaking the easy barrier. Our shared excitement about opening up new worlds for developers makes me even happier to be writing a guest post to bring you the news: building a [PartyKit Fireproof connector](https://github.com/fireproof-storage/fireproof/blob/main/packages/connect-partykit/README.md) was so easy we shipped it in a week.

When your database is a source of truth, hard things become easy and the impossible becomes reachable. I created the Fireproof database to empower web developers – just write a simple UI in your usual style and end up with a multi-user data-driven application. Once the data is in Fireproof, you can securely reference it from any backend or cloud.

Some of the benefits of our new adapter:

- Connect your party to multiple databases, both per-user and shared.
- Fireproof live query automatically rerenders your components on local or remote changes.
- Users can link, share and bookmark lightweight verifiable database snapshots.

Knowing when to use ephemeral client-local state, in-party storage, or a cloud database isn’t always straightforward. Fireproof’s verifiable snapshot links make it a new _relaxing_ choice for hosting your party data. In a real-world application like a bike messenger service, one might use a cloud for route optimization, PartyKit to connect with messengers and track their status and location, and Fireproof in the messenger app for offline delivery details and photo or recipient signature workflow. Each delivery could be archived as a URL-sized snapshot link for verifiable query and replay. Many similar use cases—from real estate leasing to supply chain compliance—can benefit from offline availability, cryptographic data integrity, and the ability to archive anywhere.

## Get into the code

Our first demo using the Fireproof PartyKit connector is even simpler. It’s a magnetic poetry app, based on [Matt Webb’s excellent mosaic drawing app](https://blog.partykit.io/posts/wisdom-of-crowds), that allows you to collaborate on word tile arrangements and save your beautiful word paintings, masterpieces that they are, for posterity! Drag and drop tile motion is shared in PartyKit, and poems are saved and loaded from Fireproof. [Try out the magnetic poetry app here](https://magnetic-poetry.use-fireproof.com/), or continue reading to run your own copy and start adapting the code for your own purposes.

<img src="/content-images/fireproof-database-connector/screenshot-poem.png" width="400" alt="">

The poem editor drag and drop is accomplished simply via PartyKit, based almost exactly on the code in Matt Webb's mosaic collaborative drawing app. Here you can see how the `onDrag` coordinates are broadcast to the party via the socket:

```ts
// the event source in the inner component
const onDrag = ({ x, y }: { x: number; y: number }, word: Word) => {
  const newWord = { ...word };
  newWord.position = { x, y };
  handleTurn(newWord);
};

// in the page, send the data to PartyKit
const handleTurn = (word: Word) => {
  socket.send(
    JSON.stringify({
      type: "turn",
      word: word,
    })
  );
};

// in the PartyKit server, forward the messages to the rest of the party
const update = <UpdateMessage>{
  type: "update",
  word: msg.word,
  turns: poem.turns,
  players: poem.players,
};
this.party.broadcast(JSON.stringify(update), [connection.id]);
```

These snippets come from [`MagenticPoem.tsx`](https://github.com/partykit/sketch-magnetic-poetry/blob/main/src/app/MagneticPoem.tsx), [`Room.tsx`](https://github.com/partykit/sketch-magnetic-poetry/blob/main/src/app/Room.tsx), and [`partykit/server.ts`](https://github.com/partykit/sketch-magnetic-poetry/blob/main/src/partykit/server.ts) respectively.

<img src="/content-images/fireproof-database-connector/screenshot-save.png" width="600" alt="">

Below the poem area is the save button. Each time you click it, the current state of the poem is first saved to a local Fireproof instance, then replicated to S3, and finally broadcast to all other room members. Among the important details is this insight—the data itself is encrypted end-to-end (even at rest in the browser) and can only be decrypted using a key managed by your PartyKit party. This means you can write the data files virtually anywhere as they are encrypted and self-verifying, so we offer pluggable storage connectors, and will support party-local data in R2 in the near future. [Read more about Fireproof connection options here.](https://github.com/fireproof-storage/fireproof/blob/main/packages/connect/README.md#connectors)

The actual code to load the list of saved poems, and to save the poem to the database looks like this (inside the Room component, using Fireproof's [live query React hook](https://use-fireproof.com/docs/react-hooks/use-live-query)). When `put` is called to save a new poem, `useLiveQuery` will automatically redraw the list of saved poems in both the local and remote UIs.

```ts
const { database, useLiveQuery } = useFireproof("poetry-party");
const savedPoems = useLiveQuery("startedAt", {
  descending: true,
  limit: 50,
}).docs as Poem[];

const handleSave = () => {
  database.put(poem);
};
```

Sync amongst the party is handled by [a simple (less than 30 loc) PartyKit server](https://github.com/fireproof-storage/fireproof/blob/main/packages/connect-partykit/src/server.ts) that you run as a sidecar with your own PartyKit app. You can [see how it is configured in the magnetic poetry app here.](https://github.com/partykit/sketch-magnetic-poetry/blob/main/partykit.json)

Finally, if you click the import button, you'll be taken to a snapshot of your data in the Fireproof data dashboard. This allows you to view and edit the data, and work with it from other applications. You can also collect data from across multiple apps in your personal dashboard.

<img src="/content-images/fireproof-database-connector/screenshot-dashboard.png" width="600" alt="">

To try out the lightweight React Next.js codebase locally, just paste this into your CLI:

```sh
git clone https://github.com/partykit/sketch-magnetic-poetry
cd sketch-magnetic-poetry
npm install
cp .env.example .env  # tell the app where to find the partyserver
npx partykit dev  & # background the partyserver
npm run dev       # run the app
```

Once it’s all running, you can check out the app at: <http://localhost:3000/>

There’s a [tour of the code in the README](https://github.com/partykit/sketch-magnetic-poetry), so you can easily convert this app into something just your style.

## Show us what you got!

![SHOW ME WHAT YOU GOT meme](/content-images/fireproof-database-connector/meme.jpg)

Fireproof is open source (Apache 2.0 & MIT) and ready for your apps. [Check out the developer docs](https://use-fireproof.com/docs/welcome) and join the [GitHub discussions](https://github.com/fireproof-storage/fireproof/discussions) and [Fireproof Discord](https://discord.gg/3cGbju6W) to talk to other builders. Let us know what you build, and we will feature it in our app showcase. We love to share what people do, so tell us about your sketches, demos, games, toys, apps, giant robots, interstellar spacecraft, etc. We hang out in PartyKit’s discord, you can also [join the Fireproof discord here](https://discord.gg/3cGbju6W)!
