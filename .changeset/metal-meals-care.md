---
"y-partykit": patch
---

y-partykit: better default for `gc`

It's better to default to `gc: true` with partykit, so memory is better used in partykit servers. We should also ensure `gc` and `persist` are never used together. So this PR adds a little logic to find a better default, and ensuring the 2 never clash.
