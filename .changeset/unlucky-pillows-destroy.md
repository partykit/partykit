---
"partykit": patch
---

apply cli args correctly

we weren't applying overrides to config via the cli (eg --name xyz, when config.name was already defined). This fixes the logic.
