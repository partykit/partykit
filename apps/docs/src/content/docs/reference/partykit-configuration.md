---
title: Configuration (partykit.json)
description: PartyKit Configuration reference
---

This is a reference of all the fields you can add to your `partykit.json` file to configure the behavior of your project.

## Project configuration

### name

The name of your project. This is used to identify your project on the platform, and is also used to generate the url for your project (typically `https://<name>.<user>.partykit.dev`) For example:

```json
{
  "name": "my-project"
}
```

Alternately, you can pass this as an argument to the `dev` or `deploy` commands, like this: `npx partykit dev --name my-project`

### main

The entry point for your project. This is where you'd define a default export as specified by the [PartyKit API](/reference/partyserver-api/). For example:

```json
{
  "main": "src/server.ts"
}
```

### parties

In addition to the [main](#main) entry point, each PartyKit project can host multiple independent parties:

```json
{
  "main": "src/server.ts",
  "parties": {
    "other": "src/other.ts",
    "another": "src/another.ts"
  }
}
```

Related guide: [Using multiple parties per project](/guides/using-multiple-parties-per-project/)

### serve

Serve static assets or a static website from the root of your your PartyKit project

```jsonc
{
  "serve": {
    "path": "path/to/assets",
    // ...
    "build": {
      "entry": "path/to/entry.ts", // can also be an array of paths
      "bundle": true, // bundle all dependencies, defaults to true
      "splitting": true, // split bundles, defaults to true
      "outdir": "path/to/outdir", // defaults to serve.path + "dist"
      "minify": true, // minify bundles, defaults to false in dev and to true in deploy
      "format": "esm", // "esm" | "cjs" | "iife", default "esm"
      "sourcemap": true, // generate sourcemaps, defaults to true
      "define": {
        // define global constants, defaults to {}
        "process.env.xyz": "123"
        // you can pass values via the CLI with --define key=value
      },
      "external": ["react", "react-dom"], // externalize modules, defaults to []
      "loader": {
        // configure loaders, defaults to {}
        ".png": "file" // see https://esbuild.github.io/content-types/ for more info
      }
    }
  }
}
```

Related guide: [Serving static assets](/guides/serving-static-assets/)

### vars

:::danger[Deprecated]
The `vars` field is deprecated and may be removed in a future version of PartyKit.

For updated documentation, read [Managing environment variables in PartyKit](/guides/managing-environment-variables/)
:::

A list of environment variables that you want to set for your project. These are available on the `room` object as `room.env`. Example:

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

## Dev server configuration

### port

The port to use when you start the dev server using `partykit dev`. Defaults to `1999`.

```json
{
  "port": 1984
}
```

### persist

Path to persist the party storage to in development mode. Defaults to `.partykit/state`.

```json
{
  "persist": ".cache"
}
```

Set to `false` if you don't want to persist storage between dev server restarts.

With a configuration like that, you could then access the variable in your code like this:

```ts
export default {
  onConnect(connection, room) {
    console.log(room.env.MY_VAR); // "my value"
    console.log(room.env["some-nested-object"].a); // 123
  }
};
```

Related guide: [Managing environment variables in PartyKit](/guides/managing-environment-variables/)

## Build configuration

### build

Occasionally, you'll want to run some custom commands before running the server, as well as when you make changes to your code, and finally before you deploy your code on to the platform. You can define those commands here with an object that has the following properties:

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

### define

A list of constants that you want to set for your project. Any globals with these names will be substituted with the values you provide here. For example:

```json
{
  "define": {
    "MY_CONSTANT": "'my value'",
    "process.env.MY_MAGIC_NUMBER": "1"
  }
}
```

With a configuration like that, you could then access the variable in your code like this:

```ts
export default {
  onConnect(connection, room) {
    console.log(MY_CONSTANT); // -> "my value"
    console.log(process.env.MY_MAGIC_NUMBER) -> // 1
  },
};
```

### minify

Whether to minify the JavaScript build output before deploying. Defaults to `true`.

```json
{
  "minify": false
}
```

## Runtime configuration

### compatibilityDate

Cloudflare Workers API [Compatibility date](https://developers.cloudflare.com/workers/configuration/compatibility-dates/) to use.

```json
{
  "compatibilityDate": "2023-09-27"
}
```

### compatibilityFlags

Additional Cloudflare Workers API [Compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-dates/#compatibility-flags) to use.

```json
{
  "compatibilityFlags": ["web_socket_compression"]
}
```
