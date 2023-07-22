---
"partykit": patch
---

cache `parties` object arter creating it

Let's not create the `parties` object on every request/connection, and instead cache it after first creating it.
