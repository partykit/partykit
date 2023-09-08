---
"partysocket": patch
"partykit": patch
---

fix: `init` doesn't install the right versions of packages

This fix should pick up the latest versions of partykit /partysocket when installing. We were using the previous beta logic when every package was on the same version. This patch picks up the latest versions of both and uses it.

(also sneaking in a quick types fix for usePartySocket)
