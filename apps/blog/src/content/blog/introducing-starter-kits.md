---
author: Matt Webb
pubDatetime: 2024-02-22T14:43:00Z
title: Introducing PartyKit starter kits, minimal and full fat
postSlug: introducing-starter-kits
featured: false
draft: false
tags:
  - starter-kits
  - docs
  - announcements
  - ai
  - collaboration
  - react
ogImage: "/content-images/introducing-starter-kits/social.png"
description: "`npm create partykit@latest` is now the best way to get started with PartyKit. Choose from five templates."
---

We’re on a mission to make it even easier to get started with PartyKit.

Now when you type:

```bash
npm create partykit@latest
```

…you’ll see a number of options:

```
Which template would you like to use?
❯ TypeScript starter
  JavaScript starter
  React starter
  Chat room starter with AI
  Text editor starter using Yjs
```

Let’s dive into all five!

## 🗣️ These starters are for new projects

These starters are for new PartyKit projects, and for example code. If you already have a project, see the docs for [how to add PartyKit to an existing project](https://docs.partykit.io/add-to-existing-project/).

## Minimal starters

### TypeScript starter and Javascript starter

Save yourself time doing setup.

Choose one of these two starters for:

- a working PartyKit server
- a client-side app that connects to the server
- the `partykit.json` config file

You can type `npm run dev` immediately: both starters include example client-server messages, and the client app is built and served using PartyKit so you can work with it during development.

In TypeScript and Javascript flavors.

### React starter

As real-time frameworks, PartyKit and React pair well together! So this is a brand new starter that gets you up and running in no time.

Get started with:

```bash
npm create partykit@latest my-react-project --template react
```

When you run the app with `npm run dev`, you’ll find a traditional _‘Increment Me’_ button to demonstrate client state. Only _this_ button is multiplayer.

![Two browser windows showing a shared 'Increment Me' button](/content-images/introducing-starter-kits/react-starter.png)

It’s a great starting point. [See the README to get oriented.](https://github.com/partykit/templates/blob/main/templates/react/README.md)

### Bonus starter: Remix

[Remix](https://remix.run) is a full-stack framework for React with a server-side framework, routing and more. We’ve made a PartyKit starter for Remix, too, which includes hosting the entire Remix application on the PartyKit platform.

It’s a little different than the other templates. To get started, run:

```bash
npx create-remix@latest --template partykit/remix-starter
```

See the [remix-starter repo on GitHub](https://github.com/partykit/remix-starter) for more details.

## Full-fat starters

We’re taking this opportunity to show richer uses of PartyKit, demonstrating patterns that are more advanced but widely applicable.

We’re starting with two, both fully documented.

### Chat room starter with AI

Select this starter to see:

- Multiplayer chat with AI participants, and how to keep state
- Using [PartyKit AI](https://docs.partykit.io/reference/partykit-ai/) to call large language models like Llama and Mistral right from the PartyKit server
- Also how to call external OpenAI models, with streaming responses.

![Multiple participants in a chat room, including an AI user](/content-images/introducing-starter-kits/ai-joke.gif)

**Bonus feature:** the `shouldReply` function on the server shows how to escalate from a cheaper model that discriminates when to jump in, to a more expensive model that generates the response. It feels more natural than an AI partipant that responses to every message.

PartyKit is a great fit for stateful, real-time AI experiences, so we love digging into real interactions.

[You also get this chat room README](https://github.com/partykit/templates/blob/main/templates/chat-room/README.md) in the starter.

**The README is a detailed breakdown of how to build this AI chat room app.** It’s a starting point to learn about PartyKit even if this isn’t the exact code you begin your project with.

### Text editor starter using Yjs

This starter shows:

- A collaborative text editor using Yjs for sync
- Yjs on the client and server, implementing using the drop-in [Y-PartyKit](https://docs.partykit.io/reference/y-partykit-api/) library
- Multiple rooms with live occupancy counts.

![A text editor showing text highlighted by a remote user and a rooms navigator](/content-images/introducing-starter-kits/yjs-editor.png)

Yjs is a battle-tested and popular sync framework, and PartyKit has first-class support. This starter is your reference implementation if you’re building your own Yjs app.

Additionally, a common pattern for multiplayer apps is to have _rooms_ where users can move from room to room to collaborate with different teams on different data. But how can rooms advertise their real-time presence, or other metadata, into a lobby or other index view? This example demonstrates how, using PartyKit’s [multiple party support](https://docs.partykit.io/guides/using-multiple-parties-per-project/).

[Here’s the text editor README.](https://github.com/partykit/templates/blob/main/templates/text-editor/README.md)

Again, **the README is a detailed breakdown of how to build this Yjs editor app.** Start a project with this template to get the README, and follow along to learn more about PartyKit, and the Yjs and multi-party patterns.

## What’s next

**It’s the best way to get started with PartyKit:**

```bash
npm create partykit@latest
```

We plan to add more starters over time.

We’d love to hear your feedback on these initial starters, and suggestions on what to add next.

Join us on our [Discord](https://discord.gg/GJwKKTcQ7W) or say hi on [Twitter](https://twitter.com/partykit_io).
