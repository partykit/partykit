---
title: Add PartyKit to existing project
description: Bring realtime collaboration to your app with PartyKit
---

Follow this quick guide to add PartyKit to your existing app, and deploy it in just a few minutes.

Note that to run PartyKit, you need to have Node v. 17 or higher installed.

:::tip[Prefer a tutorial?]
If you'd prefer an in-depth walkthrough, consider following our [tutorial](/tutorials/add-partykit-to-a-nextjs-app).
:::

### Add PartyKit to an existing app

Add PartyKit to your existing project using the following command in the project's root directory:

```bash
npx partykit@latest init
```

This command installed two packages (<a href="/reference/partyserver-api/" target="_blank" rel="noopener noreferrer"><code>partykit</code></a> and <a href="/reference/partykit-cli/" target="_blank" rel="noopener noreferrer"><code>partysocket</code></a>) and added the `party` directory with a server template.

## Run a dev server

Run the following command in your terminal in your project's directory to start the dev server:

```bash
npx partykit dev
```

## Develop your server

Add desired behavior to your server, and connect it to the UI.

:::tip[Where to start?]
If you don't know where to start, follow our [guide to building a WebSocket server](/guides).
:::

## Deploy your app

Lastly, deploy your PartyKit server:

```bash
npx partykit deploy
```

To read more about deploying PartyKit server, check <a href="/guides/deploying-your-partykit-server/" target="_blank" rel="noopener noreferrer">our deployment guide</a>.

:::note
Custom domains will be available in the near future.
:::

## Enjoy 🎈

Welcome to the party, pal!

---

Questions? Ideas? We'd love to hear from you 🎈 Reach out to us on [Discord](https://discord.gg/KDZb7J4uxJ) or [Twitter](https://twitter.com/partykit_io)!
