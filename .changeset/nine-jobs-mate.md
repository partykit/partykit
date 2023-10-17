---
"partykit": patch
---

fix: get proper room id from `/party/:id/*`

We had a bug when picking out the room name from `/party/:id/*`, it would pick the whole subpath instead. This fixes it.
