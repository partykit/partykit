---
"y-partykit": patch
---

y-partykit: first cut

This lands a first implementation of yjs for partykit. It uses patch-package to create a modified build of y-websocket, and re-exports it for usage in a partykit server. This also lands a small example of lexical+y-partykit.
