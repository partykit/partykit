# y-partykit

## 0.0.33

### Patch Changes

- [`732dc3c`](https://github.com/partykit/partykit/commit/732dc3c70faaf3d73c61fd3ab6c77f1da29e9175) Thanks [@threepointone](https://github.com/threepointone)! - broader range of react as a peer dep

## 0.0.32

### Patch Changes

- [#906](https://github.com/partykit/partykit/pull/906) [`a25381e`](https://github.com/partykit/partykit/commit/a25381e71a207064cba231f94e6fb8185fa30ac5) Thanks [@alexdlm](https://github.com/alexdlm)! - Move y-partykit deps to peerDependencies

## 0.0.31

### Patch Changes

- [#901](https://github.com/partykit/partykit/pull/901) [`74657bf`](https://github.com/partykit/partykit/commit/74657bf62218e460f960682ff2454da7ea66ed31) Thanks [@threepointone](https://github.com/threepointone)! - fix: actually pass prefixed url to the provider

## 0.0.30

### Patch Changes

- [#899](https://github.com/partykit/partykit/pull/899) [`7feb26e`](https://github.com/partykit/partykit/commit/7feb26e48f47499169ef08c629f6539f5c6a1abe) Thanks [@threepointone](https://github.com/threepointone)! - 'prefix' option for PartySocket/YPartyKitProvider

  We currently assume that parties are routed to by /parties/:party/:room (or /party/:room for the default party.) However, there will be upcoming changes where parties can be routed to on the basis of any url (or even any other param, like a session id or whatever). This change lets clients connect with a `prefix` param. It also uses /parties/main/:room when connecting to the default party. This is not a breaking change, all projects should still just work as expected.

## 0.0.29

### Patch Changes

- [#889](https://github.com/partykit/partykit/pull/889) [`3626116`](https://github.com/partykit/partykit/commit/3626116a3fa90e1fa251b7748f31f34741b52808) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.28

### Patch Changes

- [#858](https://github.com/partykit/partykit/pull/858) [`085bb8f`](https://github.com/partykit/partykit/commit/085bb8ff9c6dc508d5fac8c9ed95ae26039414ee) Thanks [@jslauthor](https://github.com/jslauthor)! - Add null check to load() in y-partykit

- [#851](https://github.com/partykit/partykit/pull/851) [`7275433`](https://github.com/partykit/partykit/commit/727543377096604bb3efa9da2bad093220b66d37) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: don't load document multiple times on start

## 0.0.27

### Patch Changes

- [#846](https://github.com/partykit/partykit/pull/846) [`01f311d`](https://github.com/partykit/partykit/commit/01f311d712ab2b1ff07109d12416c023ce53f376) Thanks [@threepointone](https://github.com/threepointone)! - Update dependencies

## 0.0.26

### Patch Changes

- [#844](https://github.com/partykit/partykit/pull/844) [`19c27dc`](https://github.com/partykit/partykit/commit/19c27dc0cdd8c3858a96a2e9410a11b21281a727) Thanks [@OCA99](https://github.com/OCA99)! - y-partykit provider can generate IDs even if 'crypto' is not defined

## 0.0.25

### Patch Changes

- [#819](https://github.com/partykit/partykit/pull/819) [`f448798`](https://github.com/partykit/partykit/commit/f448798c0059cdf5c3a7fce4789d4c0640a310b7) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.24

### Patch Changes

- [#812](https://github.com/partykit/partykit/pull/812) [`fda7510`](https://github.com/partykit/partykit/commit/fda751078c26ce39ff7c84f09d20b2951b4ced73) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: don't swallow errors when saving

## 0.0.23

### Patch Changes

- [#769](https://github.com/partykit/partykit/pull/769) [`dc91b54`](https://github.com/partykit/partykit/commit/dc91b54bfb32b671449a411b69f59326406f0117) Thanks [@threepointone](https://github.com/threepointone)! - Update dependencies

## 0.0.22

### Patch Changes

- [#767](https://github.com/partykit/partykit/pull/767) [`fd87e26`](https://github.com/partykit/partykit/commit/fd87e26c001da22be264441f2305aaa124cddde5) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: let user force protocol

  via https://github.com/partykit/partykit/issues/766

## 0.0.21

### Patch Changes

- [#763](https://github.com/partykit/partykit/pull/763) [`7885ced`](https://github.com/partykit/partykit/commit/7885ced71e24e1282cc2fd31718ca81525c577df) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: in provider, replace ws.onX with ws.addEventListener(X

## 0.0.20

### Patch Changes

- [#759](https://github.com/partykit/partykit/pull/759) [`aedaead`](https://github.com/partykit/partykit/commit/aedaeadecd3fc02fcd183d8dec0165616bc30066) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: options are optional

- [#761](https://github.com/partykit/partykit/pull/761) [`00bc826`](https://github.com/partykit/partykit/commit/00bc8269437156586e352e6e4f211fe4ed07a6c5) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: ignore string messages

## 0.0.19

### Patch Changes

- [#749](https://github.com/partykit/partykit/pull/749) [`aa408aa`](https://github.com/partykit/partykit/commit/aa408aa583616baa29dfbe11813c2d06369274b9) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: call process.on/.off only when available

## 0.0.18

### Patch Changes

- [#739](https://github.com/partykit/partykit/pull/739) [`297cfb1`](https://github.com/partykit/partykit/commit/297cfb13e703d5e00329b0edefb98eaf05fe67e3) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit/partysocket: default `host` to `window.location.host`

## 0.0.17

### Patch Changes

- [#730](https://github.com/partykit/partykit/pull/730) [`68789f0`](https://github.com/partykit/partykit/commit/68789f03006e0c6f7d27a25f990aa3887dfe987c) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit/react: don't crash in node if websocket polyfill not available

## 0.0.16

### Patch Changes

- [#725](https://github.com/partykit/partykit/pull/725) [`6883221`](https://github.com/partykit/partykit/commit/68832211fd30b840dd787042285fe27f6b381c1d) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.15

### Patch Changes

- [#701](https://github.com/partykit/partykit/pull/701) [`9b1e29c`](https://github.com/partykit/partykit/commit/9b1e29c47f6ef1fa906022a764c43ac314836a79) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: use sendChunked from the client/provider

## 0.0.14

### Patch Changes

- [#699](https://github.com/partykit/partykit/pull/699) [`ccf7ebe`](https://github.com/partykit/partykit/commit/ccf7ebec0d27d11fdbb88bc92e249c2cbb30c701) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit remove ChunkedWebSocket class

  The class definition was eagerly looking for a WebSocket class, breaking in non-standards based environments (like node.js), leading to issues like https://github.com/partykit/partykit/issues/698. This removes the class definition, and uses the chunking function directly when required. I think this should fix the problem.

## 0.0.13

### Patch Changes

- [#663](https://github.com/partykit/partykit/pull/663) [`4ee25aa`](https://github.com/partykit/partykit/commit/4ee25aac71dd573f49ce9a1bdc07e67789a03066) Thanks [@threepointone](https://github.com/threepointone)! - rename Party.Party -> Party.Room

## 0.0.12

### Patch Changes

- [#683](https://github.com/partykit/partykit/pull/683) [`9927c51`](https://github.com/partykit/partykit/commit/9927c51a5c081059421a5cbf1060f6d7f81503df) Thanks [@threepointone](https://github.com/threepointone)! - partysocket/y-partykit: Use ws:/http:/ by default for all local networks

## 0.0.11

### Patch Changes

- [#636](https://github.com/partykit/partykit/pull/636) [`b190d1d`](https://github.com/partykit/partykit/commit/b190d1d52d9e6265231d904380ca0e08bba2842a) Thanks [@threepointone](https://github.com/threepointone)! - partysocket: make a proper event/target polyfill for react native

## 0.0.10

### Patch Changes

- [#494](https://github.com/partykit/partykit/pull/494) [`24b33d8`](https://github.com/partykit/partykit/commit/24b33d817c9e0c5808d89f6ab1969df9d7a29fb5) Thanks [@jevakallio](https://github.com/jevakallio)! - y-partykit: Implement WebSocket chunking for y-partykit/provider

  Workers platform limits individual WebSocket message size to 1MB. There are legitimate situations when YPartyKitProvider sync messages can exceed 1MB.

  This is an experimental fix to batch messages into 1MB chunks.

- [#483](https://github.com/partykit/partykit/pull/483) [`08d54ea`](https://github.com/partykit/partykit/commit/08d54ea61fa6bc7e5445f17dd51aad9b7726310e) Thanks [@jevakallio](https://github.com/jevakallio)! - ## Improved `y-partykit` persistence

  This release includes bugfixes and new options to `y-partykit` server persistence layer.

  ### Background

  By default, PartyKit maintains a copy of the Yjs document as long as at least one client is connected to the server. When all clients disconnect, the document state may be lost.

  To persists the Yjs document state between sessions, you can use the built-in PartyKit storage by enabling the `persist` option.

  This release fixes known performance and scaling issues with the existing `persist: true` option, and deprecates it in favour of two separate persistence strategies: **snapshot**, and **history**.

  #### Persisting snapshots (recommended)

  In `snapshot` mode, PartyKit stores the latest document state between sessions.

  ```ts
  onConnect(connection, party, {
    persist: {
      mode: "snapshot"
    }
  });
  ```

  During a session, PartyKit accumulates individual updates and stores them as separate records. When an editing session ends due to last connection disconnecting, PartyKit merges all updates to a single snapshot.

  The `snapshot` mode is optimal for most applications that do not need to support long-lived offline editing sessions.

  #### Persisting update history (advanced)

  In `history` mode, PartyKit stores the full edit history of the document.

  This is useful when multiple clients are expected to be able to change the document while offline, and synchronise their changes later.

  ```ts
  onConnect(connection, party, {
    persist: {
      mode: "history"
    }
  });
  ```

  For long-lived documents, the edit history could grow indefinitely, eventually reaching the practical limits of a single PartyKit server instance. To prevent unbounded growth, PartyKit applies a 10MB maximum limit to the edit history.

  You can customise these limits as follows:

  ```ts
  onConnect(connection, party, {
    persist: {
      mode: "history",
      // Maximum size in bytes.
      // You can set this value to any number below 10MB (10_000_000 bytes).
      maxBytes: 10_000_000,

      // Maximum number of updates.
      // By default, there is no maximum, and history grows until maximum amount of bytes is reached.
      maxUpdates: 10_000
    }
  });
  ```

  Once either limit is reached, the document is snapshotted, and history tracking is started again.

  #### Deprecating `persist: true`

  In previous versions, PartyKit only had one persistence mode:

  ```ts
  onConnect(connection, party, { persist: true });
  ```

  In this mode, PartyKit would store the full edit history of the Yjs document in the party storage. This worked well for short-lived documents, but would break for long-lived documents, as the document history size would grow until it would reach the practical limits of the runtime environment.

  From this version onwards, `persist: true` will function identically to setting `persist: { mode: "history" }`, including respecting the maximum storage limits.

  This option is still supported for backwards compatibility reasons, but will be removed in a future version of `y-partykit`.

## 0.0.9

### Patch Changes

- [#475](https://github.com/partykit/partykit/pull/475) [`73dac94`](https://github.com/partykit/partykit/commit/73dac9473ac26d776ad0d7c150dcf3c7a3a195b8) Thanks [@jevakallio](https://github.com/jevakallio)! - Filter out null/undefined parameters when constructing query string

## 0.0.8

### Patch Changes

- [#468](https://github.com/partykit/partykit/pull/468) [`7778127`](https://github.com/partykit/partykit/commit/7778127c50cbdd2af0f6c99469edf3a1da6c30b1) Thanks [@jevakallio](https://github.com/jevakallio)! - Allow passing a function to YPartyKitProvider options.params

## 0.0.7

### Patch Changes

- [#450](https://github.com/partykit/partykit/pull/450) [`3fd5fc9`](https://github.com/partykit/partykit/commit/3fd5fc9901f74ebc3731cf4ab5b4fec39ceb16c9) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: export `unstable_getYDoc`

  This is an escape hatch to get access to the `Y.Doc` instance, or initialize it if one doesn't exist yet.

  ```ts
  import type * as Party from "partykit/server";
  import type { YPartyKitOptions } from "y-partykit";
  import { onConnect, unstable_getYDoc } from "y-partykit";

  // options must match when calling unstable_getYDoc and onConnect
  const opts: YPartyKitOptions = { persist: true };

  export default class YjsServer implements Party.Server {
    yjsOptions: YPartyKitOptions = { persist: true };
    constructor(public room: Party.Room) {}

    async onRequest() {
      const doc = await unstable_getYDoc(this.room, opts);
      return new Response(doc.getText("message")?.toJSON());
    }

    onConnect(conn: Party.Connection) {
      return onConnect(conn, this.room, opts);
    }
  }
  ```

  ### Caveats

  This API is marked `unstable`, because it's likely to be superceded by a better API in the future.

  Notably, the `options` argument provided to `unstable_getYDoc` should match the options provided to `onConnect`. We do currently not change the options when each change is made, so the first options passed are applied, and any further changes are ignored. We try to detect changed options, and show a warning if changes are detected.

- [#449](https://github.com/partykit/partykit/pull/449) [`239aaef`](https://github.com/partykit/partykit/commit/239aaef1dbda80ca06491ed78ff8e3db28741b01) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: update deps

- [#456](https://github.com/partykit/partykit/pull/456) [`af8af51`](https://github.com/partykit/partykit/commit/af8af51172f36696fdf43c51eabeeffa16b1904d) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: only import things we need

- [#452](https://github.com/partykit/partykit/pull/452) [`cb57107`](https://github.com/partykit/partykit/commit/cb5710772a1b0ec0c298de4fd92f611cc46c264f) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit: remove ping-pong

  We had a ping-pong loop with partykit to keep the object alive, but it's not necessary. This patch removes it.

## 0.0.6

### Patch Changes

- [#423](https://github.com/partykit/partykit/pull/423) [`d88f87f`](https://github.com/partykit/partykit/commit/d88f87fdc2f3d35c4fb7389ea412e58e82244416) Thanks [@threepointone](https://github.com/threepointone)! - y-partykit fix: ignore string messages

## 0.0.5

### Patch Changes

- [#365](https://github.com/partykit/partykit/pull/365) [`5e73617`](https://github.com/partykit/partykit/commit/5e736175902c85df401bc9e2e756fa0ec7c3d355) Thanks [@jevakallio](https://github.com/jevakallio)! - Only yield open hibernating connections to match non-hibernating behaviour + polyfill WebSocket status code on platform side

## 0.0.4

### Patch Changes

- [#366](https://github.com/partykit/partykit/pull/366) [`b79f846`](https://github.com/partykit/partykit/commit/b79f84696d52d07c2b4a402dbb52ab688a17b4d7) Thanks [@threepointone](https://github.com/threepointone)! - use npm ci for CI installs

  We shouldn't use bun install until https://github.com/partykit/partykit/pull/352 lands

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
