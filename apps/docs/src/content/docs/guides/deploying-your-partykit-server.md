---
title: Deploy your PartyKit server
sidebar:
  label: Deploying a PartyKit server
description: Deploy your PartyKit app and debug live apps after deployment
---

This page provides an overview of how to deploy your PartyKit server and how to debug live apps after deployment.

## First deployment

In your project directory, run the following command in the terminal:

```bash
npx partykit deploy
```

If you’re running PartyKit for the first time, you will be prompted to log in using GitHub. A new browser window will open with a device activation page.

Next, you will be asked to grant permissions to PartyKit. Once you do that, your app will be deployed to your `partykit.dev` domain, which will follow the pattern of `[your project's name].[your GitHub username].partykit.dev`.

After the domain has been provisioned (up to two minutes), you can use the link or share it with your friends and play with it live 🥳

## Deploying with environment variables

There are two ways to manage secrets in PartyKit - read our guide on [managing secrets](../managing-environment-variables).

## Debugging live apps after deployment

If you're encountering any issues with your server, run the following command in your project directory to get live traffic logs and errors:

```bash
npx partykit tail
```

## Configuring GitHub Actions

Now that your project is deployed, you can consider [configuring CI/CD with GitHub Actions](https://docs.partykit.io/guides/setting-up-ci-cd-with-github-actions), which will deploy your PartyKit project on every commit to the `main` branch.
