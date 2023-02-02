---
"y-partykit": patch
---

remove y-partykit's onCommand config

now that we have onRequest, we don't need to set up a command channel within y-partykit itself, so let's remove the code for it.
