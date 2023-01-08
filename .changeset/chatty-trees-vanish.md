---
"partykit": patch
---

lazy load heavy deps in cli

This imports modules like edge-runtime, esbuild, etc lazily / on demand in the cli, which should make the cli startup marginally faster.

Additionally, we're modifying prereleases to use `changeset --snapshot` instead of our custom thing
