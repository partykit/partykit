# partykit

## 0.0.10

### Patch Changes

- [#339](https://github.com/partykit/partykit/pull/339) [`0206dd5`](https://github.com/partykit/partykit/commit/0206dd59b56c5f232969ca99e9c9ea5b286ed0d8) Thanks [@threepointone](https://github.com/threepointone)! - partykit: bundle dependencies

  This brings back packaging of dependencies for partykit (and introduces it for create-partykit). We had previously disabled it for deps because of esm/cjs nonsense, but we've now figured out how to make them play decently together.

  I had to fork ink-testing-library because of https://github.com/vadimdemedes/ink-testing-library/pull/23, I'll remove it once that PR is merged.

  This also updates ink to 4.4.1, which fixes our previous issue where it was exiting early.

## 0.0.9

### Patch Changes

- [`c5a8357`](https://github.com/partykit/partykit/commit/c5a835761e4b81a0dbd460ac53aa93193ce4c658) Thanks [@jevakallio](https://github.com/jevakallio)! - Trigger a new release

## 0.0.8

### Patch Changes

- [#329](https://github.com/partykit/partykit/pull/329) [`9a55f69`](https://github.com/partykit/partykit/commit/9a55f69dee39267faf02204821b724c826870d39) Thanks [@threepointone](https://github.com/threepointone)! - change naming of /server exports

  This changes the naming of our exported types from `partykit/server`. The motivation here was aesthetic/simplification. Most of the exports los the `Party` prefix; i.e. `PartyServer` becomes `Server`, `PartyConnection` becomes `Connection`, and so on. If you look at the class example, this doesn't drastically change the code; the import becomes a lot shorter (`import type * as Party from 'partykit/server'` gets all the required types) and required types are taken by `Party.*`.

  I also did a run on all the docs/templates and the blog post, but lemme know if I missed anything!

- [#333](https://github.com/partykit/partykit/pull/333) [`dc324d9`](https://github.com/partykit/partykit/commit/dc324d91d9521682bf8490e1fed51d5371a752df) Thanks [@threepointone](https://github.com/threepointone)! - fix: `init` doesn't install the right versions of packages

  This fix should pick up the latest versions of partykit /partysocket when installing. We were using the previous beta logic when every package was on the same version. This patch picks up the latest versions of both and uses it.

  (also sneaking in a quick types fix for usePartySocket)

- [#334](https://github.com/partykit/partykit/pull/334) [`9e46880`](https://github.com/partykit/partykit/commit/9e468804206d7a3a3d56d3d3c795bd603a131b9d) Thanks [@jevakallio](https://github.com/jevakallio)! - Fix create-partykit crash issue by downgrading "ink" dependency to last known good version

## 0.0.7

### Patch Changes

- [#274](https://github.com/partykit/partykit/pull/274) [`30fabc9`](https://github.com/partykit/partykit/commit/30fabc95645adbfe5293e0f8b131a917d344965f) Thanks [@threepointone](https://github.com/threepointone)! - don't compile node builtins that the platform supports

  We support some node builtins, so we shouldn't try to compile them into the bundle.

## 0.0.6

### Patch Changes

- [#314](https://github.com/partykit/partykit/pull/314) [`d9a1871`](https://github.com/partykit/partykit/commit/d9a187180cb1b205b26b3f26cd8bde6701426d24) Thanks [@threepointone](https://github.com/threepointone)! - trigger a release

## 0.0.5

### Patch Changes

- [#304](https://github.com/partykit/partykit/pull/304) [`9c5df06`](https://github.com/partykit/partykit/commit/9c5df06e5378bf24338349403aa75a07e0d21c21) Thanks [@jevakallio](https://github.com/jevakallio)! - Update create and init templates to use Class API

## 0.0.4

### Patch Changes

- [#307](https://github.com/partykit/partykit/pull/307) [`ad3ea55`](https://github.com/partykit/partykit/commit/ad3ea552b42614217493f71fd69343a53591d470) Thanks [@threepointone](https://github.com/threepointone)! - fix: route sub party requests correctly

  sigh. we were always fetching from the main party. This fix routest he request to the correct sub party.

## 0.0.3

### Patch Changes

- [#296](https://github.com/partykit/partykit/pull/296) [`57f71c9`](https://github.com/partykit/partykit/commit/57f71c94639ace4a6fefd9f53fe2bd20f24d46b2) Thanks [@jevakallio](https://github.com/jevakallio)! - Add `partykit token generate` to create API tokens

- [#305](https://github.com/partykit/partykit/pull/305) [`8e087cc`](https://github.com/partykit/partykit/commit/8e087ccc6f18581f74f769c341589afadf7a1156) Thanks [@jevakallio](https://github.com/jevakallio)! - Fix edge case bugs in `partykit init`

- [#299](https://github.com/partykit/partykit/pull/299) [`2209de9`](https://github.com/partykit/partykit/commit/2209de9b8de794db5c19a9a0a7fe21b94b140711) Thanks [@threepointone](https://github.com/threepointone)! - fix: call oBC/oBR on sub parties

  We hadn't wired up onBeforeConnect/onBeforeRequest for multi parties. To fix this, I did a refactor where _every_ request goes through a common codepath now. Additionally, this also means that `/parties/main/:id` is equivalent to `party/:id`. I also massaged out some differences between the platform/cli facade.

- [#300](https://github.com/partykit/partykit/pull/300) [`6bd4609`](https://github.com/partykit/partykit/commit/6bd4609017ee32596ac5fdf37a09fba4e24c6dd3) Thanks [@threepointone](https://github.com/threepointone)! - add new lines when hitting return in `dev`

  fairly common behaviour with other CLIs, just adding it to ours as well.

- [#293](https://github.com/partykit/partykit/pull/293) [`53eb0b5`](https://github.com/partykit/partykit/commit/53eb0b54f09628e3c625dba052dffdbbf6b4c836) Thanks [@threepointone](https://github.com/threepointone)! - `partykit init`: add partykit to existing projects

  The common usecase is to add partykit to an existing project, usually running on another stack/provider. This adds an `init` command that simply adds dependencies, a `partykit.json` file, and an entry point. If it's not run inside an existing project, it defers to running `npm create partykit` instead.

- [#303](https://github.com/partykit/partykit/pull/303) [`6b773ae`](https://github.com/partykit/partykit/commit/6b773ae6e276dc4a68a958ebc86099a51186b471) Thanks [@jevakallio](https://github.com/jevakallio)! - Improve type documentation

## 0.0.2

### Patch Changes

- [#241](https://github.com/partykit/partykit/pull/241) [`a5b3dda`](https://github.com/partykit/partykit/commit/a5b3dda10ed270cf1e91f813387e042c97898194) Thanks [@threepointone](https://github.com/threepointone)! - generate a json schema and publish it

- [#251](https://github.com/partykit/partykit/pull/251) [`049bcac`](https://github.com/partykit/partykit/commit/049bcac42aa49e4bddec975c63b7d7984112e450) Thanks [@threepointone](https://github.com/threepointone)! - small tweaks to `init`

  - replace `process.env.PARTYKIT_HOST` with just `PARTYKIT_HOST`
  - add a `tsconfig.json`
  - add partykit to devDependencies in `init`
  - strip protocol from host (partysocket, y-partykit)

- [#270](https://github.com/partykit/partykit/pull/270) [`db40a08`](https://github.com/partykit/partykit/commit/db40a083463abe76abac96777c10350f89b0d9bf) Thanks [@threepointone](https://github.com/threepointone)! - fix: serve newer assets on changes

  We had a bug where newly created assets weren't being served on dev, this should fix that.

- [#246](https://github.com/partykit/partykit/pull/246) [`30e4dbd`](https://github.com/partykit/partykit/commit/30e4dbdee2935fcb194dd87fd9e7dbb468cbefd1) Thanks [@threepointone](https://github.com/threepointone)! - feat: define a default `process.env.PARTYKIT_HOST`

  We can actually make a pretty good guess to what the host is for both dev and deploy, so let's define it when compiling, and remove a bunch of boilerplate in the process.

- [#107](https://github.com/partykit/partykit/pull/107) [`e0135cd`](https://github.com/partykit/partykit/commit/e0135cd1b51c1d0298e29bc32d8942d3a5cd412e) Thanks [@threepointone](https://github.com/threepointone)! - fix: don't receive messages until onConnect completes

- [#201](https://github.com/partykit/partykit/pull/201) [`b993cb5`](https://github.com/partykit/partykit/commit/b993cb5686517e182f2516f3f1172c31ecd44108) Thanks [@threepointone](https://github.com/threepointone)! - fix: correct room id/parties in hibernation mode

  We weren't hydrating the room id and `parties` correctly in hibernation mode, this patch fixes that.

- [#8](https://github.com/partykit/partykit/pull/8) [`208c67b`](https://github.com/partykit/partykit/commit/208c67ba019d39ced0ff1253e53d2c1f5afb0d6e) Thanks [@threepointone](https://github.com/threepointone)! - update esbuild (and misc).

- [#196](https://github.com/partykit/partykit/pull/196) [`7aeeff6`](https://github.com/partykit/partykit/commit/7aeeff6a1284c82377a8c339aa011f3127b910c5) Thanks [@threepointone](https://github.com/threepointone)! - Expose `parties` inside `onBeforeConnect` and `onBeforeRequest`.

- [#10](https://github.com/partykit/partykit/pull/10) [`6864be8`](https://github.com/partykit/partykit/commit/6864be8e0e557429eec888896e15661af7f5a36c) Thanks [@threepointone](https://github.com/threepointone)! - Error when cli is used in older versions of node

  We now throw an error when the CLI is used on node < v18.12.1 (We could probably make this work on node 16, but we'll see in the future of required)

- [#104](https://github.com/partykit/partykit/pull/104) [`ede48ab`](https://github.com/partykit/partykit/commit/ede48ab4dc418c4d8936b819737c63a3abb23919) Thanks [@threepointone](https://github.com/threepointone)! - `npx partykit env remove` to delete all env vars for a project at once

- [#19](https://github.com/partykit/partykit/pull/19) [`167a677`](https://github.com/partykit/partykit/commit/167a67728be61926cdf56ba4101c32f86bf3be08) Thanks [@threepointone](https://github.com/threepointone)! - lazy load heavy deps in cli

  This imports modules like edge-runtime, esbuild, etc lazily / on demand in the cli, which should make the cli startup marginally faster.

  Additionally, we're modifying prereleases to use `changeset --snapshot` instead of our custom thing

- [#145](https://github.com/partykit/partykit/pull/145) [`66fb515`](https://github.com/partykit/partykit/commit/66fb515e4c37641cfb0f00c05b7e89f27c3265cf) Thanks [@threepointone](https://github.com/threepointone)! - feat: `onAlarm()`

  This exposes DO's `alarm` functionality. We already added the ability to set/remove alarms when we moved to workerd, this adds the api `onAlarm()`

- [#62](https://github.com/partykit/partykit/pull/62) [`1410f06`](https://github.com/partykit/partykit/commit/1410f06371589e6fa28ee9291a33476fcb682c3a) Thanks [@mellson](https://github.com/mellson)! - Node 16 compatibility.

- [#194](https://github.com/partykit/partykit/pull/194) [`87a3c46`](https://github.com/partykit/partykit/commit/87a3c469306d77e1861985ffd18a05d37d24c4a7) Thanks [@threepointone](https://github.com/threepointone)! - feat: `unstable_onFetch` as a catch-all for other requests

  This introduces `unstable_onFetch(req, lobby, ctx)` as a catch-all for requests that _don't_ match `/party/:id` or `/parties/:party/:id`.

- [#156](https://github.com/partykit/partykit/pull/156) [`46d871d`](https://github.com/partykit/partykit/commit/46d871d98a50362efaa85b5c6ff9bbbdf299aba1) Thanks [@threepointone](https://github.com/threepointone)! - feat: enable multiparty support when deploying

  We'd previously landed multiparty support in https://github.com/partykit/partykit/pull/151, this enables us to publish as well.

- [#283](https://github.com/partykit/partykit/pull/283) [`3d3bddb`](https://github.com/partykit/partykit/commit/3d3bddb04ba0d799de8e196ef8bf787c2a398acc) Thanks [@threepointone](https://github.com/threepointone)! - unload listeners on mf server / fix live reload console logging

  We were adding a bunch of listeners on the miniflare server that we weren't cleaning up, and the dependency array was wrong. This PR fixes those up, while also conveniently fixing the issue where console.log wasn't working after the first compile failure.

- [#224](https://github.com/partykit/partykit/pull/224) [`5ed8917`](https://github.com/partykit/partykit/commit/5ed89171b31f4a0d9e67b6dfa076c10ae4deb3e1) Thanks [@threepointone](https://github.com/threepointone)! - enable inspector in non-tests 😖

  In https://github.com/partykit/partykit/pull/222, we didn't actually enble the inspector outside of tests. Oops. This fixes that.

- [#261](https://github.com/partykit/partykit/pull/261) [`6c8504d`](https://github.com/partykit/partykit/commit/6c8504db3f98b1fee9e78d9af60bebd37a6e7d96) Thanks [@jevakallio](https://github.com/jevakallio)! - # New class-based `PartyServer` API

  PartyKit now supports a new ES6 Class-based API.

  ## TL;DR;

  Before:

  ```ts
  import type {
    PartyKitServer,
    PartyKitRoom,
    PartyKitConnection,
  } from "partykit/server";

  export default {
    onBeforeConnect(request: Request) {
      request.headers.set("X-User", getUser(request.headers.Authorization));
      return request;
    },
    onConnect(connection: PartyKitConnection, room: PartyKitRoom) {
      room.broadcast(`Someone joined room ${room.id}!`);
    },
  } satisfies PartyKitServer;
  ```

  After:

  ```ts
  import type {
    Party,
    PartyConnection,
    PartyRequest,
    PartyServer,
    PartyWorker,
  } from "partykit/server";

  export default class MyParty implements PartyServer {
    constructor(public party: Party) {}

    static onBeforeConnect(request: PartyRequest) {
      request.headers.set("X-User", getUser(request.headers.Authorization));
      return request;
    }

    onConnect(connection: PartyConnection) {
      this.party.broadcast(`Someone joined room ${this.party.id}!`);
    }
  }

  MyParty satisfies PartyWorker;
  ```

  The old API remains supported for the time being, but we highly recommend starting all new projects with the new API, as the old API may be deprecated in the future.

  ## New Class-based API

  Previously, you created PartyKit servers by exporting an plain object that defines handlers for different events that occur in a room. This was nice and terse, but we found a lot of room for improvement:

  - This API didn't accurately convey PartyKit's mental model of each party being a stateful object (backed by a CloudFlare Durable Object)
  - It was hard to manage derived state safely
  - It was hard to distinguish between code that runs in the Edge worker near the user (e.g.`onBeforeConnect`) and the Party worker that runs where the room was first created (e.g. `onConnect`).
  - The naming of different concepts (parties, rooms, etc) was ambiguous

  With this feedback in mind, we've redesigned PartyKit's primary server interface with a new ES6 Class-based API.

  The following code sample demonstrates the new API, with comments describing what's changing:

  ```ts
  import type {
    Party,
    PartyConnection,
    PartyRequest,
    PartyServer,
    PartyWorker,
    PartyServerOptions,
    PartyConnectionContext,
  } from "partykit/server";

  // PartyKit servers now implement PartyServer interface
  export default class Main implements PartyServer {
    // onBefore* handlers that run in the worker nearest the user are now
    // explicitly marked static, because they have no access to Party state
    static async onBeforeRequest(request: PartyRequest) {}
    static async onBeforeConnect(request: PartyRequest) {}

    // onFetch is now stable. No more unstable_onFetch
    static async onFetch(req: PartyRequest) {}

    // Opting into hibernation is now an explicit option
    readonly options: PartyServerOptions = {
      hibernate: true,
    };

    // Servers can now keep state in class instance variables
    messages: string[] = [];

    // PartyServer receives the Party (previous PartyKitRoom) as a constructor argument
    // instead of receiving the `room` argument in each method.
    readonly party: Party;
    constructor(party: Party) {
      this.party = party;
    }

    // There's now a new lifecycle method `onStart` which fires before first connection
    // or request to the room. You can use this to load data from storage and perform other
    // asynchronous initialization. The Party will wait until `onStart` completes before
    // processing any connections or requests.
    async onStart() {
      this.messages =
        (await this.party.storage.get<string[]>("messages")) ?? [];
    }

    // You can now tag connections, and retrieve tagged connections using Party.getConnections()
    getConnectionTags(
      connection: PartyConnection,
      ctx: PartyConnectionContext
    ) {
      return [ctx.request.cf?.country as string];
    }

    // onConnect, onRequest, onAlarm no longer receive the room argument.
    async onRequest(req: PartyRequest) {}
    async onAlarm() {}
    async onConnect(connection: PartyConnection, ctx: PartyConnectionContext) {
      // You can now read the room state from `this.party` instead.
      this.party.broadcast(JSON.stringify({ messages: this.messages }));

      const country = ctx.request.cf?.country as string;

      // room.connections is now called room.getConnections(tag?)
      // that receives an optional tag argument to filter connections
      for (const compatriot of this.party.getConnections(country)) {
        compatriot.send(
          JSON.stringify({
            message: `${connection.id} is also from ${country}!`,
          })
        );
      }
    }

    // Previously onMessage, onError, onClose were only called for hibernating parties.
    // They're now available for all parties, so you no longer need to manually
    // manage event handlers in onConnect!
    async onError(ws: PartyConnection, err: Error) {}
    async onClose(ws: PartyConnection) {}
    async onMessage(message: string, connection: PartyConnection) {}
  }

  // Optional: Typecheck the static methods with a `satisfies` statement.
  Main satisfies PartyWorker;
  ```

  In addition to moving from an object syntax to class syntax, we've introduced multiple improvements to developer ergonomics:

  ## `onStart` handler

  PartyKit servers are convenient, because they're stateful, but you still need to make sure to store the state into room storage for when the room restarts due to inactivity or exceeding its maximum CPU time.

  There's now a new lifecycle method `onStart` which fires before first connection or request to the room. You can use this to load data from storage and perform other asynchronous initialization, such as retrieving data or configuration from other services or databases.

  ```ts
    // Servers can now keep state in class instance variables
    messages: string[] = [];
    async onStart() {
      this.messages = (await this.party.storage.get<string[]>("messages")) ?? [];
    }
  ```

  The Party will wait until `onStart` completes before processing any connections or requests to the party.

  ## Better support for Hibernatable WebSockets

  In order to support scaling parties to tens of thousands of concurrent connections, PartyKit supports CloudFlare Durable Object [Hibernatable WebSockets API](https://developers.cloudflare.com/durable-objects/api/hibernatable-websockets-api).

  When opting into hibernation, the server goes to sleep between messages, and only comes alive when there is work to be performed, making it more cost-effective and easier to scale. Hibernation comes with tradeoffs: for certain type of applications, you may want to keep the server in memory for longer between requests.

  ### Explicit hibernation opt-in

  Previously, we automatically opted you into "hibernation mode" when you defined an `onMessage` handler in your server. Now, you can define an `options.hibernate` field, which defaults to `false`:

  ```ts
    readonly options: PartyServerOptions = {
      hibernate: true,
    };
  ```

  ### More convenient message handling

  Previously the so-called "hibernation-mode handlers" `onMessage`, `onError`, `onClose` were only called when you opted into hibernation. They're now available for all servers, so you no longer need to manually manage event handlers in `onConnect`:

  ```ts
    async onMessage(message: string, connection: PartyConnection) {}
    async onError(ws: PartyConnection, err: Error) {}
    async onClose(ws: PartyConnection) {}
  ```

  No more manually registering event handlers in `onConnect`! (Unless you want to, of course.)

  ### Better connection management

  Previously, PartyKit managed connections in memory in a big Map, available in `room.connections`. This meant that every time your server woke up from hibernation, PartyKit needed to rehydrate all connections, which was both slow and expensive.

  Now, instead, you can access connections on `Party` as follows:

  ```ts
  // get connection by id (previously room.connections.get(id))
  const connection = this.party.getConnection(id);
  // iterate over all connection (previously room.connections.values())
  for (const c of this.party.getConnections()) {
  }
  ```

  ### Tagged connections

  You can set additional metadata on connections by returning them from a `getConnectionTags` callback on `PartyServer`:

  ```ts
    getConnectionTags(connection: PartyConnection) {
      return ["some tag"];
    }
  ```

  You can then filter connections by tag, removing the need to wake up hibernated sockets unnecessarily:

  ```ts
  for (const c of this.party.getConnections("some tag")) {
  }
  ```

  ## Naming changes

  While designing the new API, we also wanted to be thoughtful about naming.

  The biggest problem we wanted to solve was the distinction between "parties" and "rooms", which was confusing for many. From now on, we'll refer to PartyKit server instances as "parties", and will no longer use the "room" terminology.

  To reflect this, we made the following names in our TypeScript types:

  - `PartyKitRoom` is now `Party`, and refers to a single server instance (i.e. Durable Object)
  - `PartyServer` refers to the instance code definition of the server (i.e. Durable Object)
  - `PartyWorker` refers to the static code definition of the server which runs in a separate worker before connecting to the Party.
  - `PartyKit*`-prefixed types are now shortened to `Party*` by dropping the "Kit". It's cleaner.
  - `room.parties` ➡️ `party.context.parties` — Represents the taxonomy and relationship between parties more clearly.

  The old names are deprecated, but will continue to work. The deprecated names are decorated with JSDoc `@deprecated` pragmas, so you can find the types you need to rename.

  ## Breaking changes

  There are no breaking runtime changes. Existing PartyKit projects should continue working as expected.

  ### Incoming request types

  However, while making changes to our TypeScript types, we discovered that the type definitions for `on(Before)Request` and `on(Before)Connect` were incorrectly defined to receive a Fetch API `Request` type, whereas at runtime they would always receive a `PartyKitRequest` type, which is an instance of CloudFlare Workers -specific Request object.

  We decided to fix this issue, which means you'll need to make the following change:

  ```diff

  + import { PartyRequest } from "partykit/server";

  export default {
  -  onBeforeRequest(request: Request) {
  +  onBeforeRequest(request: PartyRequest) {
      return new Request(request.url, { headers: { "x-foo": "bar" } });
    }
  }
  ```

  Note that you can still return a normal `Request` -- only the input type has changed.

- [#58](https://github.com/partykit/partykit/pull/58) [`c4bc1f2`](https://github.com/partykit/partykit/commit/c4bc1f2ea86696305ad5e0f9bf460e66d346ba04) Thanks [@threepointone](https://github.com/threepointone)! - feat: onRequest/onBeforeRequest

  This feature allows you to optionally configure onBeforeRequest/onRequest on a room. just like oBC/oC, the former runs in a worker closest to you, and the later runs in the room. This also makes defining onConnect fully optional. This should open the door to some interesting integrations.

- [#113](https://github.com/partykit/partykit/pull/113) [`f176d8d`](https://github.com/partykit/partykit/commit/f176d8d3beaef7a6b0cb36a2ee235f6871d96cfb) Thanks [@threepointone](https://github.com/threepointone)! - feat: `tail` for live logs

  running `partykit tail --name <project>` will now hook into a project's production logs and stream them live. This is a full clone of `wrangler tail`. Two notes:

  - there's a bug with cf where logs on websocket connections don't come through until the websocket disconnects
  - the filter aren't tested yet

  That said, this is a good start, so let's land it and see what to fix after.

- [#9](https://github.com/partykit/partykit/pull/9) [`24f8641`](https://github.com/partykit/partykit/commit/24f86413f83219591536cffe2e2e896ebd5f0baf) Thanks [@threepointone](https://github.com/threepointone)! - add client id (`_pk`) to connection requests

- [#245](https://github.com/partykit/partykit/pull/245) [`158c239`](https://github.com/partykit/partykit/commit/158c239ad6d9c3adc36ee8408ab0c9b1799c85ed) Thanks [@threepointone](https://github.com/threepointone)! - rename `assets` -> `serve`

- [#249](https://github.com/partykit/partykit/pull/249) [`ac55fd0`](https://github.com/partykit/partykit/commit/ac55fd07255ea6b50ef6033e963b799ebbfdfc3d) Thanks [@threepointone](https://github.com/threepointone)! - `npx partykit init` - the basics

  This implements the basics for an init command: it creates a package,.json if needed with dependencies, a simple server, a client entry and an index.html file (using the new static assets, woo)

- [`5cc8734`](https://github.com/partykit/partykit/commit/5cc8734c12b64a0f1c34f0a21b661233d2125879) Thanks [@threepointone](https://github.com/threepointone)! - Let onBeforeRequest return a Response

- [#7](https://github.com/partykit/partykit/pull/7) [`97c26e7`](https://github.com/partykit/partykit/commit/97c26e7dfc4abd927dc71fdd2b916e29fd4d8650) Thanks [@threepointone](https://github.com/threepointone)! - `export default {onConnect}`

  changing the server's export signature so it's easier to add types and validate.

- [#87](https://github.com/partykit/partykit/pull/87) [`a3f7b72`](https://github.com/partykit/partykit/commit/a3f7b72b0eb17ce44f5f7f5c6d0c3c9fb301357c) Thanks [@threepointone](https://github.com/threepointone)! - add update-notifier

- [#186](https://github.com/partykit/partykit/pull/186) [`d3c6c72`](https://github.com/partykit/partykit/commit/d3c6c72bbabedb679a582b16a4ba8b22e75c7a9a) Thanks [@threepointone](https://github.com/threepointone)! - feat: expose the 'main' party as `room.parties.main`

- [`d2c4878`](https://github.com/partykit/partykit/commit/d2c4878f911b78cd32225af06c9182659bcbf6bc) Thanks [@threepointone](https://github.com/threepointone)! - fix: configurable API endpoint name

- [#177](https://github.com/partykit/partykit/pull/177) [`5c5b729`](https://github.com/partykit/partykit/commit/5c5b7292b22d8391a722a40757832920c3ee994a) Thanks [@threepointone](https://github.com/threepointone)! - fix: `without` in `room.broadcast()` is optional

- [#281](https://github.com/partykit/partykit/pull/281) [`a1cfe42`](https://github.com/partykit/partykit/commit/a1cfe4232d6c01ee195295fcf02faea0b593d480) Thanks [@threepointone](https://github.com/threepointone)! - run multiple instances simultaneously

  We weren't looking for free ports when starting up partykit dev. We run a few servers; the runtime, the assets server, and an inspector port. This PR uses preferred ports when starting up, and finds free ports when not.

- [#282](https://github.com/partykit/partykit/pull/282) [`38d3975`](https://github.com/partykit/partykit/commit/38d39750b3b53df4eb0153f8b1f64e1a9db283f2) Thanks [@threepointone](https://github.com/threepointone)! - fix asset server reload

- [#123](https://github.com/partykit/partykit/pull/123) [`0387b1a`](https://github.com/partykit/partykit/commit/0387b1abc0cf593f215f59c67e04fde63bc8619a) Thanks [@TrySound](https://github.com/TrySound)! - replace express with node http server

- [#2](https://github.com/partykit/partykit/pull/2) [`83570bf`](https://github.com/partykit/partykit/commit/83570bfb5775da6be3e4c567a3a0426ce784ad2c) Thanks [@threepointone](https://github.com/threepointone)! - read `PARTYKIT_API_BASE` from `process.env`, with a production default

- [#289](https://github.com/partykit/partykit/pull/289) [`8bf5eb8`](https://github.com/partykit/partykit/commit/8bf5eb85c354c6ecd44e4ea28732910b824173c1) Thanks [@threepointone](https://github.com/threepointone)! - partymix: first commit

  partymix is a remix.run adapter for deploying on to partykit. This PR includes an implementation, as well as example app.

- [#255](https://github.com/partykit/partykit/pull/255) [`7aab91f`](https://github.com/partykit/partykit/commit/7aab91fda85e2ef14cf2c418864d5dda045a55e3) Thanks [@threepointone](https://github.com/threepointone)! - expose `external` for asset bundling config

- [#13](https://github.com/partykit/partykit/pull/13) [`28ada99`](https://github.com/partykit/partykit/commit/28ada9937b4205cdfc1a655a4cc94c1d4568a639) Thanks [@threepointone](https://github.com/threepointone)! - feat: initial implementation of `partykit env`

  This patch adds an initial implementation of the `partykit env list/pull/add/remove` commands. This doesn't actually use the env vars anywhere yet, but it's a start.

- [#288](https://github.com/partykit/partykit/pull/288) [`5caf200`](https://github.com/partykit/partykit/commit/5caf200d883b09096108c2efe7a1bfa1b8b860bb) Thanks [@threepointone](https://github.com/threepointone)! - fix: timing issues with assets/build server

  In `dev` we have some issues with the way we initialise/restart servers

  - if an external process is generating assets, and it does it quickly, then we end up crashing the assets server
  - we were restarting the assets folder watcher whenever the assets watcher restarted
  - we weren't cleaning up the assets folder watcher on effect rerun
  - we weren't cleaning up the custom build folder watcher on effect rerun

  So, the fixes:

  - debounce setting the assets map (100ms, is short enough to not be noticeable, but long enough to let esbuild manager a restart)
  - close the assets build watcher correctly
  - don't restart the assets build watcher incessantly
  - close the custom build watcher correctly

- [#204](https://github.com/partykit/partykit/pull/204) [`2a43d58`](https://github.com/partykit/partykit/commit/2a43d586bb36554ae5752d026ccf2972288d145c) Thanks [@threepointone](https://github.com/threepointone)! - add a user agent to all our fetch calls

  Good manners, and will be useful when we start debugging/o11ying

- [#198](https://github.com/partykit/partykit/pull/198) [`fd49ef8`](https://github.com/partykit/partykit/commit/fd49ef8a90c6bb98abb0cbeb38159905175c8159) Thanks [@threepointone](https://github.com/threepointone)! - cache `parties` object arter creating it

  Let's not create the `parties` object on every request/connection, and instead cache it after first creating it.

- [#25](https://github.com/partykit/partykit/pull/25) [`31c95a7`](https://github.com/partykit/partykit/commit/31c95a74272d525790149ae5e7257dffcdba0a41) Thanks [@threepointone](https://github.com/threepointone)! - s/unstable_onValidate/onBeforeConnect

  This changes the behaviour of unstable_onValidate. Instead of return a boolean, this function now expects an error to be thrown if it's an invalid connection. Further, you can now return a json-serialisable object that gets passed on to onConnect (currently inside room.connections.<id>.unstable_initial, but we'll expose it on the connection soon.). This is particularly cool because onBeforeConnect will usually be run on a different machine from onConnect, but you'll still be able to pass data like session info etc on to onConnect.

  misc: remove `serve`, fix builds.

- [#168](https://github.com/partykit/partykit/pull/168) [`59218ee`](https://github.com/partykit/partykit/commit/59218eef2453080bdbead4d3fbdb702bdb4a3634) Thanks [@threepointone](https://github.com/threepointone)! - feat: persist state locally in dev

  Currently, `.storage` is only held in memory. This is fine for most usecases, but it means if you shutdown the dev process, we lose any state you may have been holding. This PR adds a config/flag `persist` to store this locally. We also turn it on by default. You can pass `--persist false` in the cli, or `persist: false` in config to turn it off (or `true` for default path). You can also pass `--persist some/custom/path` in the cli, or `persist: "some/custom/path" in the config, to use a custom path for the state.

  Fixes https://github.com/partykit/partykit/issues/161

- [#111](https://github.com/partykit/partykit/pull/111) [`4a808d5`](https://github.com/partykit/partykit/commit/4a808d5a3bec707c5e370df764a574e3905bf43d) Thanks [@mellson](https://github.com/mellson)! - Ensure that commander expects port to be a number.

- [#290](https://github.com/partykit/partykit/pull/290) [`e4fb27a`](https://github.com/partykit/partykit/commit/e4fb27acd6c5a99aa771eb713dbbc465ba5e7085) Thanks [@threepointone](https://github.com/threepointone)! - fix: actually fix the listeners/crash scenario

  Ok I figured it out. We were adding listeners to the inspector websocket server. I also found some stray listeners we weren't cleaning up. I also removed the debouncing setup for the assets server. This is looking a lot better now.

- [#212](https://github.com/partykit/partykit/pull/212) [`0bca793`](https://github.com/partykit/partykit/commit/0bca7935e2a68f2724a8bc3ad5ed9bca4ca34681) Thanks [@threepointone](https://github.com/threepointone)! - add update-notifier again

  This time it's integrated into the banner, so it's not as intrusive. It'll show up all the time in dev, but rarely in prod builds, so it's not annoying either.

- [#144](https://github.com/partykit/partykit/pull/144) [`314e7ce`](https://github.com/partykit/partykit/commit/314e7ce411874e3fb51f4ef97fc0159132e7307d) Thanks [@threepointone](https://github.com/threepointone)! - add ctx to onBefore\* fns

  importantly, this lets you call `ctx.waitUntil(promise)` in the `onBefore` fns.

- [#129](https://github.com/partykit/partykit/pull/129) [`a4a8568`](https://github.com/partykit/partykit/commit/a4a8568a4f6dab464ab5ba3342dd9cefca1357f7) Thanks [@threepointone](https://github.com/threepointone)! - fix: extract room id correctly

  For `onRequest`, we were just using the part of the url after `/party` as the room id, which isn't true when we have query params. This quickly fixes that. Thanks @mellson for the catch.

- [#275](https://github.com/partykit/partykit/pull/275) [`0261a76`](https://github.com/partykit/partykit/commit/0261a7604a101b26741260e1d252d3291e16f5d8) Thanks [@threepointone](https://github.com/threepointone)! - implement single page mode

  setting `singlePageApp: true` in `partykit.json#serve` enables, well, single page app mode.

- [#244](https://github.com/partykit/partykit/pull/244) [`f25c3f3`](https://github.com/partykit/partykit/commit/f25c3f34f93463f3a0d5c9e47b5737df5904a614) Thanks [@threepointone](https://github.com/threepointone)! - feat: a better assets dev/deploy story

  This enhances the static assets story, with features and utility:

  - First, we remove `sirv`/`polka`, and use esbuild's server to serve assets in dev, since we already have it.
  - We then introduce a config for actually building static assets. It's a tiny subset of esbuild's configuration; it takes (all fields optional):
    - entry: a path to an entry, or an array of paths, or even no entry at all (and simply serve the assets folder)
    - bundle: whether to bundle dependencies (default true)
    - outdir: where to put the output (default assets dir + '/dist')
    - minify: whether to minify (default false in dev, true for deploy)
    - splitting: whether to split up lazy import (default true)
    - format: one of `esm | cjs | iife` (default esm)
    - sourcemap: default true
    - define: expressions to substitute in the source; it merges the top level `define` here coneveniently, which means you can also pass it as a cli arg (`--define key:value`)
    - loader: corresponding to esbuild's loader args

  Lovely. the config can also be a plain string, which it's use as the entry point instead.

  I updated all the examples to use this new config, it drastically simplifies (imo) the boilerplate to get started.

- [#286](https://github.com/partykit/partykit/pull/286) [`8b345ab`](https://github.com/partykit/partykit/commit/8b345ab6bc76ec39f02284e9cdafb6f9b8dddf1e) Thanks [@threepointone](https://github.com/threepointone)! - export lobby types

- [`710460a`](https://github.com/partykit/partykit/commit/710460a551075b79f9b0460cb1de680cdc6558f0) Thanks [@threepointone](https://github.com/threepointone)! - remove update-notifier for now

- [#234](https://github.com/partykit/partykit/pull/234) [`2d5311b`](https://github.com/partykit/partykit/commit/2d5311bab76fef92a87baf94a2f8b7ea9675f73f) Thanks [@threepointone](https://github.com/threepointone)! - delay login browser popup for 5 seconds

  When we're logging in, we open up a browser for a user to paste a code into github. We currently open it immediately, so users aren't sure what's happening. This PR adds a delay for a few seconds, with clearer instructions on what's happening.

- [#141](https://github.com/partykit/partykit/pull/141) [`f1dd644`](https://github.com/partykit/partykit/commit/f1dd6441c235fcd3995f538c9d7222ee7dfa056f) Thanks [@threepointone](https://github.com/threepointone)! - introduce ink

  This uses [ink](https://github.com/vadimdemedes/ink) to render a couple of commands (login, logout). Introducing this in a small PR since it requires some changes to how we build stuff. Unfortunately this means we're not bundling packages into the package anymore, but we'll revisit that later. After this, we'll rewrite dev to use ink as well.

- [#229](https://github.com/partykit/partykit/pull/229) [`d2e26a4`](https://github.com/partykit/partykit/commit/d2e26a46ddbaad0c5605b27f5d154036ff2f7e3a) Thanks [@threepointone](https://github.com/threepointone)! - feat: serve `config.assets` / `--assets`

  This PR adds support for deploying static assets.

  - You can configure `config.assets` or `--assets` to point to a directory of static assets
  - You can also configure `config.assets` to `{ path, browserTTL, edgeTTL, include, exclude, serveSinglePageApp }`
  - In dev, it serves these assets "locally"
  - It can deploy these assets to PartyKit and serve them from the edge

- [`f26bb08`](https://github.com/partykit/partykit/commit/f26bb08b99b8d9a94d0eedb06cca70fca9833f93) Thanks [@threepointone](https://github.com/threepointone)! - fix: import from `partykit/server` when moduleResolution: "nodenext"

  fixes https://github.com/partykit/partykit/issues/167

- [#216](https://github.com/partykit/partykit/pull/216) [`ac6e892`](https://github.com/partykit/partykit/commit/ac6e892bcf7e7594cc2ebe66fc5777a2fc206cb6) Thanks [@threepointone](https://github.com/threepointone)! - feat: pass `--compatibility-date` `--compatibility-flags` via CLI for `dev`/`deploy`

- [#269](https://github.com/partykit/partykit/pull/269) [`2af99fd`](https://github.com/partykit/partykit/commit/2af99fde1fbcd1083221fc9583fd48f4c4993662) Thanks [@threepointone](https://github.com/threepointone)! - fix: type signatures on `onBeforeRequest`/`onBeforeConnect`

  The types on `onBeforeRequest`/`onBeforeConnect` were causing errors, this should fix 'em

- [#122](https://github.com/partykit/partykit/pull/122) [`5620808`](https://github.com/partykit/partykit/commit/5620808e3fae25dae6da811248e0ada57e6f6d8c) Thanks [@threepointone](https://github.com/threepointone)! - fix: in dev, close the socket with a 1011 when starting error

- [#195](https://github.com/partykit/partykit/pull/195) [`839ebff`](https://github.com/partykit/partykit/commit/839ebff46d6c08ae4ab5d988549959d3d9caca15) Thanks [@threepointone](https://github.com/threepointone)! - partykit: remove unused packages. move dev only deps to devDependencies

  Also added a banner for all commands. Because why not.

- [#26](https://github.com/partykit/partykit/pull/26) [`5eb8f9d`](https://github.com/partykit/partykit/commit/5eb8f9deffaef138dfad8bb37079c95984306128) Thanks [@threepointone](https://github.com/threepointone)! - feat: persistence / storage (phase 1)

  This implements persistence / storage for partykit. It hijack's cloudflare's DO storage api (without config options). This doesn't implement DO's i/o gates yet, but that's kinda fine, because it means you have to write code that's good in dev (but production will automatically be better). We'll implement them later. Also this currently does in-memory storage. We'll fix that in the future by (optionally) using disk for persistence.

- [#84](https://github.com/partykit/partykit/pull/84) [`c138aa2`](https://github.com/partykit/partykit/commit/c138aa283a26ea1144f771bf8822675777398f8e) Thanks [@threepointone](https://github.com/threepointone)! - read configuration from package.json#partykit

- [#132](https://github.com/partykit/partykit/pull/132) [`206315d`](https://github.com/partykit/partykit/commit/206315df5193c2313520c953bb2336f6032f7909) Thanks [@threepointone](https://github.com/threepointone)! - connection ids aren't mandatory anymore

- [`2d08282`](https://github.com/partykit/partykit/commit/2d082829eeb9a7e8d87e7c88069753336447a609) Thanks [@threepointone](https://github.com/threepointone)! - show banner for `npx partykit env`

- [`e5832a0`](https://github.com/partykit/partykit/commit/e5832a05665485d98005cb0a1ecbf2940cd7640b) Thanks [@threepointone](https://github.com/threepointone)! - export "server" type definition

- [#57](https://github.com/partykit/partykit/pull/57) [`9cd9b8d`](https://github.com/partykit/partykit/commit/9cd9b8d10f72353d550301224dfbb71720d291d9) Thanks [@threepointone](https://github.com/threepointone)! - feat: wasm modules

  This adds support for importing and using .wasm modules. It requires a ?module prefix, ala vercel. Gives a compiled. WebAssembly.Module instance.

- [#214](https://github.com/partykit/partykit/pull/214) [`0e56c2e`](https://github.com/partykit/partykit/commit/0e56c2e7db4ea4afb2ac0bd2eb74b88acd1a3951) Thanks [@threepointone](https://github.com/threepointone)! - feat: better errors/warnings

  Copied some code from wrangler for better looking errors/warnings. This also enables sourcemaps only in dev.

- [#34](https://github.com/partykit/partykit/pull/34) [`0fdf7a3`](https://github.com/partykit/partykit/commit/0fdf7a30f5112dfce21d105921674ddff57a1596) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: remove vendored libs

  We'd previously vendored the libs used by y-partykit (yjs, lib0, etc) to workaround a bug in edge-runtime https://github.com/vercel/edge-runtime/issues/243, but it makes using other libs that include those libs difficult. So instead this patch removes the vendoring, and applies the other workaround (which is to set `minify:true`). The tradeoff for this workaround is that any "dev mode" code (i.e. code wrapped with `if (process.env.NODE_ENV !== 'production')`) will be removed. This is temporary and we'll remove it once the bug is fixed by edge-runtime.

- [#15](https://github.com/partykit/partykit/pull/15) [`d2959d5`](https://github.com/partykit/partykit/commit/d2959d54031ae766f1af4d79724f085f5edca82b) Thanks [@threepointone](https://github.com/threepointone)! - integrate `dotenv`, expose `.env` in local dev on `room`

- [#205](https://github.com/partykit/partykit/pull/205) [`8eec1a6`](https://github.com/partykit/partykit/commit/8eec1a618aaf6ee6ce38ff072530e3e7cbb6ea36) Thanks [@threepointone](https://github.com/threepointone)! - fix: choose a recent compatibility date for dev

- [#140](https://github.com/partykit/partykit/pull/140) [`6ce60e2`](https://github.com/partykit/partykit/commit/6ce60e2db27c5f032ebd710c40d8005b1d086fb5) Thanks [@threepointone](https://github.com/threepointone)! - local dev assets + custom builds

  - This adds support for serving static assets (in dev only). This makes onboarding a little simpler; starting a new project doesn't require (too much) extra tooling. It's fairly simple, you make a field called `assets` in `partykit.json`, or pass it via cli with `--assets <path>`. In the future we _may_ also deploy these assets to partykit directly, we'll see.
  - This also adds support for custom build commands. You may be using some other compile-to-js language, or need to run some codegen, or even compile your client side app; you can now define a command that runs. It looks like this (all fields are optional):

  ```js
  build: {
    command: "...", // the command to run
    cwd: "...", // the directory to run it "in",
    watch: "..." // the directory to "watch" for changes
  }
  ```

- [#218](https://github.com/partykit/partykit/pull/218) [`ffd3434`](https://github.com/partykit/partykit/commit/ffd3434009c2da6059dd111dfa6393d11cee3c3f) Thanks [@threepointone](https://github.com/threepointone)! - fix: better messages for env commands

  This adds better messages for env commands. We were previously just spitting out some json, this cleans it up.

- [#56](https://github.com/partykit/partykit/pull/56) [`a0d1bbd`](https://github.com/partykit/partykit/commit/a0d1bbdfd1275d6c496219c809cdfe01912683f8) Thanks [@threepointone](https://github.com/threepointone)! - feat: read env vars from command line

  We hadn't implemented actually taking input for env vars from the command line, this patch fixes that. You can either type/copy paste a value, or pipe it in from a file.

- [#211](https://github.com/partykit/partykit/pull/211) [`fffe721`](https://github.com/partykit/partykit/commit/fffe72148e5cc425e80c90b6bf180192df410080) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

- [#5](https://github.com/partykit/partykit/pull/5) [`e4b721f`](https://github.com/partykit/partykit/commit/e4b721f3f36973dcfe27ea1dc7ea8e8d8b271936) Thanks [@threepointone](https://github.com/threepointone)! - queryparams for client, onConnect in server

  client: `new PartySocket` now accepts `query: {...}` that gets encoded as query params in the url when connecting.

  server: `export onConnect(){...}` to better reflect what's happening (and opening the door to other descriptive exports, like onAuth, etc)

- [#157](https://github.com/partykit/partykit/pull/157) [`6927442`](https://github.com/partykit/partykit/commit/6927442ab4accefbed89c7a0f34098c3863d43c2) Thanks [@threepointone](https://github.com/threepointone)! - feat: optional hibernation api

  This introduces cloudflare's new hibernation api for durable objects. (see https://developers.cloudflare.com/workers/runtime-apis/durable-objects/#hahahugoshortcode-s2-hbhb)
  It kicks in when you specify `onMessage(){}` in the export. This should let us scale to thousands of connections on a single object, while also not charging for idle objects. Very nice.

- [#291](https://github.com/partykit/partykit/pull/291) [`fa8d73a`](https://github.com/partykit/partykit/commit/fa8d73a3ceced7f9fcc55a4c2fa0061c3ea477b4) Thanks [@threepointone](https://github.com/threepointone)! - feat: add hot keys to open a browser, clear console, exit

  Stealing this idea from wrangler: this adds a floating bar with hotkeys to open a browser, clear the console, or simply exit the process.

- [#147](https://github.com/partykit/partykit/pull/147) [`e7aa4cd`](https://github.com/partykit/partykit/commit/e7aa4cdd104cbcd694839984f2fe8ab7a89f7048) Thanks [@threepointone](https://github.com/threepointone)! - feat: refactor PartyKitConnection / PartyKitRoom

  This adds a couple of APIs based on common usage patterns:

  - `room.broadcast(message, without)` lets you broadcast a message to all connections to a room, optionally excluding an array of connection IDs
  - the "socket" now includes `.id`

  This shouldn't break any code, so I'm comfortable landing it.

- [#179](https://github.com/partykit/partykit/pull/179) [`e49223f`](https://github.com/partykit/partykit/commit/e49223f51b1d93656ec11e52bc0b38bde70d094f) Thanks [@jevakallio](https://github.com/jevakallio)! - Fix Response types for `onBeforeRequest` and `onRequest` callbacks.

  When you respond from `onBeforeRequest` or `onRequest`, you have to construct a new response using the `new Response()`.

  Unless you've overridden the global `Response` type to refer to `"@cloudflare/workers-types"`, the type is assumed a [Fetch API Response](https://developer.mozilla.org/en-US/docs/Web/API/Response). This is a pain in the ass, especially if you have your PartyKit server code as part of your frontend project.

  Because the actual return value will be an instance of whatever Response class is defined in the environment, the type does not matter to us, so let's just allow the user to return either type.

- [#252](https://github.com/partykit/partykit/pull/252) [`6534490`](https://github.com/partykit/partykit/commit/6534490308c85c605fca1c1d45721df5f372f72d) Thanks [@threepointone](https://github.com/threepointone)! - init: add a default favico, styles.css

- [#280](https://github.com/partykit/partykit/pull/280) [`3228764`](https://github.com/partykit/partykit/commit/322876447ffb5b4219daf95b6aee9932d4b140a4) Thanks [@jevakallio](https://github.com/jevakallio)! - Separate modes for local dev against local dev vs production

- [#66](https://github.com/partykit/partykit/pull/66) [`9044fb4`](https://github.com/partykit/partykit/commit/9044fb4504ae0add9a5d48ae256662b88528f1d9) Thanks [@jevakallio](https://github.com/jevakallio)! - Add room-like parameter to onBeforeConnect/onBeforeRequest

- [#151](https://github.com/partykit/partykit/pull/151) [`3f260d6`](https://github.com/partykit/partykit/commit/3f260d67688d66b2d9f845c160551781760426e8) Thanks [@"user.ts",](https://github.com/"user.ts",)! - feat: multiparty support

  Not all architectures can be represented with a single 'type' of entity. The interesting ones have multiple types of entities, interconnected by business logic. For example, you could model a chat system with a chatroom entity, a user entity, and a rate limiter entity.

  This patch introduces "multiparty" support. You can define multiple modules with the same `PartyKitServer` interface in different modules, and configure them in `partykit.json`, like so:

  ```json
  main: "./src/main.ts" // your "main" entity, usually performing supervisory work
  parties: {
    chatroom: "chatroom.ts",

    limiter: "rate-limiter.ts"
  }
  // ...
  ```

  You can then reference these entities via `room.parties.<user/chatroom/limiter>.get('some-id')` and then make an http request to it with `.fetch(req)` or open a WebSocket to it with `.connect()`.

  This needs more examples and documentation (and potentially iterating on the api), but let's land it to experiment with the model a little.

- [#127](https://github.com/partykit/partykit/pull/127) [`1d7d600`](https://github.com/partykit/partykit/commit/1d7d6005a26fc1aafab55897d700d30b74c41248) Thanks [@mellson](https://github.com/mellson)! - Add preview to deployed URL output.

- [#271](https://github.com/partykit/partykit/pull/271) [`4624a2d`](https://github.com/partykit/partykit/commit/4624a2ded3161d46f0c8bac8b7b029fba1a8583d) Thanks [@threepointone](https://github.com/threepointone)! - fix: wasm modules

  Looks like importing wasm modules was broken, this should fix it

- [#260](https://github.com/partykit/partykit/pull/260) [`f4add35`](https://github.com/partykit/partykit/commit/f4add35cbc1d750e841d9ada56e6edff3daae1ce) Thanks [@threepointone](https://github.com/threepointone)! - create-partykit: move implementation from `partykit init`

- [#178](https://github.com/partykit/partykit/pull/178) [`deaa474`](https://github.com/partykit/partykit/commit/deaa4740100f62bce4ee3fad1bb15f87e612d66a) Thanks [@threepointone](https://github.com/threepointone)! - remove `unstable_initial`, and `onBeforeConnect` can now return a `Request`/`Response`

  We were using `unstable_initial` to pass info between `onBeforeConnect` and `onConnect`. But it just felt so alien. Now that onConnect also receives request (via https://github.com/partykit/partykit/pull/166), let's just let onBeforeConnect return a Request or a Response. If a Request, it gets passed on to onConnect. Else, it just returns.

  This is a breaking change, but it's a minor one, and it's worth it to get rid of `unstable_initial`.

- [#230](https://github.com/partykit/partykit/pull/230) [`278833e`](https://github.com/partykit/partykit/commit/278833e0539c24623913151b882c7f75107f9d62) Thanks [@threepointone](https://github.com/threepointone)! - don't minify code in dev

  This a remnant from our previous arch, we don't need this anymore. (and it's getting overwritten anyway, so it's not functional)

- [#217](https://github.com/partykit/partykit/pull/217) [`04e5bed`](https://github.com/partykit/partykit/commit/04e5bed2502073059dccc0b93cc4896e87df219d) Thanks [@threepointone](https://github.com/threepointone)! - feat: add `--minify` and `whoami`

  - This adds a `--minify` / `config.minify` flag for both `dev` and `deploy` commands.
  - This also adds a `partykit whoami` command

- [#190](https://github.com/partykit/partykit/pull/190) [`cc7d994`](https://github.com/partykit/partykit/commit/cc7d9944d71a3806ec38edf73b5018fd4eeac01b) Thanks [@jevakallio](https://github.com/jevakallio)! - Clean up hibernatable connection before invoking event handler

- [#152](https://github.com/partykit/partykit/pull/152) [`a12b450`](https://github.com/partykit/partykit/commit/a12b450922993afaa632a2212d24382b998b0085) Thanks [@threepointone](https://github.com/threepointone)! - fix: dev on windows doesn't resolve correctly

  fixes https://github.com/partykit/partykit/issues/150

- [#3](https://github.com/partykit/partykit/pull/3) [`7cd9edc`](https://github.com/partykit/partykit/commit/7cd9edc6d864de4266342774dffd0635515fa2bb) Thanks [@threepointone](https://github.com/threepointone)! - `partykit list`

  very simply, lists all deployed parties.

- [#272](https://github.com/partykit/partykit/pull/272) [`9d532f8`](https://github.com/partykit/partykit/commit/9d532f8bc030a303ffe1bc236d80a37f0351aade) Thanks [@threepointone](https://github.com/threepointone)! - fix: only fetch static assets for get/head methods

- [#240](https://github.com/partykit/partykit/pull/240) [`77b897c`](https://github.com/partykit/partykit/commit/77b897c927de1116622f5b628b1658b4f21186cd) Thanks [@threepointone](https://github.com/threepointone)! - default to hibernation mode when `onConnect` isn't defined

- [`ee72c1f`](https://github.com/partykit/partykit/commit/ee72c1f4d20189e6e9377845cf36ad40b4f415cf) Thanks [@threepointone](https://github.com/threepointone)! - configure bundledDependencies

- [#206](https://github.com/partykit/partykit/pull/206) [`f11c487`](https://github.com/partykit/partykit/commit/f11c487baadc57ffe299c2e73b21da61057c0233) Thanks [@threepointone](https://github.com/threepointone)! - feat: use compatibilityDate/compatibilityFlags if available

  This lets you pass a compatibility date and/or flags when uploading a worker. See https://developers.cloudflare.com/workers/configuration/compatibility-dates for more info.

- [#292](https://github.com/partykit/partykit/pull/292) [`8cbd4ee`](https://github.com/partykit/partykit/commit/8cbd4eedb2ef7f7332f145842e8c7590e33bf93b) Thanks [@threepointone](https://github.com/threepointone)! - fix: show hot keys only when possible

- [#14](https://github.com/partykit/partykit/pull/14) [`b97b75b`](https://github.com/partykit/partykit/commit/b97b75b7bc4394befa2b6fb79df06b2c1c58c347) Thanks [@threepointone](https://github.com/threepointone)! - feat: pass room to onConnect handler

- [#108](https://github.com/partykit/partykit/pull/108) [`9e8a062`](https://github.com/partykit/partykit/commit/9e8a0621b969c74082399b97e49c435ad1463370) Thanks [@threepointone](https://github.com/threepointone)! - deploy --with-vars, and fixes for env commands

  - running `deploy --with-vars` now reads values from config files
  - `env pull` now writes to `partykit.json`
  - env commands don't fail if a `main` isn't specified

- [#103](https://github.com/partykit/partykit/pull/103) [`90ca2e1`](https://github.com/partykit/partykit/commit/90ca2e143a8207435212194a259033c38b301f2b) Thanks [@threepointone](https://github.com/threepointone)! - fix: pass --var values to deploy

- [#80](https://github.com/partykit/partykit/pull/80) [`232340d`](https://github.com/partykit/partykit/commit/232340dec8398ca5cd936332990bd0e05e5e000c) Thanks [@threepointone](https://github.com/threepointone)! - feat: configuration file / flags

  This adds a configuration file for partykit projects. It looks for partykit.json by default, but you can pass -c / --config to a custom path if you'd like. Fields:
  name: corresponds to project name
  main: corresponds to path to script
  port: local dev port number
  vars: a bag of key values, where values can be any serialisable object. this can be overriden by .env files, or --var X=A flags
  define: a bag of key values, where values can be strings representing js expressions.

  This PR also refactors the user login/config logic, but shouldn't have broken anything.

  This also adds a `env push` command to upload a bunch of env vars at one, collecting values partykit.json and .env

- [#237](https://github.com/partykit/partykit/pull/237) [`77b8ca3`](https://github.com/partykit/partykit/commit/77b8ca36c3882b73aa6cf4e6f163adeb2d5ff18a) Thanks [@threepointone](https://github.com/threepointone)! - add a verbose mode for debugging dev

- [#225](https://github.com/partykit/partykit/pull/225) [`e1bebe6`](https://github.com/partykit/partykit/commit/e1bebe63e99de644e9189f7dc2e05836095c6060) Thanks [@threepointone](https://github.com/threepointone)! - fix: don't forward request to room without an `onRequest` handler

- [#112](https://github.com/partykit/partykit/pull/112) [`5aaa7be`](https://github.com/partykit/partykit/commit/5aaa7be04ea589816ee1feee91cab9ebf454cb55) Thanks [@mellson](https://github.com/mellson)! - Read port number from config file.

- [#121](https://github.com/partykit/partykit/pull/121) [`d338a56`](https://github.com/partykit/partykit/commit/d338a56161f91c3d54cad8b65462a4409b2f3131) Thanks [@threepointone](https://github.com/threepointone)! - fix: don't validate user tokens

  This comments out `validateUserConfig`. We already had a bug where we weren't using it, but it's actually not that useful since we validate on the server anyway. So this patch comments out the implementation and usage.

- [#279](https://github.com/partykit/partykit/pull/279) [`55444c1`](https://github.com/partykit/partykit/commit/55444c14adb71f7ea48af2398ccaf10952c9401c) Thanks [@threepointone](https://github.com/threepointone)! - create: don't initialise git repo inside another

  When we create a project, we shouldn't try to create a git repo if we're initialising inside another git repo (like a monorepo). This PR detects whether there's a git folder and skips the git repo creation part.

  Additionally:

  - we switch away from `find-config` to `find-up` everywhere, since it works on both files and directories
  - I also took the opportunity to enable `verbatimModuleSyntax` in our tsconfig, which makes vscode import types correctly when we auto-import

- [#6](https://github.com/partykit/partykit/pull/6) [`b04abec`](https://github.com/partykit/partykit/commit/b04abec06ed844ca2bc457318b1ef6ccf14a0009) Thanks [@threepointone](https://github.com/threepointone)! - lint for no-floating-promises and consistent-type-imports

  enables some more linting rules (and immediately caught some errors). also fixes caching rules for actions.

- [#138](https://github.com/partykit/partykit/pull/138) [`4d484bc`](https://github.com/partykit/partykit/commit/4d484bc418868928e392cfd4efa5373c56fd5242) Thanks [@threepointone](https://github.com/threepointone)! - Allow deploys by users with capitals in username

  This required a fix on the platform side, which I've deployed. It also required a cosmetic fix in the cli, which this patch does.

  Fix https://github.com/partykit/partykit/issues/137

- [#264](https://github.com/partykit/partykit/pull/264) [`2293ed5`](https://github.com/partykit/partykit/commit/2293ed559f8661b9573f9593eec88542a6aa354f) Thanks [@threepointone](https://github.com/threepointone)! - log a message when it's first publish

- [#222](https://github.com/partykit/partykit/pull/222) [`25be6e8`](https://github.com/partykit/partykit/commit/25be6e8882d3776b7bbcfa4a59e144599ea1a4af) Thanks [@threepointone](https://github.com/threepointone)! - disable inspector for tests

  The server we spin up makes our tests flaky. we don't have tests for dev logs anyway right now, so let's disable them.

- [#166](https://github.com/partykit/partykit/pull/166) [`2f3676c`](https://github.com/partykit/partykit/commit/2f3676c37122b6ae82e816fab2821d7a25d674ae) Thanks [@threepointone](https://github.com/threepointone)! - feat: add `ctx` to `onConnect`

  ## `onConnect(connection, room, context){}`

  Developers want access to additional metadata available on every connection. For example, to implement a rate limiter, they need access to the IP address of the client. They may want access to the user agent, some cookie values, or any of the special `cf` properties like geo information, etc. Most of this information is available on the request object when the connection is made, but we don't actually expose that to the developer right now. I propose we do that.

  We can expose a third parameter to the `onConnect` method that is the `context` object. For now it'll just be an onject with a single property `request` that is the request object. In the future we can add more properties to this object.

  ```js
  onConnect(connection, room, context) {
    const { request } = context;
    const { headers } = request;
    const ip = headers['x-forwarded-for'];
    // do something with the ip
  }
  ```

  Now, the hibernation api variant doesn't include `onConnect` at all. So, we'll need to add that to the hibernation api. So, I also propose that we let folks add an optional `onConnect` method when defining a party. Calling `connection.addEventListener` with that variant will silently do nothing, but maybe we could override that to throw an error instead. Importantly, folks should be able to call `.serializeAttachment` in the `onConnect` method, and recover that data in the `onMessage` method.

  ```js
  export default {
    onConnect(connection, room, context) {
      const { request } = context;
      const { headers } = request;
      const ip = headers["x-forwarded-for"];
      connection.serializeAttachment({ ip });
      // do something with the ip
    },
    onMessage(message, connection, room) {
      const { ip } = connection.deserializeAttachment();
      // do something with the ip
    },
  };
  ```

  This PR adds the context object to `onConnect`. After we land the hibernation api, we can do the additional work mentioned.

- [#209](https://github.com/partykit/partykit/pull/209) [`a6b8b46`](https://github.com/partykit/partykit/commit/a6b8b46acae7c28543b865a49c2762fe5c604a4c) Thanks [@threepointone](https://github.com/threepointone)! - update miniflare/workers-types

- [#4](https://github.com/partykit/partykit/pull/4) [`d2c5c51`](https://github.com/partykit/partykit/commit/d2c5c51efce46cafe69de77488dd9e79cc494b7f) Thanks [@threepointone](https://github.com/threepointone)! - fix exports/typings

  This patch fixes how we generate types (by actually doing so), configuring exports in package.json, and making sure it points to the right thing. I had to write a script that moves the generated types to the root for... javascript reasons ™ but at least it works now. good enough.

- [#11](https://github.com/partykit/partykit/pull/11) [`b1e47ae`](https://github.com/partykit/partykit/commit/b1e47ae6fe6459bf77dc46cda64bbb931168e76f) Thanks [@threepointone](https://github.com/threepointone)! - add `unstable_onValidate`

  This adds `unstable_onValidate` to server's default export, alongside onConnect. Users are expected to implement this and return a boolean, that will reject the connection when false.

- [#250](https://github.com/partykit/partykit/pull/250) [`f579143`](https://github.com/partykit/partykit/commit/f5791437ee358834f5085790dc94386e8ce90ceb) Thanks [@threepointone](https://github.com/threepointone)! - apply cli args correctly

  we weren't applying overrides to config via the cli (eg --name xyz, when config.name was already defined). This fixes the logic.

- [#202](https://github.com/partykit/partykit/pull/202) [`437458b`](https://github.com/partykit/partykit/commit/437458bd9b9c1024ecf35082722a6ac5d732816c) Thanks [@threepointone](https://github.com/threepointone)! - cache hydrated connections

  When using hibernation, we should cache initialised connections, or else we end up doing it for every message, which seems wasteful.

- [#30](https://github.com/partykit/partykit/pull/30) [`323fce1`](https://github.com/partykit/partykit/commit/323fce1ef57981922eb52126bddb425da90801e5) Thanks [@threepointone](https://github.com/threepointone)! - chore: update esbuild, edge-runtime, and co.

  of note, esbuild had breaking changes, had to rewrite the rebuild logic.

- [#12](https://github.com/partykit/partykit/pull/12) [`115c094`](https://github.com/partykit/partykit/commit/115c09428237b00d4aeade7f35747756b8b1cbc7) Thanks [@threepointone](https://github.com/threepointone)! - rename publish -> deploy

- [#187](https://github.com/partykit/partykit/pull/187) [`450e139`](https://github.com/partykit/partykit/commit/450e139038f79a7c44a976f069b80ef0e826c6d4) Thanks [@threepointone](https://github.com/threepointone)! - allow using `onConnect` with `onMessage`

  We now allow using `onConnect` with `onMessage`. This lets you get access to the context `{request}`. Warning: You can't use `.addEventListener` when using `onMessage`, but it currently just silently fails. We'll make this an error later.

- [#85](https://github.com/partykit/partykit/pull/85) [`8b13a3c`](https://github.com/partykit/partykit/commit/8b13a3cf5a01446466b78f6a440405995fd341b7) Thanks [@threepointone](https://github.com/threepointone)! - read from .env.local for local dev

- [#29](https://github.com/partykit/partykit/pull/29) [`05e647f`](https://github.com/partykit/partykit/commit/05e647f1044cb92bdc5d05a53feb0202691c944c) Thanks [@threepointone](https://github.com/threepointone)! - fix: add key/value size limits for storage api

  This adds checks for size of key/values for the persistence api (mirroring DO's limits). (2kb keys. 128 kb values)

- [#213](https://github.com/partykit/partykit/pull/213) [`528a117`](https://github.com/partykit/partykit/commit/528a117dcc695264f7adf3b01b146dcb6e32c7f0) Thanks [@threepointone](https://github.com/threepointone)! - feat: render list of projects in a table
