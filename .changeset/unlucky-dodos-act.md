---
"partysocket": patch
---

fix: configure `_pk` with PartySocket with `options.id`

This adds an `id` config for `new PartySocket()` that's uses as the value of `_pk`, that becomes the connection id in the backend.

Fixes https://github.com/partykit/partykit/issues/159
