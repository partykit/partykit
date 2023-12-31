---
title: PartyKit CLI
description: PartyKit Command Line Interface reference
sidebar:
  order: 2
---

The `partykit` Command Line Interface allows you to develop, deploy and manage your PartyKit projects from your terminal, and automate deployment workflows in your Continuous Integration environments.

## Installation

Install the PartyKit CLI with `npm` (or substitute your preferred Node package manager):

```bash
npm install partykit@latest
```

## Commands

This is a reference for the commands you can run in your terminal.

:::tip[Using npx]
You'll notice the below examples use the `npx` command, which is a utility that comes packaged with Node.js. `npx` allows you run commands from packages you have installed locally.
:::

### Project commands

#### init

`npx partykit init` will add PartyKit to your existing `npm` project. This will install the latest version of PartyKit into your project, create a `partykit.json` configuration file, and example `client.ts` and `server.ts` you can use as starting points for your app.

It will use the name specified in your `package.json` as the name of your project.

#### dev

`npx partykit dev` will start a local development server. This will watch your code for changes, and automatically restart the server when you make changes.

It will use the file specified in the `main` field in your `partykit.json` file as the entry point for your project. Alternately, you can pass the entry point as an argument to the command, like this: `npx partykit dev src/server.ts`

#### deploy

`npx partykit deploy` will deploy your code on to the PartyKit platform. It will use the file specified in the `main` field in your `partykit.json` file as the entry point for your project, and the `name` field as the name of the project. Alternately, you can pass the entry point and name as arguments to the command, like this: `npx partykit deploy src/server.ts --name my-project`

#### tail

`npx partykit tail` will tail the logs for your project.

This is useful for debugging issues, while looking at live traffic including logs and errors. You can also pass the name of the project as an argument to the command, like this: `npx partykit tail --name my-project`

#### list

`npx partykit list` will list all the projects that you've published on to the platform.

#### delete

`npx partykit delete` will delete a project that you've published on to the platform.

You can also pass the name of the project as an argument to the command, like this: `npx partykit delete --name my-project`

### `env` commands

The `npx partykit env <command>` commands allow you to manage environment variables available to PartyKit projects deployed via `deploy`

For a more comprehensive guide, see [Managing environment variables with PartyKit](/guides/managing-environment-variables/).

#### env list

`npx partykit env list` will list all the environment variable keys you've configured in your project.

#### env add

`npx partykit env add <key>` will create or update an environment variable. The name of the variable will be the value of the `key` argument, and the CLI will prompt you for a value.

You need to run `npx partykit deploy` again for the newly added variable to become available.

#### env remove

`npx partykit env remove <key>` will remove an environment variable from the PartyKit platform.

The value will continue to be available to previously deployed projects until you run `npx partykit deploy` again.

#### env pull

<!-- TODO: We are going to remove the .vars field in partykit.json, so this behaviour will also change -->

`npx partykit env pull [filename]` will write all environment variable keys and values you've configured in your project into a JSON file.

If `filename` is not provided, `env pull` will update your `partykit.json` configuration file.

#### env push

<!-- TODO: We are going to remove the .vars field in partykit.json, so this behaviour will also change -->

`npx partykit env push` will read all environment variable keys and values you've configured in your `partykit.json` and deploy them to the PartyKit platform.

You need to run `npx partykit deploy` again for the newly pushed variables to take effect.

### Authentication commands

#### login

`npx partykit login` will authenticate you with the PartyKit service.

Running this command will open a browser window where you can authenticate yourself with your GitHub account.

If you don't run `login` manually, we'll automatically log you in when you first run [`deploy`](#deploy) to push your code on to the platform, or when running the [`env`](#env) commands to manage your environment variables.

#### logout

`npx partykit logout` will log you out of the PartyKit service.

#### whoami

`npx partykit whoami` will display the currently logged in user.

#### token generate

`npx partykit token generate` will generate a new OAuth token you can use to grant access to deploy on your behalf. This is useful for tasks like deploying to PartyKit from GitHub Actions, or your Continuous Integration jobs. Each time you run the command, a new token will be generated.

Read more: [Setting up CI/CD with GitHUb Actions](/guides/setting-up-ci-cd-with-github-actions/)
