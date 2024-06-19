---
title: Setting up CI/CD with Github Actions
description: Setting up a Github Action for deploying a PartyKit project on every commit to the `main` branch
---

This page provides a walkthrough on setting up a [Github Action](https://github.com/features/actions) for deploying a PartyKit project on every commit to the `main` branch.

To do so, you will first create a PartyKit token and then set up a GitHub action.

### 1. Create a PartyKit Access Token

On your local machine, run the following PartyKit CLI command:

```sh
npx partykit@latest token generate
```

This will open a new browser window to authorize you, and then generate a new long-lived session token:

```ts
PARTYKIT_LOGIN=your_username
PARTYKIT_TOKEN=eyJhb...YR7Bw
```

### 2. Create Secrets in GitHub Actions

Provide the `PARTYKIT_LOGIN` and `PARTYKIT_TOKEN` values you generated in the previous step to GitHub actions securely following the official [Using Secrets in GitHub guide](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository).

:::caution[Storing secrets]
The `PARTYKIT_TOKEN` will allow anyone to deploy to PartyKit your behalf, so do not share it publicly or commit it to source control.
:::

### 3. Create a Github Action

Create a `.github/workflows` directory in your project's root directory. There, create a new file called `deploy.yml` with the following contents:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: "npm"
      - run: npm ci
      - run: npx partykit deploy
        env:
          PARTYKIT_TOKEN: ${{ secrets.PARTYKIT_TOKEN }}
          PARTYKIT_LOGIN: ${{ secrets.PARTYKIT_LOGIN  }}
```

Notice that the above GitHub action deploys the PartyKit project on every push to the `main` branch.

:::note[Customize]
You can customize the action to deploy to other branches and other environments or to run other commands and other actions. For example, you could add a step to run your tests before deploying.
:::

### 3. Deploy 🚀

Now that the GitHub Action is set up, you can watch it run every time you push a new change to the `main` branch. To see its output, click on the "Actions" tab of your repository's top menu.

---

Questions? Ideas? We'd love to hear from you 🎈 Reach out to us on [Discord](https://discord.gg/KDZb7J4uxJ) or [Twitter](https://twitter.com/partykit_io)!
