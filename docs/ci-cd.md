## CI/CD with Github Actions

So, you want to deploy a PartyKit project with [Github Actions](https://github.com/features/actions); here's a quick recipe for doing so. This example deploys a PartyKit project on every commit to the `main` branch of a repository.

### 1. Create a Github Token

You'll need to configure a token using GitHub's Secrets feature - go to _Settings_ -> Secrets* and variables* -> _Actions_ and click "New repository secret". (You can make one in your [Developer Settings](https://github.com/settings/tokens/new)). Your API token is encrypted by GitHub, and the action won't print it into logs, so it should be safe! Let's say you've saved the token as `GITHUB_TOKEN`.

### 2. Create a Github Action

Create a new file in your project's `.github/workflows` directory. Name it something like `deploy.yml`. Add these contents:

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
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_LOGIN: threepointone # use your github username
```

### 3. Deploy!

Commit and push your changes to `main` and watch the action run! You can see the output of the action by clicking on the "Actions" tab of your repository.

### 4. Customize

You can customize the action to deploy to other branches, or to deploy to other environments. You can also customize the action to run other commands, or to run other actions. For example, you could add a step to run your tests before deploying.
