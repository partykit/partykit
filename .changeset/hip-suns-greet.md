---
"partykit": patch
---

introduce ink

This uses [ink](https://github.com/vadimdemedes/ink) to render a couple of commands (login, logout). Introducing this in a small PR since it requires some changes to how we build stuff. Unfortunately this means we're not bundling packages into the package anymore, but we'll revisit that later. After this, we'll rewrite dev to use ink as well.
