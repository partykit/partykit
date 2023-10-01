---
"y-partykit": patch
---

y-partykit: add onLoad callback

This adds an `onLoad` callback to `y-partykit`. While we can wait for onConnect to finish before we return, this doesn't give us a handle on the actual YDoc. This adds a callback that we can use to get a handle on the YDoc.
