---
title: Quickstart
description: Build a collaborative realtime application with PartyKit
---

Follow this quickstart guide to create and deploy your first PartyKit app in just a few minutes.

Note that to run PartyKit, you need to have Node v. 17 or higher installed.

:::tip[Prefer a tutorial?]
If you'd prefer an in-depth walkthrough, consider following our [tutorial](/tutorials/add-partykit-to-a-nextjs-app).
:::

## Create a PartyKit app

To start your adventure, run the following command in your terminal to create a new PartyKit project:

```bash
npm create partykit@latest
```

:::tip[Create projects faster]
To create a PartyKit project faster, you can pass arguments to the `create` command, such as `--yes` to skip all prompt by accepting defaults, `--typescript` to default to TypeScript, `--git` to initialize git repository, or `--install` to install dependencies.
:::

That's it! Navigate to your project's directory, and explore your first PartyKit app 🥳

## Run a dev server

To see PartyKit in action, run the following command in your terminal in your project's directory:

```bash
npx partykit dev
```

Once the server is running, open localhost with the designated port (defaulting to 1999) in two windows to simulate two users logging using the app.

## Deploy your app

Next, deploy your PartyKit server:

```bash
npx partykit deploy
```

To read more about deploying PartyKit apps, check <a href="/guides/deploying-your-partykit-server/" target="_blank" rel="noopener noreferrer">our guide</a>.

After the domain has been provisioned (up to two minutes), **share the link with your friends and play with it live** 🥳

:::note
Custom domains will be available in the near future.
:::

---

Questions? Ideas? We'd love to hear from you 🎈 Reach out to us on [Discord](https://discord.gg/KDZb7J4uxJ) or [Twitter](https://twitter.com/partykit_io)!
