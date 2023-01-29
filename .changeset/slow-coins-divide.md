---
"partysocket": patch
"y-partykit": patch
---

fix: don't crash in some secure contexts

This uses a weaker implementation to generate conneciton IDs if crypto.randomUUID() isn't available in the browser (re: https://github.com/WICG/uuid/issues/23) Fixes https://github.com/partykit/partykit/issues/53
