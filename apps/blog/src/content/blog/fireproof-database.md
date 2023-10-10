---
author: J Chris Anderson
pubDatetime: 2023-10-10T10:00:00Z
title: Multi-user database collaboration made easy
postSlug: fireproof-database-connector
featured: false
draft: false
tags:
  - database
  - local-first
  - collaboration
  - fireproof
ogImage: "/content-images/fireproof-database-connector/og.jpg"
description: PartyKit’s effortless connections are the perfect complement to 🔥 Fireproof’s immutable storage
---

_[J Chris Anderson](https://github.com/jchris)’s relentless pursuit of the vision of a simple programming model for event driven apps running near the user led to his early success with Apache CouchDB and Couchbase Mobile, and now to his creation of [Fireproof](https://use-fireproof.com/)._

When your database is a source of truth, hard things become easy and the impossible becomes reachable. I created the Fireproof database to empower web developers – just write a simple UI in your usual style and end up with a multi-user data-driven application. Once the data is in Fireproof, you can securely reference it from any backend or cloud.

PartyKit’s effortless connections are the perfect complement to Fireproof’s immutable storage, and we both love breaking the easy barrier. Our shared excitement about opening up new worlds for developers makes me even happier to be writing a guest post to bring you the news: building a [PartyKit Fireproof connector](https://github.com/fireproof-storage/fireproof/blob/main/packages/connect-partykit/README.md) was so easy we shipped it in a week.

Some of the benefits of our new adapter:

* Connect your party to multiple databases, both per-user and shared.
* Fireproof live query automatically rerenders your components on local or remote changes.
* Users can link, share and bookmark lightweight verifiable database snapshots.

Knowing when to use ephemeral client-local state, in-party storage, or a cloud database isn’t always easy. Fireproof’s verifiable snapshot links make it the new relaxing choice for hosting your party data. In a real-world application like a bike messenger service, one might use a cloud for route optimization, PartyKit to connect with messengers and track their status and location, and Fireproof in the messenger app for offline delivery details and photo or recipient signature workflow. Each delivery can be archived as a snapshot link for verifiable query and replay.

Our first demo using the Fireproof PartyKit connector is even simpler. It’s a magnetic poetry app, based on [Matt Webb’s excellent mosaic drawing app](https://blog.partykit.io/posts/wisdom-of-crowds), that allows you to collaborate on word tile arrangements and save your beautiful word paintings, masterpieces that they are, for posterity! Drag and drop tile motion is shared in PartyKit, and poems are saved and loaded from Fireproof. [Try out the magnetic poetry app here](https://magnetic-poetry.use-fireproof.com/), or continue reading to run your own copy and start adapting the code for your own purposes.

![Screenshot of magnetic poetry app](/content-images/fireproof-database-connector/screenshot.png)

To try it out, just paste this into your CLI: 

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

SHOW US WHAT YOU GOT

![SHOW ME WHAT YOU GOT meme](/content-images/fireproof-database-connector/meme.png)

Fireproof is open source and ready for your apps. [Check out the developer docs](https://use-fireproof.com/docs/welcome) and join the [GitHub discussions](https://github.com/fireproof-storage/fireproof/discussions) and [Fireproof Discord](https://discord.gg/3cGbju6W) to talk to other builders. Let us know what you build, and we will feature it in our app showcase. We love to share what people do, so tell us about your sketches, demos, games, toys, apps, giant robots, interstellar spacecraft, etc. We hang out in PartyKit’s discord, you can also [join the Fireproof discord here](https://discord.gg/3cGbju6W)!
