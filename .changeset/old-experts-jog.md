---
"partykit": patch
---

local dev assets + custom builds

- This adds support for serving static assets (in dev only). This makes onboarding a little simpler; starting a new project doesn't require (too much) extra tooling. It's fairly simple, you make a field called `assets` in `partykit.json`, or pass it via cli with `--assets <path>`. In the future we _may_ also deploy these assets to partykit directly, we'll see.
- This also adds support for custom build commands. You may be using some other compile-to-js language, or need to run some codegen, or even compile your client side app; you can now define a command that runs. It looks like this (all fields are optional):

```js
build: {
  command: "...", // the command to run
  cwd: "...", // the directory to run it "in",
  watch: "..." // the directory to "watch" for changes
}
```
