---
"partykit": patch
---

remove `unstable_initial`, and `onBeforeConnect` can now return a `Request`/`Response`

We were using `unstable_initial` to pass info between `onBeforeConnect` and `onConnect`. But it just felt so alien. Now that onConnect also receives request (via https://github.com/partykit/partykit/pull/166), let's just let onBeforeConnect return a Request or a Response. If a Request, it gets passed on to onConnect. Else, it just returns.

This is a breaking change, but it's a minor one, and it's worth it to get rid of `unstable_initial`.
