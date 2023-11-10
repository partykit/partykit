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

_[Anders Bech Mellson](https://github.com/mellson) and the [Stately team](https://stately.ai) are at the forefront of visual app logic construction and collaboration. When they wanted to deploy app logic to the Sky, they turned to PartyKit._

## Introducing Stately

State machines provide a robust framework for structuring application logic, making our code predictable and straightforward. This insight drives us at [Stately](https://stately.ai), a company brought to life by [David Khourshid](https://twitter.com/DavidKPiano). David also created [XState](https://github.com/statelyai/xstate), the popular library for managing and orchestrating state anywhere JavaScript runs.

<img src="/content-images/partykit-orchestrates-stately/example-machine.png" alt="Image of a state machine in the Stately Studio visual editor" >

Our [Stately visual editor](https://state.new) is a game-changer—you can use it to:

- construct app logic visually with drag-and-drop.
- speedily generate logic from text descriptions using AI.
- collaborate on your logic in a format your whole team understands.
- simulate your logic to discover unreachable states and unwanted transitions quickly.
- effortlessly turn your state machine diagrams into code, test paths, and more.

To further bridge the gap, we offer a [VS Code extension](https://marketplace.visualstudio.com/items?itemName=statelyai.stately-vscode), which syncs with the visual editor, ensuring a smooth transition between visual and code views.

## Our Vision: Stately Sky 🌤️

We envision a world where deploying your application logic is as simple as a few clicks. This is where Stately Sky comes in. We're offering a service that runs at the edge, enabling the building of real-time applications without any back-end coding. Stately Sky works alongside our visual editor, helping you go from visualizing your app logic to having a real-time application running live in just a few steps.

## Stately ❤️ PartyKit

As we developed Stately Sky, we faced two significant challenges:

1. How do we orchestrate running machines and provide them with a `multiplayer` experience?
2. How do we make it easy to `deploy` and run state machines in the Sky?

### Multiplayer

We started working on Sky in February 2023. At that time, PartyKit was emerging as the cool new tool for real-time collaboration, and it was a perfect fit for our use case. So, we contacted the PartyKit team, and they were extremely helpful and supportive in getting us on board the early access program. Within a few days, we had a functioning prototype.

PartyKit not only addressed our orchestration needs but also added features like user presence, which users can incorporate into their own apps.

### Deployment

But we needed to solve our second challenge before Sky could become a reality: Because our users are building state machines live in our editor, we don't know what the machines will look like until they are complete. We needed a way to deploy the state machine code dynamically.

And since we don't know what the code will look like until the user wants to deploy, we can't really provision any infrastructure in advance. We need to be able to deploy the state machines dynamically. We also need to be able to deploy them in a secure and scalable way without resorting to questionable methods like using [`eval`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval).

We explored various options for this but didn't find any satisfactory off-the-shelf solutions that met our safety and quick deployment requirements.

#### [Sunil](https://twitter.com/threepointone) has entered the chat

Since PartyKit was solving our multiplayer problem so easily, talking to the PartyKit team about our deployment problem felt natural. We chatted with Sunil, and he brainstormed a solution codenamed `machinehub`.

Given Sunil's extensive knowledge of Cloudflare, he suggested using [Workers for Platforms](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/) to solve the problem. This collaboration was a breakthrough, providing us with a way to deploy state machines dynamically, swiftly, and securely, and we are very grateful to Sunil for his help!

## What can you build with Stately Sky?

You can think of Stately Sky as a _multiplayer-enabled app logic-as-a-service_ platform. That's quite the mouthful. If you already know XState, it might be easier to think of it as _state machines in the cloud_ (or the Sky in our case 😅).

It turns out this is super convenient for building many different types of apps. Your imagination is the only limit.

#### Counter example

Let's look at a very basic example of how to build a shared counter in React using Stately Sky.

We'll start by building the simple counter machine in the Stately Studio visual editor. When finished, it looks like this ([view the machine in our editor](https://sky.stately.ai/Wu5gAj)):

<img src="/content-images/partykit-orchestrates-stately/counter-machine.png" alt="Counter machine shown in the Stately Studio visual editor" >

Now, let's have a look at the code you would need inside your app to connect to this machine:

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

That's it, and you now have a shared counter in your app. Fully multiplayer enabled and ready to go.
You can [find the full example code in the starter repo](https://github.com/statelyai/sky-starter-app/blob/main/src/examples/counter.tsx), and [test our deployed demo](https://sky-starter.stately.ai/?page=counter).

## The future of Stately Sky

There's so much to be excited about with Stately Sky. Imagine creating any type of event-driven workflow, no matter how complex, and deploying it at the click of a button.

Sky isn't the limit though; we have even more plans for using state machines and AI to intelligently assist in the creation and improvement of the workflows you create.

We can't wait to see what you will build with Stately Sky!

- [Try the Stately visual editor](https://state.new)
- [Read more about Sky and Stately on our blog](https://stately.ai/blog)
