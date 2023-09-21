---
author: James Pearce
pubDatetime: 2023-09-21T16:00:00Z
title: PartyKit, meet TinyBase
postSlug: partykit-meet-tinybase
featured: false
draft: false
tags:
  - collaboration
  - local-first
  - reactivity
  - tinybase
ogImage: "/content-images/partykit-meet-tinybase/og.jpg"
description: We're excited to announce TinyBase v4.3, and its integration with PartyKit! 🎈
---

_Hi, I’m [James](https://twitter.com/jamespearce). I’m your guest writer for
this post because I have some PartyKit news and the team was kind enough to let
me pen a few words here!_

For the last year or so, I've been working on an open source project called
[TinyBase](https://tinybase.org/), a reactive data store for local-first apps.
It lets you store structured data and application state in memory, and provides
a reactive UI so that you can build fast web experiences that work both online
and offline.

Today I'm excited to announce [TinyBase
v4.3](https://tinybase.org/guides/releases/#v4-3), which provides an integration
with - you guessed it - PartyKit! 🎈

This integration allows you to enjoy the benefits of both a "local-first"
architecture and a "sharing-first" platform. You can have structured data on the
client with fast, reactive user experiences, but also benefit from cloud-based
persistence and room-based collaboration.

![PartyKit and TinyBase](/content-images/partykit-meet-tinybase/animation.gif)

The integration comes in two parts: there's a [server
class](https://tinybase.org/api/persister-partykit-server/classes/other/tinybasepartykitserver/)
for coordinating clients and persisting TinyBase store data durably in the
cloud. And then there's a [client
module](https://tinybase.org/api/persister-partykit-client/) that provides the
API to create the connection to the server and a binding to your data.

It's pretty easy to get up and running! The TinyBase server implementation on
PartyKit can be as simple as this:

```js
import { TinyBasePartyKitServer } from "tinybase/persisters/persister-partykit-server";
export default class extends TinyBasePartyKitServer {}
```

On the client, a simple API lets you create the binding between your PartyKit
socket object and the TinyBase store:

```js
const persister = createPartyKitPersister(
  store, // the TinyBase data
  new PartySocket({
    host: "project-name.my-account.partykit.dev",
    room: "my-partykit-room",
  })
);
```

After that, you simply start the automatic save and load modes in TinyBase, and
off you go! Your data is now synchronized to the room.

```js
await persister.startAutoSave();
await persister.startAutoLoad();
// let's go!
```

When this process starts, TinyBase uses HTTPS to get or set full copies of the
data from or to the cloud. However, after that, the auto-save and auto-load
modes use a websocket to transmit subsequent incremental changes in either
direction, making for performant sharing of state between clients.

You can try out this new collaboration functionality (in the time-honored way!)
with a [Todo App
demo](https://tinybase.org/demos/todo-app/todo-app-v6-collaboration/). This demo
builds on a non-PartyKit version of the app, so it emphasizes the very few
changes that need to be made to an existing app to make it instantly
collaborative.

![A Todo App - what a surprise!](/content-images/partykit-meet-tinybase/demo.png)

Also, we want to make it easy for you to try this out for yourselves. We're
releasing a [TinyBase + PartyKit starter
kit](https://github.com/tinyplex/tinybase-ts-react-partykit) that should get you
up and running extremely easily.

It's been a huge pleasure to work with the amazing PartyKit team on this
project, and I want to give out a big thank you to Sunil, Sylwia, and Jani for
being so responsive and helping get this built and released as quickly as we
did.

Please try out this new integration and let us know how it goes. We're standing
by in the [PartyKit](https://discord.gg/g5uqHQJc3z) and
[TinyBase](https://discord.com/invite/mGz3mevwP8) Discords, or hit up
[TinyBase](https://twitter.com/tinybasejs) on X! There is plenty more we can do
to improve things, but we're excited to see what you build with it and would
love your feedback.

Party on, TinyBase!
