---
author: Matt Webb
pubDatetime: 2023-09-25T13:26:00Z
title: Dancing cursors and Voronoi diagrams
postSlug: dancing-cursors-and-voronoi-diagrams
featured: false
draft: false
tags:
  - sketchbook
  - residency
  - demos
  - cursors
  - d3
ogImage: "/content-images/dancing-cursors-and-voronoi-diagrams/screengrab.png"
description: Real-time multiplayer cursors on the PartyKit homepage drive an interactive Voronoi diagram. Here’s how it works.
---

If you go the [PartyKit homepage](https://www.partykit.io) right now, you may be lucky enough to see it dancing with cursors.

<video autoplay muted loop src="/content-images/dancing-cursors-and-voronoi-diagrams/voronoi-cursors.mp4"></video>

_(Or maybe it doesn’t do that anymore! For me, “right now” is September 2023.)_

It’s a trope but I love multiplayer cursors. The web should feel more _alive!_ And when you see other people’s real-time cursors, you get a sense of presence.

The pattern itself is a **Voronoi diagram**.

To make a [Voronoi diagram](https://en.wikipedia.org/wiki/Voronoi_diagram) _(Wikipedia),_ you take a point (a cursor in this case) and look for its nearest neighbour. Then you draw a line, crossways, at the midpoint between them. Rinse and repeat for all points and all neighbours. That gives you a set of cells: small cells for points with many nearby neighbours, large cells when a point has plenty of space. Colour the cells as you want.

And this is what that is, only interactive. I find myself playing with other people’s cursors, seeing how the cell boundary changes between us — and sometimes you find someone who dances back.

Actually, this does happen! Check out [this exchange](https://twitter.com/adam_janis/status/1701703493143409148) I happened across on X/Twitter:

![A Twitter thread. The first message is 'and ofc partykit gets much better with friends' with a picture of the homepage. The first reply is: 'holy s—, was that you I was going this with!??'](/content-images/dancing-cursors-and-voronoi-diagrams/twitter-thread.png)

Happy serendipity!

## Diving into the code

[Here’s a standalone demo.](https://multicursor-sketch.vercel.app) And [here’s the code on GitHub](https://github.com/partykit/sketch-voronoi).

The PartyKit server receives all the cursor coordinates and re-broadcasts them to all other clients connected to the room. (Actually it’s not absolute coordinates. They’re scaled in proportion to the screen.) [The server code is pretty brief](https://github.com/partykit/sketch-voronoi), but note three things:

- we’ve opted into **hibernation** ([docs](https://docs.partykit.io/guides/scaling-partykit-servers-with-hibernation/)) which means the server can handle thousands of connections simultaneously. The bottleneck is the frequency of cursor updates from the clients: really those should be debounced, and the updates batched up so they’re not broadcast so often.
- **country flags!** In `onConnect` we’re looking at the `request` object and pulling out some Cloudflare-specific data. In particular, we’re grabbing the connection’s location (to a country resolution) and using an attachment to save it on the websocket object for later display. That’s how the flags appear.
- finally, **a cursor carries its type** with it: `mouse` or `touch`. Touches on a smartphone screen are ephemeral — the cursor only shows up while the user is touching their phone, and the client displays it as a hand not a pointer.

The Voronoi pattern itself is drawn with the data visualisation library [D3](https://d3js.org).

D3 comes with [a package to compute Voronoi diagrams](https://d3js.org/d3-delaunay).

You can see [the Voronoi integration itself here](https://github.com/partykit/sketch-voronoi/blob/main/src/app/shared-space.tsx). It’s part of the client-side app.

It’s pretty neat to be able to flow messages from `usePartySocket` into a live, programmatic SVG. This sketch is just a toy, but given D3 is a data visualisation language, I do wonder what other real time sources could be similarly plugged in.

## Cursors, cursors, cursors

Like I said, I can’t get enough of cursors. _(Which don’t translate well to smartphones or future spatial computing, sure, but we’ll cross that bridge when we come to it.)_

![A screengrab of my blog with multiple blurred-out cursors behind the text.](/content-images/dancing-cursors-and-voronoi-diagrams/blog-cursors.png)

On [my blog](https://interconnected.org/home/), for example, I show real-time multiplayer cursors on every page, but blurred slightly as if beyond frosted glass. For vibes.

And I too have had that serendipitious experience of dancing cursors with a stranger!

But all of that is a story for another day.
