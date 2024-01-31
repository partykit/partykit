# nitroparty

## 0.0.5

### Patch Changes

- [#771](https://github.com/partykit/partykit/pull/771) [`dc8e960`](https://github.com/partykit/partykit/commit/dc8e960a33f4a97e784ce1fb330af013ddcad0a5) Thanks [@threepointone](https://github.com/threepointone)! - nitroparty: import { useNitroApp } from "#imports";

## 0.0.4

### Patch Changes

- [#753](https://github.com/partykit/partykit/pull/753) [`197f5e9`](https://github.com/partykit/partykit/commit/197f5e95bcbff760c9387d1a60728bd0d4528c30) Thanks [@threepointone](https://github.com/threepointone)! - nitroparty: compile source

## 0.0.3

### Patch Changes

- [#741](https://github.com/partykit/partykit/pull/741) [`b5ffa13`](https://github.com/partykit/partykit/commit/b5ffa130b42a94b0d6c94bb55c3f89d511c2cf62) Thanks [@threepointone](https://github.com/threepointone)! - inject `process` global

## 0.0.2

### Patch Changes

- [#661](https://github.com/partykit/partykit/pull/661) [`0f81796`](https://github.com/partykit/partykit/commit/0f817961331d73a9784ddac6c26d910f12cdd513) Thanks [@threepointone](https://github.com/threepointone)! - nitroparty: pass context and body to request handler

## 0.0.1

### Patch Changes

- [#660](https://github.com/partykit/partykit/pull/660) [`7401a5d`](https://github.com/partykit/partykit/commit/7401a5d89622df0f606c316de698db7d42203fcf) Thanks [@threepointone](https://github.com/threepointone)! - an even better readme for nitroparty

- [#658](https://github.com/partykit/partykit/pull/658) [`13e296e`](https://github.com/partykit/partykit/commit/13e296e5de9cf01feb6df0c8b4cb48e5021c57e3) Thanks [@threepointone](https://github.com/threepointone)! - sample config for nitroparty

- [#659](https://github.com/partykit/partykit/pull/659) [`cd789d4`](https://github.com/partykit/partykit/commit/cd789d44adde7107fa205ed15a5c94348dc314bb) Thanks [@threepointone](https://github.com/threepointone)! - a better config for nitroparty

- [`a6e4e84`](https://github.com/partykit/partykit/commit/a6e4e8458434059e06e7c48facdf8bd451e77955) Thanks [@threepointone](https://github.com/threepointone)! - fix using nitroparty by package name

- [#654](https://github.com/partykit/partykit/pull/654) [`9775153`](https://github.com/partykit/partykit/commit/977515366ed8126c58448aaea8584136d5ec0cdc) Thanks [@threepointone](https://github.com/threepointone)! - wip: first cut at getting nitro working with partykit

  This adds a nitro preset so folks can deploy nuxt/solidstart/etc apps directly to partykit. This is still a wip. Notes:

  - server endpoints work, but getting the static asset handling to work in a bit of a pain. I think I need to change the "when" of waiting for the assets folder to appear before watching it
  - it's not clear how to reference an npm package from nitro.config.ts (alternately, maybe I should submit it directly to the nitro repo)
  - still needs process.env defines, or it crashes
  - needs extensive testing, we'll get there
