---
"partykit": patch
---

add ctx to onBefore\* fns

importantly, this lets you call `ctx.waitUntil(promise)` in the `onBefore` fns.
