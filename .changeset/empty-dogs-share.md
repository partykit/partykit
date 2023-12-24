---
"partykit": patch
---

Inject every var as it's own var instead of a big PARTYKIT_VARS object

env vars have a 5kb limit, and people are hitting it. This should ease that off, without changing how we persist it ourselves.
