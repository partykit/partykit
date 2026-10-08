---
title: Migrate to PartyServer
description: Move a PartyKit project to PartyServer and deploy it to your own Cloudflare account
---

:::caution[The PartyKit managed platform is winding down]
The PartyKit managed platform (`*.partykit.dev` and `npx partykit deploy`) is being shut down. New projects should use [PartyServer](https://github.com/cloudflare/partykit/tree/main/packages/partyserver) and deploy straight to Cloudflare with `wrangler`. This guide shows how to move an existing project.
:::

## Timeline

| Date                 | What happens                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **9 October 2026**   | No new projects or preview environments. Existing projects can still be redeployed.                               |
| **16 October 2026**  | Projects with no activity in the last 3 months are removed.                                                       |
| **23 October 2026**  | Deploys are turned off. **Deadline to export your data, or to ask us for help.**                                  |
| **6 November 2026**  | The hosted platform shuts down. Remaining projects and their room data are deleted.                               |
| **20 November 2026** | `npx partykit deploy` to your own Cloudflare account stops working. Workers already in your account keep running. |

Running something people depend on, or can't make these dates? Tell us on [Discord](https://discord.gg/KDZb7J4uxJ) before 23 October and we'll keep your project running while we help you move it.

PartyServer is the successor to PartyKit. It keeps the same model (rooms, connections, `onConnect` / `onMessage`, hibernation, broadcasting) but runs as a plain Cloudflare Worker with Durable Objects in **your own Cloudflare account**. Nothing sits in between you and Cloudflare: you deploy with `wrangler`, configure with `wrangler.jsonc`, and pay Cloudflare directly. The Workers free plan includes SQLite-backed Durable Objects.

Your clients keep working mostly unchanged: [`partysocket`](https://www.npmjs.com/package/partysocket) talks to PartyServer too.

## What changes

| PartyKit                                                                                                   | PartyServer                                                                                  |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `partykit.json`                                                                                            | `wrangler.jsonc`                                                                             |
| `npx partykit dev` / `deploy`                                                                              | `npx wrangler dev` / `deploy`                                                                |
| `class Server implements Party.Server`                                                                     | `class MyServer extends Server` (from `partyserver`)                                         |
| `constructor(readonly room: Party.Room)`                                                                   | no constructor needed, use `this`                                                            |
| `this.room.id`                                                                                             | `this.name`                                                                                  |
| `this.room.storage`                                                                                        | `this.ctx.storage`                                                                           |
| `this.room.env`                                                                                            | `this.env`                                                                                   |
| `this.room.broadcast(msg, without)`                                                                        | `this.broadcast(msg, without)`                                                               |
| `this.room.getConnection(id)` / `getConnections(tag)`                                                      | `this.getConnection(id)` / `this.getConnections(tag)`                                        |
| `onMessage(message, sender)`                                                                               | `onMessage(connection, message)` (**arguments are swapped**)                                 |
| `onConnect(connection, ctx)`, `onClose`, `onError`, `onRequest`, `onAlarm`, `onStart`, `getConnectionTags` | same names                                                                                   |
| `static options = { hibernate: true }`                                                                     | same                                                                                         |
| `static onBeforeConnect` / `onBeforeRequest`                                                               | options to `routePartykitRequest()`                                                          |
| `static onFetch`                                                                                           | your Worker's `fetch` handler                                                                |
| `static onCron` + `crons` in `partykit.json`                                                               | `triggers.crons` in `wrangler.jsonc` + a `scheduled` handler                                 |
| `parties` in `partykit.json`                                                                               | one Durable Object binding per server class                                                  |
| `this.room.context.parties.other.get(id)`                                                                  | `getServerByName(this.env.Other, id)`                                                        |
| `serve` (static assets)                                                                                    | [`assets`](https://developers.cloudflare.com/workers/static-assets/) in `wrangler.jsonc`     |
| `vars` / `npx partykit env`                                                                                | `vars` in `wrangler.jsonc` / `npx wrangler secret put`                                       |
| `room.context.ai`, `vectorize`, `bindings`                                                                 | regular [Workers bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/) |
| `y-partykit`                                                                                               | [`y-partyserver`](https://www.npmjs.com/package/y-partyserver)                               |
| `https://<project>.<user>.partykit.dev`                                                                    | `https://<name>.<subdomain>.workers.dev` or your own domain                                  |

## Step by step

### 1. Install

```sh
npm install partyserver
npm install -D wrangler
```

Remove `partykit` from your dependencies once you're done.

### 2. Port the server

Before (PartyKit):

```ts
import type * as Party from "partykit/server";

export default class Chat implements Party.Server {
  constructor(readonly room: Party.Room) {}

  static options = { hibernate: true };

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    conn.send(`welcome to ${this.room.id}`);
  }

  async onMessage(message: string, sender: Party.Connection) {
    await this.room.storage.put("last", message);
    this.room.broadcast(message, [sender.id]);
  }
}
```

After (PartyServer):

```ts
import { routePartykitRequest, Server } from "partyserver";
import type { Connection } from "partyserver";

type Env = { Main: DurableObjectNamespace<Chat> };

export class Chat extends Server<Env> {
  static options = { hibernate: true };

  onConnect(conn: Connection) {
    conn.send(`welcome to ${this.name}`);
  }

  async onMessage(sender: Connection, message: string) {
    await this.ctx.storage.put("last", message);
    this.broadcast(message, [sender.id]);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response("Not Found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
```

`routePartykitRequest` serves `/parties/:server/:room`, where `:server` is the kebab-cased name of a Durable Object binding. Naming the binding `Main` means existing clients that connect to the default `main` party keep working without changes.

### 3. Replace `partykit.json` with `wrangler.jsonc`

```jsonc
{
  "name": "my-chat",
  "main": "src/server.ts",
  "compatibility_date": "2025-06-01",
  "compatibility_flags": ["nodejs_compat"],
  "durable_objects": {
    "bindings": [{ "name": "Main", "class_name": "Chat" }]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["Chat"] }],

  // if you used "serve"
  "assets": { "directory": "./public" },

  // if you used "vars"; use `wrangler secret put` for secrets
  "vars": { "SOME_SETTING": "value" }

  // if you used "crons"
  // "triggers": { "crons": ["*/5 * * * *"] }
}
```

Unlike PartyKit, wrangler doesn't create Durable Object migrations for you. Add a new entry to `migrations` whenever you add, rename or remove a server class.

### 4. Static `onBeforeConnect` / `onBeforeRequest` / `onFetch`

```ts
export default {
  async fetch(request: Request, env: Env) {
    return (
      (await routePartykitRequest(request, env, {
        onBeforeConnect: async (req) => {
          const token = new URL(req.url).searchParams.get("token");
          if (!(await isValid(token))) {
            return new Response("Unauthorized", { status: 401 });
          }
        }
      })) ||
      // whatever your static onFetch used to do
      new Response("Not Found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
```

### 5. Update your clients

Point `host` at your new deployment:

```ts
const socket = new PartySocket({
  host: "my-chat.<your-subdomain>.workers.dev",
  room: "my-room"
});
```

If you had `PARTYKIT_HOST` baked into your frontend, replace it with the new host. If your clients connect to the old `/party/:room` URLs (very old `partysocket` versions), either upgrade `partysocket` or rewrite `/party/` to `/parties/main/` in your `fetch` handler.

### 6. Run and deploy

```sh
npx wrangler dev
npx wrangler login
npx wrangler deploy
```

## Moving your data

Room storage (`this.room.storage`) on the managed platform lives in Durable Objects in PartyKit's Cloudflare account. **It can't be transferred to your account automatically, and it will be deleted when the platform shuts down.** If you need it, export it while you can still redeploy your PartyKit project:

You need three things: an export endpoint on your old PartyKit server, an import endpoint on your new PartyServer server, and a script that copies each room from one to the other.

### 1. Add an export endpoint to your PartyKit server

Add this to your PartyKit server class (merge it into your existing `onRequest` if you have one), then set a secret and redeploy:

```ts
async onRequest(req: Party.Request) {
  if (req.headers.get("Authorization") !== `Bearer ${this.room.env.EXPORT_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const data = await this.room.storage.list();
  return Response.json(Object.fromEntries(data));
}
```

```sh
npx partykit env add EXPORT_SECRET
npx partykit deploy
```

Check it works: `curl -H "Authorization: Bearer $EXPORT_SECRET" https://<project>.<user>.partykit.dev/parties/main/<room-id>`

### 2. Add an import endpoint to your PartyServer server

```ts
async onRequest(req: Request) {
  if (req.method === "POST" && new URL(req.url).pathname.endsWith("/import")) {
    if (req.headers.get("Authorization") !== `Bearer ${this.env.IMPORT_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
    const entries = Object.entries(await req.json<Record<string, unknown>>());
    // put() accepts at most 128 keys at a time
    for (let i = 0; i < entries.length; i += 128) {
      await this.ctx.storage.put(Object.fromEntries(entries.slice(i, i + 128)));
    }
    return Response.json({ imported: entries.length });
  }
  // ...the rest of your onRequest
  return new Response("Not Found", { status: 404 });
}
```

```sh
npx wrangler secret put IMPORT_SECRET
npx wrangler deploy
```

### 3. Copy your rooms

Save this as `migrate-rooms.mjs` (Node 18+, no dependencies) and put the room ids you want to keep in `rooms.txt`, one per line. You can't list rooms on the managed platform yourself, so take the ids from your own database, logs or URLs.

```js
// migrate-rooms.mjs: copies room storage from PartyKit to PartyServer.
// Every room is also saved to ./export/<room>.json as a backup.
// Leave out NEW_HOST to only export.
import fs from "node:fs";

const { OLD_HOST, NEW_HOST, EXPORT_SECRET, IMPORT_SECRET } = process.env;
const PARTY = process.env.PARTY ?? "main";
const roomsFile = process.argv[2];
if (!OLD_HOST || !EXPORT_SECRET || !roomsFile) {
  console.error(
    "Usage: OLD_HOST=... EXPORT_SECRET=... [NEW_HOST=... IMPORT_SECRET=...] node migrate-rooms.mjs rooms.txt"
  );
  process.exit(1);
}
const scheme = (host) => (/^(localhost|127\.)/.test(host) ? "http" : "https");
const rooms = fs
  .readFileSync(roomsFile, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);
fs.mkdirSync("export", { recursive: true });

let ok = 0;
for (const room of rooms) {
  try {
    const res = await fetch(
      `${scheme(OLD_HOST)}://${OLD_HOST}/parties/${PARTY}/${encodeURIComponent(room)}`,
      {
        headers: { Authorization: `Bearer ${EXPORT_SECRET}` }
      }
    );
    if (!res.ok) throw new Error(`export: ${res.status} ${await res.text()}`);
    const data = await res.text();
    fs.writeFileSync(`export/${encodeURIComponent(room)}.json`, data);

    if (NEW_HOST) {
      const imp = await fetch(
        `${scheme(NEW_HOST)}://${NEW_HOST}/parties/${PARTY}/${encodeURIComponent(room)}/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${IMPORT_SECRET}`,
            "Content-Type": "application/json"
          },
          body: data
        }
      );
      if (!imp.ok) throw new Error(`import: ${imp.status} ${await imp.text()}`);
    }
    ok++;
    console.log(`✓ ${room}`);
  } catch (e) {
    console.error(`✗ ${room}: ${e.message}`);
  }
}
console.log(
  `${ok}/${rooms.length} rooms ${NEW_HOST ? "migrated" : "exported"}`
);
```

```sh
OLD_HOST=<project>.<user>.partykit.dev EXPORT_SECRET=... \
NEW_HOST=<name>.<subdomain>.workers.dev IMPORT_SECRET=... \
node migrate-rooms.mjs rooms.txt
```

Use `PARTY=<name>` to copy rooms from one of your other `parties` (the matching PartyServer binding must kebab-case to the same name). Re-running is safe; it overwrites the same keys.

Things to know:

- Values go through JSON, so `Date`s become strings and `Map`s, `Set`s and binary data don't survive as-is. If you stored those, convert them in the export endpoint and back in the import endpoint.
- PartyServer keeps a `__ps_name` key in each room's storage. Don't use that key name yourself.
- Remove both endpoints once you're done.

:::tip[Can't export it yourself?]
If you have a lot of rooms, don't know your room ids, or can't redeploy in time, reach out on [Discord](https://discord.gg/KDZb7J4uxJ) before deploys are turned off. We'll keep your project running and help you get the data out.
:::

If you use `y-partykit` with persistence, export the document from `onRequest` with `Y.encodeStateAsUpdate(doc)` and apply it with `Y.applyUpdate` in your new `y-partyserver` room.

## Already deploying to your own Cloudflare account?

If you used [cloud-prem](/guides/deploy-to-cloudflare/) (`CLOUDFLARE_ACCOUNT_ID=... npx partykit deploy --domain ...`), your Worker and its data already live in your account and keep running after the PartyKit platform shuts down. Only `npx partykit deploy` stops working, because it goes through the PartyKit API.

You have two options:

- **Start fresh** with a new Worker following the steps above, and move data over with an export endpoint.
- **Keep your existing Worker and its data (advanced).** PartyKit deployed your Worker with the Durable Object class `PartyKitDurable` bound as `PARTYKIT_DURABLE` (plus one class per entry in `parties`). Rooms were addressed with `idFromName(roomId)`, which is also what PartyServer does. If you deploy a PartyServer Worker under the **same Worker name**, export your main server class as `PartyKitDurable`, and bind it under the same name, existing rooms keep their storage. Leave `migrations` out of `wrangler.jsonc` for classes that already exist, and don't switch them to SQLite storage (`new_sqlite_classes`), since existing classes can't change storage backend. Because the binding isn't called `Main`, route requests yourself instead of relying on `routePartykitRequest`'s name matching:

  ```ts
  import { getServerByName } from "partyserver";

  export default {
    async fetch(request: Request, env: Env) {
      const [, prefix, party, room] = new URL(request.url).pathname.split("/");
      if (prefix === "parties" && party === "main" && room) {
        const stub = await getServerByName(env.PARTYKIT_DURABLE, room);
        return stub.fetch(request);
      }
      return new Response("Not Found", { status: 404 });
    }
  } satisfies ExportedHandler<Env>;
  ```

  **Try it on a copy first.** Deploy under a new Worker name, check behaviour, then deploy over the original.

## Getting help

Ask on our [Discord](https://discord.gg/KDZb7J4uxJ), or open an issue on [cloudflare/partykit](https://github.com/cloudflare/partykit).
