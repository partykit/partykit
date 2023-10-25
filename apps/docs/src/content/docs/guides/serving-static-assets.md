---
title: Serving static assets
description: You can serve static assets (HTML, CSS, JavaScript, images, and others) from a PartyKit project
---

This page provides a walkthrough on serving static assets (HTML, CSS, JavaScript, images, and others) from a PartyKit project.

:::danger[Experimental]
This feature is still in development. It may change.

Let us know what you think on [Discord](https://discord.gg/KDZb7J4uxJ) or [Twitter](https://twitter.com/partykit_io), we'd love to hear from you!
:::

## Serving static assets

You can pass a static assets path via CLI: `--serve path/to/assets` or add it to your `partykit.json`:

```jsonc
{
  //...
  "serve": "path/to/assets"
}
```

While PartyKit defaults should satisfy most needs, you can override some optional configs:

```jsonc
{
  //...
  "serve": {
    "path": "path/to/assets",
    // cache in the browser
    browserTTL: 1000 * 60 * 60 * 24 * 365, // any number of seconds
    // cache on the edge
    edgeTTL: 1000 * 60 * 60 * 24 * 365, // any number of seconds


    // serve in "single page app" mode
    singlePageApp: true
    // COMING SOON: exclude files from being served
    exclude: ["**/*.map"] // PartyKit already excludes dotfiles and node_modules
    // COMING SOON: include files to be served
    include: ["**/*.map"]
  }
}
```

## Passing `build` field

Modern apps usually need a compiler of some kind, for example, for TypeScript, JSX, bundle splitting, and so on. PartyKit addresses this need. Pass a `build` field:

```jsonc
{
  // ...
  "serve": {
    "path": "path/to/assets",
    // ...
    "build": "path/to/entry.ts"
  }
}
```

You can further customize the `build` command by passing additional configuration arguments:

```jsonc
{
  // ...
  "serve": {
    "path": "path/to/assets",
    // ...
    "build": {
      "entry": "path/to/entry.ts", // can also be an array of paths
      "bundle": true, // bundle all dependencies, defaults to true
      "splitting": true, // split bundles, defaults to true
      "outdir": "path/to/outdir", // defaults to serve.path + "dist"
      "minify": true, // minify bundles, defaults to false in dev and to true in deploy
      "format": "esm", // "esm" | "cjs" | "iife", default "esm"
      "sourcemap": true, // generate sourcemaps, defaults to true
      "define": {
        // define global constants, defaults to {}
        "process.env.xyz": "123"
        // you can pass values via the CLI with --define key=value
      },
      "external": ["react", "react-dom"], // externalize modules, defaults to []
      "loader": {
        // configure loaders, defaults to {}
        ".png": "file" // see https://esbuild.github.io/content-types/ for more info
      }
    }
  }
}
```

:::tip[Did you know?]
If you use PartyKit's bundler via `serve.build`, then it will automatically define `PARTYKIT_HOST` correctly in both `dev` and `deploy`. Check out [this PR](https://github.com/partykit/partykit/pull/246) to see how PartyKit eliminates all the boilerplate.
:::

---

Please give us feedback on [Discord](https://discord.gg/KDZb7J4uxJ) or [Twitter](https://twitter.com/partykit_io) if you use this feature - your insights will make PartyKit better 🥳
