---
title: Configuration
description: PartyKit enables you to create real-time collaborative applications.
sidebar:
    badge: WIP
    order: 5
---

This is a reference of all the fields you can add to your `partykit.json` file to configure the behaviour of your project.

**name**: The name of your project. This is used to identify your project on the platform, and is also used to generate the url for your project (typically `https://<name>.<user>.partykit.dev`) For example:

```json
{
  "name": "my-project"
}
```

Alternately, you can pass this as an argument to the `dev` or `deploy` commands, like this: `npx partykit dev --name my-project`

**main**: The entrypoint for your project. This is where you'd define a default export as specified by the [PartyKit API](#api). Example: `"main": "src/server.ts"`

**vars**: A list of environment variables that you want to set for your project. These are available on the `room` object as `room.env`. Example:

```json
{
  "vars": {
    "MY_VAR": "my value",
    "some-nested-object": {
      "a": 123,
      "b": "hello"
    }
  }
}
```

With a configuration like that, you could then access the variable in your code like this:

```ts
export default {
  onConnect(connection, room) {
    console.log(room.env.MY_VAR); // "my value"
    console.log(room.env["some-nested-object"].a); // 123
  },
};
```

**define**: A list of constants that you want to set for your project. Any globals with these names will be substituted with the values you provide here. For example:

```json
{
  "define": {
    "MY_CONSTANT": "my value"
  }
}
```

With a configuration like that, you could then access the variable in your code like this:

```ts
export default {
  onConnect(connection, room) {
    console.log(MY_CONSTANT); // "my value"
  },
};
```

**build**: Occasionally, you'll want to run some custom commands before running the server, as well as when you make changes to your code, and finally before you deploy your code on to the platform. You can define those commands here with an object that has the following properties:

- **command**: The command to run.
- **watch**: A directory to watch for changes. If any files in this directory change, the command will be run again.
- **cwd**: The directory to run the command in. Defaults to the directory of your `partykit.json` file.

So for example, a `build` object that runs `npm run build` and watches the `src` directory would look like this:

```json
{
  "build": {
    "command": "npm run build",
    "watch": "src"
  }
}
```
