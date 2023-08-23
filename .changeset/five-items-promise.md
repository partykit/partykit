---
"partykit": patch
---

run multiple instances simultaneously

We weren't looking for free ports when starting up partykit dev. We run a few servers; the runtime, the assets server, and an inspector port. This PR uses preferred ports when starting up, and finds free ports when not.
