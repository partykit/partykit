---
author: Sylwia Vargas
pubDatetime: 2023-10-24T14:12:00Z
title: PartyKit powers realtime avatars in Epic Web
postSlug: partykit-powers-realtime-avatars-in-epic-web
featured: false
draft: false
tags:
  - community
  - showcase
  - education
ogImage: "/content-images/partykit-powers-realtime-avatars-in-epic-web/social.png"
description: Kent C. Dodds used PartyKit for users' presence on his course platform.
---

Last week Kent C. Dodds launched his magnum opus, a fullstack web development course called [_Epic Web_](https://www.epicweb.dev/). The course is massive in scale - it consists of 452 videos divided into 56 sections, with additional snacks like 25 interviews with experts. It was an instant success and has been celebrated enthusiastically by the web dev community.

<a href="https://twitter.com/kentcdodds/status/1714021891462369341" target="_blank" rel="noopener noreferrer"><img style="width:500px; height: auto;" src="/content-images/partykit-powers-realtime-avatars-in-epic-web/kent-cool-feature.png" alt="Kent's tweet: 'The Workshop App now uses PartyKit for a cool feature. This is only the beginning :)'"></a>

We couldn't be prouder to be a part of this amazing feat. Right before the launch we worked with Kent and added _presence_ to the course platform (see [first PR](https://github.com/epicweb-dev/kcdshop/pull/152) and [second PR](https://github.com/epicweb-dev/kcdshop/pull/153)). Presence is a way to create a sense of shared online experience among your users for example by showing their cursors (like in Figma), the place in text they are (like in Google Docs), or by featuring your users' avatars, which is what Kent went with.

<a href="https://twitter.com/kentcdodds/status/1715569320141713749" target="_blank" rel="noopener noreferrer"><img style="width:500px; height: auto;" src="/content-images/partykit-powers-realtime-avatars-in-epic-web/kent-loves-presence.png" alt="Kent's tweet: 'I just love this presence feature. It makes you feel like you're not learning alone. Learning is better together. Thanks for making this feature so easy to add PartyKit!'"></a>

## Presence in Epic Web

On the left side of the platform screen, users can see their own profile and a number of other users working on the same lesson -- even though the app runs on `localhost`:

<img style="width:800px; height: auto;" src="/content-images/partykit-powers-realtime-avatars-in-epic-web/kent-UI-1.png" alt="A screenshot of one of the lessons with an icon showing '+8' and a tooltip describing it as 'Epic Web devs working now'">

When you open the sidebar, you can see all the avatars as well:

<img style="width:800px; height: auto;" src="/content-images/partykit-powers-realtime-avatars-in-epic-web/kent-UI-2.png" alt="A screenshot of one of the lessons with the sidebar unfolded showing the avatars of others working on this lesson along you">

Since the launch, the platform has been sending over 100,000 events a day to PartyKit - a testament to how popular the course is.

## Adding avatars to your website

All PartyKit server code that was needed to implement the real-time avatars feature to Kent's course was the following:

```ts
import type * as Party from "partykit/server";

type UserPayload = {
  id: string;
  avatarUrl: string;
  name?: string | null | undefined;
};

type Message =
  | { type: "remove-user"; payload: Pick<UserPayload, "id"> }
  | { type: "add-user"; payload: UserPayload }
  | { type: "presence"; payload: { users: Array<UserPayload> } };

export default class Server implements Party.Server {
  options: Party.ServerOptions = { hibernate: true };
  constructor(party: Party.Party) {
    this.party = party;
  }

  updateUsers() {
    const presenceMessage = JSON.stringify(this.getPresenceMessage());
    for (const connection of this.party.getConnections<UserPayload>()) {
      connection.send(presenceMessage);
    }
  }

  getPresenceMessage(): Message {
    const users = new Map<string, UserPayload>();
    for (const connection of this.party.getConnections<UserPayload>()) {
      const user = connection.state;
      if (user) users.set(user.id, user);
    }
    return {
      type: "presence",
      payload: { users: Array.from(users.values()) },
    } satisfies Message;
  }

  onMessage(message: string, sender: Party.Connection<UserPayload>) {
    const user = JSON.parse(message) as Message;
    if (user.type === "add-user") {
      sender.setState(user.payload);
      this.updateUsers();
    } else if (user.type === "remove-user") {
      sender.setState(null);
      this.updateUsers();
    }
  }

  onClose() {
    this.updateUsers();
  }

  onError() {
    this.updateUsers();
  }
}
```

Kent later improved the UX to also group the users according to their progress.

<a href="https://twitter.com/kentcdodds/status/1715734434539032870" target="_blank" rel="noopener noreferrer"><img style="width:500px; height: auto;" src="/content-images/partykit-powers-realtime-avatars-in-epic-web/kent-highlighted.png" alt="Kent's tweet: 'Now people are highlighted based on how closely to you they're working'"></a>

Moreover, as privacy is an important consideration, he implemented an option to opt out of avatars, taking full advantage of that PartyKit allows you to write your own business logic.

You can see the full code here:

- [server](https://github.com/epicweb-dev/kcdshop/blob/ab590025aab758a832b98dfd4fc91fab639b4b3a/packages/presence/src/server.ts)
- [UI](https://github.com/epicweb-dev/kcdshop/blob/ab590025aab758a832b98dfd4fc91fab639b4b3a/packages/workshop-app/app/utils/presence.ts)
- [tooltip](https://github.com/epicweb-dev/kcdshop/blob/ab590025aab758a832b98dfd4fc91fab639b4b3a/packages/workshop-app/app/components/ui/tooltip.tsx)
- [user settings](https://github.com/epicweb-dev/kcdshop/blob/ab590025aab758a832b98dfd4fc91fab639b4b3a/packages/workshop-app/app/routes/_app+/account.tsx)

## Reactions to presence

Learning online often feels like a lonely journey so realtime features added to online courses can help students enjoy the ride a little more.

Responses to Kent's tweets were enthusiatic and positive:

<a href="https://x.com/PaoloRicciuti/status/1715677367799079059?s=20" target="_blank" rel="noopener noreferrer"><img style="width:650px; height: auto;" src="/content-images/partykit-powers-realtime-avatars-in-epic-web/kent-feedback-1.png" alt="Two tweets. First from Paolo Ricciuti: 'This is also something I was pleasantly surprised with, very good touch'. Second from Afan Khan: 'Learning with others and through their mistakes is the best way to learn.'"></a>

Presence features like avatars, cursors, chat, or visible text highlighting are generally a well-received idea. Websites, apps, courses, and online experiences feel less lonely and isolated if you know that there are others sharing this moment with you.

## Let's make the web friendlier!

The web was created to connect people and yet, it often feels like a lonely place. We're here to help because everything's better with friends 🥰

<a href="https://twitter.com/kentcdodds/status/1714993075934863488" target="_blank" rel="noopener noreferrer"><img style="width:650px; height: auto;" src="/content-images/partykit-powers-realtime-avatars-in-epic-web/kent-partykit-easy.png" alt="Kent's tweet: 'What they say is true. PartyKit is ridiculously easy and fun to use.'"></a>

I'd love to help you make your website or app feel more familiar. Reach out to me on <a href="https://discord.gg/8RXNx7ED3j" target="_blank" rel="noopener noreferrer">PartyKit Discord</a> or reach out to me on <a href="https://twitter.com/sylwiavargas" target="_blank" rel="noopener noreferrer">Twitter!</a>

Alternatively, we also have some code examples for you to get inspired:

- [realtime reactions counter](https://docs.partykit.io/examples/#realtime-reaction-counters)
- [live cursors with country flags](https://docs.partykit.io/examples/#cursors-with-country-flags)
- [live polls](https://docs.partykit.io/examples/#live-polls)
- [YouTube watch party](https://docs.partykit.io/examples/#the-namib-desert-watering-hole-livestream)

Let's make the web friendlier!
