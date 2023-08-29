---
"partykit": patch
---

`partykit init`: add partykit to existing projects

The common usecase is to add partykit to an existing project, usually running on another stack/provider. This adds an `init` command that simply adds dependencies, a `partykit.json` file, and an entry point. If it's not run inside an existing project, it defers to running `npm create partykit` instead.
