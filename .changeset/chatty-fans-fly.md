---
"partykit": patch
---

Error when cli is used in older versions of node

We now throw an error when the CLI is used on node < v18.12.1 (We could probably make this work on node 16, but we'll see in the future of required)
