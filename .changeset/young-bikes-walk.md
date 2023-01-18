---
"partykit": patch
---

fix: add key/value size limits for storage api

This adds checks for size of key/values for the persistence api (mirroring DO's limits). (2kb keys. 128 kb values)
