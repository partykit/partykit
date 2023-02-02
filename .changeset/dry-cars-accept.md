---
"partykit": patch
---

feat: onRequest/onBeforeRequest

This feature allows you to optionally configure onBeforeRequest/onRequest on a room. just like oBC/oC, the former runs in a worker closest to you, and the later runs in the room. This also makes defining onConnect fully optional. This should open the door to some interesting integrations.
