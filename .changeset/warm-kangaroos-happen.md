---
"y-partykit": patch
---

[y-partykit] fix: write state to storage on connection close

we'd forgotten to implement `writeState()` so data wasn't being saved when everyone left a room. the fix is to implement, seems fine now.
