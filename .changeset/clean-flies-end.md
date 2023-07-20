---
"partykit": patch
---

feat: `unstable_onFetch` as a catch-all for other requests

This introduces `unstable_onFetch(req, lobby, ctx)` as a catch-all for requests that _don't_ match `/party/:id` or `/parties/:party/:id`.
