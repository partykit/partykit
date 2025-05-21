# partykit

## 0.0.115

### Patch Changes

- [`9fcca93`](https://github.com/partykit/partykit/commit/9fcca935f4c9af6fbdb1228f13aca05bd60966c3) Thanks [@threepointone](https://github.com/threepointone)! - remove warnign when deploying to own domain

## 0.0.114

### Patch Changes

- [#948](https://github.com/partykit/partykit/pull/948) [`4b734d7`](https://github.com/partykit/partykit/commit/4b734d70f0bdf15eedff3b9f407e15e3d820f8f1) Thanks [@threepointone](https://github.com/threepointone)! - move partysocket to the partyserver repo

## 0.0.113

### Patch Changes

- [`e9dd477`](https://github.com/partykit/partykit/commit/e9dd47747e90e0ee314c25d96cbb593004c6b367) Thanks [@threepointone](https://github.com/threepointone)! - --no-hotkeys

## 0.0.112

### Patch Changes

- [#928](https://github.com/partykit/partykit/pull/928) [`d84c373`](https://github.com/partykit/partykit/commit/d84c373a42215da49485ce327d8999c0b1dfd309) Thanks [@maryam-khan-dev](https://github.com/maryam-khan-dev)! - Improve Node.js API compatibility in PartyKit

- [#939](https://github.com/partykit/partykit/pull/939) [`00a1d6c`](https://github.com/partykit/partykit/commit/00a1d6c7445fd2f9171fbc0bed81beebdacbcb66) Thanks [@albertso](https://github.com/albertso)! - Fix bad URL on windows, from `path.join( import.meta.url, "../dist/generated.js" )`
  which produces url startring with `.\\file:\\`, that incorrectly has `.\\`.

  Changes to `partykit/src/dev.tsx` and `partykit/src/cli.tsx`

- [#934](https://github.com/partykit/partykit/pull/934) [`b651f93`](https://github.com/partykit/partykit/commit/b651f93c48b2ca0a84b0727a50a6e0fdb90ff42d) Thanks [@maryam-khan-dev](https://github.com/maryam-khan-dev)! - Restore & improve Node APIs' compatibility with PartyKit

- [#932](https://github.com/partykit/partykit/pull/932) [`175a977`](https://github.com/partykit/partykit/commit/175a9776e6470f0d76c1e671f4700beed594dfe7) Thanks [@threepointone](https://github.com/threepointone)! - rename CLERK_PUBLISHABLE_KEY to PARTYKIT_CLERK_PUBLISHABLE_KEY

## 0.0.111

### Patch Changes

- [#916](https://github.com/partykit/partykit/pull/916) [`66d07f5`](https://github.com/partykit/partykit/commit/66d07f5d06613dcc35f58c10078eaac1d54e977e) Thanks [@threepointone](https://github.com/threepointone)! - Add support for observability

## 0.0.110

### Patch Changes

- [`0dc127a`](https://github.com/partykit/partykit/commit/0dc127a233303d516d5a86383b045c72b6662062) Thanks [@threepointone](https://github.com/threepointone)! - smart placement config schema update

## 0.0.109

### Patch Changes

- [#907](https://github.com/partykit/partykit/pull/907) [`96a8d83`](https://github.com/partykit/partykit/commit/96a8d8349eaf0974d4334c216a215702151f06a4) Thanks [@threepointone](https://github.com/threepointone)! - feat: add smart placement

## 0.0.108

### Patch Changes

- [#897](https://github.com/partykit/partykit/pull/897) [`41dd92a`](https://github.com/partykit/partykit/commit/41dd92a346689a09aec6827d457d1b941d8584b0) Thanks [@threepointone](https://github.com/threepointone)! - update miniflare/cf types

## 0.0.107

### Patch Changes

- [#889](https://github.com/partykit/partykit/pull/889) [`3626116`](https://github.com/partykit/partykit/commit/3626116a3fa90e1fa251b7748f31f34741b52808) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.106

### Patch Changes

- [#887](https://github.com/partykit/partykit/pull/887) [`f730425`](https://github.com/partykit/partykit/commit/f7304258befac4e7a92dfb635b38f12eb72d74b3) Thanks [@sleexyz](https://github.com/sleexyz)! - Make `partykit list -f json` actual valid json

## 0.0.105

### Patch Changes

- [#877](https://github.com/partykit/partykit/pull/877) [`23b00b5`](https://github.com/partykit/partykit/commit/23b00b54396c0684c0c3f11b958b1e4a788e2da1) Thanks [@threepointone](https://github.com/threepointone)! - fix: attachment can be a null

## 0.0.104

### Patch Changes

- [#868](https://github.com/partykit/partykit/pull/868) [`b337e86`](https://github.com/partykit/partykit/commit/b337e863efc00ca6c05365ec3ce848ee97e96f1c) Thanks [@threepointone](https://github.com/threepointone)! - feat: custom bindings for cloud-prem (part 1)

  Instead of having to provision resources directly from the config, we'd like to bind to existing resources in users' CF accounts. For example, you have an R2 bucket that you'd like to access from your partykit project. Now, you can add this to your `partykit.json`:

  ```jsonc
  {
    //...
    "bindings": {
      "r2": {
        "myBucket": "my-bucket-name"
      }
    }
  }
  ```

  Inside your project, you can now access the r2 bucket with `room.context.bindings.r2.myBucket` (or `lobby.bindings.r2.myBucket`).

  We'll add more types of bindings in the near future.

- [#871](https://github.com/partykit/partykit/pull/871) [`8f5800c`](https://github.com/partykit/partykit/commit/8f5800ced0dbf0d057882e336d7aa789fd0c1386) Thanks [@buildbreaker](https://github.com/buildbreaker)! - Update fetch error logging from console.error to console.warn

## 0.0.103

### Patch Changes

- [#862](https://github.com/partykit/partykit/pull/862) [`1b06f14`](https://github.com/partykit/partykit/commit/1b06f14c4288fd8f46bbc740223956ec62f0e861) Thanks [@threepointone](https://github.com/threepointone)! - pass --preview to `env list`

## 0.0.102

### Patch Changes

- [#852](https://github.com/partykit/partykit/pull/852) [`949f8a5`](https://github.com/partykit/partykit/commit/949f8a58fb4c226335cf9eaf7cad61bbd98ed0e2) Thanks [@threepointone](https://github.com/threepointone)! - update deps

## 0.0.101

### Patch Changes

- [#848](https://github.com/partykit/partykit/pull/848) [`16045ba`](https://github.com/partykit/partykit/commit/16045bab67b257f818f251c3e16646debc61702c) Thanks [@threepointone](https://github.com/threepointone)! - update miniflare

## 0.0.100

### Patch Changes

- [#846](https://github.com/partykit/partykit/pull/846) [`01f311d`](https://github.com/partykit/partykit/commit/01f311d712ab2b1ff07109d12416c023ce53f376) Thanks [@threepointone](https://github.com/threepointone)! - Update dependencies

## 0.0.99

### Patch Changes

- [#840](https://github.com/partykit/partykit/pull/840) [`5b70636`](https://github.com/partykit/partykit/commit/5b70636585568cde68bc4d44dc5e8b26b6eba3ef) Thanks [@threepointone](https://github.com/threepointone)! - fix: ensure imports from builtins work correctly on deploy

## 0.0.98

### Patch Changes

- [#834](https://github.com/partykit/partykit/pull/834) [`f15d9e2`](https://github.com/partykit/partykit/commit/f15d9e20e9f4ebd5bccaf5a9d2deb7819a3095ba) Thanks [@threepointone](https://github.com/threepointone)! - fix: default import from node: builtins should work

## 0.0.97

### Patch Changes

- [#832](https://github.com/partykit/partykit/pull/832) [`1905f70`](https://github.com/partykit/partykit/commit/1905f707dfe021e6bdda43efcf545e9ee34124d6) Thanks [@threepointone](https://github.com/threepointone)! - feat: support for .bin binary modules

## 0.0.96

### Patch Changes

- [#828](https://github.com/partykit/partykit/pull/828) [`6c2256f`](https://github.com/partykit/partykit/commit/6c2256f9c843b17ab32e8ba40fd41525a460e34b) Thanks [@threepointone](https://github.com/threepointone)! - feat: asset fetcher

## 0.0.95

### Patch Changes

- [#826](https://github.com/partykit/partykit/pull/826) [`30117ab`](https://github.com/partykit/partykit/commit/30117ab1594805315c093f50755e16df9bcb1128) Thanks [@threepointone](https://github.com/threepointone)! - update deps

## 0.0.94

### Patch Changes

- [#824](https://github.com/partykit/partykit/pull/824) [`e135cc6`](https://github.com/partykit/partykit/commit/e135cc661a0dfdc2579dbc263377425658d6763c) Thanks [@threepointone](https://github.com/threepointone)! - pass --tail-consumers <workers...>

## 0.0.93

### Patch Changes

- [#819](https://github.com/partykit/partykit/pull/819) [`f448798`](https://github.com/partykit/partykit/commit/f448798c0059cdf5c3a7fce4789d4c0640a310b7) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.92

### Patch Changes

- [#814](https://github.com/partykit/partykit/pull/814) [`4b85c68`](https://github.com/partykit/partykit/commit/4b85c688661b3a356716fe05c0aafd62cfdc2555) Thanks [@threepointone](https://github.com/threepointone)! - dev: add a flag `--disable-request-cf-fetch`

  when miniflare starts, it makes a request to get data to populate request.cf. This might not be desirable in some secure environments. This PR adds a flag to disable that behaviour.

## 0.0.91

### Patch Changes

- [#806](https://github.com/partykit/partykit/pull/806) [`34ed7be`](https://github.com/partykit/partykit/commit/34ed7be8e2dbdc284b0e5f828eb1e89afe414ab6) Thanks [@threepointone](https://github.com/threepointone)! - feat: add support for custom analytics

## 0.0.90

### Patch Changes

- [#798](https://github.com/partykit/partykit/pull/798) [`182c00d`](https://github.com/partykit/partykit/commit/182c00da09749dcf00363d5ce762e83183ff9710) Thanks [@threepointone](https://github.com/threepointone)! - Remove warning about missing connection id

## 0.0.89

### Patch Changes

- [#792](https://github.com/partykit/partykit/pull/792) [`367b5c8`](https://github.com/partykit/partykit/commit/367b5c83f3d5b8613b99a2a03611cfad0f9f1930) Thanks [@threepointone](https://github.com/threepointone)! - fix: allow dynamic imports of node:\* builtins

- [#794](https://github.com/partykit/partykit/pull/794) [`91b48a6`](https://github.com/partykit/partykit/commit/91b48a62093bcb902b7359a09cd5dd2e4433c805) Thanks [@threepointone](https://github.com/threepointone)! - fix: allow dynamic imports of builtins

## 0.0.88

### Patch Changes

- [#790](https://github.com/partykit/partykit/pull/790) [`44c2e94`](https://github.com/partykit/partykit/commit/44c2e9420febaf8689dc5708064ca36de610ea2d) Thanks [@threepointone](https://github.com/threepointone)! - `dev --https --https-key-path <path> --https-cert-path <path>`

  for folks who want to visit `https://localhost...` in dev

## 0.0.87

### Patch Changes

- [#788](https://github.com/partykit/partykit/pull/788) [`3ae1669`](https://github.com/partykit/partykit/commit/3ae16696705d12c3222cfcaa0e4011598c69bfe4) Thanks [@threepointone](https://github.com/threepointone)! - Simpler AI models listing

## 0.0.86

### Patch Changes

- [#784](https://github.com/partykit/partykit/pull/784) [`fb07b5d`](https://github.com/partykit/partykit/commit/fb07b5db04038db94d9c2b718d348872affc64fb) Thanks [@threepointone](https://github.com/threepointone)! - udpate dependencies

## 0.0.85

### Patch Changes

- [#785](https://github.com/partykit/partykit/pull/785) [`6bca688`](https://github.com/partykit/partykit/commit/6bca6883303df4b7c85d4f2f06e72edabc039f9d) Thanks [@threepointone](https://github.com/threepointone)! - `--live` / `config.serve.build.live`: live reload for client builds

## 0.0.84

### Patch Changes

- [#781](https://github.com/partykit/partykit/pull/781) [`63a9603`](https://github.com/partykit/partykit/commit/63a96037680c75b2d41844ab4a1dce05dee79382) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.83

### Patch Changes

- [#779](https://github.com/partykit/partykit/pull/779) [`95cc02a`](https://github.com/partykit/partykit/commit/95cc02a3dcf0d274fa83c5295eadf69966326cc5) Thanks [@threepointone](https://github.com/threepointone)! - add cloudflare config: logpush, tail_consumers

## 0.0.82

### Patch Changes

- [#775](https://github.com/partykit/partykit/pull/775) [`b5a4202`](https://github.com/partykit/partykit/commit/b5a4202d9845aad151c6b392fd0c79f95444cb07) Thanks [@threepointone](https://github.com/threepointone)! - node compat fixes

  - pick up correct build from 'exports' condition defined in a dep's package.json
  - correctly import `cloudflare:` dependencies

- [#778](https://github.com/partykit/partykit/pull/778) [`9f58128`](https://github.com/partykit/partykit/commit/9f58128c3176c5028fdd83f821eff8dacd01c9e8) Thanks [@threepointone](https://github.com/threepointone)! - fix imports of wasm modules on windows

## 0.0.81

### Patch Changes

- [#769](https://github.com/partykit/partykit/pull/769) [`dc91b54`](https://github.com/partykit/partykit/commit/dc91b54bfb32b671449a411b69f59326406f0117) Thanks [@threepointone](https://github.com/threepointone)! - Update dependencies

- [#772](https://github.com/partykit/partykit/pull/772) [`d9bf4b2`](https://github.com/partykit/partykit/commit/d9bf4b25c9a744b95df74282d150a564c71d5662) Thanks [@threepointone](https://github.com/threepointone)! - run first custom build synchronously in dev

## 0.0.80

### Patch Changes

- [#764](https://github.com/partykit/partykit/pull/764) [`1d35748`](https://github.com/partykit/partykit/commit/1d35748756c9ebdcd1ba150e009c1b822faa00b0) Thanks [@threepointone](https://github.com/threepointone)! - when singlePageMode is true, for missing urls only return index.html if Sec-Fetch-Mode === 'navigate'

## 0.0.79

### Patch Changes

- [#755](https://github.com/partykit/partykit/pull/755) [`e8aa911`](https://github.com/partykit/partykit/commit/e8aa9113a5b2115bd3c17308be6cebffb3a0fa0e) Thanks [@threepointone](https://github.com/threepointone)! - dev: when we have a custom build, run it before starting any effects

  In some conditions, the custom build may be generating static assets, which will trigger the file watcher and infinitely loop. Moving it to the top before any effects are run fixes this.

## 0.0.78

### Patch Changes

- [#754](https://github.com/partykit/partykit/pull/754) [`ccf6f14`](https://github.com/partykit/partykit/commit/ccf6f14afbab5d404cfceae69bb81dacb362358e) Thanks [@threepointone](https://github.com/threepointone)! - config.build.watch: watch multiple folders

- [#751](https://github.com/partykit/partykit/pull/751) [`a22b4bc`](https://github.com/partykit/partykit/commit/a22b4bce0321e0ab9a1eca4345434a71e113928d) Thanks [@threepointone](https://github.com/threepointone)! - EXPERIMENTAL DO NOT USE Login/Logout with cloudflare

## 0.0.77

### Patch Changes

- [#742](https://github.com/partykit/partykit/pull/742) [`850c77d`](https://github.com/partykit/partykit/commit/850c77d712054725cfd8dbeb49b9bbf577909899) Thanks [@threepointone](https://github.com/threepointone)! - populate `process.env` with `.env` contents

  (as well as `.env.local` during `dev`)

## 0.0.76

### Patch Changes

- [#741](https://github.com/partykit/partykit/pull/741) [`b5ffa13`](https://github.com/partykit/partykit/commit/b5ffa130b42a94b0d6c94bb55c3f89d511c2cf62) Thanks [@threepointone](https://github.com/threepointone)! - inject `process` global

## 0.0.75

### Patch Changes

- [#734](https://github.com/partykit/partykit/pull/734) [`5a9a489`](https://github.com/partykit/partykit/commit/5a9a489558cc63ca508d0640d5dd1836bb7e9add) Thanks [@threepointone](https://github.com/threepointone)! - format config errors

- [#732](https://github.com/partykit/partykit/pull/732) [`9d407bf`](https://github.com/partykit/partykit/commit/9d407bf1a1737307a127880d7e32abe53e138d3d) Thanks [@threepointone](https://github.com/threepointone)! - init: package.json#name might not exist

## 0.0.74

### Patch Changes

- [#728](https://github.com/partykit/partykit/pull/728) [`fca54cb`](https://github.com/partykit/partykit/commit/fca54cbfbff28a3ea2a252df040afc1bb2357a3c) Thanks [@threepointone](https://github.com/threepointone)! - init: when using package.json#name for party name, replace non alphanumeric chars with -

## 0.0.73

### Patch Changes

- [#725](https://github.com/partykit/partykit/pull/725) [`6883221`](https://github.com/partykit/partykit/commit/68832211fd30b840dd787042285fe27f6b381c1d) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

- [#723](https://github.com/partykit/partykit/pull/723) [`6a38b57`](https://github.com/partykit/partykit/commit/6a38b5738f1eaec0f83e67cd71b97458ed721e70) Thanks [@threepointone](https://github.com/threepointone)! - create: use templates from partykit/templates

## 0.0.72

### Patch Changes

- [#718](https://github.com/partykit/partykit/pull/718) [`d2e49d2`](https://github.com/partykit/partykit/commit/d2e49d2760cc9ba5f3dae14393c22c96b0fcd14f) Thanks [@threepointone](https://github.com/threepointone)! - Validate party names

## 0.0.71

### Patch Changes

- [#715](https://github.com/partykit/partykit/pull/715) [`8ac1f0b`](https://github.com/partykit/partykit/commit/8ac1f0b4fca6338f9dd61853373211d725d00750) Thanks [@threepointone](https://github.com/threepointone)! - Update dependencies

## 0.0.70

### Patch Changes

- [#713](https://github.com/partykit/partykit/pull/713) [`70d50fd`](https://github.com/partykit/partykit/commit/70d50fd6846e2ea8d707cecd18e2cd19ca6275c6) Thanks [@threepointone](https://github.com/threepointone)! - Warning about cloud-prem

## 0.0.69

### Patch Changes

- [#711](https://github.com/partykit/partykit/pull/711) [`23931b1`](https://github.com/partykit/partykit/commit/23931b100153d364c5b1e56efe945dd3a4808ff6) Thanks [@threepointone](https://github.com/threepointone)! - do not use bcW for onStart

## 0.0.68

### Patch Changes

- [#709](https://github.com/partykit/partykit/pull/709) [`34d5233`](https://github.com/partykit/partykit/commit/34d523370e2c6a6d2ee8bacc520baa7d9718e99a) Thanks [@threepointone](https://github.com/threepointone)! - in hibernation mode, run onStart() before onClose()/onError()

## 0.0.67

### Patch Changes

- [#707](https://github.com/partykit/partykit/pull/707) [`b354b19`](https://github.com/partykit/partykit/commit/b354b19968501483ee091794b9dfa924f0e2d4c1) Thanks [@threepointone](https://github.com/threepointone)! - Use blockConcurrencyWhile when running onStart()

## 0.0.66

### Patch Changes

- [#695](https://github.com/partykit/partykit/pull/695) [`4657bc3`](https://github.com/partykit/partykit/commit/4657bc323d9bf5b00aea3f6f57e1c5c33f32fe89) Thanks [@threepointone](https://github.com/threepointone)! - vectorizeIndex.describe() in local dev

- [#696](https://github.com/partykit/partykit/pull/696) [`ecbe61b`](https://github.com/partykit/partykit/commit/ecbe61b5e59775ce41087619dc9d438685c2391d) Thanks [@threepointone](https://github.com/threepointone)! - move `.ai` into `room.context`

- [#693](https://github.com/partykit/partykit/pull/693) [`60b4090`](https://github.com/partykit/partykit/commit/60b40904db04a4a9402ad3e5f8f2601af338132a) Thanks [@threepointone](https://github.com/threepointone)! - init tweaks

## 0.0.65

### Patch Changes

- [#688](https://github.com/partykit/partykit/pull/688) [`b5cd7e6`](https://github.com/partykit/partykit/commit/b5cd7e6b3492af74f20b1b3116bc93ccceee07d5) Thanks [@threepointone](https://github.com/threepointone)! - Add a deprecation for Party.Party

- [#692](https://github.com/partykit/partykit/pull/692) [`87541fb`](https://github.com/partykit/partykit/commit/87541fb78c2e82544e7504e250c055aa917e2d5f) Thanks [@threepointone](https://github.com/threepointone)! - fix: vectorize upsert()/insert() in local dev

## 0.0.64

### Patch Changes

- [#663](https://github.com/partykit/partykit/pull/663) [`4ee25aa`](https://github.com/partykit/partykit/commit/4ee25aac71dd573f49ce9a1bdc07e67789a03066) Thanks [@threepointone](https://github.com/threepointone)! - rename Party.Party -> Party.Room

## 0.0.63

### Patch Changes

- [#678](https://github.com/partykit/partykit/pull/678) [`290c794`](https://github.com/partykit/partykit/commit/290c794a4ee99e26a4afc87b8853cfa1de5fc63a) Thanks [@threepointone](https://github.com/threepointone)! - update miniflare

- [#681](https://github.com/partykit/partykit/pull/681) [`2a8026d`](https://github.com/partykit/partykit/commit/2a8026d250f795ef07f1925962780d802a86d3ed) Thanks [@threepointone](https://github.com/threepointone)! - npx partykit ai models: list available models

## 0.0.62

### Patch Changes

- [#676](https://github.com/partykit/partykit/pull/676) [`2de0a9c`](https://github.com/partykit/partykit/commit/2de0a9c379876431fad0e96ad8b7b143f1af19f2) Thanks [@threepointone](https://github.com/threepointone)! - Use the new cron config format, add docs for onCron

## 0.0.61

### Patch Changes

- [#674](https://github.com/partykit/partykit/pull/674) [`b2891f2`](https://github.com/partykit/partykit/commit/b2891f25071e7c3e7bd28c7f0bbf902928398a64) Thanks [@threepointone](https://github.com/threepointone)! - static onSocket for general websockets

## 0.0.60

### Patch Changes

- [#672](https://github.com/partykit/partykit/pull/672) [`b1ff9bd`](https://github.com/partykit/partykit/commit/b1ff9bd549311de38c106aa0ee6aa1543b8d6141) Thanks [@threepointone](https://github.com/threepointone)! - fix: PARTYKIT_HOST should include preview subdomain

## 0.0.59

### Patch Changes

- [#670](https://github.com/partykit/partykit/pull/670) [`f92dcb9`](https://github.com/partykit/partykit/commit/f92dcb968c7770f8bf9fbb525fd117dd00c2e2ad) Thanks [@threepointone](https://github.com/threepointone)! - Update dependencies

## 0.0.58

### Patch Changes

- [#666](https://github.com/partykit/partykit/pull/666) [`4be8509`](https://github.com/partykit/partykit/commit/4be8509cf411dc12b39005de57a050e64565b70b) Thanks [@threepointone](https://github.com/threepointone)! - move p-limit and p-retry to devDependencies

- [#668](https://github.com/partykit/partykit/pull/668) [`afda7dd`](https://github.com/partykit/partykit/commit/afda7dd43b5011bf2c277793781821d1f59ba730) Thanks [@threepointone](https://github.com/threepointone)! - get info about a project

## 0.0.57

### Patch Changes

- [#664](https://github.com/partykit/partykit/pull/664) [`2911efe`](https://github.com/partykit/partykit/commit/2911efe847d501d4522989718dddcc9e6cb1785c) Thanks [@threepointone](https://github.com/threepointone)! - onCron + crons config

## 0.0.56

### Patch Changes

- [#657](https://github.com/partykit/partykit/pull/657) [`21d6703`](https://github.com/partykit/partykit/commit/21d67036e4a276c853b39191c6c1ff3164cf6489) Thanks [@threepointone](https://github.com/threepointone)! - use execaCommandSync in dev to prevent race conditions

## 0.0.55

### Patch Changes

- [#653](https://github.com/partykit/partykit/pull/653) [`d4d5ea7`](https://github.com/partykit/partykit/commit/d4d5ea7abfd9a7824209d15e928279c93acdde14) Thanks [@threepointone](https://github.com/threepointone)! - Don't check for existence of config.main until after (optional) custom build

- [#651](https://github.com/partykit/partykit/pull/651) [`879a9de`](https://github.com/partykit/partykit/commit/879a9de09110a14416242c07b340b51e8e770325) Thanks [@threepointone](https://github.com/threepointone)! - Don't install partykit during init if it's already in dependencies

## 0.0.54

### Patch Changes

- [#649](https://github.com/partykit/partykit/pull/649) [`5bd0a23`](https://github.com/partykit/partykit/commit/5bd0a23f656bda859b709292a70788d0a8ab3fde) Thanks [@threepointone](https://github.com/threepointone)! - Add schema ref to generated json partykit.json files

## 0.0.53

### Patch Changes

- [#643](https://github.com/partykit/partykit/pull/643) [`c8e26e7`](https://github.com/partykit/partykit/commit/c8e26e7c09479e51df7bbad90de5f5882b6737d4) Thanks [@threepointone](https://github.com/threepointone)! - Update dependencies

## 0.0.52

### Patch Changes

- [#641](https://github.com/partykit/partykit/pull/641) [`c03660b`](https://github.com/partykit/partykit/commit/c03660bbb82c279b52b777a7ab863035f32bc87e) Thanks [@threepointone](https://github.com/threepointone)! - Inject every var as it's own var instead of a big PARTYKIT_VARS object

  env vars have a 5kb limit, and people are hitting it. This should ease that off, without changing how we persist it ourselves.

## 0.0.51

### Patch Changes

- [#638](https://github.com/partykit/partykit/pull/638) [`6523e92`](https://github.com/partykit/partykit/commit/6523e92c631a746beee70dec53049fa3ba4717e4) Thanks [@threepointone](https://github.com/threepointone)! - expose blockConcurrencyWhile

## 0.0.50

### Patch Changes

- [#634](https://github.com/partykit/partykit/pull/634) [`7b7bc9b`](https://github.com/partykit/partykit/commit/7b7bc9b5d9c7e8ec40bfe36c6025d6acbdb1d495) Thanks [@threepointone](https://github.com/threepointone)! - alias Party.Party as Party.Room

## 0.0.49

### Patch Changes

- [#632](https://github.com/partykit/partykit/pull/632) [`431492a`](https://github.com/partykit/partykit/commit/431492ae8e53a1f8ae5552112c822b35d55c832e) Thanks [@threepointone](https://github.com/threepointone)! - fix: vectorize index create message

## 0.0.48

### Patch Changes

- [#631](https://github.com/partykit/partykit/pull/631) [`22b620f`](https://github.com/partykit/partykit/commit/22b620fb7c52dbcb66b45511f5c492c0741f1ef6) Thanks [@threepointone](https://github.com/threepointone)! - Use the api for ai dev

- [#623](https://github.com/partykit/partykit/pull/623) [`c9b992c`](https://github.com/partykit/partykit/commit/c9b992c193d400e16780e0dcbfe93e45c3139cd3) Thanks [@threepointone](https://github.com/threepointone)! - experimental: add vectorize commands

- [#629](https://github.com/partykit/partykit/pull/629) [`955455e`](https://github.com/partykit/partykit/commit/955455e4508a4549900a061df24ded78238ef815) Thanks [@threepointone](https://github.com/threepointone)! - add AI warning when vectorize is used

- [#627](https://github.com/partykit/partykit/pull/627) [`94f3891`](https://github.com/partykit/partykit/commit/94f38917e83d8e99bb45700c0743789115a44aa3) Thanks [@threepointone](https://github.com/threepointone)! - wrap API_BASE with quotes

- [#630](https://github.com/partykit/partykit/pull/630) [`5b4bed3`](https://github.com/partykit/partykit/commit/5b4bed38f15381c661b6e51be4d6716b1b48d2fd) Thanks [@threepointone](https://github.com/threepointone)! - Silence extraneous logs

- [#628](https://github.com/partykit/partykit/pull/628) [`31b4359`](https://github.com/partykit/partykit/commit/31b43596369147cd5dc2796d38b75b0ad0027fa7) Thanks [@threepointone](https://github.com/threepointone)! - vectorize: insert/upsert inside local dev

- [#625](https://github.com/partykit/partykit/pull/625) [`17dcf4c`](https://github.com/partykit/partykit/commit/17dcf4cec124502184f3b90cc9a5f73dfa98f3f3) Thanks [@threepointone](https://github.com/threepointone)! - vectorize: local dev + deploy

  This adds local dev for vectorize, and the parts needed to deploy it to production.

- [#626](https://github.com/partykit/partykit/pull/626) [`35eac21`](https://github.com/partykit/partykit/commit/35eac214a3a5c410fe851aeb1c722455ed5cb4ec) Thanks [@threepointone](https://github.com/threepointone)! - expose API_BASE to be used by vectorize polyfill

## 0.0.47

### Patch Changes

- [#614](https://github.com/partykit/partykit/pull/614) [`ebb0afa`](https://github.com/partykit/partykit/commit/ebb0afa789c4aa76b22c05ed2cc6c3e6990ecec6) Thanks [@threepointone](https://github.com/threepointone)! - `partykit.json#serve.browserTTL/.cacheTTL` can be null

## 0.0.46

### Patch Changes

- [#610](https://github.com/partykit/partykit/pull/610) [`c237dc5`](https://github.com/partykit/partykit/commit/c237dc5da3e416bf1d8705b88628dedb2809883d) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.45

### Patch Changes

- [#606](https://github.com/partykit/partykit/pull/606) [`ef18e36`](https://github.com/partykit/partykit/commit/ef18e36dbb0cc189c6b9ae1246092bca0046ba10) Thanks [@threepointone](https://github.com/threepointone)! - deploy to own cloudflare account

  You can now deploy to your own CF account! To do so, you must set the following environment variables: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN, and add `domain: your.domain.com` to your `partykit.json` file.

- [#608](https://github.com/partykit/partykit/pull/608) [`597e4dd`](https://github.com/partykit/partykit/commit/597e4dd0bb532797e7afcc92faeb38b093fa347f) Thanks [@threepointone](https://github.com/threepointone)! - deploy directly to custom domains (don't add the project name)

## 0.0.44

### Patch Changes

- [#602](https://github.com/partykit/partykit/pull/602) [`f83a20b`](https://github.com/partykit/partykit/commit/f83a20bdc71c7687e8bce2f162cd2354c604d9b8) Thanks [@threepointone](https://github.com/threepointone)! - Experimental AI bindings

## 0.0.43

### Patch Changes

- [#600](https://github.com/partykit/partykit/pull/600) [`5b3ea1e`](https://github.com/partykit/partykit/commit/5b3ea1e326e5b4fd044c46acf3cf9608ed7225b6) Thanks [@threepointone](https://github.com/threepointone)! - Update dependencies

## 0.0.42

### Patch Changes

- [#598](https://github.com/partykit/partykit/pull/598) [`29ec788`](https://github.com/partykit/partykit/commit/29ec78882bcc957ff8ecf63cb2eedae92e1f7f51) Thanks [@threepointone](https://github.com/threepointone)! - warn when running in replit without a token

## 0.0.41

### Patch Changes

- [#596](https://github.com/partykit/partykit/pull/596) [`cfaab8e`](https://github.com/partykit/partykit/commit/cfaab8e2397c4bd692c5019d43c691fce2c8ab20) Thanks [@threepointone](https://github.com/threepointone)! - fix: use 0.0.0.0 as host, so replit can serve dev

## 0.0.40

### Patch Changes

- [#594](https://github.com/partykit/partykit/pull/594) [`44bc94a`](https://github.com/partykit/partykit/commit/44bc94a227ec283d546155fb2dbb662aa075e6f2) Thanks [@threepointone](https://github.com/threepointone)! - feat: config.build.alias / config.serve.build.alias

  This lets you specify aliases for modules, just like esbuild's aliases.

## 0.0.39

### Patch Changes

- [#569](https://github.com/partykit/partykit/pull/569) [`a09c544`](https://github.com/partykit/partykit/commit/a09c544d92d6c0f34ce4faa84a4af536bb53cf0c) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.38

### Patch Changes

- [#566](https://github.com/partykit/partykit/pull/566) [`81a943e`](https://github.com/partykit/partykit/commit/81a943e446cd7e7910a5a3c10ed5a6a997bae634) Thanks [@threepointone](https://github.com/threepointone)! - add support for team deploys

## 0.0.37

### Patch Changes

- [#563](https://github.com/partykit/partykit/pull/563) [`0a92715`](https://github.com/partykit/partykit/commit/0a92715a972e15429aa246fd2226d93f4bae0234) Thanks [@threepointone](https://github.com/threepointone)! - revert sigil fix

## 0.0.36

### Patch Changes

- [#561](https://github.com/partykit/partykit/pull/561) [`70dbd60`](https://github.com/partykit/partykit/commit/70dbd6076c18fd6f703235bd3e7eaae957cfd1ae) Thanks [@threepointone](https://github.com/threepointone)! - fix: set this.worker sigil only after onStart has finished

## 0.0.35

### Patch Changes

- [#555](https://github.com/partykit/partykit/pull/555) [`f652575`](https://github.com/partykit/partykit/commit/f6525757a0b4aadae3773d384b00f0c838321937) Thanks [@threepointone](https://github.com/threepointone)! - use `--with-env` to define .env vars as globals in the project

- [#557](https://github.com/partykit/partykit/pull/557) [`5a7fdcf`](https://github.com/partykit/partykit/commit/5a7fdcfaccc5a9851cf3cdb5779e21b437ff8f1f) Thanks [@threepointone](https://github.com/threepointone)! - wrap .env values with quotes when inlining

## 0.0.34

### Patch Changes

- [#542](https://github.com/partykit/partykit/pull/542) [`ad4f8e5`](https://github.com/partykit/partykit/commit/ad4f8e518aedfa6c9a4877261b9dbf684aeded26) Thanks [@threepointone](https://github.com/threepointone)! - Update dependencies

## 0.0.33

### Patch Changes

- [#534](https://github.com/partykit/partykit/pull/534) [`da3947e`](https://github.com/partykit/partykit/commit/da3947eb91373cb93410bc339aecf14f327c6cfb) Thanks [@andrew-r-thomas](https://github.com/andrew-r-thomas)! - Assert that names of parties in partykit.json are lowercase

- [#521](https://github.com/partykit/partykit/pull/521) [`0e5a1b6`](https://github.com/partykit/partykit/commit/0e5a1b68e41200f1ebbcff907644742a1aceed7b) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

  Of note, this now uses miniflare's new coloured logging, so we can start deprecating our weird inspector layer

- [#512](https://github.com/partykit/partykit/pull/512) [`059c133`](https://github.com/partykit/partykit/commit/059c133f1540b5eca6df325769017674a9d5cac5) Thanks [@threepointone](https://github.com/threepointone)! - Update dependencies

- [#530](https://github.com/partykit/partykit/pull/530) [`12fc02a`](https://github.com/partykit/partykit/commit/12fc02ace0f08e80306a71e8807aedcf82588233) Thanks [@jevakallio](https://github.com/jevakallio)! - Allow passing request directly to stub.fetch

- [#539](https://github.com/partykit/partykit/pull/539) [`fd0e379`](https://github.com/partykit/partykit/commit/fd0e3797897c26ff51c0ceffe214f4043b7c1ae6) Thanks [@andrew-r-thomas](https://github.com/andrew-r-thomas)! - validating project name in config

## 0.0.32

### Patch Changes

- [#509](https://github.com/partykit/partykit/pull/509) [`77ce4b4`](https://github.com/partykit/partykit/commit/77ce4b4ed2f180081afcab283a29dce5e47802cc) Thanks [@jevakallio](https://github.com/jevakallio)! - Parallellize asset uploads + fail fast

- [#506](https://github.com/partykit/partykit/pull/506) [`c57b51b`](https://github.com/partykit/partykit/commit/c57b51bd238dac0a0d4ca0d816c181242a730df8) Thanks [@threepointone](https://github.com/threepointone)! - update deps

  Of note, this fixes partymix, our remix adapter

- [#503](https://github.com/partykit/partykit/pull/503) [`dbd7c3b`](https://github.com/partykit/partykit/commit/dbd7c3b130852b61726e1c29c4e118928dd4a0c3) Thanks [@threepointone](https://github.com/threepointone)! - fix: get proper room id from `/party/:id/*`

  We had a bug when picking out the room name from `/party/:id/*`, it would pick the whole subpath instead. This fixes it.

- [#504](https://github.com/partykit/partykit/pull/504) [`80c147f`](https://github.com/partykit/partykit/commit/80c147ff9fbffe5d435213db15d9b0d28a860d14) Thanks [@jevakallio](https://github.com/jevakallio)! - partykit cli: fix session expiration for long-running deployments

## 0.0.31

### Patch Changes

- [#496](https://github.com/partykit/partykit/pull/496) [`fb62640`](https://github.com/partykit/partykit/commit/fb626408733be07ca9edc233c4f6f37c1a30fb7e) Thanks [@threepointone](https://github.com/threepointone)! - update deps

- [#489](https://github.com/partykit/partykit/pull/489) [`6276a29`](https://github.com/partykit/partykit/commit/6276a29f6fda1aa8b6232011814388c8ebafbe89) Thanks [@threepointone](https://github.com/threepointone)! - partykit bin field should be an object

- [#481](https://github.com/partykit/partykit/pull/481) [`731fea7`](https://github.com/partykit/partykit/commit/731fea78392e1e0ea675c3568bb32b5d0814e964) Thanks [@threepointone](https://github.com/threepointone)! - pass sub path/init during subparty .fetch()/.socket()

  This lets you pass a "sub" path to a sub party `.fetch()` or `.socket()` (and adds being able to pass a RequestInit to `.socket()`). This make it possible to do routing more cleanly inside sub parties, making them more versatile.

## 0.0.30

### Patch Changes

- [#476](https://github.com/partykit/partykit/pull/476) [`ad6be5b`](https://github.com/partykit/partykit/commit/ad6be5b7085ccf4bd7533af98141caea9040de65) Thanks [@threepointone](https://github.com/threepointone)! - await multiparties.socket()

  This introduces a new method `.socket()` to the multiparties bag. Much like the .fetch() method() on the bag, this now uses an internal api to connect with a websocket to the party, instead of using a URL and connecting via the internet. Importantly, this also works from inside onFetch() handlers. This patch also deprecates the previous `.connect()` method.

- [#473](https://github.com/partykit/partykit/pull/473) [`cf8cb27`](https://github.com/partykit/partykit/commit/cf8cb27e6a934f34c0266bbdae3f9f3b091aaa50) Thanks [@jevakallio](https://github.com/jevakallio)! - Fix login on WebKit (Safari)

## 0.0.29

### Patch Changes

- [#472](https://github.com/partykit/partykit/pull/472) [`a9b17f9`](https://github.com/partykit/partykit/commit/a9b17f9ccb6a479aa721a2ddc5737c464e399fd2) Thanks [@jevakallio](https://github.com/jevakallio)! - Allow preflight requests when Chrome Private Network Access is enabled

- [#470](https://github.com/partykit/partykit/pull/470) [`cdceba8`](https://github.com/partykit/partykit/commit/cdceba89c7562359e2b8dc21dc2f2085bc24ecc1) Thanks [@dev-badace](https://github.com/dev-badace)! - added missing crypto from node_compat

## 0.0.28

### Patch Changes

- [#465](https://github.com/partykit/partykit/pull/465) [`3048a9f`](https://github.com/partykit/partykit/commit/3048a9f7523a4cf5876b59f1f4f1c8aa45f7188f) Thanks [@threepointone](https://github.com/threepointone)! - fix: .send and .broadcast can send ArrayBuffers

  WebSocket messages can be `string | ArrayBuffer | ArrayBufferView`, this patch fixes the types to allow that. The implementation remains the same (and otherwise always worked).

- [#463](https://github.com/partykit/partykit/pull/463) [`1efd862`](https://github.com/partykit/partykit/commit/1efd86242be8e428bdce4b8e9b078d3e79de6dd4) Thanks [@threepointone](https://github.com/threepointone)! - update deps

- [#466](https://github.com/partykit/partykit/pull/466) [`e8a8da4`](https://github.com/partykit/partykit/commit/e8a8da4f925d2457e095736ecfb1eacb84831ee1) Thanks [@jevakallio](https://github.com/jevakallio)! - Make connection.setState accept null

- [#461](https://github.com/partykit/partykit/pull/461) [`34eeb03`](https://github.com/partykit/partykit/commit/34eeb032333554f1ab0b4d90a005888c531f9f34) Thanks [@dependabot](https://github.com/apps/dependabot)! - Bump zod from 3.22.2 to 3.22.3

## 0.0.27

### Patch Changes

- [#458](https://github.com/partykit/partykit/pull/458) [`4b3e0e2`](https://github.com/partykit/partykit/commit/4b3e0e2bb81e406ca1e8e9d97131984406c3b13b) Thanks [@jevakallio](https://github.com/jevakallio)! - Add new `connection.state` and `connection.getState` methods.

  ```ts
  import type * as Party from "partykit/server";

  // optional: you can provide typescript types for state for additional type safety
  type Connection = Party.Connection<{ country: string }>;

  class PartyServer {
    onConnect(connection: Connection, { request }) {
      // you can .setState to store information on connection
      connection.setState({ country: request.cf.country });
    }
    onMessage(message: string, connection: Connection) {
      // you can access .state to get information stored with .setState
      console.log(`${message} from user in ${connection.state?.country}`);
    }
  }
  ```

## 0.0.26

### Patch Changes

- [#437](https://github.com/partykit/partykit/pull/437) [`8848863`](https://github.com/partykit/partykit/commit/8848863a2af0ed7c789f281ce628ccd4d529504d) Thanks [@jevakallio](https://github.com/jevakallio)! - Ensure that user attachments don't clobber system attachments used by partykit

- [#454](https://github.com/partykit/partykit/pull/454) [`d9b9076`](https://github.com/partykit/partykit/commit/d9b9076ea9e273b9e994b8aeb8b86197affc667e) Thanks [@threepointone](https://github.com/threepointone)! - make node@18 the minimum version required to run partykit

## 0.0.25

### Patch Changes

- [#440](https://github.com/partykit/partykit/pull/440) [`9a9fd8a`](https://github.com/partykit/partykit/commit/9a9fd8ac100a3d94a19d8cd25d4b43ec03a76505) Thanks [@threepointone](https://github.com/threepointone)! - experimental: `dev --unstable_outdir <path>`

  When we have errors in the code, we log the error, but it uses line numbers from the output worker, which aren't helpful. Particularly because we don't output the actual worker to disk anyway, so they can't figure out where the error is coming from. It's really bad for large codebases.

  Figuring out debugging is a top level concern for us; we want to have sourcemaps, breakpoints, devtools - the works. But until we get there, we should help people find where errors are coming from.

  This adds an experimental `--unstable_outdir <path>` to `partykit dev` that spits out the actual code that we run in the dev environment, so folks can inspect it. The output code also inlines filenames, so that should help as well. This should hold folks until we have a better debugging story.

- [#442](https://github.com/partykit/partykit/pull/442) [`532a241`](https://github.com/partykit/partykit/commit/532a241b95e67c3330569e7e60256176cd617370) Thanks [@jevakallio](https://github.com/jevakallio)! - Fix compatibilityDate timezone issue, allow server to decide timezone if not provided

## 0.0.24

### Patch Changes

- [#436](https://github.com/partykit/partykit/pull/436) [`645edd6`](https://github.com/partykit/partykit/commit/645edd691f7153efc95a48d871b18eef68b38b18) Thanks [@threepointone](https://github.com/threepointone)! - fix (internal): fix infinite loop when developing

  We use node's watch mode when developing partykit itself. On node 20, this just goes into an infinite loop, because it restarts on any writes, even if the file hasn't changed (iiuc). We are compiling facade/source.ts to facade/generated.js, while also watching the facade folder, which was triggering the restarts. I moved the outout to dist/generated.js, which fixes the problem.

- [#435](https://github.com/partykit/partykit/pull/435) [`8fdb63f`](https://github.com/partykit/partykit/commit/8fdb63f31835f56a0d4dbf290c970580d4a9a9ba) Thanks [@threepointone](https://github.com/threepointone)! - add a default compatibility date

  We should be adding a default compatibility date to new projects. Further, for projects that don't have one, we should warn that they should, and default to the latest compatibility date that we can. This PR adds that behaviour for both create, dev and deploy

- [#426](https://github.com/partykit/partykit/pull/426) [`360c80a`](https://github.com/partykit/partykit/commit/360c80a9a32dadb40aa290bead10f2f4a8a2dbe6) Thanks [@threepointone](https://github.com/threepointone)! - Add --force/-f flag to `partykit delete`

  Fixes https://github.com/partykit/partykit/issues/425

- [#436](https://github.com/partykit/partykit/pull/436) [`645edd6`](https://github.com/partykit/partykit/commit/645edd691f7153efc95a48d871b18eef68b38b18) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.23

### Patch Changes

- [`b9cd337`](https://github.com/partykit/partykit/commit/b9cd337a5b54a507d0d2df9d0cb4821e582349be) Thanks [@threepointone](https://github.com/threepointone)! - trigger a release

## 0.0.22

### Patch Changes

- [#409](https://github.com/partykit/partykit/pull/409) [`5593735`](https://github.com/partykit/partykit/commit/559373553f0b89c973b75945e6c18f0259bc453e) Thanks [@dev-badace](https://github.com/dev-badace)! - [fix] filePath in windows

  Fixes #328

  In Windows devices, the assetsMap was generating file paths with double backslashes, resulting in incorrect file paths. This PR addresses this issue by replacing the double backslashes with single forward slashes, ensuring that the file paths are correct and functional.

- [#412](https://github.com/partykit/partykit/pull/412) [`5b04814`](https://github.com/partykit/partykit/commit/5b048146b1fb5587775b85e7ccda08924c49d7eb) Thanks [@tsriram](https://github.com/tsriram)! - Use existing indentation of package.json when running partykit init

- [#410](https://github.com/partykit/partykit/pull/410) [`ecc80cc`](https://github.com/partykit/partykit/commit/ecc80cc8a28f5ecfa85f989f06acda8888c0fb36) Thanks [@threepointone](https://github.com/threepointone)! - fix: work on node 16 again

  some references to `fetch` weren't being imported from undici. global fetch was introduced only in node 18. so the partykit cli (specifically `init`) and create-partykit weren't working on node 16. This fixes that issue (tho we should phase out node 16 support soon)

## 0.0.21

### Patch Changes

- [#400](https://github.com/partykit/partykit/pull/400) [`2ed33de`](https://github.com/partykit/partykit/commit/2ed33dea58cd4a978f10ae66fd3b14c98ee84d1b) Thanks [@threepointone](https://github.com/threepointone)! - pin dependencies

- [#402](https://github.com/partykit/partykit/pull/402) [`18011e8`](https://github.com/partykit/partykit/commit/18011e80134eda921a24512d774c5b5ec2bc490a) Thanks [@jevakallio](https://github.com/jevakallio)! - Change default login provider to "partykit"

## 0.0.20

### Patch Changes

- [#397](https://github.com/partykit/partykit/pull/397) [`49d876a`](https://github.com/partykit/partykit/commit/49d876a7c4ebc5af3fcc6428e801de00649a9a54) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.19

### Patch Changes

- [#392](https://github.com/partykit/partykit/pull/392) [`d9a6531`](https://github.com/partykit/partykit/commit/d9a65319e73dc7f38f1b59749f1f083e4a5d0cf6) Thanks [@threepointone](https://github.com/threepointone)! - publish releases on discord

## 0.0.18

### Patch Changes

- [#389](https://github.com/partykit/partykit/pull/389) [`e3f2808`](https://github.com/partykit/partykit/commit/e3f2808cfed9afbe7f35e58fa6a6dc58cb326a4f) Thanks [@jevakallio](https://github.com/jevakallio)! - Fix deleting preview deployments

- [#390](https://github.com/partykit/partykit/pull/390) [`2cc09ee`](https://github.com/partykit/partykit/commit/2cc09eefe1197b7d14a9b6b79444fe88ce09cb4f) Thanks [@threepointone](https://github.com/threepointone)! - mark `clipboardy` as an external dependency

  clipboardy comes with fallback binaries to use (esp. in windows). If we bundle it into the partykit bundle, then the references to those binaries fail. So we mark it as an external so it installs separately and resolves the binaries correctly.

## 0.0.17

### Patch Changes

- [#387](https://github.com/partykit/partykit/pull/387) [`5bc204f`](https://github.com/partykit/partykit/commit/5bc204fa9ef1547a31a39e1bbff454f6ec3cb188) Thanks [@jevakallio](https://github.com/jevakallio)! - Fix static asset deployment for PartyKit preview deployments

## 0.0.16

### Patch Changes

- [#380](https://github.com/partykit/partykit/pull/380) [`22d8518`](https://github.com/partykit/partykit/commit/22d85184b6d14d951786167e410ff591e428fa4f) Thanks [@threepointone](https://github.com/threepointone)! - add `party.name`

  This exposes the parent level name of the party (default "main", other wise the key from `parties` in `partykit.json`

## 0.0.15

### Patch Changes

- [#377](https://github.com/partykit/partykit/pull/377) [`9d37d81`](https://github.com/partykit/partykit/commit/9d37d81542918a503e229f1d4c8b88c1ce339080) Thanks [@jevakallio](https://github.com/jevakallio)! - Make request mutable before passing it to onBefore\* methods

## 0.0.14

### Patch Changes

- [#365](https://github.com/partykit/partykit/pull/365) [`5e73617`](https://github.com/partykit/partykit/commit/5e736175902c85df401bc9e2e756fa0ec7c3d355) Thanks [@jevakallio](https://github.com/jevakallio)! - Only yield open hibernating connections to match non-hibernating behaviour + polyfill WebSocket status code on platform side

- [#368](https://github.com/partykit/partykit/pull/368) [`a9c980f`](https://github.com/partykit/partykit/commit/a9c980f931d4d4feae6d9abe15216751784ca5ad) Thanks [@threepointone](https://github.com/threepointone)! - update deps

## 0.0.13

### Patch Changes

- [#366](https://github.com/partykit/partykit/pull/366) [`b79f846`](https://github.com/partykit/partykit/commit/b79f84696d52d07c2b4a402dbb52ab688a17b4d7) Thanks [@threepointone](https://github.com/threepointone)! - use npm ci for CI installs

  We shouldn't use bun install until https://github.com/partykit/partykit/pull/352 lands

## 0.0.12

### Patch Changes

- [#353](https://github.com/partykit/partykit/pull/353) [`a634046`](https://github.com/partykit/partykit/commit/a634046ed521d3451abb278e98bbb1b84359e50d) Thanks [@sylwiavargas](https://github.com/sylwiavargas)! - Updates readme and package metadata

## 0.0.11

### Patch Changes

- [#346](https://github.com/partykit/partykit/pull/346) [`58fe7e2`](https://github.com/partykit/partykit/commit/58fe7e2eaa9d905af4d4b6e0843ae7eed9ccd044) Thanks [@mellson](https://github.com/mellson)! - pass custom port to dev from CLI correctly

- [#345](https://github.com/partykit/partykit/pull/345) [`9990c2c`](https://github.com/partykit/partykit/commit/9990c2cbe872c61e2949f4cf091e16cdd8f5aff3) Thanks [@threepointone](https://github.com/threepointone)! - add a lint rule for not using deprecated APIs

- [#347](https://github.com/partykit/partykit/pull/347) [`3d05975`](https://github.com/partykit/partykit/commit/3d059753a7cb4b85e34fe7060a598c21fc65a771) Thanks [@threepointone](https://github.com/threepointone)! - use the right config/options in dev

  We weren't reading config correctly in dev, this fixes it

- [#348](https://github.com/partykit/partykit/pull/348) [`08a1caa`](https://github.com/partykit/partykit/commit/08a1caad40c0a39e663fec7853d252a060b84e11) Thanks [@jevakallio](https://github.com/jevakallio)! - Fix `partykit login` with new bundled imports

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
    PartyKitConnection,
    PartyKitRoom,
    PartyKitServer
  } from "partykit/server";

  export default {
    onBeforeConnect(request: Request) {
      request.headers.set("X-User", getUser(request.headers.Authorization));
      return request;
    },
    onConnect(connection: PartyKitConnection, room: PartyKitRoom) {
      room.broadcast(`Someone joined room ${room.id}!`);
    }
  } satisfies PartyKitServer;
  ```

  After:

  ```ts
  import type {
    Party,
    PartyConnection,
    PartyRequest,
    PartyServer,
    PartyWorker
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
    PartyConnectionContext,
    PartyRequest,
    PartyServer,
    PartyServerOptions,
    PartyWorker
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
      hibernate: true
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
            message: `${connection.id} is also from ${country}!`
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
    }
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
