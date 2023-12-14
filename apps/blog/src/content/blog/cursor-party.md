---
author: Matt Webb
pubDatetime: 2023-12-14T16:26:00Z
title: Cursor party! Get multiplayer cursors on your own website
postSlug: cursor-party
featured: false
draft: false
tags:
  - libraries
  - cursors
  - pret-a-installer
ogImage: "/content-images/cursor-party/social.png"
description: Cursor Party is a new PartyKit project for you to add presence to your website (even static sites) with a single script tag. Oh and it has cursor chat too.
---

Yeah yeah you already know I'm obsessed with multiplayer cursors.

What if I said you could have them on your own website with just one line of code?

<video autoplay muted loop src="/content-images/cursor-party/cursors-in-use-sm.mp4"></video>

👀 Here's the code.

```html
...
<script src="https://cursor-party.YOUR-PARTYKIT-USERNAME.partykit.dev/cursors.js"></script>
</body>
</html>
```

This is **Cursor Party.** We're releasing it today. You can get it on your own site right away.

_Full instructions below!_

### 🎈 Easter egg: Cursor chat

But wait! There's more!

<video autoplay muted loop src="/content-images/cursor-party/cursor-chat-sm.mp4"></video>

We're used to [cursor chat on Figma](https://help.figma.com/hc/en-us/articles/1500004414842-Send-messages-with-cursor-chat) but why not regular websites? And so...

You can also chat with other people on a site with Cursor Party. Just type `/` and then your message.

**Try it now!** Right now, on this page, hit `/` and say hello. If there's no-one else here, open another browser window to this same page and say hi to yourself. (That's not weird I promise.)

Is it useful? Um. Let me get back to you. Is it fun to surprise someone by messaging _HELLOOOO_ on my website as they're reading a post and then have a serendipitious back-and-forth? Yes. Yes it is.

### Why? Because VIBES

I have this same set-up on my [personal blog](https://interconnected.org/home/). I love it. It's a tiny way to make the web feel more alive.

Somebody dropped me a note earlier today:

> when i went on your website obviously i started just circling around another cursor that was there
>
> and we started moving around
>
> and it was a weird moment
>
> like you dont know who it is
>
> but it felt very "water cooler"

And I hear this kind of story a lot. It makes me feel so warm, you know? And once you realise that, just behind the glass, there are _other people_ and we can be _together_ — well, that's a vibe. Other websites feel a little impoverished in comparison maybe?

So I wanted to make it easy for any website creator to add multiplayer cursors to their own site. Being both:

- as easy as possible to get going, _pret a installer_ if you like, on any website whether it's static or based on React or whatever
- but also, as a developer, I want this to be the first stepping stone to a more sophisticated multiplayer experience, so people need to be able to customise the code themselves.

### Inspiration

The benchmark here is Spencer Chang's project [playhtml](https://github.com/spencerc99/playhtml) _(GitHub)_ where you can add a single HTML attribute to a tag on your site, such as `can-move`, and it becomes a dynamic, multiplayer element.

Such a great project.

### Step by step: how to get multiplayer cursors on your site

Here's everything you need: **[cursor-party on GitHub](https://github.com/partykit/cursor-party).**

There are full instructions over there. As a summary...

- you'll need a GitHub account, and either a development machine with Node.js installed or a Replit account
- you clone the repo
- then edit the config file to add your website URL
- then deploy: you'll be walked through creating a PartyKit account.

What you get is a PartyKit server that looks like this when you visit it:

![Cursor Party splashscreen showing a list of websites this installation is configured for](/content-images/cursor-party/cursor-party-backend.png)

That PartyKit server is the brains for your multiplayer cursors. It will only work for the websites you list in the config. You can test your installation by visiting this site.

Then you add that script tag to your website, and you're done. Cursor chat and all 🎉

(If you don't want cursor chat, cool cool, the readme has instructions for that too.)

_**A note about Replit...** The [Replit](https://replit.com/) option is a brand new way to deploy PartyKit without having to install anything on your local machine. It's experimental! So if you use it then we'd love to hear how it goes, whether it was a smooth process for you or not._

### Making it your own

Instead of cloning the repo, you can fork it. Then you can customise the code yourself.

Some ideas of what you could do:

- change the appearance of the cursors, or of the chat bubbles. (On my own site, the cursors are blurred unless they have a chat message attached.)
- add a denylist to ban certain words from chat -- you'll need that for family-friendly sites.
- there's a full presence library there too, made for re-use _(sssssh but Cursor Party is an excuse to test [that lib](https://github.com/partykit/cursor-party/tree/main/src/presence))._ So you could add a [facepile](https://interconnected.org/more/2023/partykit/facepiles.html) component to the navigation bar, or allow people to change their cursor colours, or move chat into a sidebar.

It's a first step!

### GitHub

**Start by grabbing the code 👉 [cursor-party](https://github.com/partykit/cursor-party).** The readme has full instructions.

Any questions/ideas/fixes please do [join us on the Discord](https://discord.gg/GJwKKTcQ7W) and say hi.
