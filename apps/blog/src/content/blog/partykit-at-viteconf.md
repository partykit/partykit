---
author: Sylwia Vargas
pubDatetime: 2023-10-12T14:12:00Z
title: PartyKit at ViteConf 2023
postSlug: partykit-at-viteconf
featured: false
draft: false
tags:
  - community
  - showcase
  - conference
ogImage: "/content-images/partykit-at-viteconf/social.png"
description: ViteConf attendees sent over 23,000 live reactions using PartyKit.
---

Last week PartyKit made an appearance at [ViteConf](https://viteconf.org/23), an online conference that celebrates Vite and the web dev ecosystem at large, hosted by [StackBlitz](https://stackblitz.com/).

The conference is known for its friendly vibe, which is no small feat as most online conferences fail to recreate that special communal space online. ViteConf organizers, however, managed to bring the in-person conference joy onto Discord and Twitter, which are booming with love, jokes, and serious questions 💕

To make the space cozier and even more communal, the organizers added a little interactivity to the conference platform to help the participants feel that they are experiencing the talks together.

<img style="width:400px; height: auto;" src="/content-images/partykit-at-viteconf/hearts-go-up.gif" alt='A reaction counter going up'>

A week before the conference, Matias Capeletto, a Vite core maintainer, added a real-time reaction counter to the platform using [our example](https://github.com/partykit/example-reactions) as reference. At first, the team wasn't sure if they would be able to implement real-time features in such a short timeframe, but using the examples, they had a working prototype in less than a day. In Matias' words:

<a href="https://twitter.com/patak_dev/status/1708849034201268561" target="_blank" rel="noopener noreferrer"><img style="width:650px; height: auto;" src="/content-images/partykit-at-viteconf/patak-partykit.png" alt='Pataks tweet: "I finally got an opportunity to try PartyKit. It works like a charm. A true pleasure to use 💜 Youll play with it this week at the ViteConf party 🍿"'></a>

In this way, the attendees were able to show their love and reward the speakers as the talks progressed 💕 Every time a participant clicked on the button, their joy was broadcasted to everyone else -- you were able to see the counter go up in real time. Some talks gathered over 2k reactions and the most popular one, [Evan You's Vite keynote](https://viteconf.org/23/replay/vite_keynote) was _hearted_ 4.7k times! In total, ViteConf participants shared their love <nobr>🎈 **23,311 times** 🎈.</nobr>

## Real-time audience experience

Behind the scenes, each conference talk connected to its own PartyKit server (called "a room"). This is what the ViteConf room activity looked like:

<img style="width:650px; height: auto;" src="/content-images/partykit-at-viteconf/viteconf-analytics.png" alt='Analytics screenshot'>

Each spike indicates the beginning of a new talk (when attendees joined a designated PartyKit room). This way, the reactions for each talk were kept separately.

The whole code needed to implement the feature is this:

```ts
import type * as Party from "partykit/server";

export default class ReactionServer implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };
  reactions: Record<string, number> = {};
  constructor(readonly party: Party.Party) {}

  // load the reactions from built-in key-value storage
  async onStart() {
    this.reactions = (await this.party.storage.get("reactions")) ?? {};
  }

  // when user connects, send them the current reaction counts
  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify(this.reactions));
  }

  // when user sends a reaction, update the count
  onMessage(message: string) {
    const { kind } = JSON.parse(message);
    this.reactions[kind] = (this.reactions[kind] ?? 0) + 1;
    this.party.storage.put("reactions", this.reactions);
    // broadcast the updated counts to all users
    this.party.broadcast(JSON.stringify(this.reactions));
  }
}
```

Want to see more? Explore it further [on GitHub](https://github.com/partykit/example-reactions) or see [other example apps](https://docs.partykit.io/examples) in our docs 💕

## Making online spaces cozier one connection at a time

Reaction buttons could further be extended by adding animation that would fire up whenever someone clicks the button. Or, why stop there? Imagine a waterfall of floating hearts appearing in the corner of the window.

One could also go an entirely different direction - for example, by giving the participants a way to create (code, draw?) something together as the talks progress. Given that **PartyKit can handle up to 32,000 concurrent connections**, you're limited only by your imagination.

🎈 **I'd love to help you bring real-time interactivity to your event! Find me on <a href="https://discord.gg/8RXNx7ED3j" target="_blank" rel="noopener noreferrer">PartyKit Discord</a> or reach out to me on <a href="https://twitter.com/sylwiavargas" target="_blank" rel="noopener noreferrer">Twitter!</a>** 🎈

Meanwhile, we've prepared [an examples page](https://docs.partykit.io/examples) to help you imagine new possibilities.

## ViteConf replay party 🍿

If you've missed ViteConf, don't worry, you can still watch the talks on [the conference platform](https://viteconf.org/23/replay). There are a lot of gems there.

My personal favorite was Sarah Rainsberger's [talk on contributing to docs](https://viteconf.org/23/replay/docs) which featured a lot of birds 🐦

<a href="https://viteconf.org/23/replay/docs" target="_blank" rel="noopener noreferrer"><img style="width:650px; height: auto;" src="/content-images/partykit-at-viteconf/sarahs-talk.png" alt="Sarah's slide with a bird as a background. The slide reads: 'Are your docs helpful? Is this helping someone get started with my project? Figure out what my project is or does? Evaluate whether it's right for them? Accomplish a specific goal? Avoid common pitfalls? Troubleshoot? Experiment? Update?"></a>

Otherwise, everyone will find something for themselves as the all-star lineup included [Daniel Roe](https://viteconf.org/23/replay/nuxt), [Fred K. Schott](https://viteconf.org/23/replay/astro), [Jecelyn Yeen](https://viteconf.org/23/replay/dev_tools), [Kent C. Dodds](https://viteconf.org/23/replay/vite_react_router), [Ryan Carniato](https://viteconf.org/23/replay/solid), [the StackBlitz team](https://viteconf.org/23/replay/stackblitz_keynote), [Lindsay Wardell](https://viteconf.org/23/replay/elm), and many others.

Meanwhile, the preparations for ViteConf 2024 have already started. You can follow [ViteConf](https://twitter.com/ViteConf) on Twitter to stay up to date. See you there next year!
