---
"partysocket": patch
---

partysocket: add subpath support

This patch lets you add `path: string` to `new PartySocket({...})` and point to a subpath in a room. This is a client side analog to the recent subpath support we added to multiparty `.fetch()`/`.socket()`
