---
"partykit": patch
---

cache hydrated connections

When using hibernation, we should cache initialised connections, or else we end up doing it for every message, which seems wasteful.
