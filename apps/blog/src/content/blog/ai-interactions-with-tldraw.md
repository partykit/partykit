---
author: Matt Webb
pubDatetime: 2023-10-04T14:12:00Z
title: Exploring AI interaction design and multiplayer with tldraw
postSlug: ai-interactions-with-tldraw
featured: false
draft: false
tags:
  - sketchbook
  - residency
  - interaction design
  - ai
  - tldraw
  - research-note
ogImage: "/content-images/ai-interactions-with-tldraw/window-social.png"
description: How might we interact with AI? I'm exploring this with tldraw, a multiplayer whiteboard app.
---

One question is: **how might we interact with AIs?**

Something I like to do is to sketch in code to explore different angles in interaction design. You can reach interesting conclusions even with scrappy code.

What you’ll find in this post:

- A review of a few of today’s human-AI interaction modes -- and why I think that _multiplayer_ is an approach worth taking too.
- Some software sketches built on [tldraw](https://tldraw.com), a multiplayer infinite whiteboard web app, with NPC users that can follow commands and proactively offer help.
- Some conclusions in both the design and tech domains.

**There’s also code!** We made a starter kit to get tldraw working with PartyKit, for your own experiments. You’ll find that at the bottom of this post.

_(I delivered a version of this post as [my talk at NEXT23 in Hamburg](https://nextconf.eu/event/playfully-inventing-our-way-into-the-ai-future/) a few weeks ago.)_

## The pros and cons of today’s human-AI interaction modes

Let’s take a look at a few. I’m sure I don’t need to remind anyone what [ChatGPT](https://chat.openai.com) looks like, but let’s start there.

![A blank ChatGPT chat with a few providing starting points](/content-images/ai-interactions-with-tldraw/chatgpt-screenshot-sm.png)

**~~Affordances.~~** I use ChatGPT daily, it’s amazing. It takes some learning though. From an interaction design point of view, ChatGPT is missing [visual affordances](https://www.interaction-design.org/literature/topics/affordances): like a door handle informs you that you’re looking at a door and not a wall, and also provides the possibility of opening it, _‘affordance’_ is the technical term for being able to see what you can do.

Sure, ChatGPT has those hints about where to begin. But let’s say I’m in the middle of writing a blog post and I’m stuck for phrasing: it has no _affordance_ that points the way at exactly how it can help.

<video autoplay muted loop src="/content-images/ai-interactions-with-tldraw/Notion AI en-US.mp4"></video>

[Notion AI](https://www.notion.so/product/ai) is really smart: a menu command like _’Change tone’_ is a great affordance. You’re likely to notice the feature before you need it, and change your workflow to take advantage of it. _The video above is taken from their marketing site._

([Replit Ghostwriter](https://replit.com/site/ghostwriter) has a great spin on this. You choose a command like _’Generate’_ and then add a free-text prompt to nuance the AI.)

**~~Proactive.~~** The affordance gain is great. But context menus aren’t an interface which makes it easy for the AI to jump in. If the AI knows it can be super helpful, wouldn’t it be great if it put its hand up to offer?

<video autoplay muted loop src="/content-images/ai-interactions-with-tldraw/robin-sloan-rnn-example-1.mp4"></video>

Here’s another human-AI interaction mode.

One of the best patterns we have is _ghosted text for suggested autocomplete._ This is how [GitHub Copilot](https://github.com/features/copilot/) has worked since it launched in 2021 — another AI that I collaborate with daily.

But the video above is from further back. In [Writing With the Machine](https://www.robinsloan.com/notes/writing-with-the-machine/) (2016!), author Robin Sloan trained a recurrent neural network (RNN) on a corpus of mid-century science fiction short stories. Then he hooked the output up to tab-autocomplete.

Sloan found quickly that this wasn’t a text editor that “writes for you.”

> The animating ideas here are <u>augmentation</u>; partnership; call and response.

Which is exactly how the rest of us - years later - use Copilot, right?

**~~Multifunctional.~~** Where I’d like to extend both Sloan’s work and Copilot is to somehow have _many_ different functions instead of the same style of autocomplete all of the time. Think of working on a Google Doc with your human team. Your ideal team changes over time... perhaps you’d pair with a creative sparring partner at the beginning, ask some critical friends to drop by at the midpoint, and a work with a detail-oriented copyeditor at the end. A fact-checker might come and go. But what would be stifling would be a copyeditor dropping comments right at the outset, when you’re still feeling out your topic.

So what would it mean to have AI interactions that are as sophisticated as that human team?

## AI as teammate

To summarise, this is what I‘m looking for. An interface that

- has **affordances**
- means the AI can be **proactive**
- allows for a **multifunctional** AI with different functions at different times.

Now, it’s early days. People are iterating AI interaction design so fast. And those are only a few examples above. The number of future approaches will dwarf that list! But there’s a specific approach that I feel cuts through a lot of the issues: **multiplayer.** That’s the direction I want to explore.

Once you say that you can have _many different AIs,_ simultaneously, each with its own personality, and you interact with them (almost) exactly as you would interact with your colleagues, a whole set of problems just disappear.

Let me go through my software sketches and show you what I mean.

## Demo: Interacting with non-player characters on an infinite whiteboard

It‘s demo time! (By the way, I use the term _NPC_ to mean _non-player character._ This is because the NPCs are not entirely AI-driven, and some don’t use AI at all.)

<video autoplay muted loop src="/content-images/ai-interactions-with-tldraw/demo/1-intro.mp4"></video>

### 1. Combining tldraw and PartyKit, and adding fake users with their own cursors

What’s we’re looking at here is an integrated version of [tldraw](https://www.tldraw.com), the multiplayer infinite whiteboard web app. [tldraw supplies an open source library](https://tldraw.dev) which I’ve taken and added a sidebar with chat and a “facepile” (line of user avatars).

Active uers have to hang out _somewhere:_ I’ve chosen to supply a [cursor park](https://knowyourmeme.com/memes/cursor-park), a place in a shared document where users can leave their cursors while they’re reading. It’s a gag but genuinely, it’s useful to have a place to go! Like having pockets to stuff your hands in when you’re in an idle state.

NPCs are summoned to the filepile across the top of the screen, and simultaneously their cursors appear on the multiplayer whiteboard.

<video autoplay muted loop src="/content-images/ai-interactions-with-tldraw/demo/2-poet.mp4"></video>

### 2. Proof of concept: the poet NPC in action

Let’s see how it works…

- We can tell the poet to **circle.** This is just to prove that we can programmatically control the cursor NPC.
- We can ask the poet to **compose a poem.** Behind the scenes this is using OpenAI. It’s neat to see the locus of attention of the NPC move with the cursor – you have a better idea what the NPC is “thinking” about.

You can also see that the NPC can speak into the chat. An earlier version didn’t have chat and it felt too constrained.

<video autoplay muted loop src="/content-images/ai-interactions-with-tldraw/demo/3-painter.mp4"></video>

### 3. Proactive NPCs! The painter helps out when it can

Let’s get more sophisticated. **The painter likes to paint stars.**

If you draw a rectangle on the whiteboard… nothing happens.

If you draw a star on the whiteboard, then the painter NPC moves its cursor nearer to the shape in question, and puts its hand up (by speaking into the chat) to say that it can help. You can accept its help by choosing the action from the command menu, at which point the NPC colours the star and returns back to the cursor park.

This is just a toy example. But I think there’s something there akin to [proxemics](https://en.wikipedia.org/wiki/Proxemics), the meaning the people ascribe to the distance between us. For example we might example an editor NPC that hovers nearby a paragraph when it has something to suggest regarding style. The more confident it is it can help, the closer it would come.

<video autoplay muted loop src="/content-images/ai-interactions-with-tldraw/demo/4-maker.mp4"></video>

### 4. Functions: Ask the maker to draw on the canvas for you

In this example I’m using [OpenAI function calling](https://openai.com/blog/function-calling-and-other-api-updates) and I’ve provided the AI with a straightforward command to add shapes to the canvas.

If we ask it to draw _“a 3x3 grid of squares, narrow gutter”_ then it does just that. (This recorded version of the prototype doesn’t have an idle animation built in; my current version does.)

And if we ask it to draw a house… then it can’t. Maybe AI won’t take our jobs quite yet.

_I want to give a shout out to [Fermat](https://fermat.app) for pushing hard into the space of AI operating on an infinite canvas. In particular I was inspired by [Max Drake's prototypes on X/Twitter](https://twitter.com/max__drake/status/1641034364615008256) (thread), showing how the agent can even be given knowledge of the canvas state, and the human and the AI can work together._

## Some design conclusions

I’m taken with a few of the interactions that emerged while I was working on this sketch:

- **Cursor proxemics to show attention.** It’s a powerful pattern, to use the distance of a cursor to show where an NPC is paying attention, and being near/far to allow it to chip in with varying levels of confidence. Cursors aren’t an all-purpose solution (neither smartphones nor VR headsets use cursors) but there’s something here to explore.
- **Multiple helpful AIs, not just one.** As a user, I can have a _”theory of mind”_ about a focused AI that I can’t with a general-purpose copilot. There’s my affordance right there. I can see a world in which we bring in different AIs with different goals at different project stages.

**tl;dr:** AI-as-teammate is an approach that answers some (though not all) of today’s issues in AI interactions. Future solutions will likely combine several approaches; this one has some unique strengths.

While it’s fun to experiment using an infinite canvas, I feel like some of these patterns could also be applicable in other apps like Figma or even text editors like Google Docs — or perhaps even at the OS level.

An outstanding question is how to avoid anthropomorphising NPCs. These NPCs aren’t full AIs (just using large language models for specific features), but even if they did have GPT-4-level smarts, they still wouldn’t be human, so how do we encourage users to think about non-human intelligence? In a previous version of this software sketch, [I depicted the NPCs as dolphins](https://interconnected.org/more/2023/partykit/npcs.html)… a playful metaphor but perhaps too distracting.

## Technical architecture and future-facing hunches

As with my other sketches, the code is open for you to browse and build on. I’ll summarise the architecture first.

![Code architecture diagram: the client hosts the tldraw client, which uses Yjs to talk to a PartyKit-hosted backend. The NPCs also run on PartyKit.](/content-images/ai-interactions-with-tldraw/architecture-sm.png)

tldraw can use Yjs as its multiplayer sync server: [here’s the tldraw Yjs example code](https://github.com/tldraw/tldraw-yjs-example), made open source by the tldraw team.

Happily PartyKit can act as a Yjs backend. [See y-partykit in the docs.](https://docs.partykit.io/reference/y-partykit-api/)

Once those are brought together, it’s possible to write NPCs as separate PartyKit servers that connect directly to tldraw and manipulate its Yjs document directly. For presence (i.e. to show a user is online) we make use of the Yjs awareness protocol, just as tldraw does.

Having built this, I have two technical ~~conclusions~~ hunches:

- In the future, we’ll need **NPC-specific APIs.** NPCs, whether using AI or just mechanical fake users, need access to real-time application events, and they need high-level ways to view and manipulate the current application state. These APIs will have to run on the server, so that the NPCs are independent of any specific client. I’m not convinced that REST is a good fit for this, and my hunch is that NPC APIs will look quite different from the APIs we have today.
- If we’re going to have human-AI collaboration, then **apps should be natively multiplayer.** It’s way easier to solve both design and technical challenges when applications already have the concept of multiple users working simultaneously on the same document.

## You can download the code

- **Scrappy exploration code:** In the repo [sketch-tldraw-npcs](https://github.com/partykit/sketch-tldraw-npcs) on GitHub you’ll find all the NPC experiments above. For example, [here’s the maker NPC with OpenAI function calling](https://github.com/partykit/sketch-tldraw-npcs/blob/main/src/partykit/npc-maker.ts). Feel free to browse. _(I’m not going to link to the playable demo itself here… I cut corners making this sketch, and while it’s fine to use to record videos, it’s not robust enough to be used!)_
- **Starter kit for a multiplayer whiteboard:** In [sketch-tldraw](https://github.com/partykit/sketch-tldraw) you can find a minimal implementation for tldraw with a PartyKit backend, based on the tldraw team’s own work with Yjs (thank you!). Use this as a starting point for your own NPC investigations!

[Let me know](https://twitter.com/genmon) if you do any digging in this direction yourself. I’d love to see.
