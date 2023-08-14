---
"partykit": patch
---

feat: a better assets dev/deploy story

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
