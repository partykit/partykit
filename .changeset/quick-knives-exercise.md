---
"partykit": patch
---

Fix Response types for `onBeforeRequest` and `onRequest` callbacks.

When you respond from `onBeforeRequest` or `onRequest`, you have to construct a new response using the `new Response()`. 

Unless you've overridden the global `Response` type to refer to `"@cloudflare/workers-types"`, the type is assumed a [Fetch API Response](https://developer.mozilla.org/en-US/docs/Web/API/Response). This is a pain in the ass, especially if you have your PartyKit server code as part of your frontend project.

Because the actual return value will be an instance of whatever Response class is defined in the environment, the type does not matter to us, so let's just allow the user to return either type.
