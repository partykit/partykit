---
"create-partykit": patch
"partykit": patch
---

add a default compatibility date

We should be adding a default compatibility date to new projects. Further, for projects that don't have one, we should warn that they should, and default to the latest compatibility date that we can. This PR adds that behaviour for both create, dev and deploy
