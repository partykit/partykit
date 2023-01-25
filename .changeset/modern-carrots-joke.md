---
"y-partykit": patch
"partykit": patch
---

y-partykit: remove vendored libs

We'd previously vendored the libs used by y-partykit (yjs, lib0, etc) to workaround a bug in edge-runtime https://github.com/vercel/edge-runtime/issues/243, but it makes using other libs that include those libs difficult. So instead this patch removes the vendoring, and applies the other workaround (which is to set `minify:true`). The tradeoff for this workaround is that any "dev mode" code (i.e. code wrapped with `if (process.env.NODE_ENV !== 'production')`) will be removed. This is temporary and we'll remove it once the bug is fixed by edge-runtime.
