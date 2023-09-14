---
"create-partykit": patch
---

Reduce double ping in client.js/ts

When server hot-reloads (for example), the clients reconnect and another ping sequence starts. You then get multiple pings from each browser. This change cancels an existing sequence if it exists.
