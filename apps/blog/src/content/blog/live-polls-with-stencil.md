---
author: Matt Webb
pubDatetime: 2023-09-29T10:12:00Z
title: Using Stencil to make a live poll Web Component
postSlug: live-polls-with-stencil
featured: false
draft: false
tags:
  - sketchbook
  - residency
  - demos
  - web components
ogImage: "/content-images/live-polls-with-stencil/social.png"
description: Building a live poll Web Component with Stencil and PartyKit, plus a meditation on the art of maintenance.
---

Forget fancy modern web development for a moment.

What if I said you could add some regular HTML to your webpage, any webpage with no database required, and it would magically turn into an **interactive poll**? With real-time updating results as everyone votes.

Let me show you a GIF first and then,

- I’ll talk about why I’m digging into Web Components (the underlying tech)
- I’ll show you the code, and how to do this yourself.

<video autoplay muted loop src="/content-images/live-polls-with-stencil/poll-party.mp4"></video>

## The longevity of the web is amazing, but it doesn’t mean we have to stick with old tech

Let me get philosophical.

I’m part of a long-running on-again/off-again writing group. We have a website. I once wrote on my blog about [maintaining a 17 year old website](https://interconnected.org/home/2017/08/17/upsideclown) — and even that post is from 6 years ago.

My takeaway from that experience: two decades means a website can outlast the popularity of most web frameworks, even some _languages_, and so **maintenance** such as hopping between hosting providers means being able to re-write a site even as my own skills ebb and flow.

Maintenance! I feel like like we can never talk enough about maintenance. It’s the subject of Stewart Brand’s new book: chapter 1 is online, [The Maintenance Race](https://worksinprogress.co/issue/the-maintenance-race), all about the various maintenance strategies used in a 1968 round-the-world solo yacht race. _(It’s an incredible essay. Read the whole thing.)_

Brand highlights Bernard Moitessier’s approach: continuous maintenance, simplicity, and old systems. Hang on... old systems?

> Traditional systems (like wood-plank-keeled boats) have an advantage over innovative systems (like the then-novel plywood trimarans) in that the whole process of maintaining traditional things is well explored and widely understood. <u>Old systems break in familiar ways.</u> New systems break in unexpected ways.

Well! The web is an old system.

The special longevity of the web platform means we have this incredible accumulation of knowledge and perspectives. I love it for that. And I want to contribute to it. Hence: my ancient websites.

But!

Modern web frameworks, based on React and all the rest, allow for incredible interactivity which I _also_ love — the emerging real-time, multiplayer web. And I’m not confident, yet, whether these frameworks will have the same longevity and same ease of maintenance as my good old almost-static websites. Great for web apps, but for the web of documents? The jury is still out.

Perhaps there is a best-of-both-worlds approach.

Could I piecemeal upgrade the tried-and-tested traditional web to something which is real-time and multiplayer, in the knowledge that my websites won’t suffer if I need to revert in, say, 10 years?

Yes. This is where **Web Components** come in.

## Unpacking Web Components in the browser

[Here’s a playable demo of the live polls](https://partykit.github.io/sketch-polls/), the same as the video above. Give it a go!

Web Components are a standard web technology to create new HTML tags. They work in all modern browsers. What’s neat is that they can bundle their own functionality. So I’ve been looking at using websockets and a PartyKit backend to make them live.

Now, they’re complicated to build, so you want a build system. But once a component is built, it’s **reusable.** So I can include this script tag in the head of my otherwise static webpage, and you can too:

`<script type='module' src='https://unpkg.com/poll-party@0.0.1'></script>`

View source on the playable demo. Let’s break down this HTML:

```html
<poll-party host="poll-party.genmon.partykit.dev">
  <question>What is the best animal?</question>
  <option id="dogs">Dogs</option>
  <option id="cats">Cats, obviously</option>
  <option id="monkeys">Monkeysssss</option>
  <option id="ants">Ants</option>
  <option id="dk">Donkey Kong</option>
</poll-party>
```

The tag `poll-party` is the new HTML element installed by that script.

The attribute `host` is the PartyKit server responsible for tallying votes. (You can use mine, or you can deploy your own.)

Each poll is its own “party,” or “room”. The party name is a hash of a question and options for the poll; this isn’t something you need to set independently.

And that’s it! The internal poll-party code takes care of displaying either the form for the user to vote, or the results, as appropriate.

Meanwhile the rest of the HTML is untouched.

**What I like about this approach is that it works on any static website.** So I can add a live poll to my website built 23 years ago, or my radio show fan website built with Jekyll and hosted on GitHub Pages.

I see these polls as a proof of concept, and I’ll be experimenting more in this direction.

## Digging into the code

[Here’s the GitHub repo for the poll-party Web Component and PartyKit back-end.](https://github.com/partykit/sketch-polls)

The components itself is built using [StencilJS](https://stenciljs.com). Stencil puts a friendly, reactive wrapper around the underlying Web Components standard: you can change when props (element attributes) change; emit and listen for events; and so on.

- The docs are great but it’s still not 100% straightforward to get started. [Check out the README](https://github.com/partykit/sketch-polls#using-stenciljs) for the steps I took to get started with Stencil.
- Once your component is complete, you can publish to npm. [Here’s poll-party on npm.](https://www.npmjs.com/package/poll-party)

Now, PartyKit…

[Have a look at poll-party.tsx](https://github.com/partykit/sketch-polls/blob/main/src/components/poll-party/poll-party.tsx), which is the component source. You can see in there how the websocket (as using `PartySocket`) is created, and how votes are submitted and results listened for.

And [here’s polls.ts, the PartyKit server](https://github.com/partykit/sketch-polls/blob/main/partykit/polls.ts). It’s incredibly simple. Each poll is a separate party, and the room persists the vote tally using the [Storage API](https://docs.partykit.io/guides/persisting-state-into-storage/) _(link there to the PartyKit docs)_. The current state is broadcast when a client connects, and whenever any connected client submits a new vote.

## Lightweight and composable

Web Components are themselves a mature technology. [Consulting Wikipedia](https://en.wikipedia.org/wiki/Web_Components), I see they were introduced in 2011! And they’ve had several years of good cross-browser support.

Yet it’s only since using [Stencil](https://stenciljs.com) that I feel like I have a handle on them myself. And combined with a PartyKit backend, I feel like I have a path to making more and more of these lightweight, composable Lego bricks, in pursuit of a real-time, multiplayer web that goes hand-in-hand with its longevity.

Or maybe it won’t matter because we’ll all be obsoleted in an AI singularity in a matter of months anyway, who knows.

Hang on! Let’s see if I can include a poll on the PartyKit blog!

<script type='module' src='https://unpkg.com/poll-party@0.0.1'></script>
<poll-party host="poll-party.genmon.partykit.dev">
  <question>Will AGI be achieved before 2025?</question>
  <option id="yes">Yes</option>
  <option id="no">No</option>
</poll-party>

🤖🤖🤖
