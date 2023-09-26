---
author: Sunil Pai
pubDatetime: 2023-09-26T13:00:00Z
title: PartyKit raises a pre-seed round of $2.5M from Sequoia, Remote First, and more
postSlug: partykit-raises-a-pre-seed-round-2-5-m-from-sequoia-remote-first-and-more
featured: false
draft: false
tags:
  - collaboration
  - local-first
  - multiplayer
  - real-time
  - announcement
  - startup-life
ogImage: "/content-images/partners.jpg"
description: We're building the developer-friendly, real-time platform for human-to-human and human-to-AI collaboration. Today we're announcing our pre-seed round, as well as general availability of our platform!
---

![Our partners](/content-images/partners.jpg)

Hi folks! I'm [Sunil](https://twitter.com/threepointone/), the founder of [PartyKit](https://www.partykit.io/).

The Internet is a lonely place today. Most of the time we browse websites and do work in SaaS apps completely alone, or passively consume and rarely participate. Collaborative editing in Google Docs, collaborative design in Figma, and multiplayer video games are the rare exceptions that give us a taste of what the good life on the Internet could be. But building these highly interactive, real-time, collaborative applications has always been out of the reach of mere mortals; it's a hard computer science problem, and requires expensive infrastructure which is difficult to maintain and scale.

Further, the very practice of collaboration is changing. I think the next phase of the Internet will be defined not just by humans collaborating with each other, but also by humans collaborating with AI. We're already seeing this in the form of AI assistants like ChatGPT, which can be used to generate text and code, and generative tools that can create images, videos, and more. These AI services will soon work in real-time, in collaboration with humans. Building products that leverage this technology will require a new generation of platforms and tools.

Enter PartyKit. We envision a world where humans (and AI!) collaborate to build amazing things, where multiplayer experiences are the norm, and where the Internet is a better place for everyone. This is a lofty ambition, so I [formed a team](https://blog.partykit.io/posts/everything-is-better-with-friends) with my closest friends [Sylwia](https://twitter.com/SylwiaVargas) and [Jani](https://twitter.com/jevakallio), and we got to work.

## PartyKit's beta and what we learnt

In the last 6 months, developers have been using the beta version of the PartyKit platform to build ambitious collaborative apps, multiplayer games, and AI-driven experiences. By leveraging the PartyKit platform, developers have been able to build real-time experiences that are fast, reliable, and affordable:

- [tldraw](https://www.tldraw.com/) built a highly extensible multiplayer drawing app from scratch with a small team, and PartyKit was borne out of this effort. While PartyKit took care of the plumbing, the operational cost, and complexity, they were able to focus on creating a truly world-class product experience.
- [Stately](https://stately.ai/) used PartyKit to build state machines and workflows that can run on the edge, can be collaboratively edited, and deployed to users in different parts of the world.
- [SiteGPT](https://sitegpt.ai/) used PartyKit to synchronize chat sessions between humans and LLMs, allowing for their customers to build remarkable customer support experiences augmented by AI.

During the beta period, we've learnt that developers want:

- **A Familiar Programming Model**: JavaScript is the language of the Internet, and you shouldn't have to learn a new one to build real-time experiences. Therefore, it takes remarkably little JavaScript to build a scalable multiplayer experience with PartyKit:

```ts
export default class Server {
  constructor(party) {
    this.party = party;
  }
  onConnect(client) {
    // send a message when a client connects
    client.send(`hello from ${this.party.id}!`);
  }
  onMessage(message) {
    // broadcast incoming messages to all clients in the room
    this.party.broadcast(message);
  }
}
```

- **Instant deploys**: You can run this code on your machine to add multiplayer to your application, and when you're ready, you can deploy it to the PartyKit platform with a single command `partykit deploy`. It scales to thousands of users within seconds, and you don't have to worry about infrastructure, scaling, or reliability.

- **Usage-Based Pricing**: It is hard for companies to estimate usage upfront, and it is difficult to commit to a large number of users upfront. Companies also worry about paying more for users that only connect for a few seconds. We will be introducing a usage-based pricing model with a generous free tier and a simple pay-as-you-go model.

- **No Lock-In**: PartyKit is [open source](https://github.com/partykit/partykit), and we're committed to ensuring you can run it on your infrastructure or even your own laptop.

## Announcing our pre-seed round

Today, I'm extremely happy to announce that PartyKit has raised $2.5M in pre-seed funding from [Sequoia Capital](https://www.sequoiacap.com/), with participation from [Remote First Capital](https://www.remotefirstcapital.com/), [Matthew Prince](https://twitter.com/eastdakota), [Guillermo Rauch](https://twitter.com/rauchg), [Matt Biilmann](https://twitter.com/biilmann), [Tiny VC](https://tiny.vc/), [Jack McCloy](https://twitter.com/JackMcCloy), [Untitled VC](https://www.untitledventures.xyz/), [Thilo Koinzok](https://www.konzok.com/), [Chris Schagen](https://twitter.com/cschagen), [Badrul Farooqi](https://farooqib.com/), [Soren Bramer Schmidt](https://twitter.com/sorenbs), [Dane Knecht](https://twitter.com/dok2001), [Adam Wiggins](https://twitter.com/_adamwiggins_), [Jeanette zu Fürstenberg](https://twitter.com/jcfurstenberg), [Rick Hanlon](https://twitter.com/rickhanlonii), [Rishabh Kaul](https://twitter.com/rishabhkaul), and [Micah Smurthwaite](https://twitter.com/Smurda).

## Today: general availability of the PartyKit platform

This brings me to second announcement: PartyKit is now generally available, and you can use it to build and deploy ambitious multiplayer apps in minutes. Getting started is as easy as running `npm create partykit` and following the CLI prompts. We've built [a more powerful API](https://blog.partykit.io/posts/partyserver-api), [better documentation](https://docs.partykit.io/), and [a broad range of examples](https://docs.partykit.io/examples/); we will follow this up with a dashboard for projects and teams, pricing, and numerous features to aid you in building the next great multiplayer experience.

This is a big milestone for us, and we’re grateful that we can share it with you. Everything’s better with friends, and we have been blessed with the most amazing ones! Having such a supportive community on Twitter, Discord and at in-person events has brought PartyKit to this point. And it’s also only the beginning: we have a long roadmap with a number of exciting features planned. If you’d like to collaborate with us, do reach out via [mail](mailto:contact@partykit.io), [twitter](https://twitter.com/partykit_io), or on [discord](https://discord.gg/g5uqHQJc3z).

We're getting back to building, so please join us for the ride. Get started at [partykit.io](https://www.partykit.io/) right now!

## Read more

Still want to read more? We're [featured in TechCrunch](https://techcrunch.com/2023/09/26/sequoia-backs-partykit-to-power-real-time-multiplayer-collaboration-for-any-app/) and on the [Sequoia blog](https://www.sequoiacap.com/article/partnering-with-partykit-everything-is-better-with-friends/).
