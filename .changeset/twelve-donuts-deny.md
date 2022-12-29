---
"partykit": patch
---

fix exports/typings

This patch fixes how we generate types (by actually doing so), configuring exports in package.json, and making sure it points to the right thing. I had to write a script that moves the generated types to the root for... javascript reasons ™ but at least it works now. good enough.
