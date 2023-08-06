---
"partykit": patch
---

delay login browser popup for 5 seconds

When we're logging in, we open up a browser for a user to paste a code into github. We currently open it immediately, so users aren't sure what's happening. This PR adds a delay for a few seconds, with clearer instructions on what's happening.
