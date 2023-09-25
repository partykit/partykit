---
title: Setting up CI/CD with Github Actions
description: Setting up a Github Action for deploying a PartyKit project on every commit to the `main` branch.
---

This page provides a walkthrough on setting up a [Github Action](https://github.com/features/actions) for deploying a PartyKit project on every commit to the `main` branch.

To do so, you will first create a GitHub token and then set up a GitHub action.

### 1. Create a GitHub Token

Create a GitHub Personal Access Token from [https://github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new). You can give it a name & expiration, and leave the other inputs as is.

Copy the token and add it to the project repository by going to "Settings" from the top menu of the repository. Then, find "Secrets and variables" in the sidebar and choose "Actions" from the submenu. Finally, click "New repository secret" to add the token.

:::note
For the purpose of this guide, let's assume that you have saved the token as `PARTYKIT_GITHUB_TOKEN`.
:::

Your token is encrypted by GitHub and the action won't print it into logs.

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
          cache: "npm"
      - run: npm ci
      - run: npx partykit deploy
        env:
          GITHUB_TOKEN: ${{ secrets.PARTYKIT_GITHUB_TOKEN }}
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
