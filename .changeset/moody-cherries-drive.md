---
"partykit": patch
---

dev: when we have a custom build, run it before starting any effects

In some conditions, the custom build may be generating static assets, which will trigger the file watcher and infinitely loop. Moving it to the top before any effects are run fixes this.
