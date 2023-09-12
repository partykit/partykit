---
title: Setting up CI/CD with Github Actions
description: Setting up a Github Action for deploying a PartyKit project on every commit to the `main` branch.
---

This page provides a walkthrough on setting up a [Github Action](https://github.com/features/actions) for deploying a PartyKit project on every commit to the `main` branch.

To do so, you will first create a GitHub token and then set up a GitHub action.

### 1. Create a GitHub Token

Open the project repository on GitHub and choose "Settings" from the top menu. Then, find "Secrets and variables" in the sidebar and choose "Actions" from the submenu. Finally, click "New repository secret."

Alternatively, you can create the token in your [Developer Settings](https://github.com/settings/tokens/new).

:::note
For the purpose of this guide, let's assume that you have saved the token as `GITHUB_TOKEN`.
:::

Your API token is encrypted by GitHub and the action won't print it into logs.

### 2. Create a Github Action

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
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx partykit deploy
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_LOGIN: threepointone # use your GitHub username
```

Notice that the above GitHub action deploys the PartyKit project on every push to the `main` branch.

:::note[Customize]
You can customize the action to deploy to other branches and other environments or to run other commands and other actions. For example, you could add a step to run your tests before deploying.
:::

### 3. Deploy 🚀

Now that the GitHub Action is set up, you can watch it run every time you push a new change to the `main` branch. To see its output, click on the "Actions" tab of your repository's top menu.

---

Questions? Ideas? We'd love to hear from you 🎈 Reach out to us on [Discord](https://discord.gg/KDZb7J4uxJ) or [Twitter](https://twitter.com/partykit_io)!
