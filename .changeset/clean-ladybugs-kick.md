---
"partykit": patch
---

unload listeners on mf server / fix live reload console logging

We were adding a bunch of listeners on the miniflare server that we weren't cleaning up, and the dependency array was wrong. This PR fixes those up, while also conveniently fixing the issue where console.log wasn't working after the first compile failure.
