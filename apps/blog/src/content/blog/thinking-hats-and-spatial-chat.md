---
author: Matt Webb
pubDatetime: 2023-09-19T15:16:00Z
title: AI chatbots for Edward De Bono’s Six Thinking Hats
postSlug: thinking-hats-and-spatial-chat
featured: false
draft: false
tags:
  - sketchbook
  - residency
  - demos
  - ai
  - chat
ogImage: "/content-images/thinking-hats-and-spatial-chat/moving-rooms.png"
description: AI chatbots with personality, for group teams. The code uses Yjs and is open for you to customise.
---

Edward De Bono is famed for coming up with _lateral thinking_ — how to reach new ideas in non-obvious ways.

For groups, De Bono also came up with the approach of [Six Thinking Hats](https://en.wikipedia.org/wiki/Six_Thinking_Hats) _(Wikipedia)._

In a nutshell: _Six Thinking Hats_ is a technique to deliberately bounce your team’s discussion between approaches like “new ideas” (green hat) and “evaluation” (black hat), in order to explore and expand your thinking on a particular issue. For instance you might say: ok I’m putting on the red hat now (“feelings and emotions”), or the green hat, or the white hat. Different types of discussion combine different thinking hats.

Meanwhile! We have ChatGPT.

I love ChatGPT and I similarly use it to think through issues and rubber duck my way through writing code. So I’m intrigued about stretching AI chat in two ways:

- Can we use AI chatbots together, in teams?
- Can we have different chatbots for different purposes?

Such as! Could you have a green hat AI bot and a black hat AI bot? You would use this to think through an issue from all sides, either on your own or with your team.

_(I am trying SO HARD right now to not say HatGPT. I hope you appreciate how difficult this is for me.)_

Ok so that is what I’ve built, and you can use it too: **AI-facilitated De Bono Thinking Hats.**

<video controls autoplay muted src="/content-images/thinking-hats-and-spatial-chat/spatial-chat-intro.mp4"></video>

## Thinking hats as spatial chat

Want to get straight to it? [Try the demo now.](https://i-am-chatting-in-a-room.vercel.app/)

_Read on for how it works, and to download the code and run/customise it yourself..._

Let’s look at what we’ve got:

- **There are six coloured rooms,** one for each of the six thinking hats: planning (blue), new ideas (green), facts (white), new benefits (yellow), feelings (red), and evaluation (black).
- _(Actually there are a couple of bonus rooms, but I’ll leave you to discover those.)_
- **The rooms are laid out in a spatial grid.** There’s a Google Maps-style navigator in the bottom right. A smooth animation takes you from room to room. Because the chatrooms connect spatially, the idea is that you’ll mentally record your way back to information more naturally than having those same conversations in a sidebar list.
- **Each room has a helpful NPC.** An NPC is a non-player character, a fake user. In each room is an AI chatbot that facilitates the discussion according to the “hat.” If you’re in the yellow hat room, the chatbot will suggest new benefits of your idea. In the white room, you’ll be encouraged to dig for factual information.
- **It’s all multiplayer.** We do our best thinking together, so you can all together together with the AI chatbots, or you can move around independently and catch up with the conversation when you enter a room.

Here’s a map. You start in the blue room.

![Thinking Hats map explaining how the rooms are connected. The top two rooms are: "Blue: the big picture" and "Green: new ideas". They connect respectively to: "White: facts and Info" and "Yellow: positive". Next row rooms are: "Red: feelings and emotions", "Black: evaluation" and "Poet". "Poet" connects to the last, secret, room](/content-images/thinking-hats-and-spatial-chat/map.png)

## The code: what you’ll find

[Check out the code on GitHub.](https://github.com/partykit/sketch-spatial-chat) There are instructions there for how to run it yourself.

I made the first version of this as part of my personal [multiplayer UI sketchbook](https://www.actsnotfacts.com/made/multiplayer), but the code was pretty scrappy. In this updated version you’ll find three interesting patterns that you may want to crib for your own PartyKit projects.

### 1. Lots of Yjs

[Yjs](https://yjs.dev/) is a framework for shared data structures. Like, if you were building your own Figma or Google Docs, with lots of people working simultaneously on the same document, you’d probably use Yjs to intelligently merge changes.

PartyKit ships with an easy, high-scalable Yjs back-end: [here are the docs for y-partykit](https://docs.partykit.io/reference/y-partykit-api/). Getting started is a one-liner. Yjs also implements presence (i.e. which users are in each room) in a feature called ”awareness.”

With this demo, each chat room is a separate Yjs document. If you’d like to dig into the code: here’s [how the client app talks to the y-partykit back-end](https://github.com/partykit/sketch-spatial-chat/blob/main/src/app/providers/room-context.tsx). And the room itself uses `useUsers` to [show the presence of many users](https://github.com/partykit/sketch-spatial-chat/blob/main/src/app/components/Room.tsx).

### 2. Manipulating the Yjs document on the server

What’s neat about using PartyKit is that I can write my own business logic.

In particular, [here’s the PartyKit code for the server](https://github.com/partykit/sketch-spatial-chat/blob/main/src/partykit/server.ts). For a Yjs backend, all you need is the `onConnect` handler.

But I’ve also added a handler called `handleYDocChange` which runs as a callback every time the shared Yjs document changes.

This means that, on the server side, we’re watching the chatroom conversation. And whenever a new message comes in, we get to run some code. You can do all kinds of things with this pattern, and here we’re going to use it to respond to messages using a chatbot.

### 3. Server-side OpenAI chatbots

[The API call to ChatGPT from the server is here](https://github.com/partykit/sketch-spatial-chat/blob/main/src/partykit/utils/openai.ts). It puts together the chatroom conversation into a list of messages, adds the prompt of the room’s NPC at the top, and sends it off.

The NPC prompt is something like:

_"You are a motivational brainstorming partner. Build on what I say with a positive, wildly imaginative extra ideas. 'Yes And' all the way. Encourage others to do the same. Be succinct._

(That’s the green hat: new ideas.)

We want the chatbot to run on the server, instead of from the user’s web browser, because that way it is independent of any particular user: it’s multiplayer after all. You can also see in this example how to stream the response from OpenAI, so that the chatbot’s response message appears character by character in the room.

### Now... customise it!

If you’d like to change the room map, or add your own NPCs, [start with RoomMap in shared.ts](https://github.com/partykit/sketch-spatial-chat/blob/main/src/shared.ts).

![Moving rooms](/content-images/thinking-hats-and-spatial-chat/moving-rooms-small.png)

## What next?

I feel like De Bono’s _Six Thinking Hats_ approach is a good way to explore ideas from all sides? If you try this system with a team in a real-life situation, I’d love to hear about your experience.

I’m into the idea of group chat + AI, but the chatbots should be able to learn from their participants, not just respond: are there better ways to interact, instead of replying to every message?

I’m also into the idea of rooms that hold context, so perhaps they accumulate docs and memory over time, rather than being wiped clean like Zoom rooms at the end of a video call.

So, for me, this is the beginning of that exploration.

<video controls autoplay muted src="/content-images/thinking-hats-and-spatial-chat/bonus-rooms.mp4"></video>

_p.s._ here’s a quick vid of the bonus rooms. There’s a poet... and one of the rooms is haunted. Enjoy!
