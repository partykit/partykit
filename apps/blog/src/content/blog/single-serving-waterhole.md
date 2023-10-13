---
author: Matt Webb
pubDatetime: 2023-10-13T11:12:00Z
title: A single-serving waterhole in the Namib Desert using Remix
postSlug: single-serving-waterhole
featured: false
draft: false
tags:
  - sketchbook
  - residency
  - demos
  - remix
ogImage: "/content-images/single-serving-waterhole/social.jpg"
description: I work with a window open to a YouTube live stream of a waterhole in Namibia, animals and all. Now it’s multiplayer and hosted on PartyKit using the Remix starter kit.
---

Look, some days you want to do your work with a browser window open to a waterhole in the Namib Desert.

I saw a giraffe earlier!

[Come hang out at the waterhole.](https://waterhole.genmon.partykit.dev/)

![Website screenshot showing a desert waterhole with antelope and a giraffe. There's a chat interface in the corner.](/content-images/single-serving-waterhole/waterhole.jpg)

The source is [this YouTube live stream by NamibiaCam](https://www.youtube.com/watch?v=ydYDqZQpim8) _(YouTube)._ I often have it playing in the background while I’m at my desk.

It’s good vibes. I live in London so the timezones roughly match up (Namibia is GMT+2). When it’s light here, it’s light there — you’re going to catch some gemsbok having a drink, sometimes some warthog, maybe a couple ostriches. When it’s dark here, it’s dark there. NamibiaCam has a night vision camera set up; a friend saw a pack of wild dogs late one evening.

There’s something about the ambient sound too? You can hear the wind! There’s a zebra whinnying right this second!

![Multiple browser windows showing the YouTube video at different aspect ratios. The video always fills the viewport.](/content-images/single-serving-waterhole/tiled.jpg)

But! YouTube itself looks and feels like a website. It feels more like a _portal to another place_ when the live stream is full bleed. Look at the way the video covers the viewport as the browser changes size. Pretty sweet if I say so myself.

And, **togetherness.** Ephemeral chat slowly ticks away. Messages aren’t retained, only shared in real time. It’s enough to give a sense of presence.

(The _“6 here”_ badge in the bottom right is something I drop into many of my PartyKit projects as a quick check that that websocket is live.)

## PartyKit x Remix

This single-serving website is hosted entirely on PartyKit. Look at the URL: `waterhole.genmon.partykit.dev`.

The site is built with [Remix](https://remix.run/), a full stack web framework for React apps.

To get going, I used [PartyKit’s Remix starter kit](https://github.com/partykit/remix-starter). That gave me a template, then I added my own code and deployed. Done! PartyKit handles the multiplayer aspect (the chat) and also serves up the assets.

There is something… lightweight? …quick? …empowering? about being able to go from idea to deployed like this. So few moving parts.

## Here’s the code

The code is open. See: [sketch-waterhole on GitHub](https://github.com/partykit/sketch-waterhole).

Please feel free to fork and modify. Everyone has their own fave waterhole for hanging out. ([lofi hip hop radio](https://www.youtube.com/watch?v=jfKfPfyJRdk) used to be my go-to.)

Behind the scenes you'll see we're using [react-player](https://github.com/CookPete/react-player). This is a React component that wraps the YouTube player and others, and it provides a lot of control that isn’t being used here. So, for example, it would be pretty easy to make a shared jukebox, by using PartyKit to sync playback state and the video URL between all clients. A project for another day!
