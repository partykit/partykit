---
"create-partykit": patch
"partykit": patch
---

fix: work on node 16 again

some references to `fetch` weren't being imported from undici. global fetch was introduced only in node 18. so the partykit cli (specifically `init`) and create-partykit weren't working on node 16. This fixes that issue (tho we should phase out node 16 support soon)
