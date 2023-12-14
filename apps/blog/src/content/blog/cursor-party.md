---
author: Matt Webb
pubDatetime: 2023-12-145T16:26:00Z
title: Dancing cursors and Voronoi diagrams
postSlug: cursor-party
featured: false
draft: false
tags:
  - libraries
  - cursors
  - pret-a-installer
ogImage: "/content-images/cursor-party/@TODO"
description: TK
---

Yeah yeah you already know I'm obsessed with multiplayer cursors.

What if I said you could have them on your own website with just one line of code?

(video TK)

Here's the code.

```html
  ...
  <script src="https://cursor-party.YOUR-PARTYKIT-USERNAME.partykit.dev/cursors.js"></script>
</body>
</html>
```

This is **Cursor Party** and we're releasing it today.

_Ok there's a little more to it. I'll go into that below._

### Easter egg: Cursor chat

But wait! There's more!

(video TK)

You can also chat with other people on the site. Just type `/` and then your message.

**Try it now!** Right now, on this page, hit `/` and say hello. If there's no-one else here, open another browser window to this same page and say hi to yourself. (That's not weird I promise.)

### Why? VIBES

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

And I hear this kind of story a lot. It makes me feel so warm, you know? And once you realise that, just behind the glass, there are _other people_ and we can be _together_ — well, that's a vibe. Other websites feel a little impoverished in comparison, you know what I mean?

So I wanted to make it easy for any website creator to add multiplayer cursors to their own site. Being both:

- as easy as possible to get going, _pret a installer_ if you like, on any website whether it's static or based on React or whatever
- but also, as a developer, I want this to be the first stepping stone to a more sophisticated multiplayer experience, so people need to be able to customise the code themselves.

### Inspiration

The benchmark here is Spencer Chang's project [playhtml](https://github.com/spencerc99/playhtml) _(GitHub)_ where you can add a single HTML attribute to a tag on your site, such as `can-move`, and it becomes a dynamic, multiplayer element.

Such a great project.

### How to get Cursor Party on your site

Here's everything you need: **[cursor-party on GitHub](https://github.com/partykit/cursor-party)**

There are instructions over there, but just to summarise:

- you'll need a GitHub account, and either a development machine with Node.js installed or a Replit account
- you clone the repo
- then edit the config file to add your website URL
- then deploy: you'll be walked through creating a PartyKit account.

What you get is a PartyKit server that looks like this:

TK

That PartyKit server is the brains for your multiplayer cursors. It will only work for the websites you list in the config.

Then you add that script tag to your website, and you're done. Cursor chat and all.

### Customising Cursor Party

Instead of cloning the repo, you can also fork it. Then you can customise the code yourself.

Some ideas of what you can do:

- change the appearance of the cursors, or of the cursor chat bubbles (on my own site, the cursors are blurred out unless they're chatting)
- there's a full presence library in there. _(Sssssh but Cursor Party is an excuse to test that lib.)_ So you could add a facepile component to the top of the screen, or allow people to change their cursor colours, or move chat into a sidebar.

It's a starting point!

Any questions/ideas/fixes [head over to the Discord](https://discord.gg/GJwKKTcQ7W).
