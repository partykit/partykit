## PartyMix: 🎈 PartyKit ⤫ Remix 💿

_*(Work in progress, come back later!)*_

This is a [remix.run](https://remix.run) adapter to deploy applications to [PartyKit](https://partykit.io) servers.

## Get started

You can create a new PartyMix app with the following command:

```bash
npm create partykit@latest -- --template remix
```

That's it! Alternately, you can add PartyMix to an existing Remix app with the following steps:

## Usage

First, install the dependencies:

```bash
npm install partykit partymix --save-dev
```

Define your PartyKit server like so:

```js
// src/server.js

import { createRequestHandler } from "partymix";
import * as build from "@remix-run/dev/server-build";

const handleRequest = createRequestHandler({ build });

export default class MyRemix {
  static onFetch(request, lobby, ctx) {
    return handleRequest(request, lobby, ctx);
  }
}
```

And your `partykit.json` like so:

```jsonc
// partykit.json
{
  "name": "partymix",
  "main": "src/server.js",
  "serve": "public"
}
```

And your `remix.config.js` like so:

```js
// remix.config.js
/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  server: "./src/server.ts",
  serverConditions: ["partykit", "workerd", "worker", "browser"],
  serverMainFields: ["browser", "module", "main"],
  serverMinify: true,
  serverModuleFormat: "esm",
  serverPlatform: "neutral",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  // ...
};
```

You can then run your app locally:

```bash
npx remix dev --manual -c "npx partykit dev",
```

And then deploy the whole thing with:

```bash
npx remix build && npx partykit deploy
```
