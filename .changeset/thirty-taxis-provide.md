---
"partysocket": patch
---

partysocket: fix node usage

When cloning websocket events in node, it looks like it misses the `data` field for messages. This patch adds it on to the cloned event.
