## PartyMix: 🎈 PartyKit ⤫ Remix 💿

This is a [remix.run](https://remix.run) adapter to deploy applications to [PartyKit](https://partykit.io) servers.

## Get started

You can create a new PartyMix app with the following command:

```bash
npx create-remix@latest ./my-remix-app --template partykit/remix-starter
```

That's it! Alternately, you can add PartyMix to an existing Remix app with the following steps:

## Usage

First, install the dependencies:

```bash
npm install partykit partymix
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
  "main": "build/server.js", // point to the built version of your server
  "serve": "public"
}
```

And your `remix.config.js` like so:

```js
// remix.config.js
/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  server: "./src/server.js",
  serverConditions: ["partykit", "workerd", "worker", "browser"],
  serverMainFields: ["browser", "module", "main"],
  serverModuleFormat: "esm",
  serverPlatform: "neutral"
  // ...
};
```

You can then run your app locally:

```bash
npx remix dev --manual -c "npx partykit dev"
```

And then deploy the whole thing with:

```bash
npx remix build && npx partykit deploy
```

## Thanks

(This adapter based on the original template for [Cloudflare Workers](https://github.com/remix-run/remix/tree/main/packages/remix-cloudflare-workers))
