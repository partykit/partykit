---
author: Matt Webb
pubDatetime: 2023-12-05T12:02:00Z
title: Partycore (everything’s better at 140bpm)
postSlug: partycore-140bpm-with-tonejs
featured: false
draft: false
tags:
  - sketchbook
  - residency
  - demos
  - tonejs
  - music
ogImage: "/content-images/partycore-140bpm-with-tonejs/social.png"
description: We’ve built a multiplayer drum machine demo with Tone.js and Yjs. It’s a ton of fun. Here’s how it works.
---

Hey come on over to **[partycore](https://partycore.labs.partykit.dev/rooms/1999)** and play with our drum sequencer.

<video controls muted src="/content-images/partycore-140bpm-with-tonejs/partycore-demo.mp4"></video>

There are three tracks. You tap a step to turn it on or off. Drag the slides at either end of a track to change the loop length — you can get some good polyrhythms going.

Ignore my sounds in that demo. My loops aren’t great.

But some people are _really_ good at this. This sequencer is multiplayer by default, so my main trick is to hang out on that page and wait for someone else to come along and make a better beat.

### The code is open so you can see how it works

Here’s the GitHub repo: [sketch-sequencer](https://github.com/partykit/sketch-sequencer).

The app is built and served with PartyKit using the [Remix template](https://github.com/partykit/remix-starter). I like building that way because I can serve up a whole site from `partykit.dev`.

Data sync between the app and the server is achieved with Yjs using [y-partykit](https://docs.partykit.io/reference/y-partykit-api/), PartyKit’s native Yjs backend. So there’s nothing bespoke in the server ([see sequencer.ts](https://github.com/partykit/sketch-sequencer/blob/main/party/sequencer.ts) for the code)…

…whereas on the client side there’s a lot going on. Because while it’s neat to host a shared Yjs doc so easily, I find it fiddly to interact with the doc directly. So I write high level functionality and make it available in a hook. [Look at useSequencer](https://github.com/partykit/sketch-sequencer/blob/main/app/hooks/use-sequencer.tsx) to see how to edit the steps and the loop ranges. This is a pattern I reach for pretty frequently.

Finally, how are the samples scheduled? That’s all client-side. While the steps and ranges are synced across browsers, the playhead itself isn’t synced. Each browser uses the Web Audio framework [Tone.js](https://tonejs.github.io) to play the tracks independently.

### new website, who dis?

You may have noticed the smart new look of our [homepage](https://www.partykit.io) and this blog.

We’ve been working with Mark Hurrell of [ThinkM Studio](https://thinkm.studio). The new design shipped last week.

So when Mark showed me this design of his polyrhythmic drum sequencer, we had to make it. I wired up the multiplayer backend Thursday evening and built out the rest on Friday.

Now we all get to play. Thanks Mark!
