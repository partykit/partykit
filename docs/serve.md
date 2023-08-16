## Static Assets

EXPERIMENTAL: This feature is still in development. It may change.

tl;dr - you can now serve static assets (html, css, js, images, etc) from your project.

(If you need superior hosting for websites, or features that we can't provide, I'd still recommend using a host like vercel/netlify/fly.io/et al.)

Pass it via CLI: `--serve path/to/assets` or add it to your `partykit.json`:

```jsonc
{
  //...
  "serve": "path/to/assets"
}
```

We have great defaults, but you can override some optional configs:

```jsonc
{
  //...
  "serve": {
    "path": "path/to/assets",
    // cache in the browser
    browserTTL: 1000 * 60 * 60 * 24 * 365, // any number of seconds
    // cache on the edge
    edgeTTL: 1000 * 60 * 60 * 24 * 365, // any number of seconds


    // NOT IMPLEMENTED YET: serve in "single page app" mode
    serveSinglePageApp: true
    // NOT IMPLEMENTED YET: exclude files from being served
    exclude: ["**/*.map"] // We already exclude dotfiles and node_modules
    // NOT IMPLEMENTED YET: include files to be served
    include: ["**/*.map"]
  }
}
```

But wait. There's more.

Modern Apps usually need a compiler of some kind: For TypeScript, JSX, bundle splitting, etc. We've got you covered. Pass a `build` field:

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

We have great defaults here too, but you can pass additional configs:

```jsonc
{
  // ...
  "serve": {
    "path": "path/to/assets",
    // ...
    "build": {
      "entry": "path/to/entry.ts", // can also be an array of paths
      "bundle": true, // bundle all dependencies, default true
      "splitting": true, // split bundles, default true
      "outdir": "path/to/outdir", // defaults to serve.path + "dist"
      "minify": true, // minify bundles, default false in dev, true in deploy
      "format": "esm", // "esm" | "cjs" | "iife", default "esm"
      "sourcemap": true, // generate sourcemaps, default true
      "define": {
        // define global constants, default {}
        "process.env.xyz": "123"
        // bonus: you can pass values via the cli with --define key=value
      },
      "external": ["react", "react-dom"], // externalize modules, default []
      "loader": {
        // configure loaders, default {}
        ".png": "file" // see https://esbuild.github.io/content-types/ for more info
      }
    }
  }
}
```

One last thing...

If you use partykit's bundler via `serve.build`, then we'll automatically define `PARTYKIT_HOST` correctly in both `dev` and `deploy`. See this PR to see how it eliminates all your boilerplate https://github.com/partykit/partykit/pull/246

Please give us feedback if you try this out! This might have some changes over the next few days. I hope you enjoy it!

Next up, we'll try to implement `npx partykit init` for a one-liner to setup a fully functioning project.
