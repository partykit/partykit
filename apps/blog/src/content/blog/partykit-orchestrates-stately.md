---
author: Anders Bech Mellson
pubDatetime: 2023-11-15T11:00:00Z
title: PartyKit orchestrates Stately's machines in the Sky
postSlug: partykit-orchestrates-stately
featured: false
draft: false
tags:
  - community
  - showcase
  - stately
  - xstate
ogImage: "/content-images/partykit-powers-realtime-avatars-in-epic-web/social.png"
description: Anders Bech Mellson explains how PartyKit has enabled bringing state machines to the Stately Sky 🌤️
---

_[Anders Bech Mellson](https://github.com/mellson) and the rest of the team at [Stately](https://stately.ai/) is pushing the boundaries of how you can visually build and collaborate on your app logic. When they wanted to push it to the Sky they turned to PartyKit._

## Who is Stately

State machines are a powerful way to model the logic of your application. They make your code more predictable and easier to reason about. They also serve as an excellent medium to communicate with your team about the logic of your application.

This is the premise of Stately, founded by [David Khourshid](https://twitter.com/DavidKPiano), the creator of XState. Stately builds a visual editor that allows you to build your app logic visually and then export it to code. There is even an extension for VS Code that lets you edit your app logic directly in your code editor using either regular code or the visual editor. It syncs both ways!

## What is Stately Sky 🌤️

The logical next step for Stately is to enable you to deploy your app logic with a few clicks. Build, collaborate, deploy, and run – that's the idea. Stately Sky is a service running on the edge that lets you build real-time apps without writing any backend code. It fits perfectly with Stately because it lets us focus on the core of our product: the visual editor.

## Stately ❤️ PartyKit

We had two major engineering challenges when we started building Stately Sky:

1. How do orchestrate the running machines and enable `multiplayer` for them?
2. How do we make it easy to `deploy` and run state machines in the Sky?

### Multiplayer

We started working on Sky in Februray 2023. At that time PartyKit was emerging as the cool new thing for doing real-time collaboration. We had a look at it and it seemed like a perfect fit for our use case. We reached out to the PartyKit team and they were super helpful and supportive. We started building our integration and it was a breeze. We had a working prototype in a few days.

PartyKit quickly solved our first challenge. It allowed us to orchestrate the running machines and enable multiplayer for them. It also gave us a lot of other benefits like presence, which users can integrate into their own apps.

### Deployment

But we had another challenge: Since our users are building the state machines in the editor, we don't know what they will look like until they are done. We needed a way to deploy the state machines dynamically.

Since we don't know what the code will look like up until the point where the user wants to deploy we can't really provision any infrastructure in advance. We need to be able to deploy the state machines dynamically. We also need to be able to deploy them in a way that is secure and scalable (e.g. not using stuff like `eval` or similar methods).

We looked at several different options for this. But didn't really find any good off the shelf solutions that met our demand for something that was safe and quick to deploy.

#### [Sunil](https://twitter.com/threepointone) has entered the chat

Since PartyKit was solving our multiplayer problem so easily it felt natural to talk to the PartyKit team about our deployment problem. We had a chat with Sunil and he ideated on a solution codenamed `machinehub`.

Given Sunil's extensive knowledge about Cloudflare he suggested using [Workers for Platforms](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/) to solve this problem.

We collaborated on a prototype and it was a perfect fit. It allowed us to deploy the state machines dynamically, quickly and securely. It's our secret sauce in Stately Sky, and we are very grateful to Sunil for his help.

## Example app

In this simple example we will show how to use PartyKit to orchestrate a state machine in the Sky. We will use [XState](https://xstate.js.org/) to define the state machine and [Stately](https://stately.ai/) to visualize and edit the state machine.

```tsx
import { useStatelyActor } from "@statelyai/sky-react";
import { skyConfig } from "./counter.sky";

export default function Counter() {
  const [state, send] = useStatelyActor(
    {
      url: "https://sky.stately.ai/Wu5gAj",
      sessionId: "shared-counter",
    },
    skyConfig
  );

  return (
    <div>
      <p>Current Count</p>
      <pre>{state.context.count}</pre>
      <button onClick={() => send?.({ type: "increment" })}>Increment</button>
      <button onClick={() => send?.({ type: "decrement" })}>Decrement</button>
    </div>
  );
}
```

You can see the full code here:

- [counter-example](https://github.com/statelyai/sky-starter-app/blob/main/src/examples/counter.tsx)

## Reactions to presence

## Let's make the web friendlier!

We can't wait to see what you will build!
