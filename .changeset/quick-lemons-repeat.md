---
"partysocket": patch
---

partysocket: pass custom WebSocket constructor

This lets you pass a custom WebSocket constructor to PartySocket / ReconnectingWebSocket. This means we can now run PartySocket from node.

Fixes #320
