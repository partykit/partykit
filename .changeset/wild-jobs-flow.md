---
"partykit": patch
---

allow using `onConnect` with `onMessage`

We now allow using `onConnect` with `onMessage`. This lets you get access to the context `{request}`. Warning: You can't use `.addEventListener` when using `onMessage`, but it currently just silently fails. We'll make this an error later.
