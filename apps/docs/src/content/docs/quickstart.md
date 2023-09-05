---
title: Quickstart
description: Bring realtime collaboration to your app with PartyKit.
---

Follow this quickstart guide to create and deploy your first PartyKit app in just a few minutes!

:::note[Node version]
To run PartyKit, you need to have Node v. 17 or higher installed.
:::

## Create a PartyKit app

To start your adventure, run the following command in your teminal:

```bash
npm create partykit@latest
```

Answer the prompts about your project's title, TypeScript setup, git repository initialization, and... That's it.

:::tip[Create projects faster]
To create a PartyKit project faster, you can pass arguments to the `create` command, such as `--yes` to skip all prompt by accepting defaults, `--typescript` to default to TypeScript, `--git` to initialize git repository, or `--install` to  install dependencies.
:::

Navigate to your project's directory, and explore your first PartyKit app 🥳

## Run a dev server

To see your app, run the following command in your terminal in your project's directory:

```bash
npm run dev
```

Once the server is running, open localhost with the designated port (defaulting to 1999) in two windows to simulate two users logging using the app.

## Deploy your app

To deploy your app, run the following command in your terminal in your project's directory:

```bash
npm run deploy
```

If you're running PartyKit for the first time, you will be prompted to log in using GitHub. A new browser window will open with a device activation page where you can paste the code that was automatically copied to your clipboard from the terminal output.

Next, you will be asked to grant permissions to PartyKit. Once you do that, your app will be deployed to your `partykit.dev` domain, which will follow the pattern of `[your project's name].[your GitHub username].partykit.dev`.

Provisioning of the domain may take up to 2 minutes after which **you and your friends will be able to play with it live** 🎈

:::note
Custom domains will be available in the near future.
:::

---

Questions? Ideas? We'd love to hear from you 🎈 Reach out to us on [Discord](https://discord.gg/KDZb7J4uxJ) or [Twitter](https://twitter.com/partykit_io)!
