---
"partykit": patch
---

fix: extract room id correctly

For `onRequest`, we were just using the part of the url after `/party` as the room id, which isn't true when we have query params. This quickly fixes that. Thanks @mellson for the catch.
