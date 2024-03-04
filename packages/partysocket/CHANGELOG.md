# partysocket

## 1.0.1

### Patch Changes

- [#837](https://github.com/partykit/partykit/pull/837) [`32f881b`](https://github.com/partykit/partykit/commit/32f881b4cdace2d4112953618ba8a93834de7274) Thanks [@threepointone](https://github.com/threepointone)! - export named PartySocket

## 1.0.0

### Major Changes

- [#822](https://github.com/partykit/partykit/pull/822) [`b799677`](https://github.com/partykit/partykit/commit/b7996770f23c84b60ef0b07c3bcb4e7aad330cc3) Thanks [@threepointone](https://github.com/threepointone)! - PartySocket v1

  PartySocket's been pretty stable, so it's time to cut a v1. We have plans for future features, but it's pretty good right now, so let's ship it.

## 0.0.25

### Patch Changes

- [#747](https://github.com/partykit/partykit/pull/747) [`24636b4`](https://github.com/partykit/partykit/commit/24636b4270e89ddda5b0afa91e010871cc3ecf50) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: `.updateProperties()` shouldn't reset `party` to `main`

## 0.0.24

### Patch Changes

- [#744](https://github.com/partykit/partykit/pull/744) [`cf944ab`](https://github.com/partykit/partykit/commit/cf944ab663476da5e9d6ea314d23fd4e966b0db8) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: debugLogger

## 0.0.23

### Patch Changes

- [#739](https://github.com/partykit/partykit/pull/739) [`297cfb1`](https://github.com/partykit/partykit/commit/297cfb13e703d5e00329b0edefb98eaf05fe67e3) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit/partysocket: default `host` to `window.location.host`

## 0.0.22

### Patch Changes

- [#737](https://github.com/partykit/partykit/pull/737) [`62c8471`](https://github.com/partykit/partykit/commit/62c8471272913fd0fba5da91466b459d0b45a64b) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: fix message types in node, give a useful error when WebSocket implementation hasn't been passed

## 0.0.21

### Patch Changes

- [#720](https://github.com/partykit/partykit/pull/720) [`11d3035`](https://github.com/partykit/partykit/commit/11d3035e5080d55da37b61902c7e2ae2c17cc3d1) Thanks [@MortalKastor](https://github.com/MortalKastor)! - chore: add metadata to `partysocket` package.json for discoverability

## 0.0.20

### Patch Changes

- [#684](https://github.com/partykit/partykit/pull/684) [`bc7cdcd`](https://github.com/partykit/partykit/commit/bc7cdcdd794bfecc0ed3ba63cbbb5e9465bce539) Thanks [@threepointone](https://github.com/threepointone)! - Use ws/http by default for ipv6 localhost

## 0.0.19

### Patch Changes

- [#683](https://github.com/partykit/partykit/pull/683) [`9927c51`](https://github.com/partykit/partykit/commit/9927c51a5c081059421a5cbf1060f6d7f81503df) Thanks [@threepointone](https://github.com/threepointone)! - partysocket/y-partykit: Use ws:/http:/ by default for all local networks

## 0.0.18

### Patch Changes

- [#636](https://github.com/partykit/partykit/pull/636) [`b190d1d`](https://github.com/partykit/partykit/commit/b190d1d52d9e6265231d904380ca0e08bba2842a) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: make a proper event/target polyfill for react native

## 0.0.17

### Patch Changes

- [#588](https://github.com/partykit/partykit/pull/588) [`1487c3c`](https://github.com/partykit/partykit/commit/1487c3c3d87d27da83a0a9eab6c20f2b02ae0286) Thanks [@ayoubqrt](https://github.com/ayoubqrt)! - Change properties of PartySocket after instantiation

## 0.0.16

### Patch Changes

- [#568](https://github.com/partykit/partykit/pull/568) [`a6bfedc`](https://github.com/partykit/partykit/commit/a6bfedc79dc21d7c701a950eb02d45c604fef8dd) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: remove room name validation

## 0.0.15

### Patch Changes

- [#558](https://github.com/partykit/partykit/pull/558) [`79dfe8f`](https://github.com/partykit/partykit/commit/79dfe8fc60e7a3c2d2c2360c666d20279d1848da) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: fix node usage

  When cloning websocket events in node, it looks like it misses the `data` field for messages. This patch adds it on to the cloned event.

- [#560](https://github.com/partykit/partykit/pull/560) [`34f5f9f`](https://github.com/partykit/partykit/commit/34f5f9f49bfa09090e9467cf84e9ee2b003b8c0d) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: fix node usage (error, closes, messages)

## 0.0.14

### Patch Changes

- [#540](https://github.com/partykit/partykit/pull/540) [`0e82337`](https://github.com/partykit/partykit/commit/0e82337bb1123637b996bf57018258ed7cbeb958) Thanks [@andrew-r-thomas](https://github.com/andrew-r-thomas)! - adding room validation to partysocket

## 0.0.13

### Patch Changes

- [#529](https://github.com/partykit/partykit/pull/529) [`1f5d5d9`](https://github.com/partykit/partykit/commit/1f5d5d9494e2b115c66deb87457e41e58807cf1e) Thanks [@jevakallio](https://github.com/jevakallio)! - Improvements to usePartySocket and useWebSocket hook reliability

## 0.0.12

### Patch Changes

- [#510](https://github.com/partykit/partykit/pull/510) [`d9e8c74`](https://github.com/partykit/partykit/commit/d9e8c7454d7447d0b41d0214efc66334624961d7) Thanks [@threepointone](https://github.com/threepointone)! - PartySocket.fetch: a fetch method with party options

  This adds `PartySocket.fetch()`, that constructs the URL with options similar to `new PartySocket()`. This makes it easier to fetch to parties without having to construct the URL yourself.

- [#508](https://github.com/partykit/partykit/pull/508) [`c64c58d`](https://github.com/partykit/partykit/commit/c64c58dc6c0c9cf1d5e31ad04820f0d983c417ed) Thanks [@kentcdodds](https://github.com/kentcdodds)! - feat: add named usePartySocket export

- [#499](https://github.com/partykit/partykit/pull/499) [`6cc9437`](https://github.com/partykit/partykit/commit/6cc9437ab83b6962cd139d4a9867ac1e1c6647c1) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: add subpath support

  This patch lets you add `path: string` to `new PartySocket({...})` and point to a subpath in a room. This is a client side analog to the recent subpath support we added to multiparty `.fetch()`/`.socket()`

## 0.0.11

### Patch Changes

- [#487](https://github.com/partykit/partykit/pull/487) [`2e802f3`](https://github.com/partykit/partykit/commit/2e802f37d8b2d4e76325c42c481ad20b70462f35) Thanks [@threepointone](https://github.com/threepointone)! - don't mark react as a dependency for partysocket

  This dependency causes way too many issues, especially since react doesn't work with multiple versions. Let's see if removing it helps.

- [#490](https://github.com/partykit/partykit/pull/490) [`96df6d9`](https://github.com/partykit/partykit/commit/96df6d9b51271445611a9cff72452f37b80da0a8) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: don't bundle react into the built assets

  tsup ignores pnly dependencies marked in package.json under dependencies/devDependencies. Since we don't have react in here, it was bundling it into partysocket/react, leading to multiple versions being loaded into the same space. This explicity excludes react from the bundle.

## 0.0.10

### Patch Changes

- [#478](https://github.com/partykit/partykit/pull/478) [`daddf12`](https://github.com/partykit/partykit/commit/daddf122d5ea32bf52a925ec2aa083cd97113773) Thanks [@marekhrabe](https://github.com/marekhrabe)! - React is no longer a direct dependency of partysocket

## 0.0.9

### Patch Changes

- [`ec13e37`](https://github.com/partykit/partykit/commit/ec13e37d16038424e70a9c49bdc0b551a510d0cf) Thanks [@jevakallio](https://github.com/jevakallio)! - Allow passing PartySocket.query as a function

## 0.0.8

### Patch Changes

- [#384](https://github.com/partykit/partykit/pull/384) [`205d4aa`](https://github.com/partykit/partykit/commit/205d4aa4dd67a16d634a5199cb27df03230f06fc) Thanks [@threepointone](https://github.com/threepointone)! - expose `partySocket.name`, and a static `.url`

  This exposes the top level party 'name' on partysocket. Since urls for partysocket are 'static' we can also override the base implementation and expose the calculated url as well.

- [#386](https://github.com/partykit/partykit/pull/386) [`f9a648e`](https://github.com/partykit/partykit/commit/f9a648e87660499786ecb6cca73bc52bc0b160bf) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: expose `socket.room` and `socket.host` on instance

## 0.0.7

### Patch Changes

- [#382](https://github.com/partykit/partykit/pull/382) [`8c0bd23`](https://github.com/partykit/partykit/commit/8c0bd236cc47220d1c7ac109ef4aba939b53f129) Thanks [@threepointone](https://github.com/threepointone)! - partysocket fix: don't crash in codesandbox

  looks like tools like stackblitz defines `process` on the fronted (???), but when we test for process.versions.node it crashes. This fixes the detection logic.

  (PartyKit doesn't work in stackblitz yet, but atleast this error shouldn't happen)

## 0.0.6

### Patch Changes

- [#321](https://github.com/partykit/partykit/pull/321) [`5e1f03d`](https://github.com/partykit/partykit/commit/5e1f03de909491755e9ea5974c80012cff64a85f) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: pass custom WebSocket constructor

  This lets you pass a custom WebSocket constructor to PartySocket / ReconnectingWebSocket. This means we can now run PartySocket from node.

  Fixes #320

## 0.0.5

### Patch Changes

- [#366](https://github.com/partykit/partykit/pull/366) [`b79f846`](https://github.com/partykit/partykit/commit/b79f84696d52d07c2b4a402dbb52ab688a17b4d7) Thanks [@threepointone](https://github.com/threepointone)! - use npm ci for CI installs

  We shouldn't use bun install until https://github.com/partykit/partykit/pull/352 lands

## 0.0.4

### Patch Changes

- [#333](https://github.com/partykit/partykit/pull/333) [`dc324d9`](https://github.com/partykit/partykit/commit/dc324d91d9521682bf8490e1fed51d5371a752df) Thanks [@threepointone](https://github.com/threepointone)! - fix: `init` doesn't install the right versions of packages

  This fix should pick up the latest versions of partykit /partysocket when installing. We were using the previous beta logic when every package was on the same version. This patch picks up the latest versions of both and uses it.

  (also sneaking in a quick types fix for usePartySocket)

- [#318](https://github.com/partykit/partykit/pull/318) [`8330c57`](https://github.com/partykit/partykit/commit/8330c5755b88a261cb141993910ce29ac9de7d89) Thanks [@sdnts](https://github.com/sdnts)! - Export `WebSocket` from `partysocket` correctly

## 0.0.3

### Patch Changes

- [#323](https://github.com/partykit/partykit/pull/323) [`2ca369a`](https://github.com/partykit/partykit/commit/2ca369aacbc5920c6e5d52c2cdd7c0aa5a49f7ba) Thanks [@threepointone](https://github.com/threepointone)! - useWebSocket

  a hook version of our reconnecting websocket

## 0.0.2

### Patch Changes

- [#251](https://github.com/partykit/partykit/pull/251) [`049bcac`](https://github.com/partykit/partykit/commit/049bcac42aa49e4bddec975c63b7d7984112e450) Thanks [@threepointone](https://github.com/threepointone)! - small tweaks to `init`

  - replace `process.env.PARTYKIT_HOST` with just `PARTYKIT_HOST`
  - add a `tsconfig.json`
  - add partykit to devDependencies in `init`
  - strip protocol from host (partysocket, y-partykit)

- [#208](https://github.com/partykit/partykit/pull/208) [`de4e507`](https://github.com/partykit/partykit/commit/de4e507cc7bcab1bd1f51b5e83b09a32578c70a3) Thanks [@jevakallio](https://github.com/jevakallio)! - Allow connecting directly to a multiparty using a `party` field on partysocket

- [#215](https://github.com/partykit/partykit/pull/215) [`cc88615`](https://github.com/partykit/partykit/commit/cc88615a750744fac151f9a0cfae5a94b0f546e2) Thanks [@threepointone](https://github.com/threepointone)! - fix: make PartySocket work inside cloudflare/partykit

  The implementation of `ReconnectingWebSocket` tests whether a WebSocket class is valid by the presence of a static field that's not available on CF's/PK's WebSocket class. It's a bit much anyway, so we just remove the test.

- [#239](https://github.com/partykit/partykit/pull/239) [`e57200d`](https://github.com/partykit/partykit/commit/e57200d8be5e148062d08041856118882ce97cfb) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: warn if EventTarget is not available

- [#71](https://github.com/partykit/partykit/pull/71) [`4273c76`](https://github.com/partykit/partykit/commit/4273c76d77157ffad4869ebaa6d08c599b833db7) Thanks [@mellson](https://github.com/mellson)! - Fix included files in published build.

- [#233](https://github.com/partykit/partykit/pull/233) [`8981945`](https://github.com/partykit/partykit/commit/8981945ae1ba3ce8eea02ecdb7192e85ea6fde3e) Thanks [@turkerdev](https://github.com/turkerdev)! - partysocket: check if crypto is defined

- [#211](https://github.com/partykit/partykit/pull/211) [`fffe721`](https://github.com/partykit/partykit/commit/fffe72148e5cc425e80c90b6bf180192df410080) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

- [#191](https://github.com/partykit/partykit/pull/191) [`39cf5ce`](https://github.com/partykit/partykit/commit/39cf5cebf5e699bc50ace8b6d25cd82c807e863a) Thanks [@jevakallio](https://github.com/jevakallio)! - Improve PartySocket types and React hooks API:

  - Add websocket lifecycle event handlers to usePartyKit options to reduce need for effects in userland
  - Allow usePartySocket to provide startClosed option to initialize without opening connection
  - Fix types for PartySocket#removeEventListener

- [#220](https://github.com/partykit/partykit/pull/220) [`e7e14a7`](https://github.com/partykit/partykit/commit/e7e14a7a10187dc946ddc5373eab6acc27c48387) Thanks [@threepointone](https://github.com/threepointone)! - expose `.id` on PartySocket

- [#21](https://github.com/partykit/partykit/pull/21) [`f01ad2b`](https://github.com/partykit/partykit/commit/f01ad2b33ff71099344b570ba49d7bf03f7c88bf) Thanks [@threepointone](https://github.com/threepointone)! - partysocket

  partysocket is a for of reconnecting-websocket (which appears to be abandoned), that adds a few missing features and fixes a few bugs.

- [#54](https://github.com/partykit/partykit/pull/54) [`244de6a`](https://github.com/partykit/partykit/commit/244de6aaa9ed2ee7770d29ffc6be51c5fb38939a) Thanks [@threepointone](https://github.com/threepointone)! - fix: don't crash in some secure contexts

  This uses a weaker implementation to generate conneciton IDs if crypto.randomUUID() isn't available in the browser (re: https://github.com/WICG/uuid/issues/23) Fixes https://github.com/partykit/partykit/issues/53

- [#69](https://github.com/partykit/partykit/pull/69) [`9c3418d`](https://github.com/partykit/partykit/commit/9c3418df3cf7173b49217145fb2c77adda4f4330) Thanks [@mellson](https://github.com/mellson)! - Makes partysocket compatible with both esm and cjs.

- [#160](https://github.com/partykit/partykit/pull/160) [`2753bc8`](https://github.com/partykit/partykit/commit/2753bc86a2dc2e4bd140bda3fab0a3d3793dc008) Thanks [@threepointone](https://github.com/threepointone)! - fix: configure `_pk` with PartySocket with `options.id`

  This adds an `id` config for `new PartySocket()` that's uses as the value of `_pk`, that becomes the connection id in the backend.

  Fixes https://github.com/partykit/partykit/issues/159

- [#183](https://github.com/partykit/partykit/pull/183) [`acca510`](https://github.com/partykit/partykit/commit/acca510babe8c1b4a463f2d85aa11f0450f0b771) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: export ReconnectingWebSocket class from root

- [#35](https://github.com/partykit/partykit/pull/35) [`7eb3b36`](https://github.com/partykit/partykit/commit/7eb3b3621027480092a927bec5b6096ba4614027) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit (feat): `onCommand` as a server configuration option

  y-partykit currently assumes all messages on the wire are yjs messages (usually all binary data), but we have usecases where we want to send arbitrary commands to the server and act on them (usually still with the context of a doc). So now y-partykit accepts a handler for all string messages that we're calling 'commands' - `onCommand(string, Y.Doc)`.

  Additionally, partysocket now also exports it's base websocket class as partysocket/ws

- [#63](https://github.com/partykit/partykit/pull/63) [`2910f99`](https://github.com/partykit/partykit/commit/2910f99154efae0a8cce003b12891b473d39f449) Thanks [@mellson](https://github.com/mellson)! - PartySocket commonjs compatibility and React hook test.
