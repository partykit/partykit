---
"y-partykit": patch
---

y-partykit: deprecate `persist: true`

While y-partykit's persistence layer was useful to not need a storage layer, in practice it caused too many issues. Further, it's not really useful when there are deep edit chains across clients. This PR deprecates it's usage, and adds a warning to remove it in the future.
