---
title: Managing environment variables
description: Guide for managing environment variables and secrets in PartyKit
sidebar:
  label: Managing env variables
---

There are two ways to manage environment variables in PartyKit.

## Deploying secrets to PartyKit

PartyKit can store your app's secrets. To do so, run the following command in your project directory (here we assume that the variable name is `API_KEY`):

```bash
npx partykit env add API_KEY
```

PartyKit will then prompt you to provide value of the variable.

If you wish to persist more than one variable, repeat the process.

Since variables will take effect only in the next deployment, run the following command:

```bash
npx partykit deploy
```

## Setting secrets per deployment

In case you'd like to set additional secrets for an individual deployment (or if you prefer to manage secrets yourself, for example in your CI environment), you can define the secrets in the `.env` in the PartyKit directory.

Next, use the following command:

```bash
npx partykit deploy --with-vars
```

Please note that this command will take precedence over any previously deployed secrets, overriding their values for this particular deployment.

If you are not using `.env` file, you can specify the variable values by using the following command (here we assume that we are deploying two variables: `API_KEY` and `HOST`, which correspond to your variables which were set locally):

```bash
npx partykit deploy --var API_KEY=$API_KEY --var HOST=$HOST
```
