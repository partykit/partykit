---
"y-partykit": patch
---

y-partykit remove ChunkedWebSocket class

The class definition was eagerly looking for a WebSocket class, breaking in non-standards based environments (like node.js), leading to issues like https://github.com/partykit/partykit/issues/698. This removes the class definition, and uses the chunking function directly when required. I think this should fix the problem.
