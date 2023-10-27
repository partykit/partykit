---
author: Min Chun Fu (Daniel)
pubDatetime: 2023-10-27T19:36:06Z
title: What is Flow, and Why is Partykit being a crucial player?
postSlug: flow-and-partykit-collaboration
featured: false
draft: false
tags:
  - collaboration
  - browser
  - multiplayer
  - partykit
  - flow
ogImage: "/content-images/"
description: Making the browser multiplayer is difficult. However, Flow and Partykit's collaboration brings multiplayer to a single website.
---

_Making the browser multiplayer is difficult. However, we could bring the multiplayer aspect to a single website. Starting with sharable notes and a sharable whiteboard. Flow is the center of collaboration. And that is just the beginning!_

Flow started with integrating party kit a long time ago. Back when they just started.

![Flow Vision](https://flow-notes.s3.amazonaws.com/7675f6a2-0bdb-417f-ac00-9f4f2c2a5c96-rfe.png)

The vision back then was simple. Try to create a collaborative note-taking experience using Tiptap Editor. Sunil, the CEO of Partykit, quickly created a template that I ended up using for a while.

The code is working, obviously, just not correctly configured for Flow. See the basic example [here](https://github.com/partykit/partykit-text-editor-example/blob/main/src/main.ts). The code works perfectly fine, and everything is syncing. Until I realized that I was using it the wrong way and the document wasn't syncing (It is fixed by now). Then, a huge problem surfaced, which I had a headache solving, the duplication problem. For some reason, the text is duplicating itself, and I did not know what to do besides knowing the problem was from the transformer. This is where I decided to rewrite the logic of saving and not relying on the official tiptap transformer.

## Global transformer

What I mean by global transformer is the logic behind it. Many of Flow's syncing components, like Notes and Whiteboard, rely on the `Y.js` library. If you know how to handle that, you are free from using a specific library on an individual "party" to save your documents. (Yes, I am showing the code.)

All of the party kit server code that was needed to implement the real-time syncing on Tiptap (using its collaboration plugin) was the following.

```ts
import { Buffer } from "node:buffer";
// ... [rest of the code as provided]
}
