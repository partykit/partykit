---
"partykit": patch
---

fix: correct room id/parties in hibernation mode

We weren't hydrating the room id and `parties` correctly in hibernation mode, this patch fixes that.
