---
author: Sunil Pai
pubDatetime: 2026-10-09T12:00:00Z
title: "The hosted PartyKit platform is shutting down"
postSlug: hosted-platform-shutdown
featured: true
tags:
  - announcements
  - partyserver
draft: false
description: "We're shutting down the hosted PartyKit platform (*.partykit.dev and partykit deploy) on 23 October 2026. Here's the timeline, and how to move your project to PartyServer on your own Cloudflare account."
---

Since PartyKit joined Cloudflare, all of our energy has gone into **[PartyServer](https://github.com/cloudflare/partykit/tree/main/packages/partyserver)**. It's the same model you know from PartyKit (rooms, connections, broadcasting, hibernation), but it runs as a regular Worker with Durable Objects on your own Cloudflare account. Every new feature lands there, it's what the [Cloudflare Agents SDK](https://developers.cloudflare.com/agents/) is built on, and it doesn't need us in the middle.

So we're shutting down the hosted PartyKit platform: projects on `*.partykit.dev`, and deploying with `npx partykit deploy`.

## Timeline

| Date           | What happens                                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fri 9 Oct**  | No new projects or preview environments. You can still redeploy existing projects.                                                           |
| **Mon 12 Oct** | Projects with no activity in the last 3 months are removed.                                                                                  |
| **Fri 16 Oct** | Deploys are turned off. **This is the deadline to export your data, or to ask us for help.**                                                 |
| **Fri 23 Oct** | The hosted platform shuts down. Remaining projects **and their room data** are deleted.                                                      |
| **Fri 23 Oct** | `npx partykit deploy` to your own Cloudflare account stops working too. Workers already in your account keep running; use `wrangler deploy`. |

## What you need to do

**Starting something new?** Use PartyServer. Install it, write a server class, and deploy it with `wrangler`:

```sh
npm install partyserver partysocket
npx wrangler deploy
```

The [PartyServer README](https://github.com/cloudflare/partykit/tree/main/packages/partyserver) has a full example, and it works on the Workers free plan.

**Have an existing project?** Follow the [migration guide](https://docs.partykit.io/guides/migrate-to-partyserver/). For most projects it's a small diff: your server class extends `Server` from `partyserver`, `partykit.json` becomes `wrangler.jsonc`, and your `partysocket` clients keep working once you point them at the new host.

**Need your room data?** Data stored with `this.room.storage` lives in PartyKit's Cloudflare account, and we can't move it into yours for you. Export it before **Friday 16 October**, while you can still redeploy. The guide has [an export endpoint and a copy script](https://docs.partykit.io/guides/migrate-to-partyserver/#moving-your-data) that move rooms straight into your new PartyServer project.

**Already deploying to your own Cloudflare account** (with `cloudflare` in `partykit.json`)? Your Workers keep running, but `npx partykit deploy` goes through our API, so it stops working on 23 October. The guide covers [switching to `wrangler`](https://docs.partykit.io/guides/migrate-to-partyserver/#already-deploying-to-your-own-cloudflare-account).

## Running something people depend on?

If your project has real users, lots of room data, or you just can't make these dates, **tell us before Friday 16 October** on [Discord](https://discord.gg/KDZb7J4uxJ). We'll keep your project running past the deadlines and help you move it, including your data. Some of you will hear from me directly.

## What isn't going away

- **[PartyServer](https://github.com/cloudflare/partykit/tree/main/packages/partyserver)**, **[partysocket](https://www.npmjs.com/package/partysocket)** and **[y-partyserver](https://www.npmjs.com/package/y-partyserver)** are actively maintained at [cloudflare/partykit](https://github.com/cloudflare/partykit).
- Workers you've already deployed to your own Cloudflare account keep running.
- The [PartyKit Discord](https://discord.gg/KDZb7J4uxJ) stays open, and it's still the best place to ask for help.

## Thank you

Thank you to everyone who built with PartyKit. Seeing what you made, from games and whiteboards to cursors on every website, has been the best part of this whole thing 💜

Let's keep partying on PartyServer 🎈
