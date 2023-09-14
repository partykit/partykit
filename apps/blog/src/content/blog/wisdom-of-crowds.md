---
author: Matt Webb
pubDatetime: 2023-09-14T14:03:00Z
title: The wisdom of crowds a.k.a. doing your own experiments
postSlug: wisdom-of-crowds
featured: false
draft: false
tags:
  - sketchbook
  - residency
  - demos
  - game
ogImage: "/content-images/wisdom-of-crowds/smiley.png"
description: Building a simple multiplayer drawing challenge, and what I learnt.
---

_(Hi! I’m Matt. I’m making and sharing with PartyKit for a few months. You can find an intro to what I’m up to [over here](/posts/everything-is-better-with-friends).)_

Some years ago there was a buzz around **collective intelligence.** One famous experiment gave a game controller to every person in a theatre, and had them land a (simulation of a) jumbo jet by averaging their actions.

I don’t have a 747. But another experiment asked a crowd to draw a picture, pixel by pixel, simply by highlighting a single pixel for each person and saying: _”We’re drawing the number 3. Here’s what we’ve got so far. Should this pixel be black or white?”_

Well, does it work? I couldn’t find the original experiment. (If this rings a bell for you, please let me know.)

So I tested it.

![10 people drawing a smiley face](/content-images/wisdom-of-crowds/smiley.png)

Here’s **Mosaic Challenge.** It’s real-time and multiplayer. There’s a single challenge. You just get asked to choose whether a tile is black or not.

[Play the demo here!](https://mosaic-party.vercel.app/) (Feel free to reset the game if it has already converged or is old.)

## First we get collective intelligence, then we get individual playing around

**Result:** for a 15x15 grid it takes about 600 tile flips to become recognisable. The wisdom of crowds!

I’ve seen this succeed with a few challenges now: draw a tree, draw a number 3, draw the letter A. It all works.

But then!

It takes a couple hundred turns to get the basic shape, and we get decent recognisability after 600 turns... but then, in about half the games I’ve seen, we lose detail. My guess is that the challenge is insufficiently constrainting. People _want_ to flip a tile and, seeing as there’s no longer an obvious goal to guide them, the tile flip becomes essentially random.

Lesson: with collective intelligence, you need to know when to stop. I wonder if there’s a programmatic way to tell when that is?

Also, I suspect that there’s usually a single person (maybe two) driving most of the decision-making, simply by flipping tiles faster than anyone else. I should check that.

![Drawing the number 3](/content-images/wisdom-of-crowds/three-progress.png)

## Let’s look at the code

The first version took me maybe an hour to build and put live. [Check out the code on GitHub.](https://github.com/partykit/sketch-mosaic) There are instructions about how to run it on your own laptop.

It’s neat to be able to run an experiment like this myself.

[The party server code is here.](https://github.com/partykit/sketch-mosaic/blob/main/src/partykit/server.ts) It maintains the current board state, and sends that out to any new connected browsers. It broadcasts any new tiles to all connected browsers in real-time.

You’ll also find two other handy tools in the code:

- A status widget on the client-side displays a live count of the number of connected users.
- For debug, I use `onRequest` in the party server to dump the current state of the mosaic. It’s in JSON so not very readable, and I wouldn’t usually leave this in for production, but I find it super useful during development. [Look at the debug view here.](https://sketch-mosaic.genmon.partykit.dev/party/announcer)

I decided not to use any shared data structure libraries for this because there’s not much going on — there are no complex edits to be merged or conflicts resolved. Just users flipping tiles.

So with this approach I can make something that I’m confident will scale: for example, I would love to see this presented on stage at a conference with 500 connected users, all making a picture together. Would that work? I’m pretty sure it will work technically. I’m using [hibernation](https://docs.partykit.io/guides/scaling-partykit-servers-with-hibernation) so the server can hold open many thousands of websockets simultaneously. But I don’t know if it would work _socially,_ and that’s the real experiment. I’ve only been able to share this on social media so far.

[Let me know](https://twitter.com/genmon) if you’re able to try this with a crowd, live! I would love to know what happens.
