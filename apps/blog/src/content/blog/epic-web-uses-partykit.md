---
author: Sylwia Vargas
pubDatetime: 2023-10-24T14:12:00Z
title: Epic Web uses PartyKit to show user avatars
postSlug: epic-web-uses-partykit-for-user-avatars
featured: false
draft: false
tags:
  - community
  - showcase
  - education
ogImage: "/content-images/epic-web-uses-partykit-for-user-avatars/social.png"
description: Kent C. Dodds used PartyKit to show users' presence on course pages.

---

Last week Kent C. Dodds launched his magnum opus, a fullstack web development course called [*Epic Web*](https://www.epicweb.dev/). The course is massive in scale - it consists of 452 videos divided into 56 sections, with additional snacks like 25 interviews with experts. It was an instant success and has been celebrated enthusiastically by the web dev community ever since.

<a href="https://twitter.com/kentcdodds/status/1714021891462369341" target="_blank" rel="noopener noreferrer"><img style="width:500px; height: auto;" src="/content-images/epic-web-uses-partykit/kent-cool-feature.png" alt="Kent's tweet: 'The Workshop App now uses PartyKit for a cool feature. This is only the beginning :)'"></a>

We couldn't be prouder to be a part of this amazing feat. Right before the launch, Kent and Sunil, our CEO, added *presence* (see [first PR](https://github.com/epicweb-dev/kcdshop/pull/152) and [second PR](https://github.com/epicweb-dev/kcdshop/pull/153)). Presence is a way to create a sense of shared online experience among your users for example by showing their cursors (like Figma), the place in text they are (like Google Docs), or by featuring your users' avatars, which is what Kent went with.

<a href="https://twitter.com/kentcdodds/status/1715569320141713749" target="_blank" rel="noopener noreferrer"><img style="width:500px; height: auto;" src="/content-images/epic-web-uses-partykit/kent-loves-presence.png" alt="Kent's tweet: 'I just love this presence feature. It makes you feel like you're not learning alone. Learning is better together. Thanks for making this feature so easy to add PartyKit!'"></a>

## Presence in Epic Web

Once logged into the course platform, the left side of the screen, a user can see their own profile, and above it, a number of other users working on the same lesson -- even though the app runs on `localhost`:

<img style="width:800px; height: auto;" src="/content-images/epic-web-uses-partykit/kent-UI-1.png" alt="A screenshot of one of the lessons with an icon showing '+8' and a tooltip describing it as 'Epic Web devs working now'">

When you open the sidebar, you can see their avatars as well:

<img style="width:800px; height: auto;" src="/content-images/epic-web-uses-partykit/kent-UI-2.png" alt="A screenshot of one of the lessons with the sidebar unfolded showing the avatars of others working on this lesson along you">

## Adding avatars to your website

All PartyKit server code that was needed to add the real-time avatars feature to Kent's cours was the following:

```ts
import type * as Party from 'partykit/server'

type UserPayload = {
	id: string
	avatarUrl: string
	name?: string | null | undefined
}

type Message =
	| { type: 'remove-user'; payload: Pick<UserPayload, 'id'> }
	| { type: 'add-user'; payload: UserPayload }
	| { type: 'presence'; payload: { users: Array<UserPayload> } }

export default class Server implements Party.Server {
	options: Party.ServerOptions = {
		hibernate: true,
	}

	constructor(readonly party: Party.Party) {
		this.party = party
	}

	onClose() {
		this.updateUsers()
	}

	onError() {
		this.updateUsers()
	}

	updateUsers() {
		const presenceMessage = JSON.stringify(this.getPresenceMessage())
		for (const connection of this.party.getConnections<UserPayload>()) {
			connection.send(presenceMessage)
		}
	}

	getPresenceMessage(): Message {
		const users = new Map<string, UserPayload>()

		for (const connection of this.party.getConnections<UserPayload>()) {
			const user = connection.state
			if (user) users.set(user.id, user)
		}

		return {
			type: 'presence',
			payload: { users: Array.from(users.values()) },
		} satisfies Message
	}

	onMessage(message: string, sender: Party.Connection<UserPayload>) {
		const user = JSON.parse(message) as Message

		if (user.type === 'add-user') {
			sender.setState(user.payload)
			this.updateUsers()
		} else if (user.type === 'remove-user') {
			sender.setState(null)
			this.updateUsers()
		}
	}
}

Server satisfies Party.Worker
```

Kent also improved the UX a little bit to also group the users according to how close in the specific lesson they are.

<a href="https://twitter.com/kentcdodds/status/1715734434539032870" target="_blank" rel="noopener noreferrer"><img style="width:500px; height: auto;" src="/content-images/epic-web-uses-partykit/kent-highlighted.png" alt="Kent's tweet: 'Now people are highlighted based on how closely to you they're working'"></a>

You can see the full code here:

- [presence - server code](https://github.com/epicweb-dev/kcdshop/blob/main/packages/presence/src/server.ts)
- [presence - UI code](https://github.com/epicweb-dev/kcdshop/blob/main/packages/workshop-app/app/utils/presence.ts)
- [tooltip](https://github.com/epicweb-dev/kcdshop/blob/main/packages/workshop-app/app/components/ui/tooltip.tsx)

## Reactions to presence

Learning online often feels like a lonely journey so realtime features added to online courses can help students enjoy the ride a little more.

Responses to Kent's tweets were enthusiatic and positive:

<a href="https://x.com/PaoloRicciuti/status/1715677367799079059?s=20" target="_blank" rel="noopener noreferrer"><img style="width:650px; height: auto;" src="/content-images/epic-web-uses-partykit/kent-feedback-1.png" alt="Two tweets. First from Paolo Ricciuti: 'This is also something I was pleasantly surprised with, very good touch'. Second from Afan Khan: 'Learning with others and through their mistakes is the best way to learn.'"></a>

Among other enthusiasts of the idea was Josh W. Comeau, author of popular courses like *CSS for JavaScript Developers*.

Presence features like avatars, cursors, visible highlighting of the text or chat are generally a well-received idea. Websites, apps, courses, and online experiences in general no longer feel as lonely and isolated if you know that they are others sharing this moment with you.

## Let's make the web friendlier!

The web was created to connect people and yet, it often feels like a lonely place. We're here to help because everything's better with friends 🥰

<a href="https://twitter.com/kentcdodds/status/1714993075934863488" target="_blank" rel="noopener noreferrer"><img style="width:650px; height: auto;" src="/content-images/epic-web-uses-partykit/kent-partykit-easy.png" alt="Kent's tweet: 'What they say is true. PartyKit is ridiculously easy and fun to use.'"></a>

I'd love to help you make your website or app feel more familiar. Reach out to me on <a href="https://discord.gg/8RXNx7ED3j" target="_blank" rel="noopener noreferrer">PartyKit Discord</a> or reach out to me on <a href="https://twitter.com/sylwiavargas" target="_blank" rel="noopener noreferrer">Twitter!</a>

Alternatively, we also have some code examples for you to get inspired:

- [realtime reactions counter](https://docs.partykit.io/examples/#realtime-reaction-counters)
- [live coursors with country flags](https://docs.partykit.io/examples/#cursors-with-country-flags)
- [live polls](https://docs.partykit.io/examples/#live-polls)
- [YouTube watch party](https://docs.partykit.io/examples/#the-namib-desert-watering-hole-livestream)

Let's make the web friendlier!