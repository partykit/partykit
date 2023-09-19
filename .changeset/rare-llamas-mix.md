---
"partykit": patch
---

feat: use `PartySocket` when connecting via `room.parties`

This uses `PartySocket` when connecting why `room.parties`, which gives you reconnection/buffering logic without any extra effort. Non-breaking change, existing code should still just work.
