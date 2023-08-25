---
"partykit": patch
---

fix: actually fix the listeners/crash scenario

Ok I figured it out. We were adding listeners to the inspector websocket server. I also found some stray listeners we weren't cleaning up. I also removed the debouncing setup for the assets server. This is looking a lot better now.
