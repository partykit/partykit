---
"partykit": patch
---

add `unstable_onValidate`

This adds `unstable_onValidate` to server's default export, alongside onConnect. Users are expected to implement this and return a boolean, that will reject the connection when false.
