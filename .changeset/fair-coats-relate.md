---
"y-partykit": patch
---

y-partykit: callback/persistence configuration

This patch now properly forks y-websocket, and beings in functionality for passing configuration for callbacks/persistence (that was previously using process.env vars). We also fix builds/type generation for the package.
