---
title: Deploy your PartyKit server
sidebar:
    label: Deploying a PartyKit server
    badge: New
description: Deploy your PartyKit app and debug live apps after deployment
---

This page provides an overview of how to deploy your PartyKit app and how to debug live apps after deployment.

## First deployment

In your project directory, run the following command in the terminal:

```bash
npm partykit deploy
```

If you’re running PartyKit for the first time, you will be prompted to log in using GitHub. A new browser window will open with a device activation page where you can paste the code that was automatically copied to your clipboard from the terminal output.

Next, you will be asked to grant permissions to PartyKit. Once you do that, your app will be deployed to your `partykit.dev` domain, which will follow the pattern of `[your project's name].[your GitHub username].partykit.dev`.

After the domain has been provisioned (up to two minutes), share the link with your friends and play with it live 🥳

## Deploying with environment variables

There are two ways to manage secrets in PartyKit. Read more in our guide on [managing secrets](../guides/managing-environment-variables.md).

## Debugging live apps after deployment

If you're encountering any issues with your app, run the following command in your project directory:

```ts
npx partykit tail
```

It will provide you with live traffic logs and errors.

## Configuring GitHub Actions

Now that your project is deployed, you can consider [configuring CI/CD with GitHub Actions](https://docs.partykit.io/guides/setting-up-ci-cd-with-github-actions), which will deploy your PartyKit project on every commit to the `main` branch.