---
"partykit": patch
---

feat: refactor PartyKitConnection / PartyKitRoom

This adds a couple of APIs based on common usage patterns:

- `room.broadcast(message, without)` lets you broadcast a message to all connections to a room, optionally excluding an array of connection IDs
- the "socket" now includes `.id`

This shouldn't break any code, so I'm comfortable landing it.
