---
"partykit": patch
---

queryparams for client, onConnect in server

client: `new PartySocket` now accepts `query: {...}` that gets encoded as query params in the url when connecting.

server: `export onConnect(){...}` to better reflect what's happening (and opening the door to other descriptive exports, like onAuth, etc)
