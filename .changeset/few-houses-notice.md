---
"partysocket": patch
---

fix: make PartySocket work inside cloudflare/partykit

The implementation of `ReconnectingWebSocket` tests whether a WebSocket class is valid by the presence of a static field that's not available on CF's/PK's WebSocket class. It's a bit much anyway, so we just remove the test.
