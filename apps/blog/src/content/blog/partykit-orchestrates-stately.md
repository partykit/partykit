---
author: Anders Bech Mellson
pubDatetime: 2023-11-15T11:00:00Z
title: PartyKit orchestrates Stately's machines in the Sky
postSlug: partykit-orchestrates-stately
featured: false
draft: false
tags:
  - showcase
  - collaboration
  - stately
  - sky
  - xstate
ogImage: "/content-images/partykit-orchestrates-stately/social.png"
description: Anders Bech Mellson explains how PartyKit has enabled bringing state machines to the Stately Sky 🌤️
---

_[Anders Bech Mellson](https://github.com/mellson), together with the Stately team, is at the forefront of visual app logic construction and collaboration. When they wanted to push it to the Sky they turned to PartyKit._

## Introducing Stately

State machines provide a robust framework for structuring application logic. They make our code predictable and straightforward. This insight drives us at [Stately](https://stately.ai), a company brought to life by [David Khourshid](https://twitter.com/DavidKPiano), the creator of XState.

Our visual editor is a game-changer—it lets us visually construct app logic and then turn it into code effortlessly. To bridge the gap even further, we offer a [VS Code extension](https://marketplace.visualstudio.com/items?itemName=statelyai.stately-vscode), which syncs with the visual editor, ensuring a smooth transition between visual and code views.

## Our Vision: Stately Sky 🌤️

We envision a world where deploying your application logic is as simple as a few clicks. This is where Stately Sky comes in. We're offering a service that runs at the edge, enabling the building of real-time applications without any back-end coding. This service complements our visual editor, keeping our focus sharp on what we do best.

## Stately ❤️ PartyKit

As we developed Stately Sky, we faced two significant challenges:

1. How to orchestrate running machines and bring a `multiplayer` experience to them.
2. How do we make it easy to `deploy` and run state machines in the Sky?

### Multiplayer

We started working on Sky in February 2023. At that time, PartyKit was emerging as the cool new tool for real-time collaboration, and it seemed like a perfect fit for our use case. So, we contacted the PartyKit team, and they were extremely helpful and supportive in getting us onboard the early access program. Within a few days, we had a functioning prototype.

PartyKit not only addressed our orchestration needs but also added features like user presence, which users can incorporate into their own apps.

### Deployment

But we needed to solve our second challenge before Sky could become a reality: Since our users are building the state machines in the editor, we don't know what they will look like until they are done. We needed a way to deploy the state machines dynamically.

Since we don't know what the code will look like up until the point where the user wants to deploy we can't really provision any infrastructure in advance. We need to be able to deploy the state machines dynamically. We also need to be able to deploy them in a way that is secure and scalable without resorting to questionable methods like using [`eval`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval).

We explored various options for this, but we didn't find any satisfactory off-the-shelf solutions that met our requirement for both safety and quick deployment.

#### [Sunil](https://twitter.com/threepointone) has entered the chat

Since PartyKit was solving our multiplayer problem so easily, it felt natural to talk to the PartyKit team about our deployment problem. We had a chat with Sunil, and he brainstormed a solution codenamed `machinehub`.

Given Sunil's extensive knowledge about Cloudflare, he suggested that we use [Workers for Platforms](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/) to solve the problem.

This collaboration was a breakthrough, providing us with a way to deploy state machines dynamically, swiftly, and securely, and we are very grateful to Sunil for his help!

## What can you build with Stately Sky

You can think of Stately Sky as a _multiplayer-enabled app logic-as-a-service_ platform. That's quite the mouthful. If you already know XState, it might be easier to think of it as _state machines in the cloud_ (or the Sky in our case 😅).

Turns out, this is super convenient for building many different types of apps. Only the imagination sets the limit. Let me show you a very basic example of how to build a shared counter in React using Stately Sky.

#### Counter example

We'll start by building a simple counter machine in the Stately Studio visual editor. It looks like this ([see it in the editor](https://sky.stately.ai/Wu5gAj)):

<img src="/content-images/partykit-orchestrates-stately/counter-machine.png" alt="Counter machine shown in the Stately Studio visual editor" width="600">

Lets have a look at the code you would need inside your own app to connect to this machine:

```tsx
import { useStatelyActor } from "@statelyai/sky-react";
import { skyConfig } from "./counter.sky";

export default function Counter() {
  // Sky comes with full type safety to make it easy and safe to use
  const [state, send] = useStatelyActor(
    {
      // This is the URL you use to connect your app to Sky
      // If you open it in your browser you can see the machine
      url: "https://sky.stately.ai/Wu5gAj",

      // The session ID is used to shard the multiplayer session
      sessionId: "shared-counter",
    },
    skyConfig
  );

  function increment() {
    send?.({ type: "increment" });
  }

  function decrement() {
    send?.({ type: "decrement" });
  }

  return (
    <div>
      <p>Current Count</p>
      <pre>{state.context.count}</pre>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  );
}
```

That's it, you now have a shared counter in your app. Fully multiplayer enabled and ready to go.
You can see the full example code [here](https://github.com/statelyai/sky-starter-app/blob/main/src/examples/counter.tsx), and play with a deployed version [here](https://sky-starter.stately.ai/?page=counter).

### Links

- [Try the Stately visual editor](https://state.new)
- [Read more about Sky and Stately at our blog](https://stately.ai/blog)

## The future of Stately Sky

We can't wait to see what you will build with the current release of Sky! And we are super excited about the future of Sky. We have a lot of ideas for how to make it even better, especially when it comes to AI. We see a lot of potential for state machines to improve the results you get from using LLMs.

Thanks for reading, hope to see you in the Sky!
