---
"partykit": patch
---

don't compile node builtins that the platform supports

We support some node builtins, so we shouldn't try to compile them into the bundle.
