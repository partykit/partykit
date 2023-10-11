---
author: Sylwia Vargas
pubDatetime: 2023-10-08T14:12:00Z
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

The conference is known for its friendly vibe, which is no small feat as most online conferences fail to recreate that special communal space online. ViteConf organizers, however, managed to bring the in-person conference joy onto Discord and Twitter, which are booming with love, jokes, and serious questions.

To make the space even cozier and communal, the organizers further extended this experience by adding a little interactivity to the conference platform to enhance the feeling of togetherness among the participants.

<img style="width:400px; height: auto;" src="/content-images/partykit-at-viteconf/hearts-go-up.gif" alt='A reaction counter going up'>

A week before the conference, Matias Capeletto, a Vite core maintainer, added a real-time reaction counter to the platform using our [example](https://github.com/partykit/example-reactions) as reference. In his words:

<a href="https://twitter.com/patak_dev/status/1708849034201268561" target="_blank" rel="noopener noreferrer"><img style="width:650px; height: auto;" src="/content-images/partykit-at-viteconf/patak-partykit.png" alt='Pataks tweet: "I finally got an opportunity to try PartyKit. It works like a charm. A true pleasure to use 💜 Youll play with it this week at the ViteConf party 🍿"'></a>

In this way, the attendees were able to show their love and reward the speakers 💕 Every time a participant clicked on the button, their joy was broadcasted to everyone else -- you were able to see the counter go up in real time. Some talks gathered over 2k reactions and the most popular one, [Evan You's Vite keynote](https://viteconf.org/23/replay/vite_keynote) was *hearted* 4,7k times! In total, ViteConf participants shared their joy in real time <nobr>🎈 **23,311 times** 🎈.</nobr>

## Real-time audience experience

Behind the scenes, each conference talk connected to its own PartyKit server (called "a room"). This is what the ViteConf room activity looked like:

<img style="width:650px; height: auto;" src="/content-images/partykit-at-viteconf/viteconf-analytics.png" alt='Analytics screenshot'>

Each spike indicates the beginning of a new talk (when attendees joined a designated PartyKit room). This way, the reactions for each talk were kept separately.

The whole code needed to implement the feature is this:

```ts
export default class ReactionServer implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };
  constructor(readonly party: Party.Party) {}
  reactions: Record<string, number> = {};

  async onStart() {
    // load reactions from storage on startup
    this.reactions = (await this.party.storage.get("reactions")) ?? {};
  }

  async onRequest(req: Party.Request) {
    // for all HTTP requests, respond with the current reaction counts
    return json(createUpdateMessage(this.reactions));
  }

  onConnect(conn: Party.Connection) {
    // on WebSocket connection, send the current reaction counts
    conn.send(createUpdateMessage(this.reactions));
  }

  onMessage(message: string, sender: Party.Connection) {
    // rate limit incoming messages
    rateLimit(sender, 100, () => {
      // client sends WebSocket message: update reaction count
      const parsed = parseReactionMessage(message);
      this.updateAndBroadcastReactions(parsed.kind);
    });
  }

  updateAndBroadcastReactions(kind: string) {
    // update stored reaction counts
    this.reactions[kind] = (this.reactions[kind] ?? 0) + 1;
    // send updated counts to all connected listeners
    this.party.broadcast(createUpdateMessage(this.reactions));
    // save reactions to disk (fire and forget)
    this.party.storage.put("reactions", this.reactions);
  }
}
```

Explore it further [on GitHub](https://github.com/partykit/example-reactions) or see [other example apps](https://docs.partykit.io/examples) in our docs.

## Making online spaces cozier one connection at a time

Reaction buttons could further be extended by adding animation whenever someone clicks the button or even going extra showing the waterfall of the reaction hearts on the screen (or in the video player).

One could also go an entirely different direction - for example, by giving the participants a way to draw something together as the talks progress. Given that **PartyKit can handle up to 32,000 concurrent events**, you're limited only by your imagination.

🎈 **I'd love to help you bring real-time interactivity to your event! Find me on <a href="https://discord.gg/8RXNx7ED3j" target="_blank" rel="noopener noreferrer">PartyKit Discord</a> or reach out to me on <a href="https://twitter.com/sylwiavargas" target="_blank" rel="noopener noreferrer">Twitter!</a>** 🎈

Meanwhile, we've prepared [an examples page](https://docs.partykit.io/examples) to help you imagine new possibilities.

## ViteConf replay party 🍿

If you've missed ViteConf, don't worry, you can still watch the talks on [the conference platform](https://viteconf.org/23/replay). There are a lot of gems there.

My personal favorite was Sarah Rainsberger's talk on [contributing to docs](https://viteconf.org/23/replay/docs) which featured a lot of birds 🐦

Otherwise, everyone will find something for themselves as the all-star lineup included [Matias Capeletto](https://viteconf.org/23/replay/vite_philosophy), [the StackBlitz team](https://viteconf.org/23/replay/stackblitz_keynote), [Daniel Roe](https://viteconf.org/23/replay/nuxt), [Fred K. Schott](https://viteconf.org/23/replay/astro), [Kent C. Dodds](https://viteconf.org/23/replay/vite_react_router), [Ryan Carniato](https://viteconf.org/23/replay/solid), and many others.

The preparations for ViteConf 2024 have already started. Follow [ViteConf](https://twitter.com/ViteConf) on Twitter for more information. See you there next year!
