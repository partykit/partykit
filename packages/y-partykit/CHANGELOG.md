# y-partykit

## 0.0.3

### Patch Changes

- [#337](https://github.com/partykit/partykit/pull/337) [`5b6da7f`](https://github.com/partykit/partykit/commit/5b6da7fdb328cf53990bd65c4bb35eceb3d9913e) Thanks [@threepointone](https://github.com/threepointone)! - update y-partykit/partymix to use non-deprecated APIs

## 0.0.2

### Patch Changes

- [#324](https://github.com/partykit/partykit/pull/324) [`d470878`](https://github.com/partykit/partykit/commit/d4708786da4bf2d2edc2a27aba14586a58665400) Thanks [@threepointone](https://github.com/threepointone)! - `tsximport useYProvider from "y-partykit/react";function App() {  const provider = useYProvider({    host: "localhost:1999",    room: "my-document-name",    doc: yDoc, // optional!    options,  });}`

- [#332](https://github.com/partykit/partykit/pull/332) [`7898032`](https://github.com/partykit/partykit/commit/7898032735e9c880aa83a24df0f440bd6348de38) Thanks [@jevakallio](https://github.com/jevakallio)! - Better error messages for YPartyKitProvider

## 0.0.1

### Patch Changes

- [#251](https://github.com/partykit/partykit/pull/251) [`049bcac`](https://github.com/partykit/partykit/commit/049bcac42aa49e4bddec975c63b7d7984112e450) Thanks [@threepointone](https://github.com/threepointone)! - small tweaks to `init`

  - replace `process.env.PARTYKIT_HOST` with just `PARTYKIT_HOST`
  - add a `tsconfig.json`
  - add partykit to devDependencies in `init`
  - strip protocol from host (partysocket, y-partykit)

- [#27](https://github.com/partykit/partykit/pull/27) [`1f384a0`](https://github.com/partykit/partykit/commit/1f384a02d70ad4c6a632c4478371f3f8e6182c27) Thanks [@threepointone](https://github.com/threepointone)! - feat: y-partykit persistence support

  This adds persistence support for y-partykit (based on the work at y-workers). It... just works haha. Pass `persist:true` to `onConnect` to store it. This still bumps into DO's 128 kb limit, but we'll fix that asap.

- [#62](https://github.com/partykit/partykit/pull/62) [`1410f06`](https://github.com/partykit/partykit/commit/1410f06371589e6fa28ee9291a33476fcb682c3a) Thanks [@mellson](https://github.com/mellson)! - Node 16 compatibility.

- [#18](https://github.com/partykit/partykit/pull/18) [`f255e12`](https://github.com/partykit/partykit/commit/f255e1268e9e36d16855bb7388664219c4fdfd0e) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: callback/persistence configuration

  This patch now properly forks y-websocket, and beings in functionality for passing configuration for callbacks/persistence (that was previously using process.env vars). We also fix builds/type generation for the package.

- [#17](https://github.com/partykit/partykit/pull/17) [`bf2e66f`](https://github.com/partykit/partykit/commit/bf2e66fc07dd749b502343c601eef55ceb5d56de) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: fix builds, usage

  This patch fixes y-partykit so it can actually be published and used in the platform.

- [#228](https://github.com/partykit/partykit/pull/228) [`1d259bc`](https://github.com/partykit/partykit/commit/1d259bca44860c98e7e6208d2fa448c5b33d725b) Thanks [@threepointone](https://github.com/threepointone)! - fix: properly sort chunking in y-partykit for big values

  So, out persistence layer has a 128kb limit on values, but `y-partykit` should/could be used for documents bigger than that. So we implemented a chunking strategy that break up values across multiple keys. When making keys for these, we didn't pad the generated indexes, which meant that for sufficiently large values, we might have assembled them back in the wrong order (because lexicographical sorting). This is a fix for that. It's a breaking change, but oddly I haven't heard from people who've faced the problem at all.

- [#28](https://github.com/partykit/partykit/pull/28) [`f42b1e0`](https://github.com/partykit/partykit/commit/f42b1e080d21f5f1eddfdf71c33b9a752c5cbace) Thanks [@threepointone](https://github.com/threepointone)! - better types for storage keys in y-partykit

- [#59](https://github.com/partykit/partykit/pull/59) [`5edde06`](https://github.com/partykit/partykit/commit/5edde069a2b1358631f4094bdb664f6a9ae41612) Thanks [@threepointone](https://github.com/threepointone)! - remove y-partykit's onCommand config

  now that we have onRequest, we don't need to set up a command channel within y-partykit itself, so let's remove the code for it.

- [#192](https://github.com/partykit/partykit/pull/192) [`18035c2`](https://github.com/partykit/partykit/commit/18035c284cc2307226d34b1e7581ea4a2794f8ac) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: better default for `gc`

  It's better to default to `gc: true` with partykit, so memory is better used in partykit servers. We should also ensure `gc` and `persist` are never used together. So this PR adds a little logic to find a better default, and ensuring the 2 never clash.

- [#34](https://github.com/partykit/partykit/pull/34) [`0fdf7a3`](https://github.com/partykit/partykit/commit/0fdf7a30f5112dfce21d105921674ddff57a1596) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: remove vendored libs

  We'd previously vendored the libs used by y-partykit (yjs, lib0, etc) to workaround a bug in edge-runtime https://github.com/vercel/edge-runtime/issues/243, but it makes using other libs that include those libs difficult. So instead this patch removes the vendoring, and applies the other workaround (which is to set `minify:true`). The tradeoff for this workaround is that any "dev mode" code (i.e. code wrapped with `if (process.env.NODE_ENV !== 'production')`) will be removed. This is temporary and we'll remove it once the bug is fixed by edge-runtime.

- [#88](https://github.com/partykit/partykit/pull/88) [`4d448bb`](https://github.com/partykit/partykit/commit/4d448bbf949975fbf7261e64568336c1c1be0897) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: wait for bindState to finish before connection fulfills

- [#211](https://github.com/partykit/partykit/pull/211) [`fffe721`](https://github.com/partykit/partykit/commit/fffe72148e5cc425e80c90b6bf180192df410080) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

- [#105](https://github.com/partykit/partykit/pull/105) [`f576783`](https://github.com/partykit/partykit/commit/f57678381fb72d2dc8e91547c81978ea8e57459a) Thanks [@threepointone](https://github.com/threepointone)! - fully fork y-websocket

  This fully forks y-websocket for y-partykit. Previously, we were still extending the client provider, but this now inlines that implementation so we can make our own changes/fixes as required.

- [#33](https://github.com/partykit/partykit/pull/33) [`37986a8`](https://github.com/partykit/partykit/commit/37986a8bb8dd9340a8fe7e59a53ea5468a36059a) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: remove document size limits

  By chunking values, we can workaround DO's 128 kb value size limit. This patch implements that, and adds a couple of tests too.

- [#182](https://github.com/partykit/partykit/pull/182) [`a7370aa`](https://github.com/partykit/partykit/commit/a7370aa12a040548d99533905d2fb180a5322e15) Thanks [@iojcde](https://github.com/iojcde)! - fix: change type of `conn` to PartykitConenection

- [#226](https://github.com/partykit/partykit/pull/226) [`9a4b594`](https://github.com/partykit/partykit/commit/9a4b59467f0f573747526e119372ea6a854f909a) Thanks [@threepointone](https://github.com/threepointone)! - configure `party` in `y-partykit`

  This adds a `party` parameter to the options bag for `YPartyKitProvider`

- [#22](https://github.com/partykit/partykit/pull/22) [`825bb02`](https://github.com/partykit/partykit/commit/825bb02aee262f3c0c12e8b9602339666643840a) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: export YPartyKitProvider

- [#54](https://github.com/partykit/partykit/pull/54) [`244de6a`](https://github.com/partykit/partykit/commit/244de6aaa9ed2ee7770d29ffc6be51c5fb38939a) Thanks [@threepointone](https://github.com/threepointone)! - fix: don't crash in some secure contexts

  This uses a weaker implementation to generate conneciton IDs if crypto.randomUUID() isn't available in the browser (re: https://github.com/WICG/uuid/issues/23) Fixes https://github.com/partykit/partykit/issues/53

- [#181](https://github.com/partykit/partykit/pull/181) [`7bdfcf2`](https://github.com/partykit/partykit/commit/7bdfcf28e4effb0315299e679a760916a7b7924b) Thanks [@iojcde](https://github.com/iojcde)! - feat: add support for headers in callback options

- [#16](https://github.com/partykit/partykit/pull/16) [`13c4acf`](https://github.com/partykit/partykit/commit/13c4acf2b53bf3de12c6e3c5b7f27f8b6f423481) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: first cut

  This lands a first implementation of yjs for partykit. It uses patch-package to create a modified build of y-websocket, and re-exports it for usage in a partykit server. This also lands a small example of lexical+y-partykit.

- [#285](https://github.com/partykit/partykit/pull/285) [`53ba5ac`](https://github.com/partykit/partykit/commit/53ba5ac63cbe9ca47f0abcfdf55f2c307dc3930e) Thanks [@jevakallio](https://github.com/jevakallio)! - Make YProvider work in workers runtime

- [#207](https://github.com/partykit/partykit/pull/207) [`ac76dbc`](https://github.com/partykit/partykit/commit/ac76dbc4e34d5fb127a00967170e8d3b9064e674) Thanks [@threepointone](https://github.com/threepointone)! - expose connection id on YpartyKitProvider

  available as `provider.id`

- [#31](https://github.com/partykit/partykit/pull/31) [`984a9ec`](https://github.com/partykit/partykit/commit/984a9eccc1754cebc456d814eabed1e39aa511b8) Thanks [@threepointone](https://github.com/threepointone)! - [y-partykit] fix: write state to storage on connection close

  we'd forgotten to implement `writeState()` so data wasn't being saved when everyone left a room. the fix is to implement, seems fine now.

- [#30](https://github.com/partykit/partykit/pull/30) [`323fce1`](https://github.com/partykit/partykit/commit/323fce1ef57981922eb52126bddb425da90801e5) Thanks [@threepointone](https://github.com/threepointone)! - chore: update esbuild, edge-runtime, and co.

  of note, esbuild had breaking changes, had to rewrite the rebuild logic.

- [#35](https://github.com/partykit/partykit/pull/35) [`7eb3b36`](https://github.com/partykit/partykit/commit/7eb3b3621027480092a927bec5b6096ba4614027) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit (feat): `onCommand` as a server configuration option

  y-partykit currently assumes all messages on the wire are yjs messages (usually all binary data), but we have usecases where we want to send arbitrary commands to the server and act on them (usually still with the context of a doc). So now y-partykit accepts a handler for all string messages that we're calling 'commands' - `onCommand(string, Y.Doc)`.

  Additionally, partysocket now also exports it's base websocket class as partysocket/ws
