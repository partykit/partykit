---
title: Managing environment variables
description: Guide for managing environment variables and secrets in PartyKit
---

## Set variables on `process.env`


# --------------------------- WIP ---------------------------


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

