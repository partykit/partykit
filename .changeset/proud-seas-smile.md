---
"partysocket": patch
---

Improve PartySocket types and React hooks API:
* Add websocket lifecycle event handlers to usePartyKit options to reduce need for effects in userland
* Allow usePartySocket to provide startClosed option to initialize without opening connection
* Fix types for PartySocket#removeEventListener
