# partysocket

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
