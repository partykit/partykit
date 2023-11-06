# create-partykit

## 0.0.18

### Patch Changes

- [#521](https://github.com/partykit/partykit/pull/521) [`0e5a1b6`](https://github.com/partykit/partykit/commit/0e5a1b68e41200f1ebbcff907644742a1aceed7b) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

  Of note, this now uses miniflare's new coloured logging, so we can start deprecating our weird inspector layer

## 0.0.17

### Patch Changes

- [#506](https://github.com/partykit/partykit/pull/506) [`c57b51b`](https://github.com/partykit/partykit/commit/c57b51bd238dac0a0d4ca0d816c181242a730df8) Thanks [@threepointone](https://github.com/threepointone)! - update deps

  Of note, this fixes partymix, our remix adapter

## 0.0.16

### Patch Changes

- [#496](https://github.com/partykit/partykit/pull/496) [`fb62640`](https://github.com/partykit/partykit/commit/fb626408733be07ca9edc233c4f6f37c1a30fb7e) Thanks [@threepointone](https://github.com/threepointone)! - update deps

## 0.0.15

### Patch Changes

- [#463](https://github.com/partykit/partykit/pull/463) [`1efd862`](https://github.com/partykit/partykit/commit/1efd86242be8e428bdce4b8e9b078d3e79de6dd4) Thanks [@threepointone](https://github.com/threepointone)! - update deps

## 0.0.14

### Patch Changes

- [#436](https://github.com/partykit/partykit/pull/436) [`645edd6`](https://github.com/partykit/partykit/commit/645edd691f7153efc95a48d871b18eef68b38b18) Thanks [@threepointone](https://github.com/threepointone)! - fix (internal): fix infinite loop when developing

  We use node's watch mode when developing partykit itself. On node 20, this just goes into an infinite loop, because it restarts on any writes, even if the file hasn't changed (iiuc). We are compiling facade/source.ts to facade/generated.js, while also watching the facade folder, which was triggering the restarts. I moved the outout to dist/generated.js, which fixes the problem.

- [#435](https://github.com/partykit/partykit/pull/435) [`8fdb63f`](https://github.com/partykit/partykit/commit/8fdb63f31835f56a0d4dbf290c970580d4a9a9ba) Thanks [@threepointone](https://github.com/threepointone)! - add a default compatibility date

  We should be adding a default compatibility date to new projects. Further, for projects that don't have one, we should warn that they should, and default to the latest compatibility date that we can. This PR adds that behaviour for both create, dev and deploy

- [#431](https://github.com/partykit/partykit/pull/431) [`af40d14`](https://github.com/partykit/partykit/commit/af40d14d12d2a69f76c3a154a9f35dbd7b1f0955) Thanks [@threepointone](https://github.com/threepointone)! - fix: don't add `--enable-source-maps` in create-partykit's prod build

- [#436](https://github.com/partykit/partykit/pull/436) [`645edd6`](https://github.com/partykit/partykit/commit/645edd691f7153efc95a48d871b18eef68b38b18) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.13

### Patch Changes

- [`b9cd337`](https://github.com/partykit/partykit/commit/b9cd337a5b54a507d0d2df9d0cb4821e582349be) Thanks [@threepointone](https://github.com/threepointone)! - trigger a release

## 0.0.12

### Patch Changes

- [#410](https://github.com/partykit/partykit/pull/410) [`ecc80cc`](https://github.com/partykit/partykit/commit/ecc80cc8a28f5ecfa85f989f06acda8888c0fb36) Thanks [@threepointone](https://github.com/threepointone)! - fix: work on node 16 again

  some references to `fetch` weren't being imported from undici. global fetch was introduced only in node 18. so the partykit cli (specifically `init`) and create-partykit weren't working on node 16. This fixes that issue (tho we should phase out node 16 support soon)

## 0.0.11

### Patch Changes

- [#400](https://github.com/partykit/partykit/pull/400) [`2ed33de`](https://github.com/partykit/partykit/commit/2ed33dea58cd4a978f10ae66fd3b14c98ee84d1b) Thanks [@threepointone](https://github.com/threepointone)! - pin dependencies

## 0.0.10

### Patch Changes

- [#397](https://github.com/partykit/partykit/pull/397) [`49d876a`](https://github.com/partykit/partykit/commit/49d876a7c4ebc5af3fcc6428e801de00649a9a54) Thanks [@threepointone](https://github.com/threepointone)! - update dependencies

## 0.0.9

### Patch Changes

- [#372](https://github.com/partykit/partykit/pull/372) [`a9b3593`](https://github.com/partykit/partykit/commit/a9b3593f8c4e8f463a95df9f4d8440645b3de6c0) Thanks [@jamesgpearce](https://github.com/jamesgpearce)! - Reduce double ping in client.js/ts

  When server hot-reloads (for example), the clients reconnect and another ping sequence starts. You then get multiple pings from each browser. This change cancels an existing sequence if it exists.

- [#368](https://github.com/partykit/partykit/pull/368) [`a9c980f`](https://github.com/partykit/partykit/commit/a9c980f931d4d4feae6d9abe15216751784ca5ad) Thanks [@threepointone](https://github.com/threepointone)! - update deps

## 0.0.8

### Patch Changes

- [#366](https://github.com/partykit/partykit/pull/366) [`b79f846`](https://github.com/partykit/partykit/commit/b79f84696d52d07c2b4a402dbb52ab688a17b4d7) Thanks [@threepointone](https://github.com/threepointone)! - use npm ci for CI installs

  We shouldn't use bun install until https://github.com/partykit/partykit/pull/352 lands

## 0.0.7

### Patch Changes

- [#361](https://github.com/partykit/partykit/pull/361) [`7f30721`](https://github.com/partykit/partykit/commit/7f307216f33dbef8fb61963cac7ce88ce8e8f769) Thanks [@jevakallio](https://github.com/jevakallio)! - Fix relative paths in create-partykit

## 0.0.6

### Patch Changes

- [#342](https://github.com/partykit/partykit/pull/342) [`03b782e`](https://github.com/partykit/partykit/commit/03b782e037ad35fa76af686f2c6b4dee73ae98cd) Thanks [@threepointone](https://github.com/threepointone)! - create-partykit: use latest version of partykit/partysocket

## 0.0.5

### Patch Changes

- [#339](https://github.com/partykit/partykit/pull/339) [`0206dd5`](https://github.com/partykit/partykit/commit/0206dd59b56c5f232969ca99e9c9ea5b286ed0d8) Thanks [@threepointone](https://github.com/threepointone)! - partykit: bundle dependencies

  This brings back packaging of dependencies for partykit (and introduces it for create-partykit). We had previously disabled it for deps because of esm/cjs nonsense, but we've now figured out how to make them play decently together.

  I had to fork ink-testing-library because of https://github.com/vadimdemedes/ink-testing-library/pull/23, I'll remove it once that PR is merged.

  This also updates ink to 4.4.1, which fixes our previous issue where it was exiting early.

## 0.0.4

### Patch Changes

- [#334](https://github.com/partykit/partykit/pull/334) [`9e46880`](https://github.com/partykit/partykit/commit/9e468804206d7a3a3d56d3d3c795bd603a131b9d) Thanks [@jevakallio](https://github.com/jevakallio)! - Fix create-partykit crash issue by downgrading "ink" dependency to last known good version

## 0.0.3

### Patch Changes

- [#314](https://github.com/partykit/partykit/pull/314) [`d9a1871`](https://github.com/partykit/partykit/commit/d9a187180cb1b205b26b3f26cd8bde6701426d24) Thanks [@threepointone](https://github.com/threepointone)! - trigger a release

## 0.0.2

### Patch Changes

- [#304](https://github.com/partykit/partykit/pull/304) [`9c5df06`](https://github.com/partykit/partykit/commit/9c5df06e5378bf24338349403aa75a07e0d21c21) Thanks [@jevakallio](https://github.com/jevakallio)! - Update create and init templates to use Class API

## 0.0.1

### Patch Changes

- [#263](https://github.com/partykit/partykit/pull/263) [`17cc254`](https://github.com/partykit/partykit/commit/17cc25432ce5c1d8e3ee58d89d80fc143e5214f7) Thanks [@threepointone](https://github.com/threepointone)! - tweaks to create-partykit

  - ensure instructions are logged on new project
  - don't log long git commit info
  - output path where project was made

- [#262](https://github.com/partykit/partykit/pull/262) [`cab1365`](https://github.com/partykit/partykit/commit/cab136527008b34a8d96cbd83161f75540043c5b) Thanks [@threepointone](https://github.com/threepointone)! - a better `create-partykit`

  - questions for every choice
  - flags for every choice: `--git`, `--typescript`, `-- install`
  - implement `-y` to skip questions
  - js/ts versions of the template
  - use package manager of choice
  - `--dry-run` to skip writing stuff to disk
  - better messaging

- [#276](https://github.com/partykit/partykit/pull/276) [`0aec7b3`](https://github.com/partykit/partykit/commit/0aec7b3fb72fd2a30b611e81f6fadfd4e0e12d89) Thanks [@threepointone](https://github.com/threepointone)! - initialise git repo with 'main' branch

- [#277](https://github.com/partykit/partykit/pull/277) [`6e124c4`](https://github.com/partykit/partykit/commit/6e124c4fa249240da8f17e8abf52470d2023462d) Thanks [@threepointone](https://github.com/threepointone)! - create: always make a package.json

  we were trying got be clever and not make a package.json if there was a parent (that's wasn't a monorepo root). Turns out folks have package.json's all the time. So this just always makes a package.json, and only runs the installer in the root package,json dir f it's a monorepo/has workspaces

- [#266](https://github.com/partykit/partykit/pull/266) [`36cd904`](https://github.com/partykit/partykit/commit/36cd904314d005e01b01b1665a4543d15be8facb) Thanks [@threepointone](https://github.com/threepointone)! - create: Add READMEs to generated projects

- [#260](https://github.com/partykit/partykit/pull/260) [`f4add35`](https://github.com/partykit/partykit/commit/f4add35cbc1d750e841d9ada56e6edff3daae1ce) Thanks [@threepointone](https://github.com/threepointone)! - create-partykit: move implementation from `partykit init`

- [#279](https://github.com/partykit/partykit/pull/279) [`55444c1`](https://github.com/partykit/partykit/commit/55444c14adb71f7ea48af2398ccaf10952c9401c) Thanks [@threepointone](https://github.com/threepointone)! - create: don't initialise git repo inside another

  When we create a project, we shouldn't try to create a git repo if we're initialising inside another git repo (like a monorepo). This PR detects whether there's a git folder and skips the git repo creation part.

  Additionally:

  - we switch away from `find-config` to `find-up` everywhere, since it works on both files and directories
  - I also took the opportunity to enable `verbatimModuleSyntax` in our tsconfig, which makes vscode import types correctly when we auto-import
