---
"nitroparty": patch
---

wip: first cut at getting nitro working with partykit

This adds a nitro preset so folks can deploy nuxt/solidstart/etc apps directly to partykit. This is still a wip. Notes:

- server endpoints work, but getting the static asset handling to work in a bit of a pain. I think I need to change the "when" of waiting for the assets folder to appear before watching it
- it's not clear how to reference an npm package from nitro.config.ts (alternately, maybe I should submit it directly to the nitro repo)
- still needs process.env defines, or it crashes
- needs extensive testing, we'll get there
